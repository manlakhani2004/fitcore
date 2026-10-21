"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Square, Timer, CheckCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function LiveWorkoutPage() {
  const router = useRouter();
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [sets, setSets] = useState([{ reps: 10, weight: 20, completed: false }]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !isFinished) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isFinished]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleSet = (index: number) => {
    setSets(prev => prev.map((set, i) => i === index ? { ...set, completed: !set.completed } : set));
  };

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { reps: lastSet.reps, weight: lastSet.weight, completed: false }]);
  };

  const finishWorkout = async () => {
    setIsFinished(true);
    try {
      const completedSets = sets.filter(s => s.completed);
      const totalReps = completedSets.reduce((acc, curr) => acc + Number(curr.reps), 0);
      const avgWeight = completedSets.length > 0 
        ? completedSets.reduce((acc, curr) => acc + Number(curr.weight), 0) / completedSets.length 
        : 0;

      const payload = {
        totalDuration: Math.round(secondsElapsed / 60),
        caloriesBurned: Math.round(secondsElapsed * 0.15), // Rough estimate
        exercisesCompleted: [{
          setsCompleted: completedSets.length,
          repsCompleted: totalReps,
          weightUsed: avgWeight
        }]
      };

      const res = await api.post('/workouts/log', payload);
      if (res.data.success) {
        toast.success(`Workout complete! Earned ${res.data.pointsEarned} points.`);
        router.push('/member/workouts');
      }
    } catch (err) {
      toast.error('Failed to save workout');
      setIsFinished(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/member/workouts" className="p-2 hover:bg-surface rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display">Live Workout</h1>
          <p className="text-text-muted text-sm">Track your sets in real time</p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-8 text-center border border-border shadow-xl">
        <div className="text-6xl font-mono font-bold mb-4 text-primary">
          {formatTime(secondsElapsed)}
        </div>
        
        {!isStarted ? (
          <button 
            onClick={() => setIsStarted(true)} 
            className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 mx-auto transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-1"
          >
            <Play className="w-6 h-6 fill-current" /> Start Workout
          </button>
        ) : (
          <button 
            onClick={finishWorkout} 
            className="bg-danger hover:bg-red-600 text-white px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 mx-auto transition-all shadow-lg hover:shadow-danger/30"
          >
            <Square className="w-6 h-6 fill-current" /> Finish Workout
          </button>
        )}
      </div>

      {isStarted && !isFinished && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-surface rounded-2xl p-6 border border-border">
            <h3 className="font-bold text-lg mb-4 flex justify-between items-center">
              Current Exercise
            </h3>
            
            <div className="space-y-3">
              {sets.map((set, idx) => (
                <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl transition-colors border ${set.completed ? 'bg-primary/10 border-primary/20' : 'bg-background border-border'}`}>
                  <span className="font-bold text-text-muted w-6">{idx + 1}</span>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="number" 
                      value={set.reps} 
                      onChange={(e) => {
                        setSets(prev => prev.map((s, i) => i === idx ? { ...s, reps: Number(e.target.value) } : s));
                      }}
                      className="w-16 bg-transparent border-b border-border text-center font-mono focus:border-primary focus:outline-none" 
                    />
                    <span className="text-text-muted mt-1">reps</span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="number" 
                      value={set.weight} 
                      onChange={(e) => {
                        setSets(prev => prev.map((s, i) => i === idx ? { ...s, weight: Number(e.target.value) } : s));
                      }}
                      className="w-16 bg-transparent border-b border-border text-center font-mono focus:border-primary focus:outline-none" 
                    />
                    <span className="text-text-muted mt-1">kg</span>
                  </div>
                  <button 
                    onClick={() => toggleSet(idx)}
                    className={`p-2 rounded-lg transition-colors ${set.completed ? 'text-primary' : 'text-text-muted hover:bg-surface'}`}
                  >
                    <CheckCircle className={`w-6 h-6 ${set.completed ? 'fill-primary/20' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
            
            <button onClick={addSet} className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-colors font-bold text-sm">
              + Add Set
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
