"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, MapPin, Video, X, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCoach, setSelectedCoach] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/my-appointments');
      if (res.data.success) setAppointments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [appRes, coachRes] = await Promise.all([
          api.get('/appointments/my-appointments'),
          api.get('/coaches')
        ]);
        if (appRes.data.success) setAppointments(appRes.data.data);
        if (coachRes.data.success) setCoaches(coachRes.data.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (selectedCoach && selectedDate) {
      const fetchSlots = async () => {
        try {
          const res = await api.get(`/appointments/available-slots/${selectedCoach}/${selectedDate}`);
          if (res.data.success) {
            setAvailableSlots(res.data.data);
          }
        } catch (err) {
          console.error('Failed to fetch slots', err);
        }
      };
      fetchSlots();
    }
  }, [selectedCoach, selectedDate]);

  const isUpcomingAppointment = (appt: any) => {
    if (!appt || appt.status === 'cancelled' || appt.status === 'completed') return false;
    if (!appt.date) return false;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const apptDateStr = new Date(appt.date).toISOString().split('T')[0];

    if (apptDateStr > todayStr) return true;
    if (apptDateStr < todayStr) return false;

    // Date is today! Check end/start time
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const timeSlot = appt.endTime || appt.startTime || appt.time || "23:59";
    const [endH, endM] = timeSlot.split(':').map(Number);

    if (isNaN(endH)) return true;
    if (endH > currentHours) return true;
    if (endH === currentHours && (isNaN(endM) || endM >= currentMinutes)) return true;

    return false;
  };

  const upcoming = appointments.filter(isUpcomingAppointment);
  const past = appointments.filter(a => !isUpcomingAppointment(a));

  const handleBook = async () => {
    if (!selectedCoach || !selectedDate || !selectedSlot) {
      toast.error('Please select coach, date and time slot');
      return;
    }

    try {
      const [startH, startM] = selectedSlot.split(':').map(Number);
      const endH = String((startH + 1) % 24).padStart(2, '0');
      const endM = String(startM || 0).padStart(2, '0');
      const endTime = `${endH}:${endM}`;

      const res = await api.post('/appointments/book', {
        coachId: selectedCoach,
        date: selectedDate,
        startTime: selectedSlot,
        endTime: endTime,
        type: 'online'
      });
      if (res.data.success) {
        toast.success('Appointment booked successfully!');
        setIsBookingOpen(false);
        setStep(1);
        setSelectedCoach(null);
        setSelectedDate(null);
        setSelectedSlot(null);
        fetchAppointments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book appointment');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await api.put(`/appointments/${id}/cancel`);
      if (res.data.success) {
        toast.success('Appointment cancelled');
        fetchAppointments();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Appointments</h1>
          <p className="text-text-muted mt-1">Manage your 1-on-1 coaching sessions.</p>
        </div>
        <button 
          onClick={() => setIsBookingOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(108,99,255,0.4)]"
        >
          Book Session
        </button>
      </div>

      <div className="flex gap-4 border-b border-border">
        {['upcoming', 'past'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 font-bold text-sm capitalize relative transition-colors ${activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="apptTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(activeTab === 'upcoming' ? upcoming : past).map((appt) => (
          <div key={appt.id} className="bg-surface border border-border p-6 rounded-3xl hover:border-primary/30 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center font-bold text-sm">
                  {appt.coachId?.name ? appt.coachId.name.charAt(0) : '?'}
                </div>
                <div>
                  <h3 className="font-bold">{appt.coachId?.name || 'Unknown Coach'}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    appt.status === 'confirmed' ? 'bg-accent/10 text-accent border-accent/20' :
                    appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                    'bg-text-muted/10 text-text-muted border-text-muted/20'
                  }`}>
                    {appt.status.toUpperCase()}
                  </span>
                </div>
              </div>
              {appt.type === 'online' ? <Video className="w-5 h-5 text-text-muted" /> : <MapPin className="w-5 h-5 text-text-muted" />}
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <CalendarIcon className="w-4 h-4 text-text-muted" /> {appt.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-primary">
                <Clock className="w-4 h-4 text-text-muted" /> {appt.time}
              </div>
              {appt.location && (
                <div className="flex items-center gap-2 text-sm text-text-primary">
                  <MapPin className="w-4 h-4 text-text-muted" /> {appt.location}
                </div>
              )}
            </div>

            {appt.status === 'confirmed' && appt.meetingLink && (
              <a href={appt.meetingLink} target="_blank" rel="noreferrer" className="block w-full">
                <button className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-colors">
                  Join Meeting
                </button>
              </a>
            )}
            
            {activeTab === 'upcoming' && (
               <button className="w-full mt-3 py-2 rounded-xl text-sm font-bold text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                 Cancel Appointment
               </button>
            )}
          </div>
        ))}
      </div>

      {/* Booking Modal Overlay */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsBookingOpen(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-lg rounded-3xl p-6 md:p-8 relative z-10 shadow-2xl"
            >
              <button onClick={() => setIsBookingOpen(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-display font-bold mb-6">Book a Session</h2>

              {step === 1 && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  <h3 className="text-lg font-bold mb-4">1. Select a Coach</h3>
                  <div className="space-y-3">
                    {coaches.map(c => (
                      <div 
                        key={c._id} 
                        onClick={() => setSelectedCoach(c._id)}
                        className={`p-4 rounded-2xl border cursor-pointer flex items-center justify-between transition-colors ${selectedCoach === c._id ? 'border-primary bg-primary/5' : 'border-border hover:bg-background'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center font-bold text-sm">{c.name ? c.name.charAt(0) : '?'}</div>
                          <div>
                            <p className="font-bold">{c.name}</p>
                            <p className="text-xs text-text-muted">{c.specialization || 'Coach'}</p>
                          </div>
                        </div>
                        {selectedCoach === c._id && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                    ))}
                  </div>
                  <button 
                    disabled={!selectedCoach} 
                    onClick={() => setStep(2)}
                    className="w-full mt-6 bg-primary text-white py-3 rounded-full font-bold disabled:opacity-50 transition-colors"
                  >
                    Next Step
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setStep(1)} className="p-1 text-text-muted hover:text-text-primary"><ChevronLeft className="w-5 h-5" /></button>
                    <h3 className="text-lg font-bold">2. Select Date & Time</h3>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-text-muted mb-2">Date</label>
                    <input type="date" onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none" />
                  </div>

                  {selectedDate && (
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-text-muted mb-2">Available Slots</label>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((s, i) => (
                          <button 
                            key={i}
                            disabled={!s.available}
                            onClick={() => setSelectedSlot(s.time)}
                            className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                              !s.available ? 'bg-background border-border text-text-muted/50 cursor-not-allowed' :
                              selectedSlot === s.time ? 'bg-primary border-primary text-white' :
                              'bg-background border-border text-text-primary hover:border-primary'
                            }`}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button 
                    disabled={!selectedDate || !selectedSlot} 
                    onClick={() => setStep(3)}
                    className="w-full bg-primary text-white py-3 rounded-full font-bold disabled:opacity-50 transition-colors"
                  >
                    Next Step
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setStep(2)} className="p-1 text-text-muted hover:text-text-primary"><ChevronLeft className="w-5 h-5" /></button>
                    <h3 className="text-lg font-bold">3. Confirm Details</h3>
                  </div>

                  <div className="bg-background border border-border rounded-2xl p-4 space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Coach</span>
                      <span className="font-bold">{coaches.find(c => c._id === selectedCoach)?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Date</span>
                      <span className="font-bold">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Time</span>
                      <span className="font-bold">{selectedSlot}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Type</span>
                      <span className="font-bold">Online (Zoom)</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleBook}
                    className="w-full bg-accent text-background hover:bg-[#00d68b] py-3 rounded-full font-bold transition-colors shadow-lg shadow-accent/20"
                  >
                    Confirm & Book
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
