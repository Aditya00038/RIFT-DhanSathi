"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/contexts/WalletContext";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Crown, Medal, Award, Loader2, UserPlus, Wallet } from "lucide-react";
import { getLeaderboard, registerOnLeaderboard, type LeaderboardEntry } from "@/lib/group-store";
import { formatINR, algoToInr } from "@/lib/algo-inr";
import { useToast } from "@/hooks/use-toast";

export default function LeaderboardPage() {
  const router = useRouter();
  const { activeAddress, isConnecting } = useWallet();
  const { toast } = useToast();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Register dialog
  const [registerOpen, setRegisterOpen] = useState(false);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (!activeAddress && !isConnecting) {
      router.push("/");
    }
  }, [activeAddress, isConnecting, router]);

  const loadLeaderboard = useCallback(() => {
    setIsLoading(true);
    const data = getLeaderboard();
    setEntries(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (activeAddress) loadLeaderboard();
  }, [activeAddress, loadLeaderboard]);

  const handleRegister = () => {
    if (!activeAddress || !nickname.trim()) {
      toast({ variant: "destructive", title: "Enter a nickname" });
      return;
    }
    registerOnLeaderboard(activeAddress, nickname.trim());
    toast({ title: "Registered!", description: "You're now on the leaderboard. Start saving to climb!" });
    setRegisterOpen(false);
    setNickname("");
    loadLeaderboard();
  };

  const isRegistered = entries.some((e) => e.walletAddress === activeAddress);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm text-muted-foreground font-bold">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
    if (rank === 2) return "bg-gray-500/10 border-gray-500/30";
    if (rank === 3) return "bg-amber-500/10 border-amber-500/30";
    return "";
  };

  if (!activeAddress) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container py-6 px-4 md:py-8 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-7 w-7 text-yellow-500" /> Savings Leaderboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Who saved the most? Compete with friends!</p>
          </div>
          {!isRegistered && (
            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
              <DialogTrigger asChild>
                <Button><UserPlus className="mr-2 h-4 w-4" /> Join Leaderboard</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join the Leaderboard</DialogTitle>
                  <DialogDescription>
                    Your wallet address will be displayed. Choose a nickname.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Your Wallet Address</p>
                    <p className="text-sm font-mono break-all">{activeAddress}</p>
                  </div>
                  <Input placeholder="Your nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                  <Button onClick={handleRegister} className="w-full">Register</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Top 3 Podium */}
        {entries.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {/* 2nd place */}
            <Card className={`text-center border ${getRankBg(2)} mt-8`}>
              <CardContent className="pt-6 pb-4">
                <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-lg">{entries[1].nickname}</p>
                <p className="text-primary font-semibold text-xl mt-1">{formatINR(algoToInr(entries[1].totalSaved))}</p>
                <p className="text-xs text-muted-foreground mt-1">{entries[1].totalSaved.toFixed(2)} ALGO</p>
                <Badge variant="secondary" className="mt-2">2nd</Badge>
              </CardContent>
            </Card>
            {/* 1st place */}
            <Card className={`text-center border-2 ${getRankBg(1)}`}>
              <CardContent className="pt-6 pb-4">
                <Crown className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
                <p className="font-bold text-xl">{entries[0].nickname}</p>
                <p className="text-primary font-bold text-2xl mt-1">{formatINR(algoToInr(entries[0].totalSaved))}</p>
                <p className="text-xs text-muted-foreground mt-1">{entries[0].totalSaved.toFixed(2)} ALGO</p>
                <Badge className="mt-2 bg-yellow-500 text-black">1st</Badge>
              </CardContent>
            </Card>
            {/* 3rd place */}
            <Card className={`text-center border ${getRankBg(3)} mt-12`}>
              <CardContent className="pt-6 pb-4">
                <Medal className="h-7 w-7 text-amber-600 mx-auto mb-2" />
                <p className="font-bold">{entries[2].nickname}</p>
                <p className="text-primary font-semibold text-lg mt-1">{formatINR(algoToInr(entries[2].totalSaved))}</p>
                <p className="text-xs text-muted-foreground mt-1">{entries[2].totalSaved.toFixed(2)} ALGO</p>
                <Badge variant="secondary" className="mt-2">3rd</Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Full Rankings</CardTitle>
            <CardDescription>All savers ranked by total amount saved</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
                <p className="text-muted-foreground">Be the first to join the leaderboard!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Saver</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead className="text-right">Saved (₹)</TableHead>
                    <TableHead className="text-right">ALGO</TableHead>
                    <TableHead className="text-right">Goals ✓</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.walletAddress} className={entry.walletAddress === activeAddress ? "bg-primary/5 font-semibold" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getRankIcon(entry.rank || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.nickname}
                          {entry.walletAddress === activeAddress && (
                            <Badge variant="outline" className="text-[10px] py-0">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {entry.walletAddress.substring(0, 6)}...{entry.walletAddress.slice(-4)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-primary font-semibold">
                        {formatINR(algoToInr(entry.totalSaved))}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {entry.totalSaved.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.goalsCompleted > 0 ? (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-600">{entry.goalsCompleted}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
