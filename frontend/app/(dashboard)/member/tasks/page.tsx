"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  Apple, 
  Sparkles, 
  Check, 
  Clock, 
  User, 
  Flame, 
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const TYPE_ICONS: Record<string, any> = {
  workout: Dumbbell,
  diet: Apple,
  habit: Flame,
  general: Sparkles,
};

const TYPE_COLORS: Record<string, string> = {
  workout: "text-primary bg-primary/10 border-primary/20",
  diet: "text-accent bg-accent/10 border-accent/20",
  habit: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  general: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

export default function MemberTasksPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const formattedDate = selectedDate.toISOString().split("T")[0];

  const fetchTasks = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/tasks/my?date=${dateStr}`);
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load tasks", err);
      if (err.response?.status !== 401) {
        toast.error("Failed to load tasks");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(formattedDate);
  }, [formattedDate]);

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const handleToggle = async (task: any) => {
    setTogglingId(task._id);
    try {
      const res = await api.put(`/tasks/my/${task._id}`);
      if (res.data.success) {
        const updated = res.data.data;
        setTasks(prev => prev.map(t => (t._id === task._id ? updated : t)));
        if (updated.completed) {
          toast.success("Task completed! Keep up the momentum! 🔥");
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        }
      }
    } catch (err) {
      toast.error("Failed to update task");
    } finally {
      setTogglingId(null);
    }
  };

  const filteredTasks = tasks.filter(t => filterType === "all" || t.type === filterType);
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isToday = new Date().toISOString().split("T")[0] === formattedDate;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary" /> Daily Action Plan
          </h1>
          <p className="text-text-muted mt-1">Check off tasks assigned by your coach to stay on track.</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-surface border border-border px-3 py-1.5 rounded-full shadow-sm">
          <button 
            onClick={() => changeDate(-1)} 
            className="p-1.5 hover:bg-background rounded-full transition-colors text-text-muted hover:text-text-primary"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 px-2 text-sm font-bold">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span>
              {isToday ? "Today, " : ""}
              {selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" })}
            </span>
          </div>

          <button 
            onClick={() => changeDate(1)} 
            className="p-1.5 hover:bg-background rounded-full transition-colors text-text-muted hover:text-text-primary"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isToday && (
            <button 
              onClick={() => setSelectedDate(new Date())}
              className="ml-2 text-xs text-primary hover:underline font-bold"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Daily Completion</h2>
            <p className="text-sm text-text-muted">
              {totalCount === 0 ? "No tasks scheduled for this day." : `${completedCount} of ${totalCount} tasks completed`}
            </p>
          </div>
          <div className="text-3xl font-mono font-bold text-accent">
            {progressPercent}%
          </div>
        </div>

        <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-border">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-accent"
          />
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["all", "workout", "diet", "habit", "general"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all border shrink-0 ${
              filterType === type 
                ? "bg-primary border-primary text-white shadow-md shadow-primary/20" 
                : "bg-surface border-border text-text-muted hover:text-text-primary hover:border-text-muted"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Loading your daily tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-dashed border-border rounded-3xl p-8">
            <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">No Tasks Found</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
              {totalCount === 0 
                ? "Your coach hasn't added any tasks for this day yet. Message your coach or enjoy your recovery!" 
                : "No tasks matching the selected filter."}
            </p>
            <Link 
              href="/member/inbox"
              className="inline-flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              Message Coach
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {filteredTasks.map((task) => {
              const IconComponent = TYPE_ICONS[task.type] || Sparkles;
              const colorClasses = TYPE_COLORS[task.type] || TYPE_COLORS.general;

              return (
                <motion.div
                  key={task._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-surface border rounded-2xl p-5 flex items-start sm:items-center justify-between gap-4 transition-all ${
                    task.completed 
                      ? "border-accent/30 bg-accent/5 opacity-85" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <button
                      onClick={() => handleToggle(task)}
                      disabled={togglingId === task._id}
                      className="mt-0.5 sm:mt-0 text-text-muted hover:text-primary transition-colors shrink-0 disabled:opacity-50"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-accent" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${colorClasses}`}>
                          <IconComponent className="w-3 h-3" />
                          {task.type}
                        </span>
                        <h4 className={`font-bold text-base ${task.completed ? "line-through text-text-muted" : "text-text-primary"}`}>
                          {task.title}
                        </h4>
                      </div>
                      {task.description && (
                        <p className={`text-xs ${task.completed ? "line-through text-text-muted/70" : "text-text-muted"}`}>
                          {task.description}
                        </p>
                      )}
                      {task.coachId?.name && (
                        <p className="text-[11px] text-text-muted/60 mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" /> Assigned by Coach {task.coachId.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {task.completed && task.completedAt && (
                      <span className="text-[10px] text-text-muted hidden sm:inline-block">
                        Done at {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
