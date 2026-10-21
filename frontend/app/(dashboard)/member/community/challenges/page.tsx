"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Target, Users, Calendar, ArrowRight, Flame, Medal, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await api.get('/community/challenges');
        if (res.data.success) {
          setChallenges(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch challenges");
      } finally {
        setIsLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    try {
      const res = await api.post(`/community/challenges/${id}/join`);
      if (res.data.success) {
        toast.success("Joined challenge successfully!");
        setChallenges(challenges.map(c => c._id === id ? res.data.data : c));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to join challenge");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" /> Community Challenges
          </h1>
          <p className="text-text-muted mt-1">Push yourself, compete with others, and stay accountable.</p>
        </div>
        <Link href="/member/community">
          <button className="text-sm font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-2">
            Back to Feed <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-accent" /> Active Challenges
          </h2>
          
          {challenges.filter(c => new Date(c.startDate) <= new Date() && new Date(c.endDate) >= new Date()).map((challenge, idx) => {
            const daysRemaining = Math.max(0, Math.ceil((new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const progress = challenge.leaderboard?.[0]?.progress || 0; // Simplified progress
            
            return (
            <motion.div 
              key={challenge._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-colors" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-display font-bold mb-2">{challenge.title}</h3>
                  <p className="text-text-muted text-sm max-w-md">{challenge.description}</p>
                </div>
                <div className="flex items-center gap-1 bg-background border border-border px-3 py-1.5 rounded-full text-xs font-bold text-text-muted shrink-0">
                  <Calendar className="w-3 h-3 text-primary" /> {daysRemaining} days left
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-text-muted" /> 
                  <span className="font-bold">{challenge.goal}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-text-muted" /> 
                  <span className="font-bold">{challenge.participants?.length || 0} participants</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-bold text-text-muted">
                  <span>Top Progress</span>
                  <span className="text-accent">{progress}%</span>
                </div>
                <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>

              <button 
                onClick={() => handleJoin(challenge._id)}
                disabled={joiningId === challenge._id}
                className="w-full py-3 bg-background border border-border hover:border-primary hover:text-primary rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joiningId === challenge._id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join / View Leaderboard"}
              </button>
            </motion.div>
          )})}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-surface border border-border p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-500" /> Upcoming
            </h2>
            <div className="space-y-4">
              {challenges.filter(c => new Date(c.startDate) > new Date()).map((challenge) => (
                <div key={challenge._id} className="p-4 bg-background border border-border rounded-2xl">
                  <h4 className="font-bold text-sm mb-1">{challenge.title}</h4>
                  <p className="text-xs text-text-muted mb-3">{challenge.goal}</p>
                  <button 
                    onClick={() => handleJoin(challenge._id)}
                    disabled={joiningId === challenge._id}
                    className="w-full py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {joiningId === challenge._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Opt-In Early"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 p-6 rounded-3xl text-center">
            <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-2">Claim Your Spot</h3>
            <p className="text-sm text-text-primary/80 mb-4">Complete community challenges and reach your fitness goals together.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
