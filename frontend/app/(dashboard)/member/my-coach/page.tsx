"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MessageSquare, ListTodo, Dumbbell, Apple, Video,
  Circle, CheckCircle2, Target, Send, Loader2, ArrowRight,
  Clock, Calendar as CalendarIcon, Search, SlidersHorizontal,
  Star, Award, X, ChevronRight, Plus
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

const SPECIALIZATIONS = ['All', 'Weight Loss', 'HIIT', 'Boxing', 'Endurance', 'Flexibility', 'Mindset'];

const TABS = [
  { key: "tasks", label: "Today's Tasks", icon: ListTodo },
  { key: "program", label: "My Program", icon: Dumbbell },
  { key: "diet", label: "Diet Plan", icon: Apple },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "meetings", label: "Online Meetings", icon: Video },
  { key: "coaches", label: "Browse Coaches", icon: User },
];

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

function MyCoachContent() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "tasks";

  const [activeTab, setActiveTab] = useState(requestedTab);
  const [coach, setCoach] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [assignedProgram, setAssignedProgram] = useState<any>(null);
  const [assignedDiet, setAssignedDiet] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [memberUnreadCount, setMemberUnreadCount] = useState(0);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Browse Coaches State
  const [allCoaches, setAllCoaches] = useState<any[]>([]);
  const [coachFilter, setCoachFilter] = useState("All");
  const [coachSearch, setCoachSearch] = useState("");
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>("");
  const [selectedBookingSlot, setSelectedBookingSlot] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [coachRes, msgRes, taskRes, progRes, dietRes, apptRes] = await Promise.allSettled([
        api.get('/users/my-coach').catch(() => ({ data: { success: false } })),
        api.get('/users/my-messages').catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/tasks/my?date=${today}`).catch(() => ({ data: { success: false, data: [] } })),
        api.get('/workouts/my-program').catch(() => ({ data: { success: false } })),
        api.get('/diet/my-plan').catch(() => ({ data: { success: false } })),
        api.get('/appointments/my-appointments').catch(() => ({ data: { success: false, data: [] } })),
      ]);
      if (coachRes.status === 'fulfilled' && coachRes.value.data?.success) setCoach(coachRes.value.data.data);
      if (msgRes.status === 'fulfilled' && msgRes.value.data?.success) setMessages(msgRes.value.data.data);
      if (taskRes.status === 'fulfilled' && taskRes.value.data?.success) setTasks(taskRes.value.data.data);
      if (progRes.status === 'fulfilled' && progRes.value.data?.success) setAssignedProgram(progRes.value.data.data);
      if (dietRes.status === 'fulfilled' && dietRes.value.data?.success) setAssignedDiet(dietRes.value.data.data);
      if (apptRes.status === 'fulfilled' && apptRes.value.data?.success) setAppointments(apptRes.value.data.data);
    } catch {} finally { setLoading(false); setTasksLoading(false); }
  };

  const fetchCoachesList = async () => {
    setLoadingCoaches(true);
    try {
      const res = await api.get('/coaches');
      if (res.data?.success) {
        setAllCoaches(res.data.data || []);
      }
    } catch {
      toast.error("Failed to load coaches");
    } finally {
      setLoadingCoaches(false);
    }
  };

  const fetchMessagesOnly = async () => {
    try {
      if (activeTab === 'messages') {
        const msgRes = await api.get('/users/my-messages');
        if (msgRes.data?.success) setMessages(msgRes.data.data);
        setMemberUnreadCount(0);
      } else {
        const unreadRes = await api.get('/users/unread-messages');
        if (unreadRes.data?.success) setMemberUnreadCount(unreadRes.data.data?.totalUnread || 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchAll(); 
    const interval = setInterval(fetchMessagesOnly, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "coaches" || !coach) {
      fetchCoachesList();
    }
  }, [activeTab, coach]);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load available slots when booking date changes
  useEffect(() => {
    if (!coach?.coachId?._id || !selectedBookingDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get(`/appointments/available-slots/${coach.coachId._id}/${selectedBookingDate}`);
        if (res.data?.success) {
          setAvailableSlots(res.data.data || []);
        }
      } catch {
        setAvailableSlots(["09:00", "10:00", "11:00", "14:00", "16:00", "17:00"]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [coach, selectedBookingDate]);

  const toggleTask = async (id: string) => {
    try {
      const res = await api.put(`/tasks/my/${id}`);
      if (res.data.success) setTasks(tasks.map(t => t._id === id ? res.data.data : t));
    } catch { toast.error('Failed to update'); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post('/users/my-messages', { content: msgInput });
      if (res.data.success) { setMessages([...messages, res.data.data]); setMsgInput(""); }
    } catch {} finally { setSending(false); }
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coach?.coachId?._id || !selectedBookingDate || !selectedBookingSlot) {
      return toast.error("Please pick a date and time slot");
    }

    setBookingInProgress(true);
    try {
      const [startH, startM] = selectedBookingSlot.split(':').map(Number);
      const endH = String((startH + 1) % 24).padStart(2, '0');
      const endM = String(startM || 0).padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const res = await api.post('/appointments/book', {
        coachId: coach.coachId._id,
        date: selectedBookingDate,
        startTime: selectedBookingSlot,
        endTime: endTime,
        type: 'online'
      });

      if (res.data?.success) {
        toast.success("Online session booked successfully! 🎉");
        setIsBookingOpen(false);
        setSelectedBookingDate("");
        setSelectedBookingSlot("");
        // Refresh appointments
        const apptRes = await api.get('/appointments/my-appointments');
        if (apptRes.data?.success) setAppointments(apptRes.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to book session");
    } finally {
      setBookingInProgress(false);
    }
  };

  const filteredCoaches = allCoaches.filter(c => {
    const matchesFilter = coachFilter === 'All' || (c.specializations && c.specializations.includes(coachFilter));
    const nameMatch = c.userId?.name?.toLowerCase().includes(coachSearch.toLowerCase());
    const specMatch = c.specializations?.some((s: string) => s.toLowerCase().includes(coachSearch.toLowerCase()));
    return matchesFilter && (nameMatch || specMatch);
  });

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">
      {/* Coach Info Header */}
      {coach ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#12141C] rounded-2xl p-6 md:p-7 border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-xl font-bold text-slate-900 dark:text-white shrink-0 border border-slate-200 dark:border-white/[0.08]">
            {coach.coachId?.name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{coach.coachId?.name || 'My Coach'}</h1>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Assigned
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">Your dedicated coach — assigned training programs, nutrition protocols, daily habits, and live consultations.</p>
          </div>
          <button 
            onClick={() => {
              setActiveTab("meetings");
              setIsBookingOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-sm shrink-0"
          >
            <Video className="w-3.5 h-3.5" /> Book Online Meeting
          </button>
        </motion.div>
      ) : (
        <div className="bg-white dark:bg-[#12141C] rounded-2xl p-6 md:p-7 border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-700 dark:text-slate-200">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No Coach Assigned Yet</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a certified coach below to unlock custom programming and 1-on-1 consultations.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("coaches")}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-indigo-500 transition-colors"
          >
            Explore Coaches
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200 dark:border-[#1E2230]">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => {
            setActiveTab(tab.key);
            if (tab.key === 'messages') setMemberUnreadCount(0);
          }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
            {tab.key === 'messages' && memberUnreadCount > 0 && activeTab !== 'messages' && (
              <span className="bg-danger text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm shadow-danger/40 animate-pulse">
                {memberUnreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        
        {/* 1. Today's Tasks */}
        {activeTab === "tasks" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <ListTodo className="text-primary w-6 h-6" /> Today's Assigned Tasks
            </h3>
            {tasksLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-text-muted text-sm font-medium">No tasks assigned for today. Enjoy your rest day!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t: any) => (
                  <div key={t._id} onClick={() => toggleTask(t._id)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      t.completed ? 'bg-accent/5' : 'bg-background hover:bg-background/80'
                    }`}>
                    <div className="mt-0.5">
                      {t.completed ? <CheckCircle2 className="w-5 h-5 text-accent" /> : <Circle className="w-5 h-5 text-text-muted hover:text-primary transition-colors" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${t.completed ? 'line-through text-text-muted' : ''}`}>{t.title}</span>
                      {t.description && <p className="text-xs text-text-muted mt-0.5">{t.description}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium self-center ${
                      t.type === 'workout' ? 'bg-primary/20 text-primary' :
                      t.type === 'diet' ? 'bg-accent/20 text-accent' :
                      t.type === 'habit' ? 'bg-warning/20 text-warning' : 'bg-border text-text-muted'
                    }`}>{t.type}</span>
                  </div>
                ))}
                <p className="text-xs text-text-muted text-center pt-2">{tasks.filter((t: any) => t.completed).length}/{tasks.length} completed</p>
              </div>
            )}
          </div>
        )}

        {/* 2. My Program */}
        {activeTab === "program" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <Dumbbell className="text-primary w-6 h-6" /> Assigned Workout Program
            </h3>
            {assignedProgram ? (
              <div className="space-y-4">
                <div className="bg-background rounded-xl p-5 border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold">{assignedProgram.name}</h4>
                      <p className="text-sm text-text-muted mt-2">{assignedProgram.description}</p>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium whitespace-nowrap">{assignedProgram.durationWeeks} weeks</span>
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {assignedProgram.goal?.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {assignedProgram.difficulty || 'intermediate'}</span>
                    {assignedProgram.coachId?.name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> by {assignedProgram.coachId.name}</span>}
                  </div>
                </div>
                {assignedProgram.schedule?.length > 0 && (
                  <div>
                    <h5 className="font-bold text-sm mb-3 text-text-muted uppercase tracking-wider">Schedule</h5>
                    <div className="space-y-2">
                      {assignedProgram.schedule.map((day: any, i: number) => (
                        <div key={i} className="bg-background rounded-xl p-4 border border-border flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{day.day || i + 1}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{day.exercise || day.name || `Day ${day.day || i + 1}`}</p>
                            {day.sets && <p className="text-xs text-text-muted">{day.sets} sets x {day.reps} reps</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                <Dumbbell className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-text-muted text-sm font-medium">No program assigned yet. Your coach will upload your routine soon.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. Diet Plan */}
        {activeTab === "diet" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <Apple className="text-accent w-6 h-6" /> Assigned Diet Plan
            </h3>
            {assignedDiet ? (
              <div className="space-y-6">
                <div className="bg-background rounded-xl p-5 border border-border">
                  <h4 className="text-xl font-bold">{assignedDiet.name}</h4>
                  <p className="text-sm text-text-muted mt-1">{assignedDiet.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-surface p-3 rounded-lg text-center">
                      <span className="text-xs text-text-muted">Calories</span>
                      <p className="text-lg font-bold font-mono">{assignedDiet.caloriesTarget} kcal</p>
                    </div>
                    <div className="bg-surface p-3 rounded-lg text-center">
                      <span className="text-xs text-text-muted">Protein</span>
                      <p className="text-lg font-bold font-mono text-accent">{assignedDiet.macrosTarget?.protein}g</p>
                    </div>
                    <div className="bg-surface p-3 rounded-lg text-center">
                      <span className="text-xs text-text-muted">Carbs</span>
                      <p className="text-lg font-bold font-mono text-primary">{assignedDiet.macrosTarget?.carbs}g</p>
                    </div>
                    <div className="bg-surface p-3 rounded-lg text-center">
                      <span className="text-xs text-text-muted">Fat</span>
                      <p className="text-lg font-bold font-mono text-warning">{assignedDiet.macrosTarget?.fat}g</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                <Apple className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-text-muted text-sm font-medium">No diet plan assigned yet. Ask your coach to create a custom macro blueprint.</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Messages */}
        {activeTab === "messages" && (
          <div className="bg-white dark:bg-[#12141C] rounded-2xl border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col h-[560px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#1E2230] bg-slate-50 dark:bg-[#0E1017] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {coach?.coachId?.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{coach?.coachId?.name || 'Coach'}</h4>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">● Online</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">Send your first message to your coach!</div>
              ) : (
                messages.map((m: any, i: number) => {
                  const isMe = m.senderRole === 'member';
                  return (
                    <div key={m._id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[75%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                        isMe ? 'bg-indigo-600 text-white rounded-br-none shadow-sm' : 'bg-slate-100 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm dark:shadow-none'
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 px-1 mt-0.5">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 dark:border-[#1E2230] bg-slate-50 dark:bg-[#0E1017] flex gap-2">
              <input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Type a message to your coach..."
                className="flex-1 bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 transition-colors text-xs text-slate-900 dark:text-white placeholder-slate-400" />
              <button type="submit" disabled={!msgInput.trim() || sending}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-sm">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {/* 5. Online Meetings */}
        {activeTab === "meetings" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-xl flex items-center gap-2">
                  <Video className="text-primary w-6 h-6" /> Online Meetings & Consultations
                </h3>
                <p className="text-sm text-text-muted mt-1">Join scheduled 1-on-1 Google Meet video calls or reserve new slots.</p>
              </div>
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" /> Book New Session
              </button>
            </div>

            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                  <Video className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-text-muted font-medium">No online meetings scheduled.</p>
                  <p className="text-xs text-text-muted mt-1 mb-4">Book a 1-on-1 video call session to discuss your form, nutrition, or questions.</p>
                  <button 
                    onClick={() => setIsBookingOpen(true)}
                    className="inline-flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    Schedule a Session Now
                  </button>
                </div>
              ) : (
                appointments.map((appt) => (
                  <div key={appt._id} className="bg-background border border-border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          appt.status === 'confirmed' ? 'bg-accent/10 text-accent border-accent/20' :
                          appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          appt.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          'bg-text-muted/10 text-text-muted border-text-muted/20'
                        }`}>
                          {appt.status?.toUpperCase()}
                        </span>
                        <span className="text-xs text-text-muted font-mono">{appt.type === 'online' ? '1-on-1 Video Session' : 'In-Person Session'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium pt-1">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-primary" /> {appt.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {appt.startTime || appt.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {appt.meetingLink && appt.meetingLink.includes('meet.google.com/') && !appt.meetingLink.endsWith('meet.google.com/new') && !appt.meetingLink.endsWith('meet.google.com/') ? (
                        <a 
                          href={appt.meetingLink} 
                          target="_blank" 
                          rel="noreferrer"
                        >
                          <button className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2 hover:shadow-[#1a73e8]/30 animate-pulse">
                            <GoogleMeetIcon className="w-4 h-4 shrink-0" /> Join Google Meet
                          </button>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-text-muted bg-surface/50 border border-border px-3 py-1.5 rounded-xl">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span>Awaiting Coach to start room</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 6. Browse Coaches Catalog */}
        {activeTab === "coaches" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-xl font-display font-bold">Elite Coach Directory</h3>
                <p className="text-text-muted text-xs mt-0.5">Explore certified fitness specialists and trainers.</p>
              </div>
              
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search by name or specialty..."
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <SlidersHorizontal className="w-4 h-4 text-text-muted shrink-0 mr-1" />
              {SPECIALIZATIONS.map(spec => (
                <button
                  key={spec}
                  onClick={() => setCoachFilter(spec)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    coachFilter === spec 
                      ? 'bg-primary border-primary text-white shadow-sm' 
                      : 'bg-surface border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>

            {/* Coach Cards Grid */}
            {loadingCoaches ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCoaches.map((c) => (
                  <div key={c._id} className="bg-surface border border-border rounded-3xl p-6 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
                          {c.userId?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-text-primary">{c.userId?.name || 'Coach'}</h4>
                          <p className="text-xs text-text-muted">{c.experienceYears || 5}+ Years Experience</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-400 font-bold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{c.rating || "4.9"} (120+ reviews)</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-text-muted line-clamp-2">
                        {c.bio || "Certified personal trainer dedicated to helping you hit peak performance and strength goals."}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {(c.specializations || ['Strength', 'Nutrition']).slice(0, 3).map((spec: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-background px-2.5 py-1 rounded-lg border border-border text-text-primary">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-bold text-text-muted">
                        ₹<strong className="text-text-primary text-sm">{c.hourlyRate || 1500}</strong> / session
                      </span>
                      <Link href={`/member/coaches/${c._id}`}>
                        <button className="px-4 py-2 rounded-xl bg-background border border-border hover:border-primary text-text-primary text-xs font-bold transition-all flex items-center gap-1">
                          <span>View Profile</span>
                          <ChevronRight className="w-3.5 h-3.5 text-primary" />
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </motion.div>

      {/* Book Online Session Modal */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsBookingOpen(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-2"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-display font-bold mb-1 flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Book 1-on-1 Online Call
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Schedule a real-time Google Meet video consultation with {coach?.coachId?.name || 'your coach'}.
              </p>

              <form onSubmit={handleBookSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Select Consultation Date
                  </label>
                  <input 
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedBookingDate}
                    onChange={(e) => setSelectedBookingDate(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                    Available Time Slot
                  </label>
                  {loadingSlots ? (
                    <div className="py-4 text-center text-xs text-text-muted flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading slots...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {(availableSlots.length > 0 ? availableSlots : ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]).map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedBookingSlot(slot)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                            selectedBookingSlot === slot
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-background border-border text-text-muted hover:border-text-primary'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setIsBookingOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={bookingInProgress || !selectedBookingDate || !selectedBookingSlot}
                    className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {bookingInProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>Confirm Booking</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function MyCoachPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <MyCoachContent />
    </Suspense>
  );
}
