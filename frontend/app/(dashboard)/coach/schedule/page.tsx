"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, Clock, Video, User, X, Plus, 
  Loader2, Save, CheckCircle2, AlertCircle, Copy, ExternalLink, 
  Sparkles, RotateCcw, Check, ChevronRight, Sliders, Sun, Moon,
  CalendarCheck, UserCheck, ShieldCheck, RefreshCw, Link2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

// Ordered Monday (1) through Sunday (0) for natural weekly flow
const DAYS_ORDER = [
  { index: 1, name: 'Monday' },
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' },
  { index: 4, name: 'Thursday' },
  { index: 5, name: 'Friday' },
  { index: 6, name: 'Saturday' },
  { index: 0, name: 'Sunday' }
];

const STANDARD_SLOTS_9_5 = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
const MORNING_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00"];
const EVENING_SLOTS = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

const ALL_TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00"
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

const getMeetingUrl = (link?: string) => {
  if (link && link.includes('meet.google.com')) {
    return link;
  }
  return 'https://meet.google.com/new';
};

export default function CoachSchedulePage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'availability'>('sessions');

  // Sessions State
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all'); // 'all' | 'today' | 'upcoming' | YYYY-MM-DD
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  // Availability State
  // Map dayOfWeek (0-6) to array of startTimes e.g. { 1: ["09:00", "10:00"] }
  const [availability, setAvailability] = useState<{ [day: number]: string[] }>({});
  const [originalAvailability, setOriginalAvailability] = useState<{ [day: number]: string[] }>({});
  const [availLoading, setAvailLoading] = useState(true);
  const [savingAvail, setSavingAvail] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Quick slot adder dropdown state per day
  const [addingSlotDay, setAddingSlotDay] = useState<number | null>(null);

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/appointments/coach-schedule');
      if (res.data.success) {
        setSchedule(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch schedule', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async () => {
    setAvailLoading(true);
    try {
      const res = await api.get('/coaches/me/availability');
      if (res.data.success) {
        const availMap: { [day: number]: string[] } = {};
        // Initialize all 7 days as empty arrays by default
        for (let d = 0; d <= 6; d++) {
          availMap[d] = [];
        }

        if (Array.isArray(res.data.data)) {
          res.data.data.forEach((a: any) => {
            if (typeof a.dayOfWeek === 'number' && Array.isArray(a.slots)) {
              availMap[a.dayOfWeek] = Array.from(
                new Set(a.slots.map((s: any) => s.startTime).filter(Boolean))
              ).sort() as string[];
            }
          });
        }
        setAvailability(availMap);
        setOriginalAvailability(JSON.parse(JSON.stringify(availMap)));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to fetch availability', err);
    } finally {
      setAvailLoading(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await fetchSchedule();
    toast.success("Schedule refreshed!");
    setIsRefreshing(false);
  };

  // Custom Meeting Link modal state
  const [editingMeetingAppt, setEditingMeetingAppt] = useState<any | null>(null);
  const [customMeetingLink, setCustomMeetingLink] = useState('');
  const [saveAsDefaultRoom, setSaveAsDefaultRoom] = useState(false);
  const [isSavingLink, setIsSavingLink] = useState(false);

  // Helper to determine if an appointment has a live, valid Google Meet room attached
  const isRealMeetingReady = (link?: string) => {
    if (!link) return false;
    const clean = link.trim();
    return clean.includes('meet.google.com/') && !clean.endsWith('meet.google.com/new') && !clean.endsWith('meet.google.com/');
  };

  const handleLaunchGoogleMeet = (appt: any) => {
    // 1. Open Google Meet /new in a new tab so Google Meet generates the live room code
    window.open('https://meet.google.com/new', '_blank');

    // 2. Open our sleek linking modal so coach can paste the generated code
    setEditingMeetingAppt(appt);
    setCustomMeetingLink(personalMeetLink || '');
    setSaveAsDefaultRoom(false);
  };

  const handleSaveMeetingLink = async () => {
    if (!editingMeetingAppt) return;
    setIsSavingLink(true);
    try {
      const res = await api.put(`/appointments/${editingMeetingAppt._id}/meeting-link`, {
        meetingLink: customMeetingLink.trim(),
        saveAsDefault: saveAsDefaultRoom
      });
      if (res.data.success) {
        toast.success("Google Meet room linked! Athlete can now join.", { icon: '📹' });
        if (saveAsDefaultRoom && customMeetingLink.trim()) {
          setPersonalMeetLink(customMeetingLink.trim());
          if (typeof window !== 'undefined') {
            localStorage.setItem('fitcore_coach_google_meet', customMeetingLink.trim());
          }
        }
        setEditingMeetingAppt(null);
        fetchSchedule();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update meeting link");
    } finally {
      setIsSavingLink(false);
    }
  };

  // Coach personal / persistent Google Meet link state
  const [personalMeetLink, setPersonalMeetLink] = useState('');
  const [isSettingPersonalMeet, setIsSettingPersonalMeet] = useState(false);
  const [tempPersonalMeetLink, setTempPersonalMeetLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fitcore_coach_google_meet');
      if (saved) {
        setPersonalMeetLink(saved);
        setTempPersonalMeetLink(saved);
      }
    }
  }, []);

  const handleSavePersonalMeet = () => {
    const trimmed = tempPersonalMeetLink.trim();
    setPersonalMeetLink(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('fitcore_coach_google_meet', trimmed);
        toast.success("Personal Google Meet link saved!", { icon: '📹' });
      } else {
        localStorage.removeItem('fitcore_coach_google_meet');
        toast.success("Reset to meet.google.com/new");
      }
    }
    setIsSettingPersonalMeet(false);
  };

  const handleCopyGoogleMeetLink = () => {
    const targetLink = personalMeetLink || 'https://meet.google.com/new';
    navigator.clipboard.writeText(targetLink);
    toast.success(
      personalMeetLink
        ? "Personal Google Meet link copied to clipboard!"
        : "Google Meet link copied! Share with your client.",
      { icon: '📹' }
    );
  };

  useEffect(() => {
    fetchSchedule();
    fetchAvailability();

    // Auto-sync polling every 5s for real-time coach-member synchronization
    const interval = setInterval(fetchSchedule, 5000);

    // Auto-sync on window focus
    const onFocus = () => fetchSchedule();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Check unsaved changes
  const markChanged = (next: { [day: number]: string[] }) => {
    setAvailability(next);
    setHasUnsavedChanges(JSON.stringify(next) !== JSON.stringify(originalAvailability));
  };

  // Toggle Day Available / Day Off
  const toggleDay = (day: number) => {
    const currentSlots = availability[day] || [];
    const next = { ...availability };
    if (currentSlots.length > 0) {
      // Turn day off
      next[day] = [];
    } else {
      // Turn day on with standard hours
      next[day] = [...STANDARD_SLOTS_9_5];
    }
    markChanged(next);
  };

  // Add individual slot
  const handleAddSlot = (day: number, time: string) => {
    const current = availability[day] || [];
    if (current.includes(time)) {
      toast.error(`${time} is already added for this day`);
      return;
    }
    const nextSlots = Array.from(new Set([...current, time])).sort();
    const next = { ...availability, [day]: nextSlots };
    markChanged(next);
    setAddingSlotDay(null);
  };

  // Remove individual slot
  const handleRemoveSlot = (day: number, timeToRemove: string) => {
    const current = availability[day] || [];
    const nextSlots = current.filter(t => t !== timeToRemove);
    const next = { ...availability, [day]: nextSlots };
    markChanged(next);
  };

  // Apply Presets
  const applyPreset = (presetType: 'standard_9_5' | 'morning' | 'evening' | 'copy_monday' | 'clear_all') => {
    const next = { ...availability };

    if (presetType === 'standard_9_5') {
      // Mon-Fri 9-5, Sat-Sun Off
      [1, 2, 3, 4, 5].forEach(d => { next[d] = [...STANDARD_SLOTS_9_5]; });
      [6, 0].forEach(d => { next[d] = []; });
      toast.success("Applied Standard Hours (Mon-Fri 9am-5pm, Weekends Off)");
    } else if (presetType === 'morning') {
      [1, 2, 3, 4, 5].forEach(d => { next[d] = [...MORNING_SLOTS]; });
      toast.success("Applied Morning Shift (Mon-Fri 8am-1pm)");
    } else if (presetType === 'evening') {
      [1, 2, 3, 4, 5].forEach(d => { next[d] = [...EVENING_SLOTS]; });
      toast.success("Applied Evening Shift (Mon-Fri 3pm-8pm)");
    } else if (presetType === 'copy_monday') {
      const monSlots = availability[1] || [];
      [2, 3, 4, 5].forEach(d => { next[d] = [...monSlots]; });
      toast.success("Copied Monday slots to Tue, Wed, Thu, Fri");
    } else if (presetType === 'clear_all') {
      [0, 1, 2, 3, 4, 5, 6].forEach(d => { next[d] = []; });
      toast("Cleared all availability slots");
    }

    markChanged(next);
  };

  // Save Availability to Backend (Bulk)
  const saveAvailability = async () => {
    setSavingAvail(true);
    try {
      const schedulePayload = Object.entries(availability).map(([dayStr, slots]) => {
        const dayOfWeek = Number(dayStr);
        return {
          dayOfWeek,
          slots: slots.map(time => {
            const [h, m] = time.split(':').map(Number);
            const endHour = String(h + 1).padStart(2, '0');
            const endTime = `${endHour}:${String(m).padStart(2, '0')}`;
            return { startTime: time, endTime };
          })
        };
      });

      // Use bulk endpoint supported in coachController
      const res = await api.put('/coaches/availability', { schedule: schedulePayload });
      if (res.data.success) {
        toast.success("Weekly availability saved! Clients can now book these slots. 🎉");
        setOriginalAvailability(JSON.parse(JSON.stringify(availability)));
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save availability");
    } finally {
      setSavingAvail(false);
    }
  };

  // Discard changes
  const discardChanges = () => {
    setAvailability(JSON.parse(JSON.stringify(originalAvailability)));
    setHasUnsavedChanges(false);
    toast("Reverted changes");
  };

  // Handle Appointment Status Changes
  const handleStatusChange = async (id: string, action: 'accept' | 'decline' | 'complete') => {
    try {
      if (action === 'decline') {
        await api.put(`/appointments/${id}/cancel`, { cancelReason: 'Coach declined' });
        toast.success("Appointment declined");
      } else if (action === 'complete') {
        await api.put(`/appointments/${id}/complete`);
        toast.success("Session marked as completed! 🏆");
      } else {
        await api.put(`/appointments/${id}/confirm`);
        toast.success("Appointment accepted and confirmed!");
      }
      fetchSchedule();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} appointment`);
    }
  };

  // Computed metrics
  const pendingAppointments = schedule.filter(a => a.status === 'pending');
  const confirmedAppointments = schedule.filter(a => a.status === 'confirmed');
  const completedAppointments = schedule.filter(a => a.status === 'completed');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Filtering for appointments
  const filteredAppointments = schedule.filter(appt => {
    // Status filter
    if (statusFilter !== 'all' && appt.status !== statusFilter) return false;

    // Date filter
    if (selectedDateFilter === 'today') {
      const apptDateStr = new Date(appt.date).toISOString().split('T')[0];
      return apptDateStr === todayStr;
    } else if (selectedDateFilter === 'upcoming') {
      const apptDateStr = new Date(appt.date).toISOString().split('T')[0];
      return apptDateStr >= todayStr && appt.status !== 'completed' && appt.status !== 'cancelled';
    } else if (selectedDateFilter !== 'all') {
      const apptDateStr = new Date(appt.date).toISOString().split('T')[0];
      return apptDateStr === selectedDateFilter;
    }

    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Count active working days
  const activeWorkingDaysCount = Object.values(availability).filter(slots => slots.length > 0).length;
  const totalWeeklySlotsCount = Object.values(availability).reduce((acc, s) => acc + s.length, 0);

  return (
    <div className="max-w-6xl mx-auto pb-24 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Coach Schedule & Availability</h1>
          <p className="text-text-muted mt-1">
            Manage your booked athlete sessions, live video consultations, and weekly working hours.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-surface border border-border rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'sessions'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <CalendarCheck className="w-4 h-4" /> Sessions & Calendar
            {pendingAppointments.length > 0 && (
              <span className="bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded-full font-mono">
                {pendingAppointments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'availability'
                ? 'bg-primary text-white shadow-md'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Sliders className="w-4 h-4 text-accent" /> Working Hours & Slots
            {hasUnsavedChanges && (
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SESSIONS & CALENDAR                                                */}
      {/* ========================================================================= */}
      {activeTab === 'sessions' && (
        <div className="space-y-8">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs uppercase font-bold text-text-muted">Confirmed Sessions</p>
                <h3 className="text-2xl font-mono font-bold text-accent mt-1">{confirmedAppointments.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs uppercase font-bold text-text-muted">Pending Requests</p>
                <h3 className="text-2xl font-mono font-bold text-yellow-400 mt-1">{pendingAppointments.length}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-surface border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs uppercase font-bold text-text-muted">Weekly Active Days</p>
                <h3 className="text-2xl font-mono font-bold text-primary mt-1">{activeWorkingDaysCount} of 7 days</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <CalendarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Instant Google Meet Hub Card */}
          <div className="bg-gradient-to-br from-surface via-surface to-background border border-border p-5 sm:p-6 rounded-3xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 shadow-sm">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-[#1a73e8]/10 border border-[#1a73e8]/30 flex items-center justify-center text-[#1a73e8] shrink-0 shadow-sm">
                <GoogleMeetIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-text-primary">Instant Google Meet Hub</h3>
                  <span className="text-[10px] font-bold bg-[#1a73e8]/15 border border-[#1a73e8]/30 text-[#1a73e8] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-ping" /> LIVE GOOGLE MEET
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  {personalMeetLink 
                    ? `Active Instant Room: ${personalMeetLink}`
                    : "Need a live video consultation? Launch a Google Meet room immediately or copy your Google Meet invite link."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              <a
                href={personalMeetLink || "https://meet.google.com/new"}
                target="_blank"
                rel="noreferrer"
                title="Launch a new Google Meet call in a new tab"
                className="px-4 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-md hover:shadow-[#1a73e8]/30 shrink-0"
              >
                <GoogleMeetIcon className="w-4 h-4 shrink-0" />
                <span>Start Google Meet</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={handleCopyGoogleMeetLink}
                title="Copy Google Meet link to share with athlete"
                className="px-4 py-2.5 bg-background hover:bg-surface border border-border hover:border-[#1a73e8] text-text-primary hover:text-white font-bold rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm shrink-0"
              >
                <Copy className="w-4 h-4 text-[#1a73e8]" />
                <span>Copy Google Meet Link</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingPersonalMeet(true)}
                title="Set your personal permanent Google Meet room URL"
                className="p-2.5 bg-background hover:bg-surface border border-border hover:border-[#1a73e8] text-text-muted hover:text-[#1a73e8] rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            {/* Status Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { key: 'all', label: 'All Sessions' },
                { key: 'pending', label: 'Pending Requests', count: pendingAppointments.length },
                { key: 'confirmed', label: 'Confirmed', count: confirmedAppointments.length },
                { key: 'completed', label: 'Completed', count: completedAppointments.length }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    statusFilter === filter.key
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'bg-surface border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {filter.label}
                  {filter.count !== undefined && filter.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      statusFilter === filter.key ? 'bg-white/20 text-white' : 'bg-background text-text-muted'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Date Quick Filter & Sync */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isRefreshing}
                title="Synchronize schedule"
                className="p-1.5 rounded-xl bg-surface border border-border hover:border-primary/40 text-text-muted hover:text-text-primary transition-colors flex items-center justify-center shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
              </button>
              <span className="text-xs text-text-muted font-medium">Date:</span>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-surface border border-border text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:border-primary"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming Only</option>
                <option value="today">Today Only ({todayStr})</option>
              </select>
            </div>
          </div>

          {/* Sessions List */}
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-3xl p-12 text-center max-w-lg mx-auto">
              <CalendarCheck className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
              <h3 className="font-bold text-lg">No Sessions Found</h3>
              <p className="text-xs text-text-muted mt-1 mb-4">
                {statusFilter === 'pending'
                  ? 'Great job! You have no pending appointment requests waiting for confirmation.'
                  : 'No scheduled appointments match the selected filter.'}
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => { setStatusFilter('all'); setSelectedDateFilter('all'); }}
                  className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appt) => {
                const dateObj = new Date(appt.date);
                const dateStr = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const isToday = new Date(appt.date).toISOString().split('T')[0] === todayStr;

                return (
                  <motion.div
                    key={appt._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface border border-border hover:border-primary/40 p-6 rounded-2xl transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-display font-bold text-lg shrink-0 shadow-sm">
                        {appt.memberId?.avatar ? (
                          <img src={appt.memberId.avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          appt.memberId?.name?.charAt(0) || '?'
                        )}
                      </div>

                      {/* Details */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="font-bold text-lg text-text-primary">
                            {appt.memberId?.name || 'Athlete'}
                          </h3>

                          {isToday && (
                            <span className="text-[10px] font-mono font-bold bg-accent/15 border border-accent/30 text-accent px-2.5 py-0.5 rounded-full animate-pulse">
                              TODAY
                            </span>
                          )}

                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                            appt.status === 'confirmed'
                              ? 'bg-accent/10 text-accent border-accent/20'
                              : appt.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              : appt.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-text-muted/10 text-text-muted border-text-muted/20'
                          }`}>
                            {appt.status}
                          </span>

                          {appt.status === 'confirmed' && (
                            isRealMeetingReady(appt.meetingLink) ? (
                              <span className="text-[10px] font-mono font-bold bg-[#1a73e8]/15 border border-[#1a73e8]/30 text-[#1a73e8] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8] animate-ping" />
                                ROOM LIVE
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                WAITING FOR ROOM
                              </span>
                            )
                          )}
                        </div>

                        <p className="text-xs text-text-muted mt-0.5">{appt.memberId?.email || ''}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted mt-2">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CalendarIcon className="w-3.5 h-3.5 text-primary" /> {dateStr}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono font-bold text-text-primary">
                            <Clock className="w-3.5 h-3.5 text-accent" /> {appt.startTime} - {appt.endTime || 'End'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-primary" />
                            {appt.type === 'online' ? '1-on-1 Video Consultation' : 'In-Person Gym Session'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                      {appt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(appt._id, 'accept')}
                            className="px-4 py-2 bg-accent hover:bg-emerald-400 text-surface font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Booking
                          </button>
                          <button
                            onClick={() => handleStatusChange(appt._id, 'decline')}
                            className="px-4 py-2 bg-background hover:bg-surface border border-border text-text-muted hover:text-danger font-bold rounded-xl text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {appt.status === 'confirmed' && (
                        <>
                          {isRealMeetingReady(appt.meetingLink) ? (
                            <>
                              <a
                                href={appt.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Join athlete in active Google Meet room"
                                className="px-3.5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md hover:shadow-[#1a73e8]/30"
                              >
                                <GoogleMeetIcon className="w-3.5 h-3.5 shrink-0" /> Join Google Meet
                              </a>

                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(appt.meetingLink);
                                  toast.success("Meeting link copied to clipboard!", { icon: '📋' });
                                }}
                                title="Copy room link"
                                className="p-2 bg-surface hover:bg-border border border-border text-text-muted hover:text-text-primary rounded-xl text-xs font-bold transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMeetingAppt(appt);
                                  setCustomMeetingLink(appt.meetingLink);
                                  setSaveAsDefaultRoom(false);
                                }}
                                title="Edit Google Meet room code"
                                className="px-2.5 py-2 bg-surface hover:bg-border border border-border text-text-muted hover:text-text-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Link2 className="w-3.5 h-3.5 text-[#1a73e8]" /> Edit Link
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLaunchGoogleMeet(appt)}
                              title="Start Google Meet call in new tab and link room code for athlete"
                              className="px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md hover:shadow-[#1a73e8]/30 animate-pulse"
                            >
                              <GoogleMeetIcon className="w-3.5 h-3.5 shrink-0" /> Start Google Meet
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </button>
                          )}

                          <button
                            onClick={() => handleStatusChange(appt._id, 'complete')}
                            className="px-3 py-2 bg-surface hover:bg-accent/10 border border-border hover:border-accent text-accent font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </button>
                        </>
                      )}

                      {appt.memberId?._id && (
                        <Link
                          href={`/coach/clients/${appt.memberId._id}`}
                          className="px-3 py-2 bg-background hover:bg-surface border border-border text-text-muted hover:text-text-primary rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <User className="w-3.5 h-3.5" /> Dossier
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKING HOURS & AVAILABILITY                                       */}
      {/* ========================================================================= */}
      {activeTab === 'availability' && (
        <div className="space-y-8">
          {/* Availability Overview & Guidance Banner */}
          <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-accent" /> Weekly Booking Slots Setup
                </h2>
                <p className="text-xs text-text-muted mt-1 max-w-2xl">
                  Choose which days and hours you are available for 1-on-1 coaching consultations.
                  Athletes booking on FitCore will only see the time slots you enable here.
                </p>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs bg-background border border-border px-3 py-1.5 rounded-xl font-mono text-text-primary font-bold">
                  {activeWorkingDaysCount} active days • {totalWeeklySlotsCount} total slots/wk
                </span>
              </div>
            </div>

            {/* Quick 1-Click Preset Templates */}
            <div className="pt-4 border-t border-border">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2.5">
                ⚡ 1-Click Fast Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('standard_9_5')}
                  className="px-3.5 py-2 bg-background hover:bg-primary/10 border border-border hover:border-primary/40 text-text-primary hover:text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Standard Hours (Mon–Fri, 9am–5pm)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('morning')}
                  className="px-3.5 py-2 bg-background hover:bg-surface border border-border hover:border-primary/40 text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Sun className="w-3.5 h-3.5 text-yellow-400" /> Morning Shift (8am–1pm)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('evening')}
                  className="px-3.5 py-2 bg-background hover:bg-surface border border-border hover:border-primary/40 text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Moon className="w-3.5 h-3.5 text-purple-400" /> Evening Shift (3pm–8pm)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('copy_monday')}
                  className="px-3.5 py-2 bg-background hover:bg-surface border border-border text-text-muted hover:text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-primary" /> Copy Monday ➔ All Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('clear_all')}
                  className="px-3.5 py-2 bg-background hover:bg-danger/10 border border-border hover:border-danger/30 text-text-muted hover:text-danger rounded-xl text-xs font-bold transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Floating Save Bar if changes are made */}
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="sticky top-20 z-30 bg-primary/95 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 backdrop-blur-md border border-white/20"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-accent animate-bounce" />
                <div>
                  <h4 className="font-bold text-sm">You have unsaved availability changes!</h4>
                  <p className="text-xs text-white/80">Make sure to save so athletes can book your updated schedule.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={discardChanges}
                  disabled={savingAvail}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAvailability}
                  disabled={savingAvail}
                  className="px-5 py-2 bg-accent hover:bg-emerald-400 text-surface rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg"
                >
                  {savingAvail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Availability
                </button>
              </div>
            </motion.div>
          )}

          {/* Day-by-Day Cards */}
          {availLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              {DAYS_ORDER.map(({ index: dayIdx, name: dayName }) => {
                const slots = availability[dayIdx] || [];
                const isWorkingDay = slots.length > 0;

                return (
                  <div
                    key={dayIdx}
                    className={`bg-surface border rounded-2xl p-5 md:p-6 transition-all ${
                      isWorkingDay 
                        ? 'border-border shadow-sm' 
                        : 'border-border/60 bg-surface/50 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      {/* Day Name & Toggle */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleDay(dayIdx)}
                          className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                            isWorkingDay ? 'bg-accent' : 'bg-border'
                          }`}
                          aria-label={`Toggle ${dayName}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full bg-surface shadow-md transform transition-transform ${
                              isWorkingDay ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <div>
                          <h3 className="font-bold text-lg flex items-center gap-2 text-text-primary">
                            {dayName}
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isWorkingDay
                                ? 'bg-accent/10 text-accent border-accent/20'
                                : 'bg-text-muted/10 text-text-muted border-text-muted/20'
                            }`}>
                              {isWorkingDay ? `${slots.length} Slots Active` : 'Day Off'}
                            </span>
                          </h3>
                        </div>
                      </div>

                      {/* Day Actions */}
                      {isWorkingDay && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...availability, [dayIdx]: [...STANDARD_SLOTS_9_5] };
                              markChanged(next);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold bg-background border border-border hover:border-primary/40 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                          >
                            Set 9am–5pm
                          </button>

                          {/* Add Slot Button / Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setAddingSlotDay(addingSlotDay === dayIdx ? null : dayIdx)}
                              className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Time Slot
                            </button>

                            {/* Dropdown Options */}
                            <AnimatePresence>
                              {addingSlotDay === dayIdx && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="absolute right-0 top-9 z-20 bg-surface border border-border rounded-xl p-2 shadow-2xl w-48 max-h-56 overflow-y-auto"
                                >
                                  <div className="text-[10px] font-bold text-text-muted px-2 py-1 uppercase border-b border-border mb-1">
                                    Select Start Time
                                  </div>
                                  {ALL_TIME_OPTIONS.map((timeOption) => {
                                    const isAdded = slots.includes(timeOption);
                                    return (
                                      <button
                                        key={timeOption}
                                        type="button"
                                        disabled={isAdded}
                                        onClick={() => handleAddSlot(dayIdx, timeOption)}
                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center justify-between ${
                                          isAdded
                                            ? 'text-text-muted/40 cursor-not-allowed'
                                            : 'hover:bg-primary/10 hover:text-primary'
                                        }`}
                                      >
                                        <span>{timeOption}</span>
                                        {isAdded && <span className="text-[10px] text-accent">Added</span>}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Slots Area */}
                    {isWorkingDay ? (
                      <div className="pt-2">
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(slots)).map((startTime, sIdx) => {
                            const [h, m] = startTime.split(':').map(Number);
                            const endHour = String(h + 1).padStart(2, '0');
                            const endTime = `${endHour}:${String(m).padStart(2, '0')}`;

                            return (
                              <div
                                key={`${dayIdx}-${startTime}-${sIdx}`}
                                className="group bg-background border border-border hover:border-accent/50 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                              >
                                <Clock className="w-3.5 h-3.5 text-accent" />
                                <span>{startTime} – {endTime}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlot(dayIdx, startTime)}
                                  title={`Remove ${startTime}`}
                                  className="text-text-muted hover:text-danger p-0.5 rounded transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted flex items-center justify-between pt-1">
                        <span>No consultation slots available on this day.</span>
                        <button
                          type="button"
                          onClick={() => toggleDay(dayIdx)}
                          className="text-xs text-accent hover:underline font-bold"
                        >
                          Enable {dayName}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Save Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-surface border border-border rounded-2xl">
            <div>
              <h4 className="font-bold text-sm">Save Changes to Public Availability</h4>
              <p className="text-xs text-text-muted">Updates will immediately apply to athlete booking screens.</p>
            </div>

            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={discardChanges}
                  disabled={savingAvail}
                  className="px-5 py-2.5 bg-background border border-border hover:bg-border text-text-muted hover:text-text-primary rounded-xl text-xs font-bold transition-colors"
                >
                  Discard
                </button>
              )}
              <button
                type="button"
                onClick={saveAvailability}
                disabled={savingAvail}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
              >
                {savingAvail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Weekly Availability
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Set Custom Google Meet / Video Link */}
      <AnimatePresence>
        {editingMeetingAppt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMeetingAppt(null)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-surface border border-border rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#1a73e8]/10 border border-[#1a73e8]/20 flex items-center justify-center">
                      <GoogleMeetIcon className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-text-primary">Set Video Consultation Link</h3>
                      <p className="text-xs text-text-muted">
                        Session with {editingMeetingAppt.memberId?.name || 'Athlete'} ({editingMeetingAppt.startTime})
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingMeetingAppt(null)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1a73e8]/10 via-[#1a73e8]/5 to-transparent border border-[#1a73e8]/20 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-[#1a73e8] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#1a73e8] animate-ping" />
                        Live Google Meet Tab Opened
                      </span>
                      <a
                        href="https://meet.google.com/new"
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" /> Re-open Meet
                      </a>
                    </div>
                    <p className="text-text-muted text-[11px] leading-relaxed">
                      Copy the room code (e.g. <strong className="text-text-primary font-mono">meet.google.com/xxx-yyyy-zzz</strong>) from Google Meet and paste below. Your athlete will join your exact room.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">
                        Google Meet URL or Code
                      </label>
                      <div className="flex items-center gap-2">
                        {personalMeetLink && (
                          <button
                            type="button"
                            onClick={() => setCustomMeetingLink(personalMeetLink)}
                            className="text-[10px] text-accent hover:underline font-bold"
                          >
                            Use Default Room
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) {
                                setCustomMeetingLink(text.trim());
                                toast.success("Pasted from clipboard!");
                              }
                            } catch {
                              toast.error("Please paste directly into the input.");
                            }
                          }}
                          className="text-[10px] text-[#1a73e8] hover:underline font-bold flex items-center gap-0.5"
                        >
                          <Copy className="w-3 h-3" /> Paste Clipboard
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={customMeetingLink}
                      onChange={(e) => setCustomMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/xxx-yyyy-zzz or xxx-yyyy-zzz"
                      className="w-full bg-background border border-border focus:border-[#1a73e8] rounded-xl px-4 py-3 text-sm focus:outline-none font-mono text-text-primary"
                    />
                    <p className="text-[11px] text-text-muted mt-1.5">
                      This room link will immediately unlock the &quot;Join Google Meet&quot; button on {editingMeetingAppt.memberId?.name || 'the athlete'}&apos;s screen.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer hover:text-text-primary select-none pt-1">
                    <input
                      type="checkbox"
                      checked={saveAsDefaultRoom}
                      onChange={(e) => setSaveAsDefaultRoom(e.target.checked)}
                      className="rounded border-border text-[#1a73e8] focus:ring-[#1a73e8] w-4 h-4 bg-background"
                    />
                    <span>Save this room as my permanent Google Meet link for future sessions</span>
                  </label>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingMeetingAppt(null)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-background transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMeetingLink}
                      disabled={isSavingLink || !customMeetingLink.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                    >
                      {isSavingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Save & Activate Room
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal to Set Coach Personal Google Meet Room */}
      <AnimatePresence>
        {isSettingPersonalMeet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingPersonalMeet(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-surface border border-border rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#1a73e8]/10 border border-[#1a73e8]/20 flex items-center justify-center">
                      <GoogleMeetIcon className="w-5 h-5 shrink-0" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-text-primary">Permanent Google Meet Room</h3>
                      <p className="text-xs text-text-muted">Set your personal Google Meet link for all instant calls</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSettingPersonalMeet(false)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-background border border-border text-xs flex items-center justify-between gap-3">
                    <span className="text-text-muted">Need to generate a new meeting code?</span>
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <GoogleMeetIcon className="w-3.5 h-3.5 shrink-0" /> Launch Google Meet ↗
                    </a>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-1.5">
                      Your Google Meet URL
                    </label>
                    <input
                      type="url"
                      value={tempPersonalMeetLink}
                      onChange={(e) => setTempPersonalMeetLink(e.target.value)}
                      placeholder="https://meet.google.com/xxx-yyyy-zzz"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-mono text-text-primary"
                    />
                    <p className="text-[11px] text-text-muted mt-1.5">
                      When set, &quot;Copy Google Meet Link&quot; will copy this exact URL for your athletes. Leave blank to default to meet.google.com/new.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSettingPersonalMeet(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-background transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePersonalMeet}
                      className="flex-1 py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      Save Room Link
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
