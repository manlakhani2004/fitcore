"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Flame, 
  Droplets, 
  CheckCircle2, 
  Circle, 
  Video, 
  MessageSquare, 
  Calendar, 
  ChevronRight, 
  Plus, 
  Activity, 
  Clock, 
  User, 
  Award, 
  Scale, 
  ExternalLink,
  Loader2,
  Target,
  Check
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
        toast.success(`+${amount}ml logged`);
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
        toast.success(res.data.data.completed ? "Task completed" : "Task marked pending");
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

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  if (loading) {
    return (
      <div className="flex h-[65vh] items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-medium text-slate-400 tracking-wide">Syncing athlete training metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* 1. Header Overview Bar */}
      <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 md:p-7 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {formattedDate} • Active Training Cycle
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Athlete'}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              Track your lifts, monitor today&apos;s recovery, and align with your coach.
            </p>

            {/* Metric Pills (Clean Monochromatic Badges) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-xs">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Streak:</span>
                <span className="font-semibold text-white">5 Days Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-xs">
                <Award className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-400">Focus:</span>
                <span className="font-semibold text-white capitalize">{profile?.fitnessGoals?.[0]?.replace('_', ' ') || 'Hypertrophy'}</span>
              </div>
              {profile?.weight && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-xs">
                  <Scale className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-slate-400">Fasted Weight:</span>
                  <span className="font-semibold font-mono text-white">{profile.weight} kg</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/member/workouts/today">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-98">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Start Today&apos;s Workout</span>
              </button>
            </Link>

            <Link href="/member/my-coach?tab=messages">
              <button className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-[#1E2230] text-slate-200 text-xs font-semibold transition-all">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Coach Chat</span>
                {unreadMessages > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Primary Training Split + Coach Consultation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Workout Plan Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2230] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-200 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Training Split</span>
                  <h3 className="text-base font-semibold text-white tracking-tight">Today&apos;s Scheduled Workout</h3>
                </div>
              </div>

              <span className="text-xs font-medium text-slate-400 bg-[#0E1017] px-2.5 py-1 rounded-md border border-[#1E2230] flex items-center gap-1.5 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>45-60 min</span>
              </span>
            </div>

            {program ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {program.name || "Assigned Program Routine"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {program.schedule?.[0]?.dayName || "Full Body Power & Hypertrophy"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0E1017] border border-[#1E2230] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="uppercase tracking-wider">Planned Movements:</span>
                    <span className="font-mono text-slate-300">{program.schedule?.[0]?.exercises?.length || 4} Exercises</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(program.schedule?.[0]?.exercises || [
                      { name: "Barbell Bench Press" },
                      { name: "Incline Dumbbell Press" },
                      { name: "Tricep Pushdowns" },
                      { name: "Lateral Raises" }
                    ]).slice(0, 4).map((ex: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#12141C] border border-[#1E2230] text-xs">
                        <span className="font-medium text-slate-200 truncate">{ex.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-[#0E1017] border border-[#1E2230]">
                          {ex.sets || 3}x{ex.reps || 10}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#0E1017] border border-dashed border-[#1E2230] text-center space-y-1.5">
                <p className="text-xs font-semibold text-white">No Program Assigned Yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Your coach will assign a customized multi-week training protocol to your profile.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-[#1E2230] flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Target: <strong className="text-white font-medium">{program?.goal || 'General Hypertrophy'}</strong>
            </span>
            <Link href="/member/workouts/today">
              <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm">
                <span>Start Workout Logger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Coach Consultation Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 flex flex-col justify-between space-y-5 hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2230] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-200 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Personal Coaching</span>
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {coach?.coachId?.name || "Assigned Coach"}
                  </h3>
                </div>
              </div>

              <Link href="/member/my-coach?tab=messages">
                <button className="relative p-2 rounded-lg bg-[#0E1017] border border-[#1E2230] hover:border-slate-600 text-slate-400 hover:text-white transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#12141C] animate-pulse" />
                  )}
                </button>
              </Link>
            </div>

            {/* Video Consultation Box */}
            {todayAppointment ? (
              <div className="p-4 rounded-xl bg-[#0E1017] border border-[#1E2230] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-slate-300" />
                    <span>Video Consultation</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    todayAppointment.meetingLink 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {todayAppointment.meetingLink ? 'Room Active' : 'Standby'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Time: <strong className="text-white font-semibold">{todayAppointment.startTime ? `${todayAppointment.startTime} - ${todayAppointment.endTime}` : (todayAppointment.timeSlot || 'Today')}</strong>
                </div>

                {todayAppointment.meetingLink ? (
                  <a
                    href={todayAppointment.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white hover:bg-slate-100 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
                  >
                    <GoogleMeetIcon className="w-3.5 h-3.5" />
                    <span>Join Google Meet Session</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-surface border border-[#1E2230] text-slate-500 font-medium text-xs cursor-not-allowed"
                  >
                    <Clock className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span>Waiting for Coach to Open Room</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-[#0E1017] border border-[#1E2230] text-center space-y-1.5">
                <Video className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-white">No Calls Scheduled Today</p>
                <p className="text-[11px] text-slate-400">
                  Book a 1-on-1 strategy check-in or technique review with your coach.
                </p>
                <Link href="/member/my-coach?tab=meetings" className="inline-block pt-1">
                  <span className="text-xs font-semibold text-indigo-400 hover:underline">Schedule 1-on-1 Session →</span>
                </Link>
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-[#1E2230] flex items-center justify-between text-xs text-slate-400">
            <span>Specialization: <strong className="text-white font-medium">{coach?.coachId?.specializations?.[0] || 'Strength & Conditioning'}</strong></span>
            <Link href="/member/my-coach" className="text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
              Coaching Hub <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Performance Matrix: Daily Calories, Hydration, Habits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Daily Macros Card */}
        <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2230] pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-sm text-white">Daily Energy & Macros</h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08]">
                {Math.max(0, targetCalories - currentCalories)} kcal left
              </span>
            </div>

            {/* Calorie Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="text-lg font-bold text-white">{currentCalories}</span>
                <span className="text-slate-400">Goal: {targetCalories} kcal</span>
              </div>
              <div className="w-full h-2 bg-[#0E1017] rounded-full overflow-hidden border border-[#1E2230]">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentCalories / targetCalories) * 100)}%` }}
                />
              </div>
            </div>

            {/* Macro Splits Grid (Clean dot indicators) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Protein</span>
                </div>
                <span className="text-xs font-bold font-mono text-white">{currentProtein}g</span>
                <span className="text-[10px] text-slate-500 block font-mono">/{targetProtein}g</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Carbs</span>
                </div>
                <span className="text-xs font-bold font-mono text-white">{currentCarbs}g</span>
                <span className="text-[10px] text-slate-500 block font-mono">/{targetCarbs}g</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E1017] border border-[#1E2230] text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Fats</span>
                </div>
                <span className="text-xs font-bold font-mono text-white">{currentFat}g</span>
                <span className="text-[10px] text-slate-500 block font-mono">/{targetFat}g</span>
              </div>
            </div>
          </div>

          <Link href="/member/diet" className="pt-2 border-t border-[#1E2230] block">
            <span className="text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors">
              <span>Nutrition Protocol Details</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </span>
          </Link>
        </div>

        {/* Daily Hydration Card */}
        <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2230] pb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-sm text-white">Hydration Intake</h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08]">
                {Math.round((currentWater / targetWater) * 100)}%
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between font-mono text-xs">
                <span className="text-lg font-bold text-white">{currentWater} ml</span>
                <span className="text-slate-400">Goal: {targetWater} ml</span>
              </div>
              <div className="w-full h-2 bg-[#0E1017] rounded-full overflow-hidden border border-[#1E2230]">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentWater / targetWater) * 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Log Buttons */}
            <div className="p-3 rounded-xl bg-[#0E1017] border border-[#1E2230] space-y-2">
              <span className="text-[11px] font-medium text-slate-400 block">Quick Log Water:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLogWater(250)}
                  disabled={loggingWater}
                  className="flex-1 py-1.5 bg-[#12141C] hover:bg-white/[0.05] border border-[#1E2230] rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  +250 ml
                </button>
                <button
                  onClick={() => handleLogWater(500)}
                  disabled={loggingWater}
                  className="flex-1 py-1.5 bg-[#12141C] hover:bg-white/[0.05] border border-[#1E2230] rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  +500 ml
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1E2230] text-[11px] text-slate-500 text-center">
            Consistent fluid intake maintains intracellular muscle volume.
          </div>
        </div>

        {/* Daily Habits & Tasks Card */}
        <div className="bg-[#12141C] border border-[#1E2230] rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2230] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-sm text-white">Daily Habits & Tasks</h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-300 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08]">
                {completedTasksCount} / {tasks.length} Done
              </span>
            </div>

            {tasks.length === 0 ? (
              <div className="p-6 text-center space-y-1.5 bg-[#0E1017] rounded-xl border border-dashed border-[#1E2230]">
                <Check className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-white">All Clear for Today</p>
                <p className="text-[11px] text-slate-500">No pending tasks or recovery check-ins required.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => handleToggleTask(task._id)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-[#0E1017] border border-[#1E2230] hover:border-slate-700 transition-colors text-left group"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/member/my-coach?tab=tasks" className="pt-2 border-t border-[#1E2230] block">
            <span className="text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors">
              <span>View Tasks Checklist</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </span>
          </Link>
        </div>

      </div>

      {/* 4. Biometrics & 3D Progress Teaser Banner */}
      <div className="bg-[#12141C] border border-[#1E2230] p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-all">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">3D Body Analysis & Weekly Check-Ins</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review anthropometric tape measurements, weight logs, and submitted check-in feedback.
            </p>
          </div>
        </div>

        <Link href="/member/progress">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E1017] border border-[#1E2230] hover:border-slate-600 text-white text-xs font-semibold transition-all">
            <span>Open Progress Hub</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </Link>
      </div>

    </div>
  );
}
