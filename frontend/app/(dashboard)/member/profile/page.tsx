"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Edit2, Check, X, ChevronDown, Activity, Heart, Target, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import api from "@/lib/api";

const GOALS = ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'maintenance'];

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [activeGoals, setActiveGoals] = useState<string[]>(['muscle_gain', 'endurance']);
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const [stats, setStats] = useState({ height: 180, weight: 75, bmi: 23.1, category: "Normal" });

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
          loading: 'Uploading...',
          success: 'Avatar updated successfully!',
          error: 'Failed to upload.',
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
      setStats(prev => ({ ...prev, height: Number(height), weight: Number(weight) }));
      toast.success('Updated successfully');
      setIsEditingHealth(false);
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  // BMI Gauge Calculation
  const safeBmi = stats.bmi || 0;
  const bmiPercentage = Math.min(Math.max((safeBmi - 15) / 25, 0), 1); // Normalize between 15 and 40 BMI
  const strokeDasharray = 283; // 2 * pi * r (r=45)
  const strokeDashoffset = strokeDasharray - (strokeDasharray * bmiPercentage * 0.75); // 0.75 for 270deg arc

  let bmiColor = "#00F5A0"; // Normal
  if (safeBmi < 18.5) bmiColor = "#6C63FF"; // Underweight
  if (safeBmi >= 25) bmiColor = "#FF4C6A"; // Overweight/Obese

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* Header & Avatar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl p-8 border border-border relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 to-accent/10" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 mt-12">
          <div className="relative group cursor-pointer">
            <div className="w-32 h-32 rounded-full border-4 border-surface bg-background overflow-hidden relative shadow-xl">
              <div className="w-full h-full flex items-center justify-center bg-primary/20 text-4xl font-bold text-primary">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud className="w-8 h-8 text-primary" />
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleAvatarUpload}
            />
          </div>
          
          <div className="text-center md:text-left mb-2 flex-1">
            <h1 className="text-3xl font-display font-bold">{user?.name || 'User Member'}</h1>
            <p className="text-text-muted capitalize">{user?.role || 'Member'} since 2026</p>
          </div>
          
          <button onClick={() => toast('Profile edit settings modal coming soon!')} className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Health Stats & BMI */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* BMI Gauge */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface rounded-3xl p-6 border border-border flex flex-col items-center justify-center relative shadow-sm"
          >
            <h3 className="font-display font-bold text-lg mb-6 w-full text-left flex items-center gap-2">
              <Activity className="text-primary w-5 h-5"/> BMI Status
            </h3>
            
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-[135deg]" viewBox="0 0 100 100">
                {/* Background Arc */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 * 0.25} strokeLinecap="round" />
                
                {/* Animated Progress Arc */}
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" stroke={bmiColor} strokeWidth="8" 
                  strokeDasharray="283" 
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <span className="text-4xl font-mono font-bold">{safeBmi}</span>
                <span className="text-sm font-medium" style={{ color: bmiColor }}>{stats.category}</span>
              </div>
            </div>
          </motion.div>

          {/* Health Information */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface rounded-3xl p-6 border border-border relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Heart className="text-danger w-5 h-5"/> Health Info
              </h3>
              <button 
                onClick={() => setIsEditingHealth(!isEditingHealth)}
                className="text-primary hover:text-primary-hover p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                {isEditingHealth ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-muted">Height</span>
                <span className="font-mono font-medium">{stats.height} cm</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-muted">Weight</span>
                <span className="font-mono font-medium">{stats.weight} kg</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-text-muted">Blood Type</span>
                <span className="font-medium">O+</span>
              </div>
            </div>

            {/* Slide-in Edit Panel */}
            <AnimatePresence>
              {isEditingHealth && (
                <motion.div 
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "100%" }}
                  className="absolute inset-0 bg-surface z-10 p-6 flex flex-col"
                >
                  <h4 className="font-bold mb-4">Edit Health Info</h4>
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Height (cm)</label>
                      <input id="heightInput" type="number" defaultValue={stats.height} className="w-full bg-background border border-border rounded-lg px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Weight (kg)</label>
                      <input id="weightInput" type="number" defaultValue={stats.weight} className="w-full bg-background border border-border rounded-lg px-3 py-2" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setIsEditingHealth(false)} className="flex-1 bg-border hover:bg-border/80 text-text-primary py-2 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSaveHealth} className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4"/> Save</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>

        {/* Right Column: Goals & Medical History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Fitness Goals */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface rounded-3xl p-6 md:p-8 border border-border"
          >
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <Target className="text-accent w-6 h-6"/> Fitness Goals
            </h3>
            
            <div className="flex flex-wrap gap-3">
              {GOALS.map(goal => {
                const isActive = activeGoals.includes(goal);
                return (
                  <motion.button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-5 py-2.5 rounded-full font-medium text-sm transition-colors border ${
                      isActive 
                        ? 'bg-accent/10 border-accent text-accent shadow-[0_0_10px_rgba(0,245,160,0.2)]' 
                        : 'bg-background border-border text-text-muted hover:border-text-muted'
                    }`}
                  >
                    {goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Medical History Accordion */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface rounded-3xl p-6 md:p-8 border border-border"
          >
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              Medical History
            </h3>
            
            <div className="space-y-3">
              {[
                { id: 'conditions', title: 'Medical Conditions', content: 'None reported. Patient is healthy.' },
                { id: 'allergies', title: 'Allergies', content: 'Penicillin, Peanuts' },
                { id: 'medications', title: 'Current Medications', content: 'Vitamin D3 (1000 IU daily)' }
              ].map(item => (
                <div key={item.id} className="border border-border rounded-2xl overflow-hidden bg-background/50">
                  <button 
                    onClick={() => setExpandedAccordion(expandedAccordion === item.id ? null : item.id)}
                    className="w-full px-6 py-4 flex justify-between items-center hover:bg-surface transition-colors"
                  >
                    <span className="font-semibold">{item.title}</span>
                    <motion.div animate={{ rotate: expandedAccordion === item.id ? 180 : 0 }}>
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {expandedAccordion === item.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 py-4 border-t border-border text-text-muted text-sm leading-relaxed">
                          {item.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}
