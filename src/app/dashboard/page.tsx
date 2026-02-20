"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import QuickActions from "@/components/dashboard/QuickActions";
import GoalsList from "@/components/dashboard/GoalsList";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { getAllGoals, getAllDeposits } from "@/lib/local-store";
import { getGoalOnChainState } from "@/lib/blockchain";
import type { Goal, GoalWithOnChainData, NormalGoal } from "@/lib/types";
import { fetchAlgoInrRate } from "@/lib/algo-inr";
import { getAllNormalGoals } from "@/lib/normal-goal-store";

export default function Dashboard() {
  const router = useRouter();
  const { activeAddress, isConnecting } = useWallet();
  const [goals, setGoals] = useState<GoalWithOnChainData[]>([]);
  const [normalGoals, setNormalGoals] = useState<NormalGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeAddress && !isConnecting) {
      router.push("/");
    }
  }, [activeAddress, isConnecting, router]);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch latest ALGO/INR rate
      await fetchAlgoInrRate();
      
      // Load smart contract goals
      const storedGoals: Goal[] = getAllGoals();
      const goalsWithOnChain = await Promise.all(
        storedGoals.map(async (goal) => {
          try {
            const onChain = await getGoalOnChainState(goal.appId);
            return { ...goal, onChain } as GoalWithOnChainData;
          } catch {
            return { ...goal, onChain: { goalOwner: "", targetAmount: 0, totalSaved: 0, deadline: 0, goalCompleted: false, balance: 0 } } as GoalWithOnChainData;
          }
        })
      );
      setGoals(goalsWithOnChain);

      // Load normal goals
      const storedNormalGoals = getAllNormalGoals();
      setNormalGoals(storedNormalGoals);
    } catch (err) {
      console.error("Error loading goals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeAddress) {
      loadGoals();
    }
  }, [loadGoals, activeAddress]);

  const stats = useMemo(() => {
    // Smart contract stats (ALGO)
    const totalSavedAlgo = goals.reduce((sum, g) => sum + (g.onChain?.totalSaved || 0) / 1_000_000, 0);
    const totalTargetAlgo = goals.reduce((sum, g) => sum + (g.onChain?.targetAmount || 0) / 1_000_000, 0);
    const completedGoals = goals.filter(g => g.onChain?.goalCompleted).length + normalGoals.filter(g => g.goalCompleted).length;
    const activeGoals = goals.filter(g => !g.onChain?.goalCompleted).length + normalGoals.filter(g => !g.goalCompleted).length;
    const progressPercent = totalTargetAlgo > 0 ? Math.round((totalSavedAlgo / totalTargetAlgo) * 100) : 0;

    // Normal goal stats (INR)
    const normalTotalSaved = normalGoals.reduce((sum, g) => sum + g.currentBalance, 0);
    const normalTotalTarget = normalGoals.reduce((sum, g) => sum + g.targetAmount, 0);

    return { totalSaved: totalSavedAlgo, totalTarget: totalTargetAlgo, completedGoals, activeGoals, progressPercent, normalTotalSaved, normalTotalTarget };
  }, [goals, normalGoals]);

  const recentDeposits = useMemo(() => {
    const allDeposits = getAllDeposits();
    const goalMap = new Map(goals.map(g => [g.id, g.name]));
    return allDeposits.slice(-5).reverse().map(d => ({ ...d, goalName: goalMap.get(d.goalId) || 'Unknown Goal' }));
  }, [goals]);

  if (!activeAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container py-6 px-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Welcome back!</h1>
          <p className="text-muted-foreground text-sm md:text-base">Here&apos;s your financial overview</p>
        </div>
        <FinancialOverview {...stats} />
        <QuickActions />
        <GoalsList
          goals={goals}
          normalGoals={normalGoals}
          isLoading={isLoading}
          loadGoals={loadGoals}
        />
        <RecentActivity deposits={recentDeposits} />
      </main>
      <footer className="border-t border-border py-6 mt-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Running on Algorand Testnet • Powered by DhanSathi</p>
        </div>
      </footer>
    </div>
  );
}
