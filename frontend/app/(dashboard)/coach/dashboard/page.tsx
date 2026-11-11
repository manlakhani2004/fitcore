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
  Sparkles, 
  Dumbbell, 
  Apple, 
  MessageSquare, 
  ArrowUpRight, 
  Search, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Flame, 
  Send,
  Loader2,
  TrendingUp,
  Award
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

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
        toast.success("Google Meet room link published to athlete! 🎯");
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
    toast.success("Meeting link copied to clipboard!");
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
        toast.success("Daily task assigned to athlete!");
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
        toast.success("Check-in reviewed & feedback sent to athlete! 🎯");
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* 1. Header & Live Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface border border-border p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Coach Command Center
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Welcome back, {user?.name || 'Coach'} 👋
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-2xl">
            Here is your live coaching overview, today&apos;s 1-on-1 consultations, and athlete accountability feed.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.open("https://meet.google.com/new", "_blank")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-background font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-accent/20 active:scale-95"
          >
            <Video className="w-4 h-4" />
            <span>Launch Meet</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Task</span>
          </button>

          <Link href="/coach/programs">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border hover:border-primary text-text-primary font-bold text-sm transition-all hover:bg-border/30">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span>Library</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Clients */}
        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-muted">Active Athletes</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold">{stats.activeClients}</span>
            <span className="text-xs text-accent font-bold">Roster Capacity</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border/50">
            <span>Retention: 98%</span>
            <Link href="/coach/clients" className="text-primary hover:underline font-bold flex items-center gap-0.5">
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Monthly MRR */}
        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-accent/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-muted">Monthly MRR</span>
            <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold">₹{stats.mrr.toLocaleString()}</span>
            <span className="text-xs text-accent font-bold">+12% MoM</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border/50">
            <span>Avg ₹{Math.round(stats.mrr / Math.max(1, stats.activeClients))}/client</span>
            <Link href="/coach/earnings" className="text-accent hover:underline font-bold flex items-center gap-0.5">
              Finances <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Consultations Today */}
        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-[#1a73e8]/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-muted">Calls Today</span>
            <div className="w-10 h-10 rounded-2xl bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center font-bold">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-[#1a73e8]">{stats.sessionsToday}</span>
            <span className="text-xs text-text-muted font-bold">1-on-1 Sessions</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border/50">
            <span>Google Meet Sync</span>
            <Link href="/coach/schedule" className="text-[#1a73e8] hover:underline font-bold flex items-center gap-0.5">
              Schedule <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden group hover:border-warning/50 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-muted">Action Required</span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              stats.actionRequired > 0 ? 'bg-warning/20 text-warning animate-pulse' : 'bg-accent/10 text-accent'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold ${stats.actionRequired > 0 ? 'text-warning' : 'text-accent'}`}>
              {stats.actionRequired}
            </span>
            <span className="text-xs text-text-muted font-bold">Check-ins & Alerts</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted pt-3 border-t border-border/50">
            <span>{pendingCheckIns.length} check-ins pending</span>
            <span className="font-bold text-warning">Urgent</span>
          </div>
        </div>
      </div>

      {/* 3. Today's Consultations Hub & Google Meet Bar */}
      <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Today&apos;s Video Consultations</h2>
              <p className="text-xs md:text-sm text-text-muted">Synchronized Google Meet video rooms for your booked athletes.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open("https://meet.google.com/new", "_blank")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background border border-border hover:border-primary text-text-primary text-xs font-bold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Open Google Meet</span>
            </button>
            <Link href="/coach/schedule">
              <button className="text-xs font-bold text-primary hover:underline">
                View Full Calendar →
              </button>
            </Link>
          </div>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-background/50 border border-border/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-border/40 text-text-muted flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-text-primary">No Video Consultations Scheduled Today</p>
            <p className="text-xs text-text-muted max-w-md mx-auto">
              You are all caught up on calls for today. Check your upcoming sessions or update your available working hours in the schedule.
            </p>
            <Link href="/coach/schedule" className="inline-block pt-2">
              <span className="text-xs font-bold text-primary hover:underline">Manage Availability & Calendar →</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayAppointments.map((appt) => {
              const attendeeName = appt.memberId?.name || "Athlete";
              const attendeeAvatar = appt.memberId?.avatar;
              const hasMeetingLink = !!appt.meetingLink;

              return (
                <div 
                  key={appt._id}
                  className="p-5 rounded-2xl bg-background border border-border hover:border-primary/40 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                        {attendeeAvatar ? (
                          <img src={attendeeAvatar} alt={attendeeName} className="w-full h-full object-cover" />
                        ) : (
                          attendeeName.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-base">{attendeeName}</h4>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          <span className="font-mono">{appt.startTime ? `${appt.startTime} - ${appt.endTime}` : (appt.timeSlot || 'Scheduled Session')}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      hasMeetingLink 
                        ? 'bg-accent/10 text-accent border-accent/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {hasMeetingLink ? '● Room Live' : 'Pending Room'}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    {hasMeetingLink ? (
                      <div className="flex items-center gap-2 w-full">
                        <a
                          href={appt.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a73e8] text-white text-xs font-bold hover:bg-[#1557b0] transition-colors shadow-md shadow-[#1a73e8]/20"
                        >
                          <Video className="w-4 h-4" />
                          <span>Join Google Meet</span>
                        </a>
                        <button
                          onClick={() => handleCopyLink(appt.meetingLink, appt._id)}
                          className="p-2.5 rounded-xl bg-surface border border-border hover:border-primary text-text-muted hover:text-text-primary transition-colors"
                          title="Copy Link"
                        >
                          {copiedApptId === appt._id ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenMeetModal(appt)}
                          className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-muted hover:text-text-primary transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => handleStartGoogleMeetRoom(appt)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a73e8] text-white text-xs font-bold hover:bg-[#1557b0] transition-colors shadow-md shadow-[#1a73e8]/20"
                        >
                          <Video className="w-4 h-4" />
                          <span>Start Google Meet Call</span>
                        </button>
                        <button
                          onClick={() => handleOpenMeetModal(appt)}
                          className="px-3 py-2 rounded-xl bg-surface border border-border text-xs text-text-muted hover:text-text-primary transition-colors"
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
        <div className="lg:col-span-2 bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-warning/10 text-warning flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold">Athlete Weekly Check-Ins</h3>
                <p className="text-xs text-text-muted">Review athlete metrics and deliver weekly feedback.</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-warning/10 text-warning border border-warning/20">
              {pendingCheckIns.length} Pending
            </span>
          </div>

          {pendingCheckIns.length === 0 ? (
            <div className="p-8 rounded-2xl bg-background/50 border border-border/60 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-text-primary">All Check-Ins Are Reviewed!</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Your athletes are on track. When an athlete submits their Sunday check-in, it will appear here for 1-click review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCheckIns.slice(0, 3).map((ci) => {
                const athleteName = ci.memberId?.name || "Athlete";
                const isSubmitting = submittingFeedback[ci._id];

                return (
                  <div key={ci._id} className="p-5 rounded-2xl bg-background border border-border space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {athleteName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-text-primary">{athleteName}</h4>
                          <span className="text-[11px] text-text-muted">
                            Submitted {new Date(ci.date || ci.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Vitals Summary Pill */}
                      <div className="flex items-center gap-3 text-xs bg-surface border border-border px-3 py-1.5 rounded-xl font-medium">
                        <span>Weight: <strong className="text-text-primary">{ci.weight} kg</strong></span>
                        <span className="text-border">|</span>
                        <span>Energy: <strong className="text-accent">{ci.energyLevel || 4}/5</strong></span>
                        <span className="text-border">|</span>
                        <span>Adherence: <strong className="text-primary">{ci.dietAdherence || 'On Plan'}</strong></span>
                      </div>
                    </div>

                    {ci.notes && (
                      <div className="p-3 bg-surface border border-border/60 rounded-xl text-xs text-text-muted italic">
                        &ldquo;{ci.notes}&rdquo;
                      </div>
                    )}

                    {/* Inline Coach Feedback Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="text"
                        placeholder="Add quick feedback (e.g. Great progress, increase bench weight by 2.5kg!)..."
                        value={feedbackInputs[ci._id] || ""}
                        onChange={(e) => setFeedbackInputs(prev => ({ ...prev, [ci._id]: e.target.value }))}
                        className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        onClick={() => handleSendFeedback(ci._id)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                      >
                        {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
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
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-display font-bold">Daily Tasks</h3>
              </div>
              <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                {completedTodayTasksCount}/{todayTasks.length} Completed
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Flame className="w-8 h-8 text-text-muted mx-auto opacity-40" />
                <p className="text-xs text-text-muted">No daily tasks scheduled for today.</p>
                <button
                  onClick={() => setTaskModalOpen(true)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Assign a Task Now
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task._id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${task.completed ? 'bg-accent' : 'bg-warning animate-pulse'}`} />
                      <span className={`font-medium ${task.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted uppercase font-bold bg-surface px-2 py-0.5 rounded border border-border">
                      {task.clientId?.name || 'Athlete'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setTaskModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-background hover:bg-border/40 border border-border text-xs font-bold text-text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Assign New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Client Roster & Management */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden space-y-6 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h2 className="text-xl font-display font-bold">Client Roster & Status</h2>
            <p className="text-xs md:text-sm text-text-muted">View active client goals, compliance, and quick action dossiers.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                placeholder="Search athlete..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-text-muted focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="needs_attention">Needs Attention</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-xs font-bold text-text-muted uppercase tracking-wider">
                <th className="p-4">Athlete</th>
                <th className="p-4">Target Goal</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Check-In</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredClients.map((client) => {
                const cId = client.clientId?._id || client._id;
                const cName = client.clientId?.name || client.name || "Athlete";
                const cEmail = client.clientId?.email || client.email || "";
                const cAvatar = client.clientId?.avatar;

                return (
                  <tr key={client._id} className="hover:bg-background/40 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs overflow-hidden shrink-0">
                          {cAvatar ? (
                            <img src={cAvatar} alt={cName} className="w-full h-full object-cover" />
                          ) : (
                            cName.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary text-sm">{cName}</p>
                          <p className="text-xs text-text-muted">{cEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-xs text-text-muted font-medium">
                      {client.currentGoal || 'General Fitness'}
                    </td>

                    <td className="p-4">
                      {client.status === 'active' || client.status === 'on_track' ? (
                        <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent px-2.5 py-1 rounded-full text-xs font-bold border border-accent/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                          <AlertCircle className="w-3 h-3" /> Needs Attention
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-xs text-text-muted">
                      {client.lastCheckInDate ? new Date(client.lastCheckInDate).toLocaleDateString() : 'No Check-ins'}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/coach/clients/${cId}`}>
                          <button className="px-3 py-1.5 rounded-lg bg-background hover:bg-border/60 border border-border text-xs font-bold text-text-primary transition-colors">
                            Dossier
                          </button>
                        </Link>
                        <Link href={`/coach/clients?tab=progress&client=${cId}`}>
                          <button className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors" title="3D Progress">
                            <Activity className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/coach/inbox?client=${cId}`}>
                          <button className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors" title="Message">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-text-muted">
                    No clients found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Sync Google Meet Link */}
      <AnimatePresence>
        {meetModalOpen && selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setMeetModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-border/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1a73e8]/10 text-[#1a73e8] flex items-center justify-center font-bold">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">Sync Google Meet Room</h3>
                  <p className="text-xs text-text-muted">
                    Consultation with {selectedAppt.memberId?.name || "Athlete"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-background border border-border/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>1. Generate host meeting room:</span>
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#1a73e8] hover:underline"
                  >
                    <span>meet.google.com/new</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-text-muted">
                  2. Copy the meeting link or code (e.g. <code>xxx-yyyy-zzz</code>) and paste below. The athlete will unlock their join button immediately.
                </p>
              </div>

              <form onSubmit={handleSaveMeetLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Google Meet Link / Code</label>
                  <input 
                    type="text"
                    required
                    placeholder="https://meet.google.com/xxx-yyyy-zzz or code"
                    value={meetLinkInput}
                    onChange={(e) => setMeetLinkInput(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-[#1a73e8] transition-colors"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0"
                  />
                  <span>Save as my default meeting room for future calls</span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMeetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingLink || !meetLinkInput.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1a73e8] text-white text-xs font-bold hover:bg-[#1557b0] transition-colors shadow-lg shadow-[#1a73e8]/20 disabled:opacity-50"
                  >
                    {isUpdatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>Publish & Sync Room</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Assign Task */}
      <AnimatePresence>
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setTaskModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-border/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">Assign Daily Athlete Task</h3>
                  <p className="text-xs text-text-muted">Create a goal, habit, or recovery task for your athlete.</p>
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Select Athlete</label>
                  <select
                    value={taskForm.clientId}
                    onChange={(e) => setTaskForm({ ...taskForm, clientId: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                  >
                    {clients.map(c => (
                      <option key={c._id} value={c.clientId?._id || c._id}>
                        {c.clientId?.name || c.name} ({c.currentGoal || 'Fitness'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10,000 Steps + 15 min Post-Workout Stretch"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted">Date</label>
                    <input
                      type="date"
                      value={taskForm.date}
                      onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted">Category</label>
                    <select
                      value={taskForm.type}
                      onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    >
                      <option value="workout">Workout</option>
                      <option value="diet">Diet & Nutrition</option>
                      <option value="habit">Habit & Recovery</option>
                      <option value="general">General Check-In</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Specific notes or instructions..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTask}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Assign Task</span>
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
