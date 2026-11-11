"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  DollarSign, 
  Activity, 
  AlertCircle, 
  ChevronRight, 
  Video, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Dumbbell, 
  MessageSquare, 
  Search, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Send,
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

export default function CoachDashboard() {
  const { user } = useAuthStore();
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeClients: 0, mrr: 0, actionRequired: 0, sessionsToday: 0 });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Quick Action: Google Meet Modal
  const [meetModalOpen, setMeetModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [meetLinkInput, setMeetLinkInput] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);
  const [copiedApptId, setCopiedApptId] = useState<string | null>(null);

  // Quick Action: Assign Task Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    clientId: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "general"
  });

  // Inline Feedback for Check-Ins
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<Record<string, boolean>>({});

  const fetchDashboardData = async () => {
    try {
      const [clientsRes, statsRes, apptsRes, checkInsRes, tasksRes] = await Promise.allSettled([
        api.get('/coach-dashboard/clients'),
        api.get('/coach-dashboard/stats'),
        api.get('/appointments/coach-schedule'),
        api.get('/check-ins/coach/all'),
        api.get('/tasks/coach')
      ]);

      let fetchedClients: any[] = [];
      if (clientsRes.status === 'fulfilled' && clientsRes.value.data.success) {
        fetchedClients = clientsRes.value.data.data;
        setClients(fetchedClients);
      }

      let mrr = 0;
      let active = fetchedClients.length;
      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        mrr = statsRes.value.data.data.mrr;
        active = statsRes.value.data.data.activeClients;
      }

      // Filter appointments for today
      let todayAppts: any[] = [];
      if (apptsRes.status === 'fulfilled' && apptsRes.value.data.success) {
        const allAppts = apptsRes.value.data.data || [];
        const todayStr = new Date().toISOString().split("T")[0];
        todayAppts = allAppts.filter((a: any) => {
          const apptDateStr = a.date ? new Date(a.date).toISOString().split("T")[0] : "";
          return apptDateStr === todayStr && a.status !== 'cancelled';
        });
        setTodayAppointments(todayAppts);
      }

      // Filter check-ins awaiting review
      let pendingCI: any[] = [];
      if (checkInsRes.status === 'fulfilled' && checkInsRes.value.data.success) {
        const allCI = checkInsRes.value.data.data || [];
        pendingCI = allCI.filter((ci: any) => ci.status === 'submitted');
        setPendingCheckIns(pendingCI);
      }

      // Filter today's tasks
      if (tasksRes.status === 'fulfilled' && tasksRes.value.data.success) {
        const allTasks = tasksRes.value.data.data || [];
        const todayStr = new Date().toISOString().split("T")[0];
        const tTasks = allTasks.filter((t: any) => {
          const tDate = t.date ? new Date(t.date).toISOString().split("T")[0] : "";
          return tDate === todayStr;
        });
        setTodayTasks(tTasks);
      }

      setStats({
        activeClients: active,
        mrr: mrr || (active * 1500),
        actionRequired: pendingCI.length + fetchedClients.filter((c: any) => c.status === 'needs_attention').length,
        sessionsToday: todayAppts.length
      });

    } catch (err) {
      console.error('Failed to load coach dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Set default client for task modal
  useEffect(() => {
    if (clients.length > 0 && !taskForm.clientId) {
      setTaskForm(prev => ({ ...prev, clientId: clients[0].clientId?._id || clients[0]._id }));
    }
  }, [clients]);

  // Handle Google Meet modal
  const handleOpenMeetModal = (appt: any) => {
    setSelectedAppt(appt);
    setMeetLinkInput(appt.meetingLink || "");
    setSaveAsDefault(false);
    setMeetModalOpen(true);
  };

  const handleStartGoogleMeetRoom = (appt: any) => {
    window.open("https://meet.google.com/new", "_blank");
    handleOpenMeetModal(appt);
  };

  const handleSaveMeetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    let cleanLink = meetLinkInput.trim();
    if (cleanLink && !cleanLink.startsWith("http")) {
      cleanLink = `https://meet.google.com/${cleanLink}`;
    }

    setIsUpdatingLink(true);
    try {
      const res = await api.put(`/appointments/${selectedAppt._id}/meeting-link`, {
        meetingLink: cleanLink,
        saveAsDefault
      });

      if (res.data?.success) {
        toast.success("Google Meet room link published to athlete");
        setMeetModalOpen(false);
        fetchDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update room link");
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedApptId(id);
    toast.success("Meeting link copied to clipboard");
    setTimeout(() => setCopiedApptId(null), 2500);
  };

  // Handle Quick Task Assignment
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.clientId || !taskForm.title.trim()) {
      toast.error("Please select a client and provide a task title");
      return;
    }

    setIsSubmittingTask(true);
    try {
      const res = await api.post('/tasks/coach', taskForm);
      if (res.data.success) {
        toast.success("Daily task assigned to athlete");
        setTaskModalOpen(false);
        setTaskForm({
          clientId: clients[0]?.clientId?._id || clients[0]?._id || "",
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          type: "general"
        });
        fetchDashboardData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Handle Inline Check-in Review
  const handleSendFeedback = async (checkInId: string) => {
    const feedback = feedbackInputs[checkInId]?.trim();
    if (!feedback) {
      toast.error("Please type your feedback before sending");
      return;
    }

    setSubmittingFeedback(prev => ({ ...prev, [checkInId]: true }));
    try {
      const res = await api.put(`/check-ins/${checkInId}/review`, { feedback });
      if (res.data?.success) {
        toast.success("Check-in reviewed & feedback sent to athlete");
        setPendingCheckIns(prev => prev.filter(ci => ci._id !== checkInId));
        setStats(prev => ({ ...prev, actionRequired: Math.max(0, prev.actionRequired - 1) }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [checkInId]: false }));
    }
  };

  const filteredClients = clients.filter(c => {
    const name = c.clientId?.name || c.name || "";
    const email = c.clientId?.email || c.email || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.status === 'active' : c.status === 'needs_attention');
    return matchesSearch && matchesStatus;
  });

  const completedTodayTasksCount = todayTasks.filter(t => t.completed).length;

  if (isLoading) {
    return (
      <div className="flex h-[65vh] items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-medium text-slate-400 tracking-wide">Syncing coach command center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* 1. Header Overview Bar */}
      <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl p-6 md:p-7 relative overflow-hidden transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Coach Operations Center
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Welcome back, Coach {user?.name?.split(' ')[0] || ''}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Live coaching roster overview, video consultations, and weekly accountability feed.
            </p>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => window.open("https://meet.google.com/new", "_blank")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-98"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Launch Meet Room</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-[#1E2230] text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Task</span>
            </button>

            <Link href="/coach/programs">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-[#1E2230] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all shadow-sm">
                <Dumbbell className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Program Library</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Clients */}
        <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none p-5 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Roster</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{stats.activeClients}</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Athletes</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-[#1E2230]">
            <span>Retention: 98%</span>
            <Link href="/coach/clients" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5">
              Roster <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Monthly MRR */}
        <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none p-5 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">₹{stats.mrr.toLocaleString()}</span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">+12%</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-[#1E2230]">
            <span>Avg ₹{Math.round(stats.mrr / Math.max(1, stats.activeClients))}/client</span>
            <Link href="/coach/earnings" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5">
              Finances <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Consultations Today */}
        <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none p-5 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today&apos;s Calls</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{stats.sessionsToday}</span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">1-on-1 Sessions</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-[#1E2230]">
            <span>Google Meet Sync</span>
            <Link href="/coach/schedule" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-0.5">
              Schedule <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none p-5 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action Queue</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
              stats.actionRequired > 0 
                ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20' 
                : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${stats.actionRequired > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
              {stats.actionRequired}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Pending Review</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 border-t border-slate-100 dark:border-[#1E2230]">
            <span>{pendingCheckIns.length} check-ins</span>
            <span className="font-semibold text-amber-500 dark:text-amber-400">Priority</span>
          </div>
        </div>
      </div>

      {/* 3. Today's Consultations Hub */}
      <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl p-6 space-y-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1E2230] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Today&apos;s Video Consultations</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct Google Meet video consultation rooms for booked athletes.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open("https://meet.google.com/new", "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Open Google Meet</span>
            </button>
            <Link href="/coach/schedule" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Calendar →
            </Link>
          </div>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-dashed border-slate-200 dark:border-[#1E2230] text-center space-y-2">
            <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-900 dark:text-white">No Consultations Scheduled Today</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your calendar is clear today. You can check upcoming athlete check-ins or update available hours.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {todayAppointments.map((appt) => {
              const attendeeName = appt.memberId?.name || "Athlete";
              const attendeeAvatar = appt.memberId?.avatar;
              const hasMeetingLink = !!appt.meetingLink;

              return (
                <div 
                  key={appt._id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200/80 dark:border-[#1E2230] hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-sm dark:shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                        {attendeeAvatar ? (
                          <img src={attendeeAvatar} alt={attendeeName} className="w-full h-full object-cover" />
                        ) : (
                          attendeeName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{attendeeName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{appt.startTime ? `${appt.startTime} - ${appt.endTime}` : (appt.timeSlot || 'Scheduled Session')}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      hasMeetingLink 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}>
                      {hasMeetingLink ? 'Room Active' : 'Standby'}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-[#1E2230]">
                    {hasMeetingLink ? (
                      <div className="flex items-center gap-2 w-full">
                        <a
                          href={appt.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
                        >
                          <GoogleMeetIcon className="w-3.5 h-3.5" />
                          <span>Join Meet Room</span>
                        </a>
                        <button
                          onClick={() => handleCopyLink(appt.meetingLink, appt._id)}
                          className="p-2 rounded-lg bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm dark:shadow-none"
                          title="Copy Link"
                        >
                          {copiedApptId === appt._id ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenMeetModal(appt)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm dark:shadow-none"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => handleStartGoogleMeetRoom(appt)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Start Meet Call</span>
                        </button>
                        <button
                          onClick={() => handleOpenMeetModal(appt)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm dark:shadow-none"
                        >
                          Paste Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Action Required: Athlete Check-Ins Review & Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Check-Ins (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl p-6 space-y-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2230] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Athlete Weekly Check-Ins</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Review progress submissions and deliver coach feedback.</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {pendingCheckIns.length} Pending
            </span>
          </div>

          {pendingCheckIns.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-dashed border-slate-200 dark:border-[#1E2230] text-center space-y-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto opacity-70" />
              <p className="text-xs font-semibold text-slate-900 dark:text-white">All Check-Ins Reviewed</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                All athlete check-ins have been addressed. New check-in submissions will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCheckIns.slice(0, 3).map((ci) => {
                const athleteName = ci.memberId?.name || "Athlete";
                const isSubmitting = submittingFeedback[ci._id];

                return (
                  <div key={ci._id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200/80 dark:border-[#1E2230] space-y-3 shadow-sm dark:shadow-none">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                          {athleteName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{athleteName}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {new Date(ci.date || ci.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Vitals Summary Pill */}
                      <div className="flex items-center gap-2.5 text-xs bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] px-3 py-1 rounded-lg font-mono shadow-sm dark:shadow-none">
                        <span>Weight: <strong className="text-slate-900 dark:text-white">{ci.weight} kg</strong></span>
                        <span className="text-slate-300 dark:text-[#1E2230]">|</span>
                        <span>Energy: <strong className="text-emerald-600 dark:text-emerald-400">{ci.energyLevel || 4}/5</strong></span>
                      </div>
                    </div>

                    {ci.notes && (
                      <div className="p-2.5 bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] rounded-lg text-xs text-slate-600 dark:text-slate-400 italic shadow-sm dark:shadow-none">
                        &ldquo;{ci.notes}&rdquo;
                      </div>
                    )}

                    {/* Inline Coach Feedback Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="text"
                        placeholder="Add quick coach feedback (e.g. Solid week, increase squat weight by 2.5kg)..."
                        value={feedbackInputs[ci._id] || ""}
                        onChange={(e) => setFeedbackInputs(prev => ({ ...prev, [ci._id]: e.target.value }))}
                        className="flex-1 bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm dark:shadow-none"
                      />
                      <button
                        onClick={() => handleSendFeedback(ci._id)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50 shrink-0 shadow-sm"
                      >
                        {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Tasks & Accountability (1 Column) */}
        <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl p-6 space-y-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2230] pb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Assigned Tasks</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] px-2 py-0.5 rounded border border-slate-200 dark:border-white/[0.08]">
                {completedTodayTasksCount}/{todayTasks.length}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center space-y-1.5">
                <Check className="w-6 h-6 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-900 dark:text-white">No Tasks Assigned Today</p>
                <button
                  onClick={() => setTaskModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block mx-auto pt-1"
                >
                  + Assign a Task Now
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task._id} 
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#0E1017] border border-slate-200/80 dark:border-[#1E2230] text-xs shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.completed ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                      <span className={`truncate font-medium ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] shrink-0">
                      {task.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setTaskModalOpen(true)}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1017] dark:hover:bg-white/[0.05] border border-slate-200 dark:border-[#1E2230] hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Assign New Task</span>
          </button>
        </div>

      </div>

      {/* 5. Athlete Roster & Activity Table */}
      <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl p-6 space-y-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#1E2230] pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Athlete Client Roster</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your active clients, current workout goals, and direct channels.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search athlete by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-56 bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="needs_attention">Needs Attention</option>
            </select>
          </div>
        </div>

        {/* Client Roster Grid */}
        {filteredClients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No athletes found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredClients.map((client) => {
              const c = client.clientId || client;
              const hasAlert = client.status === 'needs_attention';

              return (
                <div 
                  key={c._id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200/80 dark:border-[#1E2230] hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3 shadow-sm dark:shadow-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          c.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">{c.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{c.email}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${
                      hasAlert 
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      {hasAlert ? 'Alert' : 'Active'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80 dark:border-[#1E2230]">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                      Goal: <strong className="text-slate-900 dark:text-white">{client.currentGoal?.replace('_', ' ') || 'Strength'}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <Link href={`/coach/inbox?client=${c._id}`}>
                        <button className="p-1.5 rounded-lg bg-white dark:bg-[#12141C] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1E2230] transition-colors shadow-sm dark:shadow-none" title="Message Athlete">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <Link href={`/coach/clients/${c._id}`}>
                        <button className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-[#1E2230] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all shadow-sm dark:shadow-none">
                          Profile
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Google Meet Room Configuration */}
      <AnimatePresence>
        {meetModalOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMeetModalOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] rounded-2xl w-full max-w-md p-6 shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2230]">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Google Meet Video Room</h3>
                </div>
                <button onClick={() => setMeetModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMeetLink} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting URL or Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={meetLinkInput}
                    onChange={(e) => setMeetLinkInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B0C10] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveDefault"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0C10] text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="saveDefault" className="text-xs text-slate-500 dark:text-slate-400 select-none">
                    Save as my recurring Google Meet room link
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMeetModalOpen(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1017] dark:hover:bg-white/[0.05] border border-slate-200 dark:border-[#1E2230] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingLink}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUpdatingLink ? "Publishing..." : "Publish to Athlete"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Quick Task Assignment */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTaskModalOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] rounded-2xl w-full max-w-md p-6 shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2230]">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Assign Athlete Task</h3>
                </div>
                <button onClick={() => setTaskModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Athlete</label>
                  <select
                    value={taskForm.clientId}
                    onChange={(e) => setTaskForm({ ...taskForm, clientId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0B0C10] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    required
                  >
                    {clients.map(c => (
                      <option key={c._id} value={c.clientId?._id || c._id}>
                        {c.clientId?.name || c.name} ({c.clientId?.email || c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 10,000 steps + 4L hydration check"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0B0C10] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Task Category</label>
                    <select
                      value={taskForm.type}
                      onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0B0C10] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="general">General</option>
                      <option value="cardio">Cardio</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="recovery">Recovery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
                    <input
                      type="date"
                      value={taskForm.date}
                      onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0B0C10] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTaskModalOpen(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1017] dark:hover:bg-white/[0.05] border border-slate-200 dark:border-[#1E2230] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTask}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingTask ? "Assigning..." : "Assign Task"}
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
