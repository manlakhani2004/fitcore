"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Search, Play, Dumbbell, Activity, Calendar as CalendarIcon, 
  Target, LayoutList, X, CheckCircle2, Clock, Sparkles, ChevronRight 
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
    const fetchData = async () => {
      try {
        const [exRes, histRes] = await Promise.all([
          api.get('/workouts/exercises'),
          api.get('/workouts/history')
        ]);
        if (exRes.data.success) {
          setExercises(exRes.data.data);
        }
        if (histRes.data.success) {
          const histData = histRes.data.data;
          setHistory(histData);
          
          // Generate heatmap data (last 35 days)
          const newHeatmap = Array(35).fill(0);
          const today = new Date();
          today.setHours(0,0,0,0);
          
          histData.forEach((workout: any) => {
            const wDate = new Date(workout.createdAt || workout.date);
            wDate.setHours(0,0,0,0);
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
        console.error('Failed to fetch data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset pagination limit on filter change
  useEffect(() => {
    setDisplayLimit(24);
  }, [activeTab, searchQuery]);

  const filteredExercises = exercises.filter(ex => {
    const matchesTab = activeTab === 'All' || (ex.muscleGroups && ex.muscleGroups.some((m: string) => m.toLowerCase() === activeTab.toLowerCase()));
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ex.muscleGroups?.some((m: string) => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ex.equipment?.some((eq: string) => eq.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const displayedExercises = filteredExercises.slice(0, displayLimit);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      
      {/* Header & Quick Start */}
      <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-3xl font-display font-bold">Your Training</h1>
          <p className="text-text-muted mt-2">Track progress, explore verified exercises with animated movement guides, and crush your fitness goals.</p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link href="/member/workouts/today">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Start Today's Session
              </motion.button>
            </Link>
            <Link href="/member/workouts/live" className="inline-flex items-center gap-2 text-sm font-bold text-text-primary hover:text-primary transition-colors bg-background border border-border px-5 py-3.5 rounded-xl">
              <Activity className="w-4 h-4 text-accent" /> Free Live Timer
            </Link>
            <Link href="/member/workouts/programs" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover transition-colors bg-primary/10 px-5 py-3.5 rounded-xl">
              <LayoutList className="w-4 h-4" /> Assigned Programs
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Exercise Library */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <Dumbbell className="text-primary w-6 h-6" /> Exercise Library
            </h2>
            <span className="text-xs font-bold text-text-muted bg-surface px-3 py-1.5 rounded-full border border-border">
              {filteredExercises.length} Movements Available
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {MUSCLE_GROUPS.map(group => (
                <button
                  key={group}
                  onClick={() => setActiveTab(group)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                    activeTab === group 
                      ? 'bg-primary border-primary text-white shadow-md' 
                      : 'bg-surface border-border text-text-muted hover:border-text-primary'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
            
            {/* Search */}
            <div className="relative shrink-0 w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search by name, muscle, equipment..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
              />
            </div>
          </div>

          {/* Grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {displayedExercises.map((ex, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={ex._id || i}
                  onClick={() => setSelectedExercise(ex)}
                  className="group bg-surface border border-border rounded-2xl p-4 flex gap-4 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="w-24 h-24 bg-white/5 rounded-xl flex flex-col items-center justify-center text-border group-hover:bg-primary/10 group-hover:text-primary transition-colors relative overflow-hidden shrink-0 p-1">
                    {ex.thumbnailUrl ? (
                      <img 
                        src={ex.thumbnailUrl} 
                        alt={ex.name} 
                        className="w-full h-full object-contain rounded-lg opacity-85 group-hover:opacity-100 transition-opacity" 
                        loading="lazy"
                      />
                    ) : (
                      <Play className="w-8 h-8 opacity-40 group-hover:opacity-100" />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-primary transition-colors truncate">{ex.name}</h3>
                    <div className="flex flex-wrap gap-1.5 text-[11px] mb-2">
                      <span className="bg-background px-2 py-0.5 rounded text-text-muted border border-border">{ex.muscleGroups?.[0] || 'General'}</span>
                      <span className="bg-background px-2 py-0.5 rounded text-text-muted border border-border capitalize">{ex.difficulty || 'beginner'}</span>
                      {ex.equipment?.[0] && (
                        <span className="bg-background px-2 py-0.5 rounded text-primary/80 border border-border">{ex.equipment[0]}</span>
                      )}
                    </div>
                    <span className="text-xs text-text-muted font-mono">
                      {ex.duration ? `${ex.duration}s hold` : `${ex.sets || 3} Sets x ${ex.reps || 10} Reps`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Load More Button */}
          {filteredExercises.length > displayLimit && (
            <div className="pt-4 text-center">
              <button 
                onClick={() => setDisplayLimit(prev => prev + 24)}
                className="px-6 py-3 rounded-2xl bg-surface border border-border hover:border-primary text-text-primary text-xs font-bold transition-all shadow-sm hover:bg-background"
              >
                Load More Exercises ({Math.min(displayLimit, filteredExercises.length)} of {filteredExercises.length})
              </button>
            </div>
          )}
          
          {filteredExercises.length === 0 && (
            <div className="text-center py-12 border border-dashed border-border rounded-2xl text-text-muted space-y-2">
              <Dumbbell className="w-8 h-8 mx-auto opacity-30" />
              <p className="font-bold text-sm">No exercises found.</p>
              <p className="text-xs">Try selecting a different muscle group tab or clearing your search.</p>
            </div>
          )}
        </div>

        {/* Right Col: History & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Activity className="text-accent w-6 h-6" /> Activity
          </h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-center items-center text-center">
              <Target className="w-6 h-6 text-primary mb-2" />
              <span className="text-2xl font-bold font-mono">{history.length}</span>
              <span className="text-xs text-text-muted uppercase">Workouts</span>
            </div>
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-center items-center text-center">
              <CalendarIcon className="w-6 h-6 text-accent mb-2" />
              <span className="text-2xl font-bold font-mono">5</span>
              <span className="text-xs text-text-muted uppercase">Day Streak</span>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-4">Consistency (Last 35 days)</h3>
            <div className="grid grid-cols-7 gap-2">
              {heatmap.map((level, i) => {
                let colorClass = 'bg-background border border-border';
                if (level === 1) colorClass = 'bg-primary/20 border border-primary/20';
                if (level === 2) colorClass = 'bg-primary/50 border border-primary/50';
                if (level === 3) colorClass = 'bg-primary border border-primary shadow-[0_0_8px_rgba(108,99,255,0.4)]';
                return (
                  <div key={i} className={`aspect-square rounded-sm ${colorClass}`} title={`${level} workouts`} />
                );
              })}
            </div>
            <div className="flex justify-between items-center mt-4 text-xs text-text-muted">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-background border border-border rounded-sm"></div>
                <div className="w-3 h-3 bg-primary/20 border border-primary/20 rounded-sm"></div>
                <div className="w-3 h-3 bg-primary/50 border border-primary/50 rounded-sm"></div>
                <div className="w-3 h-3 bg-primary border border-primary rounded-sm"></div>
              </div>
              <span>More</span>
            </div>
          </div>

        </div>

      </div>

      {/* Exercise Detail Modal with Animated Movement GIF */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedExercise(null)}
                className="absolute top-5 right-5 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-background transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6">
                
                {/* Animated Movement GIF Preview */}
                {(selectedExercise.videoUrl || selectedExercise.thumbnailUrl) && (
                  <div className="w-full h-64 bg-white/5 rounded-2xl overflow-hidden border border-border flex items-center justify-center relative p-3">
                    <img 
                      src={selectedExercise.videoUrl || selectedExercise.thumbnailUrl} 
                      alt={selectedExercise.name} 
                      className="max-h-full max-w-full object-contain rounded-xl"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {selectedExercise.muscleGroups?.join(', ') || 'General'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20 capitalize">
                      {selectedExercise.difficulty || 'beginner'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display font-bold">{selectedExercise.name}</h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{selectedExercise.description}</p>
                </div>

                {/* Specs Box */}
                <div className="grid grid-cols-3 gap-3 bg-background p-4 rounded-2xl border border-border">
                  <div className="text-center">
                    <span className="text-[10px] text-text-muted uppercase font-bold block">Target Sets</span>
                    <span className="font-mono font-bold text-lg text-text-primary">{selectedExercise.sets || 3}</span>
                  </div>
                  <div className="text-center border-x border-border">
                    <span className="text-[10px] text-text-muted uppercase font-bold block">Target Reps</span>
                    <span className="font-mono font-bold text-lg text-accent">
                      {selectedExercise.duration ? `${selectedExercise.duration}s` : (selectedExercise.reps || 10)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-text-muted uppercase font-bold block">Rest Interval</span>
                    <span className="font-mono font-bold text-lg text-primary">{selectedExercise.restTime || 60}s</span>
                  </div>
                </div>

                {/* Equipment */}
                {selectedExercise.equipment && selectedExercise.equipment.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Required Equipment</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.equipment.map((eq: string, idx: number) => (
                        <span key={idx} className="bg-background px-3 py-1 rounded-xl text-xs font-bold text-text-primary border border-border">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Form & Execution Technique</h4>
                    <div className="space-y-2.5">
                      {selectedExercise.instructions.map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/70 text-xs">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <p className="text-text-primary leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action CTA */}
                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => setSelectedExercise(null)}
                    className="flex-1 py-3 rounded-xl border border-border text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                  >
                    Close Preview
                  </button>
                  <Link href="/member/workouts/today" className="flex-1">
                    <button className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5">
                      <span>Log In Today's Session</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
