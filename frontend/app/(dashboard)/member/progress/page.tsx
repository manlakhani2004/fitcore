"use client";

import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Camera, Plus, Scale, Ruler, ClipboardCheck, MessageSquare, 
  Moon, BatteryCharging, AlertCircle, CheckCircle2, Clock, Star, 
  Sparkles, Award, UserCheck
} from "lucide-react";
import { PhotoSlider } from "@/components/ui/PhotoSlider";
import { motion, AnimatePresence } from "framer-motion";

import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'checkins'>('analytics');

  // Analytics State
  const [activeChart, setActiveChart] = useState<'weight' | 'bodyFat'>('weight');
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>({ chest: 0, arms: 0, waist: 0, thighs: 0 });
  const [photos, setPhotos] = useState<any[]>([]);
  
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [newMetrics, setNewMetrics] = useState({ weight: '', bodyFat: '', chest: '', arms: '', waist: '', thighs: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Weekly Check-Ins State
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [newCheckIn, setNewCheckIn] = useState({
    weight: '',
    sleepHours: '7.5',
    sleepQuality: 4,
    energyLevel: 4,
    stressLevel: 2,
    dietAdherence: '100% On Plan',
    workoutsCompleted: '4',
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchCheckIns = async () => {
    try {
      const res = await api.get('/check-ins/my-check-ins');
      if (res.data?.success) {
        setCheckIns(res.data.data || []);
      }
    } catch (err) {
      console.debug("Failed to fetch check-ins", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [measRes, photoRes] = await Promise.all([
          api.get('/progress/measurements'),
          api.get('/progress/photos')
        ]);
        
        if (measRes.data.success && measRes.data.data.length > 0) {
          const data = measRes.data.data;
          setMeasurements(data);
          
          const formatted = data.map((d: any) => {
            const dateObj = new Date(d.date);
            return {
              date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              weight: d.weight,
              bodyFat: d.bodyFat
            };
          });
          setChartData(formatted);

          const latest = data[data.length - 1] || data[0];
          setLatestMetrics({
            chest: latest.chest || 0,
            arms: latest.arms || 0,
            waist: latest.waist || 0,
            thighs: latest.thighs || 0
          });
        }
        
        if (photoRes.data.success) {
          setPhotos(photoRes.data.data);
        }

        await fetchCheckIns();
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        weight: Number(newMetrics.weight),
        bodyFat: Number(newMetrics.bodyFat),
        chest: Number(newMetrics.chest),
        arms: Number(newMetrics.arms),
        waist: Number(newMetrics.waist),
        thighs: Number(newMetrics.thighs)
      };
      const res = await api.post('/progress/measurements', payload);
      if (res.data.success) {
        toast.success("Metrics logged successfully!");
        setIsMetricsModalOpen(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error("Failed to log metrics");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    formData.append('front', e.target.files[0]);
    
    try {
      toast.loading("Uploading photo...", { id: 'photo-upload' });
      const res = await api.post('/progress/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success("Photo uploaded!", { id: 'photo-upload' });
        window.location.reload();
      }
    } catch (err) {
      toast.error("Upload failed", { id: 'photo-upload' });
    }
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckIn.weight) {
      toast.error("Fasted morning weight is required!");
      return;
    }

    setSubmittingCheckIn(true);
    try {
      const res = await api.post('/check-ins', {
        weight: Number(newCheckIn.weight),
        sleepHours: Number(newCheckIn.sleepHours),
        sleepQuality: Number(newCheckIn.sleepQuality),
        energyLevel: Number(newCheckIn.energyLevel),
        stressLevel: Number(newCheckIn.stressLevel),
        dietAdherence: newCheckIn.dietAdherence,
        workoutsCompleted: Number(newCheckIn.workoutsCompleted),
        notes: newCheckIn.notes
      });

      if (res.data?.success) {
        toast.success("Weekly check-in submitted to your coach! 🚀");
        setIsCheckInModalOpen(false);
        setNewCheckIn({
          weight: '',
          sleepHours: '7.5',
          sleepQuality: 4,
          energyLevel: 4,
          stressLevel: 2,
          dietAdherence: '100% On Plan',
          workoutsCompleted: '4',
          notes: ''
        });
        await fetchCheckIns();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit check-in");
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // Determine images for slider
  let beforeImage = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400";
  let afterImage = "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400";
  
  if (photos.length > 0) {
    const sortedPhotos = [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedPhotos.length === 1) {
      beforeImage = sortedPhotos[0].frontUrl || beforeImage;
      afterImage = sortedPhotos[0].frontUrl || afterImage;
    } else if (sortedPhotos.length >= 2) {
      beforeImage = sortedPhotos[0].frontUrl || beforeImage;
      afterImage = sortedPhotos[sortedPhotos.length - 1].frontUrl || afterImage;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Progress & Accountability</h1>
          <p className="text-text-muted mt-1">Track body measurements, visual transformation, and weekly coach check-ins.</p>
        </div>

        {/* Tab Switcher & CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface border border-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Scale className="w-4 h-4" /> Biometrics & Trends
            </button>
            <button
              onClick={() => setActiveTab('checkins')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'checkins'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" /> Weekly Check-Ins
              {checkIns.length > 0 && (
                <span className="bg-accent/20 text-accent text-xs px-2 py-0.5 rounded-full font-mono">
                  {checkIns.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'analytics' ? (
            <button 
              onClick={() => setIsMetricsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Log Metrics
            </button>
          ) : (
            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="bg-accent hover:bg-emerald-400 text-surface px-5 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Submit Sunday Check-In
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: BIOMETRICS & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Analytics Chart */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface border border-border rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Scale className="text-primary w-5 h-5" /> Analytics Trends
                </h2>
                <div className="flex bg-background border border-border rounded-lg p-1">
                  <button 
                    onClick={() => setActiveChart('weight')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeChart === 'weight' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Weight
                  </button>
                  <button 
                    onClick={() => setActiveChart('bodyFat')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeChart === 'bodyFat' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                  >
                    Body Fat %
                  </button>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: activeChart === 'weight' ? 'var(--color-primary)' : 'var(--color-accent)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={activeChart} 
                      stroke={activeChart === 'weight' ? 'var(--color-primary)' : 'var(--color-accent)'} 
                      strokeWidth={4}
                      dot={{ fill: 'var(--color-surface)', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Chest', value: `${latestMetrics.chest} in`, icon: Ruler },
                { label: 'Arms', value: `${latestMetrics.arms} in`, icon: Ruler },
                { label: 'Waist', value: `${latestMetrics.waist} in`, icon: Ruler },
                { label: 'Thighs', value: `${latestMetrics.thighs} in`, icon: Ruler },
              ].map((metric, i) => (
                <motion.div 
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center"
                >
                  <metric.icon className="w-5 h-5 text-text-muted mb-2" />
                  <span className="text-xl font-mono font-bold">{metric.value}</span>
                  <span className="text-xs text-text-muted uppercase">{metric.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Col: Photo Gallery & Slider */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface border border-border rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Camera className="text-accent w-5 h-5" /> Visual Progress
                </h2>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                  title="Upload New Progress Photo"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Slider Component */}
              <div className="mb-6">
                <PhotoSlider 
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                />
              </div>
              
              <p className="text-xs text-text-muted text-center">Drag the slider to compare your Day 1 baseline photo with your latest physique check.</p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: WEEKLY COACH CHECK-INS */}
      {activeTab === 'checkins' && (
        <div className="space-y-6">
          {checkIns.length === 0 ? (
            <div className="bg-surface border border-border rounded-3xl p-12 text-center max-w-2xl mx-auto">
              <ClipboardCheck className="w-16 h-16 text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-bold font-display">No Check-Ins Submitted Yet</h2>
              <p className="text-text-muted mt-2 mb-6 text-sm">
                In personal training, weekly Sunday check-ins ensure your coach can track bodyweight trends, fatigue, sleep quality, and adjust calories or volume for optimal progression.
              </p>
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="bg-accent hover:bg-emerald-400 text-surface px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
              >
                Submit Your First Check-In
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {checkIns.map((ci) => {
                const dateStr = new Date(ci.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <div key={ci._id} className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                          <Scale className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{dateStr} Check-In</h3>
                          <p className="text-xs text-text-muted">Fasted Weight: <span className="font-mono font-bold text-text-primary">{ci.weight} kg</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {ci.status === 'reviewed' ? (
                          <span className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed by Coach
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" /> Awaiting Coach Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-background border border-border p-3.5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                          <Moon className="w-3.5 h-3.5 text-primary" /> Sleep
                        </div>
                        <div className="font-bold font-mono text-sm">{ci.sleepHours || 7.5} hrs • {ci.sleepQuality || 4}/5★</div>
                      </div>
                      <div className="bg-background border border-border p-3.5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                          <BatteryCharging className="w-3.5 h-3.5 text-accent" /> Energy Level
                        </div>
                        <div className="font-bold font-mono text-sm">{ci.energyLevel || 4}/5 Rating</div>
                      </div>
                      <div className="bg-background border border-border p-3.5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-yellow-400" /> Stress Level
                        </div>
                        <div className="font-bold font-mono text-sm">{ci.stressLevel || 2}/5 Rating</div>
                      </div>
                      <div className="bg-background border border-border p-3.5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
                          <Award className="w-3.5 h-3.5 text-purple-400" /> Diet Adherence
                        </div>
                        <div className="font-bold text-xs text-accent truncate">{ci.dietAdherence || '100% On Plan'}</div>
                      </div>
                    </div>

                    {/* Member Notes */}
                    {ci.notes && (
                      <div className="bg-background/50 border border-border/80 p-4 rounded-xl text-sm">
                        <span className="text-xs font-bold uppercase text-text-muted block mb-1">Athlete Notes & Reflections</span>
                        <p className="text-text-primary italic">"{ci.notes}"</p>
                      </div>
                    )}

                    {/* Coach Feedback Section */}
                    {ci.coachFeedback ? (
                      <div className="bg-accent/5 border border-accent/20 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-4 h-4 text-accent" />
                          <span className="text-xs font-bold text-accent uppercase tracking-wider">Coach Feedback & Adjustments</span>
                          {ci.coachFeedbackDate && (
                            <span className="text-[11px] text-text-muted ml-auto font-mono">
                              {new Date(ci.coachFeedbackDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-primary whitespace-pre-wrap">{ci.coachFeedback}</p>
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted flex items-center gap-2 italic">
                        <Clock className="w-3.5 h-3.5" /> Your coach will review your bio-metrics and provide feedback soon.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT CHECK-IN MODAL */}
      <AnimatePresence>
        {isCheckInModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsCheckInModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface border border-border rounded-3xl p-6 md:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold font-display mb-1 flex items-center gap-2">
                <ClipboardCheck className="text-accent w-6 h-6" /> Weekly Check-In
              </h2>
              <p className="text-xs text-text-muted mb-6">
                Log your fasted morning weigh-in, weekly adherence, and physical feedback for your coach.
              </p>

              <form onSubmit={handleSubmitCheckIn} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Fasted Weight (kg) *</label>
                    <input 
                      required 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g. 78.5"
                      value={newCheckIn.weight} 
                      onChange={e => setNewCheckIn({...newCheckIn, weight: e.target.value})} 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-accent" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Avg Sleep (Hours/Night)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={newCheckIn.sleepHours} 
                      onChange={e => setNewCheckIn({...newCheckIn, sleepHours: e.target.value})} 
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-accent" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Sleep Quality</label>
                    <select
                      value={newCheckIn.sleepQuality}
                      onChange={e => setNewCheckIn({...newCheckIn, sleepQuality: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Fair</option>
                      <option value={2}>2 - Poor</option>
                      <option value={1}>1 - Terrible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Energy Level</label>
                    <select
                      value={newCheckIn.energyLevel}
                      onChange={e => setNewCheckIn({...newCheckIn, energyLevel: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                    >
                      <option value={5}>5 - Very High</option>
                      <option value={4}>4 - High</option>
                      <option value={3}>3 - Moderate</option>
                      <option value={2}>2 - Low</option>
                      <option value={1}>1 - Exhausted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Stress Level</label>
                    <select
                      value={newCheckIn.stressLevel}
                      onChange={e => setNewCheckIn({...newCheckIn, stressLevel: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none"
                    >
                      <option value={1}>1 - Very Low</option>
                      <option value={2}>2 - Mild</option>
                      <option value={3}>3 - Moderate</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Overwhelmed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Diet & Nutrition Adherence</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['100% On Plan', '80-90% Moderate', '<80% Off Track'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNewCheckIn({...newCheckIn, dietAdherence: opt})}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          newCheckIn.dietAdherence === opt
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-background border-border text-text-muted hover:border-text-primary'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Workouts Completed this Week</label>
                  <input 
                    type="number" 
                    min={0}
                    max={14}
                    value={newCheckIn.workoutsCompleted} 
                    onChange={e => setNewCheckIn({...newCheckIn, workoutsCompleted: e.target.value})} 
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">
                    Notes & Questions for Coach (Wins, Soreness, Challenges)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Upper body sessions felt strong. Had slight knee stiffness during squats. Hitting protein was easy this week."
                    value={newCheckIn.notes}
                    onChange={e => setNewCheckIn({...newCheckIn, notes: e.target.value})}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex gap-4 mt-6 pt-4 border-t border-border">
                  <button 
                    type="button" 
                    onClick={() => setIsCheckInModalOpen(false)} 
                    className="flex-1 py-3 bg-border text-text-primary rounded-xl font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submittingCheckIn}
                    className="flex-1 py-3 bg-accent hover:bg-emerald-400 text-surface rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {submittingCheckIn ? "Submitting..." : "Send Check-In to Coach"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOG METRICS MODAL */}
      <AnimatePresence>
        {isMetricsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMetricsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Log New Metrics</h2>
              <form onSubmit={handleLogMetrics} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Weight (kg)</label>
                    <input required type="number" step="0.1" value={newMetrics.weight} onChange={e => setNewMetrics({...newMetrics, weight: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Body Fat (%)</label>
                    <input type="number" step="0.1" value={newMetrics.bodyFat} onChange={e => setNewMetrics({...newMetrics, bodyFat: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                </div>
                
                <h3 className="text-sm font-bold text-text-muted uppercase mt-6 mb-2">Measurements (inches)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Chest</label>
                    <input type="number" step="0.1" value={newMetrics.chest} onChange={e => setNewMetrics({...newMetrics, chest: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Arms</label>
                    <input type="number" step="0.1" value={newMetrics.arms} onChange={e => setNewMetrics({...newMetrics, arms: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Waist</label>
                    <input type="number" step="0.1" value={newMetrics.waist} onChange={e => setNewMetrics({...newMetrics, waist: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Thighs</label>
                    <input type="number" step="0.1" value={newMetrics.thighs} onChange={e => setNewMetrics({...newMetrics, thighs: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4">
                  <button type="button" onClick={() => setIsMetricsModalOpen(false)} className="flex-1 py-3 bg-border text-text-primary rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Save Metrics</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
