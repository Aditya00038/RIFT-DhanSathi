import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, BarChart3, Banknote } from "lucide-react";
import { formatAlgoWithInr, formatINR, algoToInr } from "@/lib/utils";

interface FinancialOverviewProps {
  totalSaved: number;
  totalTarget: number;
  progressPercent: number;
  activeGoals: number;
  completedGoals: number;
  normalTotalSaved?: number;
  normalTotalTarget?: number;
}

export default function FinancialOverview({ 
  totalSaved, totalTarget, progressPercent, activeGoals, completedGoals,
  normalTotalSaved = 0, normalTotalTarget = 0,
}: FinancialOverviewProps) {
  const stats = [
    {
      title: "🔒 On-Chain (ALGO)",
      value: formatINR(algoToInr(totalSaved)),
      subtitle: `${totalSaved.toFixed(2)} ALGO locked`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    },
    {
      title: "💰 Off-Chain (INR)",
      value: `₹${normalTotalSaved.toLocaleString("en-IN")}`,
      subtitle: normalTotalTarget > 0 ? `of ₹${normalTotalTarget.toLocaleString("en-IN")} target` : "Flexible savings",
      icon: Banknote,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      title: "Progress",
      value: `${progressPercent}%`,
      subtitle: undefined as string | undefined,
      icon: BarChart3,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
    },
    {
      title: "Goals",
      value: completedGoals > 0 ? (
        <><span className="text-primary">{completedGoals} ✓</span> <span className="text-sm text-muted-foreground ml-1">completed</span></>
      ) : (
        <>{activeGoals} <span className="text-sm text-muted-foreground ml-1">active</span></>
      ),
      subtitle: undefined as string | undefined,
      icon: Target,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-border">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
                {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}