// This is what is stored locally. It's metadata for the on-chain goal.
export interface Goal {
  id: string;
  name: string;
  appId: number;
  createdAt: any; // ISO string or Timestamp
  // This is a cache for chart history, not the source of truth for savings.
  deposits: Deposit[];
}

export interface Deposit {
  amount: number; // in ALGOs
  timestamp: any; // ISO string or Timestamp
  txId: string;
}

// This represents the state fetched from the smart contract, the source of truth.
export interface OnChainGoal {
  goalOwner: string;
  targetAmount: number; // in microALGOs
  totalSaved: number; // in microALGOs
  deadline: number; // unix timestamp
  goalCompleted: boolean;
  balance: number; // in microALGOs
}

// This is a combined type for convenience in the UI.
export type GoalWithOnChainData = Goal & {
  onChain: OnChainGoal;
};

// ── Normal Goal (non-blockchain, INR-based) ─────────────────────────────────

export interface NormalGoalTransaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number; // in INR
  timestamp: string; // ISO string
  note?: string;
}

export interface NormalGoal {
  id: string;
  name: string;
  targetAmount: number; // in INR
  currentBalance: number; // in INR (computed from transactions)
  deadline: string; // ISO date string
  createdAt: string; // ISO string
  monthlyIncome?: number; // user-reported monthly income in INR
  monthlySpending?: number; // user-reported monthly spending in INR
  transactions: NormalGoalTransaction[];
  goalCompleted: boolean;
}

// ── ARC-3 Achievement NFT ────────────────────────────────────────────────────

export interface AchievementNFT {
  asaId: number; // Algorand Standard Asset ID
  txId: string; // creation transaction ID
  goalId: string;
  goalName: string;
  targetAmount: number; // microALGOs
  totalSaved: number; // microALGOs
  appId: number;
  mintedAt: string; // ISO string
}
