"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Search, Play, Dumbbell, Activity, Calendar as CalendarIcon, 
  Target, LayoutList, X, Clock, ChevronRight, RotateCcw
} from "lucide-react";
import api from "@/lib/api";

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function WorkoutsDashboard() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<number[]>(Array(35).fill(0));
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [displayLimit, setDisplayLimit] = useState(24);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [exRes, histRes] = await Promise.allSettled([
          api.get('/workouts/exercises'),
          api.get('/workouts/history')
        ]);
        if (!isMounted) return;

        if (exRes.status === 'fulfilled' && exRes.value.data?.success) {
          setExercises(exRes.value.data.data || []);
        }
        if (histRes.status === 'fulfilled' && histRes.value.data?.success) {
          const histData = histRes.value.data.data || [];
          setHistory(histData);
          
          // Generate heatmap data (last 35 days)
          const newHeatmap = Array(35).fill(0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          histData.forEach((workout: any) => {
            const wDate = new Date(workout.createdAt || workout.date);
            wDate.setHours(0, 0, 0, 0);
            const diffTime = Math.abs(today.getTime() - wDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 35) {
              const index = 34 - diffDays;
              newHeatmap[index] = Math.min(newHeatmap[index] + 1, 3);
            }
          });
          setHeatmap(newHeatmap);
        }
      } catch (err) {
        console.error('Failed to fetch workouts data', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  // Reset pagination limit on filter change
  useEffect(() => {
    setDisplayLimit(24);
  }, [activeTab, searchQuery]);

  const filteredExercises = exercises.filter(ex => {
    const matchesTab = activeTab === 'All' || (ex.muscleGroups && ex.muscleGroups.some((m: string) => m.toLowerCase() === activeTab.toLowerCase()));
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesTab;
    const matchesSearch = ex.name?.toLowerCase().includes(q) || 
      ex.muscleGroups?.some((m: string) => m.toLowerCase().includes(q)) ||
      ex.equipment?.some((eq: string) => eq.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const displayedExercises = filteredExercises.slice(0, displayLimit);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* 1. Header Overview Bar */}
      <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 md:p-7 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Training Command & Library
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              Workouts & Exercise Library
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Verified movement biomechanics, form technique guides, and training history logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/member/workouts/today">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-98">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Today&apos;s Session</span>
              </button>
            </Link>

            <Link href="/member/workouts/live">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E1017] hover:bg-white/[0.05] border border-[#1E2230] text-slate-200 text-xs font-semibold transition-all">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <span>Live Interval Timer</span>
              </button>
            </Link>

            <Link href="/member/workouts/programs">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E1017] hover:bg-white/[0.05] border border-[#1E2230] text-slate-200 text-xs font-semibold transition-all">
                <LayoutList className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Programs</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Exercise Library (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-200 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">Exercise Library</h2>
                  <p className="text-[11px] text-slate-400">Filter by target muscle group or equipment</p>
                </div>
              </div>
              
              <span className="text-xs font-mono font-medium text-slate-400 bg-[#0E1017] px-2.5 py-1 rounded-md border border-[#1E2230]">
                {isLoading ? "Loading..." : `${filteredExercises.length} Movements`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
              {/* Muscle Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {MUSCLE_GROUPS.map(group => {
                  const isActive = activeTab === group;
                  return (
                    <button
                      key={group}
                      onClick={() => setActiveTab(group)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap border ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm' 
                          : 'bg-[#0E1017] border-[#1E2230] text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
              
              {/* Search */}
              <div className="relative shrink-0 w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search exercise, muscle, gear..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0E1017] border border-[#1E2230] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Exercise Grid or Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-[#12141C] border border-[#1E2230] rounded-xl p-3.5 flex gap-3.5 animate-pulse">
                  <div className="w-20 h-20 bg-[#181B26] rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-[#181B26] rounded w-3/4" />
                    <div className="h-3 bg-[#181B26] rounded w-1/2" />
                    <div className="h-3 bg-[#181B26] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="bg-[#12141C] border border-dashed border-[#1E2230] rounded-2xl p-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-500">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">No exercises match your filter</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try switching muscle group tabs or clearing your search term.
                </p>
              </div>
              <button
                onClick={() => { setActiveTab('All'); setSearchQuery(''); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedExercises.map((ex, i) => (
                <div
                  key={ex._id || i}
                  onClick={() => setSelectedExercise(ex)}
                  className="group bg-[#12141C] border border-[#1E2230] hover:border-indigo-500/40 hover:bg-[#151824] rounded-xl p-3.5 flex gap-3.5 transition-all cursor-pointer"
                >
                  <div className="w-20 h-20 bg-[#0B0C10] border border-[#1E2230] rounded-lg flex items-center justify-center overflow-hidden shrink-0 p-1">
                    {ex.thumbnailUrl ? (
                      <img 
                        src={ex.thumbnailUrl} 
                        alt={ex.name} 
                        className="w-full h-full object-contain rounded opacity-90 group-hover:opacity-100 transition-opacity" 
                        loading="lazy"
                      />
                    ) : (
                      <Play className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-semibold text-sm leading-tight text-white group-hover:text-indigo-300 transition-colors truncate">
                      {ex.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 text-[11px] my-1.5">
                      <span className="bg-[#0E1017] px-2 py-0.5 rounded text-slate-400 border border-[#1E2230]">
                        {ex.muscleGroups?.[0] || 'General'}
                      </span>
                      <span className="bg-[#0E1017] px-2 py-0.5 rounded text-slate-400 border border-[#1E2230] capitalize">
                        {ex.difficulty || 'beginner'}
                      </span>
                      {ex.equipment?.[0] && (
                        <span className="bg-[#0E1017] px-2 py-0.5 rounded text-slate-300 border border-[#1E2230]">
                          {ex.equipment[0]}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {ex.duration ? `${ex.duration}s hold` : `${ex.sets || 3} Sets × ${ex.reps || 10} Reps`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {!isLoading && filteredExercises.length > displayLimit && (
            <div className="pt-2 text-center">
              <button 
                onClick={() => setDisplayLimit(prev => prev + 24)}
                className="px-5 py-2.5 rounded-xl bg-[#12141C] border border-[#1E2230] hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
              >
                Load More Exercises ({Math.min(displayLimit, filteredExercises.length)} of {filteredExercises.length})
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Activity & Consistency Heatmap (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Consistency Heatmap Card */}
          <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2230] pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-white">Consistency (35 Days)</h3>
              </div>
              <span className="text-xs font-mono font-medium text-slate-400">
                {history.length} Workouts
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {heatmap.map((level, i) => {
                let cellClass = 'bg-[#0E1017] border border-[#1E2230]';
                if (level === 1) cellClass = 'bg-indigo-950/80 border border-indigo-900/60';
                if (level === 2) cellClass = 'bg-indigo-700 border border-indigo-600';
                if (level === 3) cellClass = 'bg-indigo-500 border border-indigo-400';
                return (
                  <div key={i} className={`aspect-square rounded-md ${cellClass} transition-colors`} title={`${level} sessions logged`} />
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
              <span>Less active</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-[#0E1017] border border-[#1E2230] rounded-sm" />
                <div className="w-2.5 h-2.5 bg-indigo-950/80 border border-indigo-900/60 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-indigo-700 border border-indigo-600 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-indigo-500 border border-indigo-400 rounded-sm" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#12141C] border border-[#1E2230] rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Logged Sessions</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">{history.length}</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">All-time</span>
            </div>
            <div className="bg-[#12141C] border border-[#1E2230] rounded-xl p-4 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">Active Streak</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">5</span>
              <span className="text-[11px] text-emerald-400 mt-0.5 block">● On Track</span>
            </div>
          </div>

          {/* Training Guidance Tip */}
          <div className="bg-[#12141C] border border-[#1E2230] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Target className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold">Progressive Overload</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Log each set with accurate weight and reps. FitCore automatically graphs your volume overload trajectory for your coach.
            </p>
          </div>

        </div>

      </div>

      {/* Exercise Detail Modal with Animated Movement GIF */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 md:p-7 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5"
            >
              <button 
                onClick={() => setSelectedExercise(null)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-[#1E2230] transition-colors z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Movement GIF Preview */}
              {(selectedExercise.videoUrl || selectedExercise.thumbnailUrl) && (
                <div className="w-full h-64 bg-[#0B0C10] rounded-xl overflow-hidden border border-[#1E2230] flex items-center justify-center relative p-3">
                  <img 
                    src={selectedExercise.videoUrl || selectedExercise.thumbnailUrl} 
                    alt={selectedExercise.name} 
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {selectedExercise.muscleGroups?.join(', ') || 'General'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#0E1017] text-slate-300 border border-[#1E2230] capitalize">
                    {selectedExercise.difficulty || 'beginner'}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white tracking-tight">{selectedExercise.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedExercise.description}</p>
              </div>

              {/* Specs Box */}
              <div className="grid grid-cols-3 gap-3 bg-[#0E1017] p-3.5 rounded-xl border border-[#1E2230]">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target Sets</span>
                  <span className="font-mono font-bold text-base text-white mt-0.5">{selectedExercise.sets || 3}</span>
                </div>
                <div className="text-center border-x border-[#1E2230]">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Target Reps</span>
                  <span className="font-mono font-bold text-base text-white mt-0.5">
                    {selectedExercise.duration ? `${selectedExercise.duration}s` : (selectedExercise.reps || 10)}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Rest Interval</span>
                  <span className="font-mono font-bold text-base text-white mt-0.5">{selectedExercise.restTime || 60}s</span>
                </div>
              </div>

              {/* Equipment */}
              {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Required Equipment</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedExercise.equipment.map((eq: string, idx: number) => (
                      <span key={idx} className="bg-[#0E1017] px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 border border-[#1E2230]">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Form & Execution Technique</h4>
                  <div className="space-y-2">
                    {selectedExercise.instructions.map((step: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-xs">
                        <span className="w-5 h-5 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-300 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <p className="text-slate-300 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action CTA */}
              <div className="pt-2 flex gap-2.5">
                <button 
                  onClick={() => setSelectedExercise(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#1E2230] text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Close Preview
                </button>
                <Link href="/member/workouts/today" className="flex-1">
                  <button className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5">
                    <span>Log In Today&apos;s Session</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
