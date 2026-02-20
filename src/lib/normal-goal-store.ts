// Local storage-based store for normal (non-blockchain) goals.
// Users can deposit/withdraw anytime. All amounts are in INR.

import type { NormalGoal, NormalGoalTransaction } from "./types";

const NORMAL_GOALS_KEY = "dhansathi_normal_goals";

// ── helpers ──────────────────────────────────────────────────────────────────

function readGoals(): NormalGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NORMAL_GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeGoals(goals: NormalGoal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NORMAL_GOALS_KEY, JSON.stringify(goals));
}

function recalcBalance(goal: NormalGoal): number {
  return goal.transactions.reduce((sum, tx) => {
    return tx.type === "deposit" ? sum + tx.amount : sum - tx.amount;
  }, 0);
}

// ── public API ───────────────────────────────────────────────────────────────

export function getAllNormalGoals(): NormalGoal[] {
  return readGoals();
}

export function getNormalGoalById(id: string): NormalGoal | null {
  return readGoals().find((g) => g.id === id) ?? null;
}

export function createNormalGoal(data: {
  name: string;
  targetAmount: number;
  deadline: string;
  monthlyIncome?: number;
  monthlySpending?: number;
}): NormalGoal {
  const goals = readGoals();
  const newGoal: NormalGoal = {
    id: `normal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: data.name,
    targetAmount: data.targetAmount,
    currentBalance: 0,
    deadline: data.deadline,
    createdAt: new Date().toISOString(),
    monthlyIncome: data.monthlyIncome,
    monthlySpending: data.monthlySpending,
    transactions: [],
    goalCompleted: false,
  };
  goals.push(newGoal);
  writeGoals(goals);
  return newGoal;
}

export function depositToNormalGoal(
  goalId: string,
  amount: number,
  note?: string
): NormalGoal | null {
  const goals = readGoals();
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx === -1) return null;

  const tx: NormalGoalTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "deposit",
    amount,
    timestamp: new Date().toISOString(),
    note,
  };

  goals[idx].transactions.push(tx);
  goals[idx].currentBalance = recalcBalance(goals[idx]);

  // Check if goal is now completed
  if (goals[idx].currentBalance >= goals[idx].targetAmount) {
    goals[idx].goalCompleted = true;
  }

  writeGoals(goals);
  return goals[idx];
}

export function withdrawFromNormalGoal(
  goalId: string,
  amount: number,
  note?: string
): NormalGoal | null {
  const goals = readGoals();
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx === -1) return null;

  // Can't withdraw more than balance
  if (amount > goals[idx].currentBalance) {
    return null;
  }

  const tx: NormalGoalTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "withdrawal",
    amount,
    timestamp: new Date().toISOString(),
    note,
  };

  goals[idx].transactions.push(tx);
  goals[idx].currentBalance = recalcBalance(goals[idx]);

  // Unmark completed if balance dropped
  if (goals[idx].currentBalance < goals[idx].targetAmount) {
    goals[idx].goalCompleted = false;
  }

  writeGoals(goals);
  return goals[idx];
}

export function updateNormalGoalFinancials(
  goalId: string,
  data: { monthlyIncome?: number; monthlySpending?: number }
): NormalGoal | null {
  const goals = readGoals();
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx === -1) return null;

  if (data.monthlyIncome !== undefined) goals[idx].monthlyIncome = data.monthlyIncome;
  if (data.monthlySpending !== undefined) goals[idx].monthlySpending = data.monthlySpending;

  writeGoals(goals);
  return goals[idx];
}

export function deleteNormalGoal(goalId: string) {
  const goals = readGoals().filter((g) => g.id !== goalId);
  writeGoals(goals);
}

// ── Prediction Utilities ─────────────────────────────────────────────────────

export function getSavingsPrediction(goal: NormalGoal): {
  requiredPerWeek: number;
  requiredPerMonth: number;
  predictedCompletionDate: Date | null;
  onTrack: boolean;
  weeksLeft: number;
  savingRate: number; // average per week based on history
  message: string;
} {
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const remaining = goal.targetAmount - goal.currentBalance;

  // Calculate weeks left
  const msLeft = deadline.getTime() - now.getTime();
  const weeksLeft = Math.max(1, Math.ceil(msLeft / (7 * 24 * 60 * 60 * 1000)));

  const requiredPerWeek = remaining > 0 ? Math.ceil(remaining / weeksLeft) : 0;
  const requiredPerMonth = requiredPerWeek * 4.33;

  // Calculate current saving rate from transaction history
  const deposits = goal.transactions.filter((t) => t.type === "deposit");
  const totalDeposited = deposits.reduce((s, t) => s + t.amount, 0);

  const createdAt = new Date(goal.createdAt);
  const weeksSinceCreation = Math.max(
    1,
    (now.getTime() - createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const savingRate = totalDeposited / weeksSinceCreation; // per week

  // Predict completion date based on current rate
  let predictedCompletionDate: Date | null = null;
  let onTrack = false;
  let message = "";

  if (goal.goalCompleted) {
    onTrack = true;
    message = "🎉 Congratulations! You have reached your goal!";
    predictedCompletionDate = now;
  } else if (savingRate <= 0) {
    message = "Start saving to see your prediction!";
  } else {
    const weeksNeeded = remaining / savingRate;
    predictedCompletionDate = new Date(
      now.getTime() + weeksNeeded * 7 * 24 * 60 * 60 * 1000
    );
    onTrack = predictedCompletionDate <= deadline;

    if (onTrack) {
      message = `✅ On track! At this rate, you will reach your goal by ${predictedCompletionDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`;
    } else {
      message = `⚠️ You are saving slower than expected. At this rate, you'll reach your goal by ${predictedCompletionDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} — after your deadline.`;
    }
  }

  return {
    requiredPerWeek,
    requiredPerMonth,
    predictedCompletionDate,
    onTrack,
    weeksLeft,
    savingRate,
    message,
  };
}

export function getAIGoalAdvice(goal: NormalGoal): string {
  const prediction = getSavingsPrediction(goal);
  const remaining = goal.targetAmount - goal.currentBalance;
  const income = goal.monthlyIncome || 0;
  const spending = goal.monthlySpending || 0;
  const monthlySavingsCapacity = income - spending;

  let advice = "";

  if (goal.goalCompleted) {
    return "🎉 Amazing! You've reached your goal! Consider setting a new savings target to keep the momentum going.";
  }

  if (income > 0 && spending > 0) {
    const savingsPercent = ((monthlySavingsCapacity / income) * 100).toFixed(0);
    advice += `Based on your income (₹${income.toLocaleString("en-IN")}) and spending (₹${spending.toLocaleString("en-IN")}), you can save ₹${monthlySavingsCapacity.toLocaleString("en-IN")}/month (${savingsPercent}% of income). `;

    if (monthlySavingsCapacity >= prediction.requiredPerMonth) {
      advice += `You should save ₹${Math.ceil(prediction.requiredPerWeek).toLocaleString("en-IN")}/week to reach your "${goal.name}" goal in ${prediction.weeksLeft} weeks. This is well within your capacity! `;
    } else if (monthlySavingsCapacity > 0) {
      advice += `You need ₹${Math.ceil(prediction.requiredPerMonth).toLocaleString("en-IN")}/month but can only save ₹${monthlySavingsCapacity.toLocaleString("en-IN")}/month. Consider extending your deadline or reducing expenses. `;
    } else {
      advice += `Your spending exceeds your income. Try to reduce expenses by at least ₹${Math.ceil(prediction.requiredPerMonth).toLocaleString("en-IN")}/month to start saving. `;
    }
  } else {
    advice += `You should save ₹${Math.ceil(prediction.requiredPerWeek).toLocaleString("en-IN")}/week to reach your "${goal.name}" goal in ${prediction.weeksLeft} weeks. `;
    advice += `Add your monthly income and spending for personalized advice. `;
  }

  advice += prediction.message;

  return advice;
}
