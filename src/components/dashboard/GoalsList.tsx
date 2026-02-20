import { Loader2, RefreshCw, PlusCircle, Shield, PiggyBank } from "lucide-react";
import GoalCard from "@/components/goals/GoalCard";
import NormalGoalCard from "@/components/goals/NormalGoalCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { GoalWithOnChainData, NormalGoal } from "@/lib/types";
import { useState } from "react";

interface GoalsListProps {
  goals: GoalWithOnChainData[];
  normalGoals: NormalGoal[];
  isLoading: boolean;
  loadGoals: () => void;
}

type TabType = "all" | "savings" | "contract";

export default function GoalsList({ goals, normalGoals, isLoading, loadGoals }: GoalsListProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const totalGoals = goals.length + normalGoals.length;

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <h2 className="text-xl md:text-2xl font-semibold">Your Goals</h2>
        <div className="flex gap-2">
          <Button onClick={loadGoals} variant="ghost" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-1 md:mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href="/savings/new">
              <PiggyBank className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Off-Chain</span>
              <span className="sm:hidden">Save</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/goals/new">
              <Shield className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">On-Chain</span>
              <span className="sm:hidden">Lock</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tab filters */}
      {totalGoals > 0 && (
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("all")}
          >
            All ({totalGoals})
          </Button>
          <Button
            variant={activeTab === "savings" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("savings")}
          >
            <PiggyBank className="mr-1 h-3.5 w-3.5" />
            Off-Chain ({normalGoals.length})
          </Button>
          <Button
            variant={activeTab === "contract" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("contract")}
          >
            <Shield className="mr-1 h-3.5 w-3.5" />
            On-Chain ({goals.length})
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading goals...</p>
        </div>
      ) : totalGoals > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(activeTab === "all" || activeTab === "savings") &&
            normalGoals.map((goal) => (
              <NormalGoalCard key={goal.id} goal={goal} />
            ))}
          {(activeTab === "all" || activeTab === "contract") &&
            goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-6xl">🏦</div>
          <h3 className="text-2xl font-semibold">No Goals Yet!</h3>
          <p className="mt-2 text-muted-foreground text-center max-w-md">
            Start your savings journey! Choose <strong>Off-Chain</strong> for flexible savings or <strong>On-Chain</strong> to lock funds on blockchain.
          </p>
          <div className="flex gap-3 mt-6">
            <Button asChild>
              <Link href="/savings/new">
                <PiggyBank className="mr-2 h-4 w-4" /> 💰 Off-Chain Goal
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/goals/new">
                <Shield className="mr-2 h-4 w-4" /> 🔒 On-Chain Goal
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}