"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  Lock, Download, Trash2, Shield, User, Heart, 
  Activity, Target, Edit2, Check, X, UploadCloud, 
  ChevronDown, AlertTriangle, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";

const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'maintenance'];

function SettingsContent() {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Security State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  
  // Profile & Health State
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [activeGoals, setActiveGoals] = useState<string[]>(['muscle_gain', 'endurance']);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);
  const [stats, setStats] = useState({ height: 180, weight: 75, bmi: 23.1, category: "Normal" });

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/progress/measurements');
        const data = res.data;
        if (data.success && data.data.length > 0) {
          const latest = data.data[data.data.length - 1];
          const heightM = latest.height / 100;
          const bmi = (latest.weight / (heightM * heightM)).toFixed(1);
          let cat = "Normal";
          if (parseFloat(bmi) < 18.5) cat = "Underweight";
          if (parseFloat(bmi) >= 25) cat = "Overweight";
          setStats({ height: latest.height, weight: latest.weight, bmi: parseFloat(bmi), category: cat });
        }
      } catch (err) {
        console.error("Failed to load stats", err);
      }
    }
    loadStats();
  }, []);

  const toggleGoal = (goal: string) => {
    setActiveGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('image', e.target.files[0]);
      
      const uploadPromise = api.put('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).then(res => {
         if (!res.data.success) throw new Error('Upload failed');
         return res.data;
      });

      toast.promise(
        uploadPromise,
        {
          loading: 'Uploading photo...',
          success: 'Profile picture updated successfully!',
          error: 'Failed to upload photo.',
        }
      );
    }
  };

  const handleSaveHealth = async () => {
    const heightInput = document.getElementById('heightInput') as HTMLInputElement;
    const weightInput = document.getElementById('weightInput') as HTMLInputElement;
    if (!heightInput || !weightInput) return;
    
    const height = heightInput.value;
    const weight = weightInput.value;

    try {
      await api.put('/users/health-info', { height, weight });
      const hM = Number(height) / 100;
      const calcBmi = (Number(weight) / (hM * hM)).toFixed(1);
      let cat = "Normal";
      if (parseFloat(calcBmi) < 18.5) cat = "Underweight";
      if (parseFloat(calcBmi) >= 25) cat = "Overweight";
      setStats({ height: Number(height), weight: Number(weight), bmi: parseFloat(calcBmi), category: cat });
      toast.success('Health metrics updated!');
      setIsEditingHealth(false);
    } catch {
      toast.error('Failed to update health metrics');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error("New passwords don't match");
    }
    
    try {
      const res = await api.put('/users/password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      if (res.data.success) {
        toast.success("Password updated successfully");
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/users/export-data');
      if (res.data.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "fitcore_data_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Data exported successfully");
      }
    } catch {
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure? This action cannot be undone and will delete all your data permanently.")) {
      try {
        const res = await api.delete('/users/account');
        if (res.data.success) {
          toast.success("Account deleted");
          logout();
          router.push('/login');
        }
      } catch {
        toast.error("Failed to delete account");
      }
    }
  };

  // BMI calculations
  const safeBmi = stats.bmi || 23.1;
  const bmiPercentage = Math.min(Math.max((safeBmi - 15) / 25, 0), 1);
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * bmiPercentage * 0.75);

  let bmiColor = "#00F5A0";
  if (safeBmi < 18.5) bmiColor = "#6C63FF";
  if (safeBmi >= 25) bmiColor = "#FF4C6A";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Account & Profile Settings</h1>
        <p className="text-text-muted mt-2">Manage your personal profile, biometrics, security credentials, and data preferences.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-sm">
        
        {/* Navigation Sidebar */}
        <div className="md:w-64 bg-background border-r border-border p-6 space-y-2 shrink-0">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'profile' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface hover:text-primary'}`}
          >
            <User className="w-5 h-5" /> Profile & Health
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'security' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface hover:text-primary'}`}
          >
            <Shield className="w-5 h-5" /> Security & Passwords
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'privacy' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface hover:text-primary'}`}
          >
            <Lock className="w-5 h-5" /> Data & Privacy
          </button>
        </div>

        {/* Content Pane */}
        <div className="flex-1 p-6 md:p-8">
          
          {/* 1. Profile & Health Tab */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              {/* Avatar & Basic Info */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full border-4 border-surface bg-background overflow-hidden relative shadow-lg">
                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-3xl font-bold text-primary">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl font-display font-bold">{user?.name || 'Athlete Member'}</h2>
                  <p className="text-text-muted text-sm">{user?.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    FitCore {user?.role || 'Member'}
                  </span>
                </div>
              </div>

              {/* Health Metrics & BMI Gauge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* BMI Arc Gauge */}
                <div className="bg-background border border-border rounded-2xl p-6 flex flex-col items-center justify-center">
                  <h3 className="font-display font-bold text-sm mb-4 w-full text-left flex items-center gap-2">
                    <Activity className="text-primary w-4 h-4"/> Calculated BMI
                  </h3>
                  
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-[135deg]" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 * 0.25} strokeLinecap="round" />
                      <motion.circle 
                        cx="50" cy="50" r="45" fill="none" stroke={bmiColor} strokeWidth="8" 
                        strokeDasharray="283" 
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                      <span className="text-3xl font-mono font-bold">{safeBmi}</span>
                      <span className="text-xs font-bold" style={{ color: bmiColor }}>{stats.category}</span>
                    </div>
                  </div>
                </div>

                {/* Health Metrics Card */}
                <div className="bg-background border border-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-bold text-sm flex items-center gap-2">
                      <Heart className="text-danger w-4 h-4"/> Body Stats
                    </h3>
                    <button 
                      onClick={() => setIsEditingHealth(!isEditingHealth)}
                      className="text-primary hover:text-primary-hover p-1.5 rounded-lg hover:bg-primary/10 transition-colors text-xs font-bold flex items-center gap-1"
                    >
                      {isEditingHealth ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                      <span>{isEditingHealth ? 'Cancel' : 'Edit'}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border/60 text-sm">
                      <span className="text-text-muted">Height</span>
                      <span className="font-mono font-bold">{stats.height} cm</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/60 text-sm">
                      <span className="text-text-muted">Weight</span>
                      <span className="font-mono font-bold">{stats.weight} kg</span>
                    </div>
                    <div className="flex justify-between items-center py-2 text-sm">
                      <span className="text-text-muted">Metabolic Category</span>
                      <span className="font-bold text-accent">{stats.category}</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditingHealth && (
                      <motion.div 
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        className="absolute inset-0 bg-surface z-10 p-5 flex flex-col justify-between border border-border"
                      >
                        <h4 className="font-bold text-sm">Update Measurements</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] text-text-muted mb-1 uppercase font-bold">Height (cm)</label>
                            <input id="heightInput" type="number" defaultValue={stats.height} className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-sm" />
                          </div>
                          <div>
                            <label className="block text-[11px] text-text-muted mb-1 uppercase font-bold">Weight (kg)</label>
                            <input id="weightInput" type="number" defaultValue={stats.weight} className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => setIsEditingHealth(false)} className="flex-1 bg-border/50 text-text-primary py-2 rounded-xl text-xs font-bold">Cancel</button>
                          <button onClick={handleSaveHealth} className="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5"/> Save
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Fitness Goals */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Target className="text-accent w-5 h-5"/> Fitness Focus & Objectives
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {GOALS.map(goal => {
                    const isActive = activeGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-4 py-2 rounded-full font-bold text-xs transition-colors border ${
                          isActive 
                            ? 'bg-accent/10 border-accent text-accent shadow-sm' 
                            : 'bg-background border-border text-text-muted hover:border-text-primary'
                        }`}
                      >
                        {goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medical Information Accordion */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-base">Health Notes & Emergency</h3>
                {[
                  { id: 'conditions', title: 'Medical Conditions', content: 'None reported. Athlete cleared for high-intensity training.' },
                  { id: 'allergies', title: 'Dietary Allergies', content: 'No known severe allergies reported.' },
                  { id: 'supplements', title: 'Daily Supplements', content: 'Creatine Monohydrate 5g, Whey Protein Isolate, Omega-3 Fish Oil.' }
                ].map(item => (
                  <div key={item.id} className="border border-border rounded-2xl overflow-hidden bg-background">
                    <button 
                      onClick={() => setExpandedAccordion(expandedAccordion === item.id ? null : item.id)}
                      className="w-full px-5 py-3.5 flex justify-between items-center hover:bg-surface transition-colors"
                    >
                      <span className="font-semibold text-sm">{item.title}</span>
                      <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${expandedAccordion === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedAccordion === item.id && (
                      <div className="px-5 py-3 border-t border-border text-text-muted text-xs leading-relaxed bg-surface/50">
                        {item.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </motion.div>
          )}

          {/* 2. Security Tab */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-lg">
              <h2 className="text-xl font-bold">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Current Password</label>
                  <input 
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">New Password</label>
                  <input 
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Confirm New Password</label>
                  <input 
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-primary/30"
                >
                  Update Password
                </button>
              </form>
            </motion.div>
          )}

          {/* 3. Data & Privacy Tab */}
          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-2">Export Athlete Data</h2>
                <p className="text-sm text-text-muted mb-4">Download a complete JSON archive of your personal records, workout logs, nutrition history, and biometric data.</p>
                <button 
                  onClick={handleExportData}
                  className="flex items-center gap-2 bg-background border border-border hover:border-primary text-text-primary px-5 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  <Download className="w-4 h-4" /> Export All Data (.JSON)
                </button>
              </div>

              <div className="pt-8 border-t border-border">
                <h2 className="text-xl font-bold text-danger mb-2">Danger Zone</h2>
                <p className="text-sm text-text-muted mb-4">Permanently delete your FitCore account and all associated workout logs and history. This action cannot be reversed.</p>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 bg-danger/10 border border-danger/20 text-danger hover:bg-danger hover:text-white px-5 py-3 rounded-xl font-bold text-sm transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete My Account
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
