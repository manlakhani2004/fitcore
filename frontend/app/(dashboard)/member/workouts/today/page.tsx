"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft, Trophy, Flame } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Timer } from "@/components/ui/Timer";

const TODAY_WORKOUT = {
  name: "Upper Body Power",
  exercises: [
    { id: 1, name: "Barbell Bench Press", sets: 3, reps: 10, rest: 60 },
    { id: 2, name: "Incline Dumbbell Press", sets: 3, reps: 12, rest: 60 },
    { id: 3, name: "Lat Pulldown", sets: 3, reps: 12, rest: 60 }
  ]
};

export default function DailyWorkoutPage() {
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);

  const totalSets = TODAY_WORKOUT.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const currentCompleted = Object.keys(completedSets).length;
  const progress = (currentCompleted / totalSets) * 100;

  const toggleSet = (exId: number, setIdx: number) => {
    const key = `${exId}-${setIdx}`;
    setCompletedSets(prev => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const handleFinish = () => {
    setIsFinished(true);
    const end = Date.now() + 2 * 1000;
    const colors = ['#6C63FF', '#00F5A0', '#FF4C6A'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-20 bg-surface border border-border p-10 rounded-3xl text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />
        <Trophy className="w-20 h-20 text-accent mx-auto mb-6" />
        <h1 className="text-4xl font-display font-bold mb-4">Workout Complete!</h1>
        <p className="text-text-muted mb-8">You crushed "{TODAY_WORKOUT.name}". Great job staying consistent.</p>
        
        <div className="flex justify-center gap-8 mb-10">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-primary">45</div>
            <div className="text-xs text-text-muted uppercase">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-accent">320</div>
            <div className="text-xs text-text-muted uppercase">Calories</div>
          </div>
        </div>

        <Link href="/member/workouts">
          <button className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-1">
            Back to Dashboard
          </button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/member/workouts" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-sm font-mono bg-surface border border-border px-4 py-2 rounded-full text-primary flex items-center gap-2">
          <Flame className="w-4 h-4 text-danger" /> {currentCompleted} / {totalSets} Sets
        </div>
      </div>

      <div className="mb-10">
        <h1 className="text-4xl font-display font-bold mb-4">{TODAY_WORKOUT.name}</h1>
        {/* Progress Bar */}
        <div className="w-full h-3 bg-surface border border-border rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {TODAY_WORKOUT.exercises.map((ex) => (
            <div key={ex.id} className="bg-surface border border-border rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl">{ex.name}</h3>
                <span className="text-sm text-text-muted font-mono">{ex.sets} Sets x {ex.reps} Reps</span>
              </div>
              
              <div className="space-y-3">
                {Array.from({ length: ex.sets }).map((_, idx) => {
                  const isChecked = !!completedSets[`${ex.id}-${idx}`];
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleSet(ex.id, idx)}
                      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                        isChecked 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-background border-border hover:border-primary/50 text-text-primary'
                      }`}
                    >
                      <span className="font-medium">Set {idx + 1}</span>
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors border ${
                        isChecked ? 'bg-primary border-primary text-white' : 'border-border'
                      }`}>
                        {isChecked && <Check className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button 
            onClick={handleFinish}
            disabled={currentCompleted !== totalSets}
            className="w-full py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-accent hover:bg-emerald-400 text-surface text-lg"
          >
            Finish Workout
          </button>
        </div>

        {/* Right Col: Rest Timer (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-surface border border-border rounded-2xl p-6 text-center">
            <h3 className="font-bold text-lg mb-6">Rest Timer</h3>
            <Timer initialSeconds={60} />
            <p className="text-xs text-text-muted mt-6">Start timer after completing a set.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
