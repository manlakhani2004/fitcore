"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Play, Dumbbell, Activity, Calendar as CalendarIcon, Target, LayoutList } from "lucide-react";
import api from "@/lib/api";

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Legs', 'Core', 'Shoulders', 'Arms'];

export default function WorkoutsDashboard() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<number[]>(Array(35).fill(0));
  const [isLoading, setIsLoading] = useState(true);

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
              // 34 is today, 0 is 35 days ago
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

  const filteredExercises = exercises.filter(ex => {
    const matchesTab = activeTab === 'All' || (ex.muscleGroups && ex.muscleGroups.includes(activeTab));
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      
      {/* Header & Quick Start */}
      <div className="bg-surface p-8 rounded-3xl border border-border">
        <div>
          <h1 className="text-3xl font-display font-bold">Your Training</h1>
          <p className="text-text-muted mt-2">Track progress, explore exercises, and crush your fitness goals with progressive overload.</p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link href="/member/workouts/today">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
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
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Dumbbell className="text-primary w-6 h-6" /> Exercise Library
          </h2>

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
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-border rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredExercises.map((ex, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={ex._id || i}
                  className="group bg-surface border border-border rounded-2xl p-4 flex gap-4 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="w-24 h-24 bg-background rounded-xl flex flex-col items-center justify-center text-border group-hover:bg-primary/10 group-hover:text-primary transition-colors relative overflow-hidden">
                    {ex.thumbnailUrl && (
                      <img src={ex.thumbnailUrl} alt={ex.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                    )}
                    <Play className="w-8 h-8 z-10 opacity-50 group-hover:opacity-100" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{ex.name}</h3>
                    <div className="flex gap-2 text-xs mb-2">
                      <span className="bg-background px-2 py-1 rounded text-text-muted border border-border">{ex.muscleGroups?.[0] || 'General'}</span>
                      <span className="bg-background px-2 py-1 rounded text-text-muted border border-border capitalize">{ex.difficulty || 'beginner'}</span>
                    </div>
                    <span className="text-xs text-text-muted font-mono">
                      {ex.duration ? `${ex.duration}s` : `${ex.sets || 3} Sets x ${ex.reps || 10} Reps`}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          
          {filteredExercises.length === 0 && (
            <div className="text-center py-10 text-text-muted">No exercises found.</div>
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
              <span className="text-2xl font-bold font-mono">3</span>
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
    </div>
  );
}
