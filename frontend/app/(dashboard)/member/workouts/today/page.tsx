"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, ArrowLeft, Trophy, Flame, Award, Loader2, 
  TrendingUp, RefreshCw, X, Sparkles, Clock
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Timer } from "@/components/ui/Timer";
import api from "@/lib/api";
import toast from "react-hot-toast";

const DEFAULT_WORKOUT = {
  name: "Upper Body Power",
  exercises: [
    { id: 1, name: "Barbell Bench Press", sets: 3, reps: 10, rest: 60, weight: 60 },
    { id: 2, name: "Incline Dumbbell Press", sets: 3, reps: 12, rest: 60, weight: 24 },
    { id: 3, name: "Lat Pulldown", sets: 3, reps: 12, rest: 60, weight: 55 }
  ]
};

// Exercise Substitution Library for real gym flow
const EXERCISE_ALTERNATIVES: Record<string, string[]> = {
  "Barbell Bench Press": ["Incline Dumbbell Press", "Chest Press Machine", "Push-Ups", "Dips", "Cable Chest Flyes"],
  "Incline Dumbbell Press": ["Barbell Bench Press", "Incline Barbell Press", "Dumbbell Flyes", "Chest Press Machine"],
  "Chest Press Machine": ["Barbell Bench Press", "Incline Dumbbell Press", "Push-Ups", "Cable Chest Flyes"],
  "Lat Pulldown": ["Pull-Ups", "Seated Cable Row", "Bent-Over Barbell Row", "Dumbbell Single-Arm Row"],
  "Pull-Ups": ["Lat Pulldown", "Assisted Pull-Ups", "Chin-Ups", "Seated Cable Row"],
  "Bent-Over Barbell Row": ["Seated Cable Row", "Dumbbell Single-Arm Row", "T-Bar Row", "Lat Pulldown"],
  "Seated Cable Row": ["Bent-Over Barbell Row", "Lat Pulldown", "Dumbbell Single-Arm Row", "Face Pulls"],
  "Overhead Press": ["Dumbbell Shoulder Press", "Arnold Press", "Machine Shoulder Press", "Lateral Raises"],
  "Dumbbell Shoulder Press": ["Overhead Press", "Arnold Press", "Cable Lateral Raises", "Machine Shoulder Press"],
  "Barbell Squat": ["Leg Press", "Bulgarian Split Squat", "Goblet Squat", "Hack Squat"],
  "Leg Press": ["Barbell Squat", "Bulgarian Split Squat", "Goblet Squat", "Walking Lunges"],
  "Romanian Deadlift": ["Dumbbell Romanian Deadlift", "Lying Leg Curls", "Barbell Deadlift"],
  "Bulgarian Split Squat": ["Walking Lunges", "Goblet Squat", "Leg Press"]
};

const GENERIC_ALTERNATIVES = [
  "Dumbbell Bench Press",
  "Incline Dumbbell Press",
  "Lat Pulldown",
  "Seated Cable Row",
  "Dumbbell Shoulder Press",
  "Leg Press",
  "Bulgarian Split Squat",
  "Barbell Bicep Curl",
  "Tricep Rope Pushdown"
];

export default function DailyWorkoutPage() {
  const [workout, setWorkout] = useState(DEFAULT_WORKOUT);
  const [programId, setProgramId] = useState<string | null>(null);
  const [programName, setProgramName] = useState<string>("");
  const [scheduleDays, setScheduleDays] = useState<any[]>([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(50);
  const [userLevel, setUserLevel] = useState(1);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Progressive Overload: Past Performance Map
  const [pastPerformance, setPastPerformance] = useState<Record<string, any>>({});
  
  // Exercise Swap State
  const [swapModalEx, setSwapModalEx] = useState<any | null>(null);

  // Rest Timer State
  const [restSeconds, setRestSeconds] = useState(60);
  const [timerKey, setTimerKey] = useState(0);

  const loadDay = (day: any, progTitle?: string, perfMap?: Record<string, any>) => {
    if (!day?.exercises?.length) return;
    const title = progTitle || programName;
    const activePerf = perfMap || pastPerformance;

    setWorkout({
      name: `${day.dayName ? day.dayName : 'Day ' + (day.dayNumber || day.day || 1)}${title ? ` (${title})` : ''}`,
      exercises: day.exercises.map((ex: any, idx: number) => {
        const perf = activePerf[ex.name?.toLowerCase().trim()];
        return {
          id: idx + 1,
          name: ex.name,
          sets: ex.sets || 3,
          reps: perf?.reps || ex.reps || 10,
          rest: ex.restSeconds || ex.rest || 60,
          weight: perf?.weight || ex.weight || 25
        };
      })
    });
    setCompletedSets({});
  };

  useEffect(() => {
    const fetchData = async () => {
      let perfMap: Record<string, any> = {};
      try {
        const perfRes = await api.get('/workouts/last-performance');
        if (perfRes.data?.success && perfRes.data.data) {
          perfMap = perfRes.data.data;
          setPastPerformance(perfMap);
        }
      } catch (err) {
        console.debug("Could not fetch last performance history", err);
      }

      try {
        const res = await api.get('/workouts/my-program');
        if (res.data?.success && res.data.data?.schedule?.length > 0) {
          const prog = res.data.data;
          setProgramId(prog._id);
          setProgramName(prog.name);
          setScheduleDays(prog.schedule);
          loadDay(prog.schedule[0], prog.name, perfMap);
        } else {
          // Check default workout against past performance
          setWorkout(prev => ({
            ...prev,
            exercises: prev.exercises.map(ex => {
              const perf = perfMap[ex.name.toLowerCase().trim()];
              return perf ? { ...ex, weight: perf.weight || ex.weight, reps: perf.reps || ex.reps } : ex;
            })
          }));
        }
      } catch (err) {
        console.error("Using default workout", err);
      }
    };
    fetchData();
  }, []);

  const handleSelectDay = (idx: number) => {
    setSelectedDayIdx(idx);
    if (scheduleDays[idx]) {
      loadDay(scheduleDays[idx]);
    }
  };

  const updateExerciseMetric = (exId: number, field: 'weight' | 'reps', val: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => ex.id === exId ? { ...ex, [field]: val } : ex)
    }));
  };

  // Exercise Swap execution
  const handleSwapExercise = (newExerciseName: string) => {
    if (!swapModalEx) return;

    const perf = pastPerformance[newExerciseName.toLowerCase().trim()];

    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.id === swapModalEx.id) {
          return {
            ...ex,
            name: newExerciseName,
            weight: perf?.weight || ex.weight || 25,
            reps: perf?.reps || ex.reps || 10
          };
        }
        return ex;
      })
    }));

    // Clear completed sets for this swapped exercise
    setCompletedSets(prev => {
      const next = { ...prev };
      for (let s = 1; s <= 10; s++) {
        delete next[`${swapModalEx.id}-${s}`];
      }
      return next;
    });

    toast.success(`Swapped to ${newExerciseName}!`, { icon: '🔄' });
    setSwapModalEx(null);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isFinished) {
      interval = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isFinished]);

  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const currentCompleted = Object.keys(completedSets).length;
  const progress = totalSets > 0 ? (currentCompleted / totalSets) * 100 : 0;

  const toggleSet = (exId: number, setIdx: number, restTime: number = 60) => {
    const key = `${exId}-${setIdx}`;
    const wasDone = !!completedSets[key];

    setCompletedSets(prev => {
      const next = { ...prev };
      if (wasDone) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });

    // If set just marked as completed, trigger rest timer
    if (!wasDone) {
      setRestSeconds(restTime);
      setTimerKey(prev => prev + 1);
    }
  };

  const handleFinish = async () => {
    setIsFinished(true);
    setSavingLog(true);

    const end = Date.now() + 2 * 1000;
    const colors = ['#6366F1', '#10B981', '#F59E0B'];

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

    try {
      const durationMins = Math.max(1, Math.round(secondsElapsed / 60) || 30);
      const calories = Math.max(50, Math.round(currentCompleted * 25) || 280);

      const exercisesCompleted = workout.exercises.map(ex => {
        let setsDone = 0;
        for (let s = 1; s <= ex.sets; s++) {
          if (completedSets[`${ex.id}-${s}`]) setsDone++;
        }
        return {
          name: ex.name,
          setsCompleted: setsDone || ex.sets,
          repsCompleted: ex.reps,
          weightUsed: ex.weight || 20
        };
      });

      const res = await api.post('/workouts/log', {
        programId: programId || undefined,
        totalDuration: durationMins,
        caloriesBurned: calories,
        exercisesCompleted
      });

      if (res.data?.success) {
        if (res.data.pointsEarned) setEarnedPoints(res.data.pointsEarned);
        if (res.data.level) setUserLevel(res.data.level);
        toast.success(`Workout logged! +${res.data.pointsEarned || 50} XP points earned! 🏆`);
      }
    } catch (err) {
      console.error("Failed to persist workout log", err);
    } finally {
      setSavingLog(false);
    }
  };

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-20 bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] p-8 md:p-10 rounded-2xl text-center shadow-xl dark:shadow-2xl relative overflow-hidden"
      >
        <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-5" />
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight mb-3">Workout Complete</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">You crushed &quot;{workout.name}&quot;. Great job staying consistent with progressive overload.</p>
        
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{Math.max(1, Math.round(secondsElapsed / 60))}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-emerald-500 dark:text-emerald-400">{Math.max(50, currentCompleted * 25 || 280)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-amber-500 dark:text-amber-400">+{earnedPoints}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mt-1">XP Points</div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] py-2 px-4 rounded-xl w-fit mx-auto">
          <Award className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>Current Level: {userLevel}</span>
        </div>

        <Link href="/member/workouts">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-sm">
            Back to Workouts
          </button>
        </Link>
      </motion.div>
    );
  }

  // Alternatives to display in swap modal
  const alternativesList = swapModalEx 
    ? (EXERCISE_ALTERNATIVES[swapModalEx.name] || GENERIC_ALTERNATIVES.filter(a => a !== swapModalEx.name))
    : [];

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/member/workouts" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="text-sm font-mono bg-surface border border-border px-4 py-2 rounded-full text-primary flex items-center gap-2">
          <Flame className="w-4 h-4 text-danger" /> {currentCompleted} / {totalSets} Sets Completed
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">{workout.name}</h1>
        
        {/* Multi-day Program Selector */}
        {scheduleDays.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {scheduleDays.map((d, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectDay(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedDayIdx === idx
                    ? 'bg-primary border-primary text-white shadow-md'
                    : 'bg-surface border-border text-text-muted hover:border-text-primary hover:text-text-primary'
                }`}
              >
                {d.dayName || `Day ${d.dayNumber || idx + 1}`}
              </button>
            ))}
          </div>
        )}

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

      {/* Exercises List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {workout.exercises.map((ex) => {
            const perf = pastPerformance[ex.name.toLowerCase().trim()];

            return (
              <div key={ex.id} className="bg-surface border border-border rounded-2xl p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-display font-bold">{ex.name}</h3>
                      <button
                        onClick={() => setSwapModalEx(ex)}
                        title="Swap exercise variation (e.g. equipment is occupied)"
                        className="text-xs bg-background hover:bg-border text-text-muted hover:text-text-primary px-2.5 py-1 rounded-lg border border-border flex items-center gap-1 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3 text-accent" /> Swap
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm text-text-muted">{ex.sets} sets • Rest {ex.rest}s</p>
                      
                      {/* Progressive Overload: Past Performance Badge */}
                      {perf && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-md border border-accent/20">
                          <TrendingUp className="w-3 h-3" />
                          <span>Last: {perf.weight}kg × {perf.reps}r</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progressive Overload Inputs */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-text-muted font-medium">Weight:</span>
                      <input 
                        type="number" 
                        value={ex.weight} 
                        onChange={(e) => updateExerciseMetric(ex.id, 'weight', Number(e.target.value))}
                        className="w-12 bg-transparent font-mono font-bold text-accent text-center focus:outline-none" 
                      />
                      <span className="text-text-muted font-medium">kg</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-background border border-border px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-text-muted font-medium">Reps:</span>
                      <input 
                        type="number" 
                        value={ex.reps} 
                        onChange={(e) => updateExerciseMetric(ex.id, 'reps', Number(e.target.value))}
                        className="w-10 bg-transparent font-mono font-bold text-primary text-center focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  {Array.from({ length: ex.sets }).map((_, setIdx) => {
                    const s = setIdx + 1;
                    const isDone = !!completedSets[`${ex.id}-${s}`];
                    return (
                      <button
                        key={s}
                        onClick={() => toggleSet(ex.id, s, ex.rest)}
                        className={`flex-1 py-3 rounded-xl border font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          isDone 
                            ? 'bg-accent/10 border-accent text-accent shadow-sm' 
                            : 'bg-background border-border text-text-muted hover:border-primary/50'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : `Set ${s}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button
            onClick={handleFinish}
            disabled={savingLog}
            className="w-full bg-accent hover:bg-emerald-400 text-surface font-bold py-4 rounded-xl shadow-lg transition-all hover:shadow-accent/30 hover:-translate-y-1 flex items-center justify-center gap-2 text-lg"
          >
            {savingLog ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
            Finish Workout & Claim XP
          </button>
        </div>

        {/* Right Col: Rest Timer (Sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-surface border border-border rounded-2xl p-6 text-center">
            <h3 className="font-bold text-lg mb-4 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Rest Timer
            </h3>
            <Timer key={timerKey} initialSeconds={restSeconds} />
            <p className="text-xs text-text-muted mt-4">Auto-starts when completing a set. Chimes when done.</p>
          </div>
        </div>
      </div>

      {/* Exercise Swap Modal */}
      <AnimatePresence>
        {swapModalEx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold">Swap Exercise</h3>
                  <p className="text-xs text-text-muted">Replace "{swapModalEx.name}" with an equivalent movement.</p>
                </div>
                <button 
                  onClick={() => setSwapModalEx(null)}
                  className="text-text-muted hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mt-4 max-h-72 overflow-y-auto pr-1">
                {alternativesList.map((altName) => {
                  const perf = pastPerformance[altName.toLowerCase().trim()];
                  return (
                    <button
                      key={altName}
                      onClick={() => handleSwapExercise(altName)}
                      className="w-full text-left p-3 rounded-xl bg-background border border-border hover:border-accent/50 hover:bg-accent/5 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-medium text-sm group-hover:text-accent transition-colors">{altName}</div>
                        {perf && (
                          <div className="text-[11px] text-text-muted font-mono mt-0.5">
                            Prev: {perf.weight}kg × {perf.reps} reps
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-text-muted group-hover:text-accent font-semibold">Select ➔</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
