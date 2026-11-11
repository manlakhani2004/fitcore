"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Apple, 
  Flame, 
  Droplets, 
  CheckCircle2, 
  Circle, 
  Video, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  Activity, 
  Clock, 
  Sparkles, 
  User, 
  Award, 
  Scale, 
  ExternalLink,
  Loader2
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

function GoogleMeetIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 87.5 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M49 36L64.5 48.5V23.5L49 36Z" fill="#00832D"/>
      <path d="M0 50.5C0 56.8513 5.14873 62 11.5 62H49V36H0V50.5Z" fill="#0066DA"/>
      <path d="M49 10H11.5C5.14873 10 0 15.1487 0 21.5V36H49V10Z" fill="#E94235"/>
      <path d="M49 36H0V36.0001H49V36Z" fill="#2684FC"/>
      <path d="M64.5 23.5L82.1641 9.36875C84.7708 7.28341 87.5 9.07914 87.5 12.3688V59.6313C87.5 62.9209 84.7708 64.7166 82.1641 62.6313L64.5 48.5V23.5Z" fill="#00AC47"/>
      <path d="M49 10V36H64.5V23.5L49 10Z" fill="#00832D"/>
      <path d="M49 36V62H64.5V48.5L49 36Z" fill="#00832D"/>
    </svg>
  );
}

export default function MemberDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Dashboard Data States
  const [profile, setProfile] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [macros, setMacros] = useState<any>({ totalCalories: 0, totalMacros: { protein: 0, carbs: 0, fat: 0 }, waterIntake: 0 });
  const [dietPlan, setDietPlan] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loggingWater, setLoggingWater] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [profRes, coachRes, progRes, macroRes, dietRes, taskRes, apptRes, unreadRes] = await Promise.allSettled([
        api.get('/users/profile'),
        api.get('/users/my-coach').catch(() => ({ data: { success: false } })),
        api.get('/workouts/my-program').catch(() => ({ data: { success: false } })),
        api.get('/diet/macros/today').catch(() => ({ data: { success: false, data: {} } })),
        api.get('/diet/my-plan').catch(() => ({ data: { success: false } })),
        api.get(`/tasks/my?date=${today}`).catch(() => ({ data: { success: false, data: [] } })),
        api.get('/appointments/my-appointments').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/users/unread-messages').catch(() => ({ data: { success: false, data: { totalUnread: 0 } } }))
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.data?.success) setProfile(profRes.value.data.data);
      if (coachRes.status === 'fulfilled' && coachRes.value.data?.success) setCoach(coachRes.value.data.data);
      if (progRes.status === 'fulfilled' && progRes.value.data?.success) setProgram(progRes.value.data.data);
      if (macroRes.status === 'fulfilled' && macroRes.value.data?.success) setMacros(macroRes.value.data.data);
      if (dietRes.status === 'fulfilled' && dietRes.value.data?.success) setDietPlan(dietRes.value.data.data);
      if (taskRes.status === 'fulfilled' && taskRes.value.data?.success) setTasks(taskRes.value.data.data || []);
      if (apptRes.status === 'fulfilled' && apptRes.value.data?.success) setAppointments(apptRes.value.data.data || []);
      if (unreadRes.status === 'fulfilled' && unreadRes.value.data?.success) setUnreadMessages(unreadRes.value.data.data?.totalUnread || 0);

    } catch (err) {
      console.error("Failed to load member dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Quick Action: Log Water Intake
  const handleLogWater = async (amount: number) => {
    setLoggingWater(true);
    try {
      const res = await api.post('/diet/water', { amount });
      if (res.data?.success) {
        setMacros((prev: any) => ({
          ...prev,
          waterIntake: res.data.data.waterIntake
        }));
        toast.success(`+${amount}ml logged! Stay hydrated 💧`);
      }
    } catch {
      toast.error("Failed to log water");
    } finally {
      setLoggingWater(false);
    }
  };

  // Quick Action: Toggle Task
  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await api.put(`/tasks/my/${taskId}`);
      if (res.data?.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? res.data.data : t));
        toast.success(res.data.data.completed ? "Task completed! 🎯" : "Task marked pending");
      }
    } catch {
      toast.error("Failed to update task");
    }
  };

  // Find today's appointment if any
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointment = appointments.find((a: any) => {
    const aDate = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
    return aDate === todayStr && a.status !== 'cancelled';
  });

  // Calculate target calories & macros
  const targetCalories = dietPlan?.caloriesTarget || profile?.macroTargets?.calories || 2200;
  const targetProtein = dietPlan?.macrosTarget?.protein || profile?.macroTargets?.protein || 160;
  const targetCarbs = dietPlan?.macrosTarget?.carbs || profile?.macroTargets?.carbs || 220;
  const targetFat = dietPlan?.macrosTarget?.fat || profile?.macroTargets?.fat || 65;

  const currentCalories = macros.totalCalories || 0;
  const currentProtein = macros.totalMacros?.protein || 0;
  const currentCarbs = macros.totalMacros?.carbs || 0;
  const currentFat = macros.totalMacros?.fat || 0;
  const currentWater = macros.waterIntake || 0;
  const targetWater = 3000;

  const completedTasksCount = tasks.filter(t => t.completed).length;

  const timeOfDay = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  })();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-text-muted">Loading your athlete dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* 1. Athlete Hero Command Center Banner */}
      <div className="relative overflow-hidden bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Athlete Daily Command Base
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Good {timeOfDay}, {user?.name || 'Athlete'}! ⚡
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-2xl">
            Today is about disciplined execution. Fuel properly, log your sets, and stay connected with your coach.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border font-bold text-text-primary">
              <Flame className="w-4 h-4 text-warning" />
              <span>5-Day Active Streak</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border font-bold text-text-primary">
              <Award className="w-4 h-4 text-accent" />
              <span>{profile?.fitnessGoals?.[0]?.replace('_', ' ') || 'Hypertrophy & Strength'}</span>
            </span>
            {profile?.weight && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border font-bold text-text-primary">
                <Scale className="w-4 h-4 text-primary" />
                <span>{profile.weight} kg Fasted</span>
              </span>
            )}
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link href="/member/workouts/today">
            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-95">
              <Dumbbell className="w-4 h-4" />
              <span>Start Workout</span>
            </button>
          </Link>

          <button
            onClick={() => handleLogWater(250)}
            disabled={loggingWater}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-background font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-accent/20 active:scale-95 disabled:opacity-50"
          >
            <Droplets className="w-4 h-4" />
            <span>+250ml Water</span>
          </button>

          <Link href="/member/my-coach?tab=messages">
            <button className="relative flex items-center gap-2 px-4 py-3 rounded-2xl bg-background border border-border hover:border-primary text-text-primary font-bold text-sm transition-all hover:bg-border/30">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Message Coach</span>
              {unreadMessages > 0 && (
                <span className="bg-danger text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                  {unreadMessages}
                </span>
              )}
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Today's Training & Live Coach Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Workout Hero Card (7 Cols) */}
        <div className="lg:col-span-7 bg-surface border border-border rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Scheduled Training</span>
                  <h3 className="text-xl font-display font-bold">Today&apos;s Workout Routine</h3>
                </div>
              </div>

              <span className="text-xs font-bold text-text-muted bg-background px-3 py-1.5 rounded-xl border border-border flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>45-60 min</span>
              </span>
            </div>

            {program ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-lg font-bold text-text-primary">
                    {program.name || "Assigned Program Routine"}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    {program.schedule?.[0]?.dayName || "Full Body Power & Hypertrophy"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-border/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span className="font-bold uppercase tracking-wider text-[10px]">Planned Exercises:</span>
                    <span>{program.schedule?.[0]?.exercises?.length || 4} Movements</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(program.schedule?.[0]?.exercises || [
                      { name: "Barbell Bench Press" },
                      { name: "Incline Dumbbell Press" },
                      { name: "Tricep Pushdowns" }
                    ]).slice(0, 4).map((ex: any, idx: number) => (
                      <span key={idx} className="text-xs bg-surface px-2.5 py-1 rounded-lg border border-border text-text-primary font-medium">
                        {ex.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-background/50 border border-border/60 text-center space-y-2">
                <p className="text-sm font-bold text-text-primary">No Program Assigned Yet</p>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Your coach will craft a tailored multi-week periodized split for your goals.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-text-muted">
              <span>Goal: <strong className="text-accent">{program?.goal || 'General Fitness'}</strong></span>
            </div>
            <Link href="/member/workouts/today">
              <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20">
                <span>Start Workout Logger</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        {/* Live Coach & Google Meet Card (5 Cols) */}
        <div className="lg:col-span-5 bg-surface border border-border rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent">Dedicated Coach</span>
                  <h3 className="text-xl font-display font-bold">{coach?.coachId?.name || "Personal Coach"}</h3>
                </div>
              </div>

              <Link href="/member/my-coach?tab=messages">
                <button className="relative p-2 rounded-xl bg-background border border-border hover:border-primary text-text-muted hover:text-text-primary transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-surface animate-pulse" />
                  )}
                </button>
              </Link>
            </div>

            {/* Video Consultation Status */}
            {todayAppointment ? (
              <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#1a73e8]" />
                    <span>Video Consultation</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    todayAppointment.meetingLink 
                      ? 'bg-accent/10 text-accent border-accent/20' 
                      : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {todayAppointment.meetingLink ? '● Coach is Live' : 'Standby'}
                  </span>
                </div>

                <div className="text-xs text-text-muted">
                  Time: <strong className="text-text-primary">{todayAppointment.startTime ? `${todayAppointment.startTime} - ${todayAppointment.endTime}` : (todayAppointment.timeSlot || 'Today')}</strong>
                </div>

                {todayAppointment.meetingLink ? (
                  <a
                    href={todayAppointment.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a73e8] text-white font-bold text-xs hover:bg-[#1557b0] transition-colors shadow-lg shadow-[#1a73e8]/20"
                  >
                    <GoogleMeetIcon className="w-4 h-4" />
                    <span>Join Google Meet Call</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-border/50 text-text-muted font-bold text-xs cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4 animate-spin text-yellow-500" />
                    <span>Waiting for Coach to Start Room</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-background border border-border/70 text-center space-y-2">
                <Video className="w-8 h-8 text-text-muted mx-auto opacity-30" />
                <p className="text-xs font-bold text-text-primary">No Calls Scheduled Today</p>
                <p className="text-[11px] text-text-muted">
                  Need a technique check or diet review? Book a 1-on-1 session with your coach.
                </p>
                <Link href="/member/my-coach?tab=meetings" className="inline-block pt-1">
                  <span className="text-xs font-bold text-primary hover:underline">Schedule 1-on-1 Consultation →</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <span>Specialization: <strong className="text-text-primary">{coach?.coachId?.specializations?.[0] || 'Strength & Conditioning'}</strong></span>
            <Link href="/member/my-coach" className="text-primary font-bold hover:underline flex items-center gap-0.5">
              Coaching Hub <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Nutrition, Hydration & Daily Tasks Rings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Calories & Macros (Col 1) */}
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Apple className="w-5 h-5 text-accent" />
                <h3 className="font-display font-bold text-lg">Daily Calories</h3>
              </div>
              <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {targetCalories - currentCalories} kcal left
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-text-primary">{currentCalories}</span>
                <span className="text-xs text-text-muted">Target: {targetCalories} kcal</span>
              </div>
              <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (currentCalories / targetCalories) * 100)}%` }}
                />
              </div>
            </div>

            {/* Macros Breakdown */}
            <div className="space-y-2 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted font-medium">Protein</span>
                  <span className="font-bold text-text-primary">{currentProtein}g / {targetProtein}g</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(100, (currentProtein / targetProtein) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted font-medium">Carbs</span>
                  <span className="font-bold text-text-primary">{currentCarbs}g / {targetCarbs}g</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (currentCarbs / targetCarbs) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted font-medium">Fats</span>
                  <span className="font-bold text-text-primary">{currentFat}g / {targetFat}g</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, (currentFat / targetFat) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <Link href="/member/diet" className="pt-2 border-t border-border block">
            <span className="text-xs font-bold text-accent hover:underline flex items-center justify-between">
              <span>Log Meals & View Diet Plan</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Hydration Tracker (Col 2) */}
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-lg">Hydration</h3>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                {Math.round((currentWater / targetWater) * 100)}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-text-primary">{currentWater} ml</span>
                <span className="text-xs text-text-muted">Goal: {targetWater} ml</span>
              </div>
              <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, (currentWater / targetWater) * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border text-center space-y-2">
              <span className="text-xs text-text-muted block">Quick Log Hydration:</span>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleLogWater(250)}
                  disabled={loggingWater}
                  className="flex-1 py-2 bg-surface hover:bg-border/60 border border-border rounded-xl text-xs font-bold text-text-primary transition-colors"
                >
                  +250 ml
                </button>
                <button
                  onClick={() => handleLogWater(500)}
                  disabled={loggingWater}
                  className="flex-1 py-2 bg-surface hover:bg-border/60 border border-border rounded-xl text-xs font-bold text-text-primary transition-colors"
                >
                  +500 ml
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-text-muted text-center pt-2 border-t border-border">
            Drink water consistently throughout the day for optimal muscle recovery.
          </p>
        </div>

        {/* Daily Tasks & Habits (Col 3) */}
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <h3 className="font-display font-bold text-lg">Daily Habits</h3>
              </div>
              <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {completedTasksCount} / {tasks.length} Done
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="p-8 text-center space-y-2 bg-background rounded-2xl border border-border">
                <Sparkles className="w-8 h-8 text-text-muted mx-auto opacity-40" />
                <p className="text-xs font-bold text-text-primary">No Tasks Assigned for Today</p>
                <p className="text-[11px] text-text-muted">Enjoy your rest day or check in with your coach.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto">
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => handleToggleTask(task._id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors text-left group"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {task.title}
                      </p>
                      <span className="text-[10px] text-text-muted uppercase font-bold">{task.type}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/member/my-coach?tab=tasks" className="pt-2 border-t border-border block">
            <span className="text-xs font-bold text-primary hover:underline flex items-center justify-between">
              <span>View All Assigned Tasks</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

      </div>

      {/* 4. Biometrics & 3D Progress Teaser Card */}
      <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold">3D Body Model & Biometrics</h3>
            <p className="text-xs text-text-muted">
              Track muscle measurements, weekly check-in photos, and weight progression over time.
            </p>
          </div>
        </div>

        <Link href="/member/progress">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-background border border-border hover:border-primary text-text-primary text-xs font-bold transition-all shadow-sm">
            <span>Explore 3D Progress</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
        </Link>
      </div>

    </div>
  );
}

