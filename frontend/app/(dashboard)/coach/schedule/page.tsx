"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Video, User, X, Plus, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CoachSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availModalOpen, setAvailModalOpen] = useState(false);

  // Availability state
  const [availability, setAvailability] = useState<{ [day: number]: string[] }>({});
  const [availLoading, setAvailLoading] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/appointments/coach-schedule');
      if (res.data.success) setSchedule(res.data.data);
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
        res.data.data.forEach((a: any) => {
          availMap[a.dayOfWeek] = a.slots.map((s: any) => s.startTime);
        });
        setAvailability(availMap);
      }
    } catch (err) {
      console.error('Failed to fetch availability', err);
    } finally {
      setAvailLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
    fetchAvailability();
  }, []);

  const isUpcomingAppointment = (appt: any) => {
    if (!appt || appt.status === 'cancelled' || appt.status === 'completed') return false;
    if (!appt.date) return false;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const apptDateStr = new Date(appt.date).toISOString().split('T')[0];

    if (apptDateStr > todayStr) return true;
    if (apptDateStr < todayStr) return false;

    // Date is today! Check end time
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const timeSlot = appt.endTime || appt.startTime || appt.time || "23:59";
    const [endH, endM] = timeSlot.split(':').map(Number);

    if (isNaN(endH)) return true;
    if (endH > currentHours) return true;
    if (endH === currentHours && (isNaN(endM) || endM >= currentMinutes)) return true;

    return false;
  };

  const filteredSchedule = schedule.filter(appt => {
    const apptDate = new Date(appt.date).toISOString().split('T')[0];
    return apptDate === selectedDate;
  });

  const upcomingSchedule = schedule
    .filter(isUpcomingAppointment)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleStatusChange = async (id: string, action: 'accept' | 'decline') => {
    try {
      if (action === 'decline') {
        await api.put(`/appointments/${id}/cancel`, { cancelReason: 'Coach declined' });
        toast.success("Appointment declined");
      } else {
        await api.put(`/appointments/${id}/confirm`);
        toast.success("Appointment accepted");
      }
      fetchSchedule();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} appointment`);
    }
  };

  const addSlot = (day: number) => {
    const slots = availability[day] || [];
    slots.push("09:00");
    setAvailability({ ...availability, [day]: slots });
  };

  const updateSlot = (day: number, idx: number, val: string) => {
    const slots = [...(availability[day] || [])];
    slots[idx] = val;
    setAvailability({ ...availability, [day]: slots });
  };

  const removeSlot = (day: number, idx: number) => {
    const slots = (availability[day] || []).filter((_, i) => i !== idx);
    setAvailability({ ...availability, [day]: slots });
  };

  const saveAvailability = async () => {
    setSavingAvail(true);
    try {
      const promises = Object.entries(availability).map(([day, slots]) =>
        api.put('/coaches/availability', {
          dayOfWeek: Number(day),
          slots: slots.map(time => ({ startTime: time, endTime: String(Number(time.split(':')[0]) + 1).padStart(2, '0') + ':00' }))
        })
      );
      await Promise.all(promises);
      toast.success("Availability saved!");
      setAvailModalOpen(false);
    } catch (err) {
      toast.error("Failed to save availability");
    } finally {
      setSavingAvail(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">My Schedule</h1>
        <p className="text-text-muted mt-1">Manage your availability and upcoming sessions.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 bg-surface border border-border p-6 rounded-3xl h-fit space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xl font-display font-bold">
              <CalendarIcon className="w-5 h-5 text-primary" /> Calendar
            </div>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" />
            <button onClick={() => { setAvailModalOpen(true); fetchAvailability(); }}
              className="w-full py-2.5 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors">
              Set Weekly Availability
            </button>
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2 text-text-primary">
              <Video className="w-4 h-4 text-accent" /> Instant Meeting Link
            </h3>
            <p className="text-xs text-text-muted">Generate a quick online meeting link to share directly with your client in chat.</p>
            <button 
              onClick={() => {
                const link = `https://meet.google.com/fitcore-${Math.random().toString(36).substring(2, 8)}`;
                navigator.clipboard.writeText(link);
                toast.success("Meeting link copied to clipboard!");
              }}
              className="w-full py-2.5 bg-background border border-border hover:border-accent text-accent font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Video className="w-3.5 h-3.5" /> Copy Instant Link
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          {/* Selected Date Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" /> Appointments for {selectedDate}
              </h2>
              <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                {filteredSchedule.length} session{filteredSchedule.length === 1 ? '' : 's'}
              </span>
            </div>

            {filteredSchedule.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-3xl text-center text-text-muted bg-surface/50">
                <p className="text-sm font-medium">No appointments scheduled for {selectedDate}.</p>
                <p className="text-xs text-text-muted mt-1">Pick another date from the calendar or view upcoming sessions below.</p>
              </div>
            ) : (
              filteredSchedule.map((appt, idx) => (
                <motion.div key={appt._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="bg-surface border border-border p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors shadow-sm">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      {appt.memberId?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{appt.memberId?.name || 'Unknown Member'}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          appt.status === 'confirmed' ? 'bg-accent/10 text-accent border-accent/20' :
                          appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          'bg-text-muted/10 text-text-muted border-text-muted/20'
                        }`}>
                          {appt.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                        <span className="flex items-center gap-1 font-mono"><Clock className="w-3.5 h-3.5 text-primary" /> {appt.startTime} - {appt.endTime}</span>
                        <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-primary" /> {appt.type === 'online' ? '1-on-1 Video Session' : 'In-Person'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2">
                    {appt.status === 'pending' ? (
                      <>
                        <button onClick={() => handleStatusChange(appt._id, 'accept')} className="px-4 py-2 bg-accent/10 text-accent font-bold rounded-xl text-sm hover:bg-accent/20 transition-colors">Accept</button>
                        <button onClick={() => handleStatusChange(appt._id, 'decline')} className="px-4 py-2 bg-background border border-border font-bold rounded-xl text-sm hover:bg-border transition-colors">Decline</button>
                      </>
                    ) : appt.status === 'confirmed' ? (
                      <a href={appt.meetingLink || `https://meet.google.com/fitcore-session`} target="_blank" rel="noreferrer">
                        <button className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-md">
                          <Video className="w-4 h-4" /> Join Call
                        </button>
                      </a>
                    ) : (
                      <span className="px-4 py-2 text-text-muted text-sm font-bold">{appt.status}</span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Upcoming Appointments Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" /> Upcoming Appointments
              </h2>
              <span className="text-xs font-mono font-bold bg-accent/10 text-accent px-3 py-1 rounded-full">
                {upcomingSchedule.length} active
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : upcomingSchedule.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-3xl text-center text-text-muted bg-surface/50">
                <p className="text-sm font-medium">No upcoming appointments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedule.map((appt, idx) => (
                    <motion.div key={`up-${appt._id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-surface border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {appt.memberId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base">{appt.memberId?.name || 'Unknown Member'}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              appt.status === 'confirmed' ? 'bg-accent/10 text-accent border-accent/20' :
                              appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              'bg-text-muted/10 text-text-muted border-text-muted/20'
                            }`}>
                              {appt.status?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                            <span className="flex items-center gap-1 font-mono"><CalendarIcon className="w-3 h-3 text-primary" /> {appt.date}</span>
                            <span className="flex items-center gap-1 font-mono"><Clock className="w-3 h-3 text-primary" /> {appt.startTime} - {appt.endTime}</span>
                            <span className="flex items-center gap-1"><Video className="w-3 h-3 text-primary" /> {appt.type === 'online' ? 'Online' : 'In-Person'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {appt.status === 'pending' ? (
                          <>
                            <button onClick={() => handleStatusChange(appt._id, 'accept')} className="px-3 py-1.5 bg-accent/10 text-accent font-bold rounded-xl text-xs hover:bg-accent/20 transition-colors">Accept</button>
                            <button onClick={() => handleStatusChange(appt._id, 'decline')} className="px-3 py-1.5 bg-background border border-border font-bold rounded-xl text-xs hover:bg-border transition-colors">Decline</button>
                          </>
                        ) : appt.status === 'confirmed' ? (
                          <a href={appt.meetingLink || `https://meet.google.com/fitcore-session`} target="_blank" rel="noreferrer">
                            <button className="px-3 py-1.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-hover transition-colors flex items-center gap-1 shadow-md">
                              <Video className="w-3.5 h-3.5" /> Join Call
                            </button>
                          </a>
                        ) : (
                          <span className="text-xs text-text-muted font-bold capitalize">{appt.status}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Availability Modal */}
      <AnimatePresence>
        {availModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAvailModalOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-surface border border-border rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold">Weekly Availability</h2>
                  <button onClick={() => setAvailModalOpen(false)} className="p-2 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                </div>

                {availLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-6">
                    {DAYS.map((dayName, dayIdx) => {
                      const dateObj = new Date();
                      dateObj.setDate(dateObj.getDate() + ((dayIdx + 7 - dateObj.getDay()) % 7));
                      const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                      return (
                      <div key={dayIdx} className="bg-background border border-border rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold flex items-center gap-2">
                            {dayName} <span className="text-sm font-normal text-text-muted">({dateStr})</span>
                          </h3>
                          <button onClick={() => addSlot(dayIdx)} className="text-sm text-primary hover:underline font-bold flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Slot
                          </button>
                        </div>
                        {(availability[dayIdx] || []).length === 0 ? (
                          <p className="text-xs text-text-muted">No slots set</p>
                        ) : (
                          <div className="space-y-2">
                            {(availability[dayIdx] || []).map((slot, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2">
                                <input type="time" value={slot} onChange={(e) => updateSlot(dayIdx, sIdx, e.target.value)}
                                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
                                <button onClick={() => removeSlot(dayIdx, sIdx)} className="p-1.5 text-text-muted hover:text-danger"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button onClick={() => setAvailModalOpen(false)} className="flex-1 py-3 border border-border rounded-xl font-bold hover:bg-background transition-colors">Cancel</button>
                  <button onClick={saveAvailability} disabled={savingAvail}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {savingAvail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
