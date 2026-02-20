"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, PlusCircle, UserPlus, Trophy, Loader2, Target, Crown, Medal } from "lucide-react";
import { getAllGroupGoals, createGroupGoal, joinGroupGoal, addGroupDeposit, type GroupGoal } from "@/lib/group-store";
import { formatINR, algoToInr } from "@/lib/algo-inr";
import { useToast } from "@/hooks/use-toast";

export default function GroupGoalsPage() {
  const router = useRouter();
  const { activeAddress, isConnecting } = useWallet();
  const { toast } = useToast();
  const [groupGoals, setGroupGoals] = useState<GroupGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newNickname, setNewNickname] = useState("");

  // Join dialog state
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinGoalId, setJoinGoalId] = useState("");
  const [joinNickname, setJoinNickname] = useState("");

  // Deposit dialog state
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    if (!activeAddress && !isConnecting) {
      router.push("/");
    }
  }, [activeAddress, isConnecting, router]);

  const loadGoals = useCallback(() => {
    setIsLoading(true);
    const goals = getAllGroupGoals();
    setGroupGoals(goals);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (activeAddress) loadGoals();
  }, [activeAddress, loadGoals]);

  const handleCreate = () => {
    if (!activeAddress || !newName.trim() || !newTarget || !newNickname.trim()) {
      toast({ variant: "destructive", title: "Missing fields", description: "Fill in all fields." });
      return;
    }
    createGroupGoal({
      name: newName.trim(),
      targetAmount: parseFloat(newTarget),
      creatorAddress: activeAddress,
      creatorNickname: newNickname.trim(),
    });
    toast({ title: "Group Goal Created!", description: `"${newName}" is ready. Share the ID with friends!` });
    setCreateOpen(false);
    setNewName("");
    setNewTarget("");
    setNewNickname("");
    loadGoals();
  };

  const handleJoin = () => {
    if (!activeAddress || !joinGoalId.trim() || !joinNickname.trim()) {
      toast({ variant: "destructive", title: "Missing fields" });
      return;
    }
    const result = joinGroupGoal(joinGoalId.trim(), activeAddress, joinNickname.trim());
    if (result) {
      toast({ title: "Joined!", description: `You joined "${result.name}"` });
    } else {
      toast({ variant: "destructive", title: "Group not found" });
    }
    setJoinOpen(false);
    setJoinGoalId("");
    setJoinNickname("");
    loadGoals();
  };

  const handleDeposit = () => {
    if (!activeAddress || !depositGoalId || !depositAmount) return;
    const result = addGroupDeposit(depositGoalId, activeAddress, parseFloat(depositAmount));
    if (result) {
      toast({ title: "Deposit Added!", description: `${depositAmount} ALGO added to group pool.` });
    } else {
      toast({ variant: "destructive", title: "Failed", description: "You may not be a member of this group." });
    }
    setDepositOpen(false);
    setDepositAmount("");
    setDepositGoalId("");
    loadGoals();
  };

  if (!activeAddress) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container py-6 px-4 md:py-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" /> Group Goals
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Compete with friends & save together!</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Group Goal</DialogTitle>
                  <DialogDescription>Set a shared savings target. Invite friends with the group ID.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input placeholder="Group name (e.g., Trip to Goa)" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <Input type="number" step="0.01" placeholder="Target amount (ALGO)" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
                  <Input placeholder="Your nickname" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} />
                  <Button onClick={handleCreate} className="w-full">Create Group Goal</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Join Group</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Group Goal</DialogTitle>
                  <DialogDescription>Enter the group ID shared by your friend.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input placeholder="Group ID" value={joinGoalId} onChange={(e) => setJoinGoalId(e.target.value)} />
                  <Input placeholder="Your nickname" value={joinNickname} onChange={(e) => setJoinNickname(e.target.value)} />
                  <Button onClick={handleJoin} className="w-full">Join Group</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : groupGoals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Group Goals Yet</h3>
              <p className="text-muted-foreground mb-4">Create a group goal and invite friends to save together!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupGoals.map((goal) => {
              const totalDeposited = goal.members.reduce((sum, m) => sum + m.totalDeposited, 0);
              const progress = goal.targetAmount > 0 ? (totalDeposited / goal.targetAmount) * 100 : 0;
              const sortedMembers = [...goal.members].sort((a, b) => b.totalDeposited - a.totalDeposited);
              const isMember = goal.members.some((m) => m.walletAddress === activeAddress);

              return (
                <Card key={goal.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          {goal.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {goal.members.length} member{goal.members.length !== 1 ? "s" : ""} • Target: {formatINR(algoToInr(goal.targetAmount))}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">{goal.targetAmount} ALGO</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Group Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatINR(algoToInr(totalDeposited))} / {formatINR(algoToInr(goal.targetAmount))}
                      </p>
                    </div>

                    {/* Mini Leaderboard */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-yellow-500" /> Group Leaderboard
                      </h4>
                      <div className="space-y-1">
                        {sortedMembers.map((member, idx) => (
                          <div key={member.walletAddress} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-sm">
                            <div className="flex items-center gap-2">
                              {idx === 0 ? <Crown className="h-4 w-4 text-yellow-500" /> :
                               idx === 1 ? <Medal className="h-4 w-4 text-gray-400" /> :
                               idx === 2 ? <Medal className="h-4 w-4 text-amber-600" /> :
                               <span className="w-4 text-center text-xs text-muted-foreground">{idx + 1}</span>}
                              <span className="font-medium">{member.nickname}</span>
                              {member.walletAddress === activeAddress && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1">You</Badge>
                              )}
                            </div>
                            <span className="text-primary font-semibold">{formatINR(algoToInr(member.totalDeposited))}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Group ID for sharing */}
                    <div className="bg-muted/50 p-2 rounded-md">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Share this ID with friends:</p>
                      <p className="text-xs font-mono break-all select-all">{goal.id}</p>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    {isMember ? (
                      <Dialog open={depositOpen && depositGoalId === goal.id} onOpenChange={(open) => { setDepositOpen(open); if (open) setDepositGoalId(goal.id); }}>
                        <DialogTrigger asChild>
                          <Button className="w-full" size="sm">Add Savings</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add to "{goal.name}"</DialogTitle>
                            <DialogDescription>Enter the ALGO amount you want to contribute.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-2">
                            <Input type="number" step="any" placeholder="Amount in ALGO" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
                            <Button onClick={handleDeposit} className="w-full">Confirm Deposit</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button className="w-full" variant="outline" size="sm"
                        onClick={() => {
                          const nick = prompt("Enter your nickname:");
                          if (nick) {
                            joinGroupGoal(goal.id, activeAddress!, nick);
                            loadGoals();
                            toast({ title: "Joined!", description: `You joined "${goal.name}"` });
                          }
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" /> Join this Group
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
