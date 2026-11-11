"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Plus, Utensils, Apple, Coffee, Flame, LayoutList } from "lucide-react";
import Link from "next/link";
import { CircularProgress } from "@/components/ui/CircularProgress";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function DietDashboard() {
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [meals, setMeals] = useState<any[]>([]);
  const [targets, setTargets] = useState({ calories: 2500, protein: 180, carbs: 250, fat: 80 });
  const [assignedPlan, setAssignedPlan] = useState<any>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [tempTargets, setTempTargets] = useState(targets);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealsRes, macrosRes, profileRes, planRes] = await Promise.all([
          api.get('/diet/meals'),
          api.get('/diet/macros/today'),
          api.get('/users/profile'),
          api.get('/diet/my-plan').catch(() => ({ data: { success: false } }))
        ]);
        
        if (mealsRes.data.success) {
          setMeals(mealsRes.data.data);
        }
        
        if (macrosRes.data.success && macrosRes.data.data) {
          const data = macrosRes.data.data;
          setConsumed({
            calories: data.totalCalories || 0,
            protein: data.totalMacros?.protein || 0,
            carbs: data.totalMacros?.carbs || 0,
            fat: data.totalMacros?.fat || 0
          });
          setWaterGlasses(data.waterIntake || 0);
        }

        if (planRes.data?.success && planRes.data.data) {
          const plan = planRes.data.data;
          setAssignedPlan(plan);
          if (plan.caloriesTarget) {
            const planTargets = {
              calories: plan.caloriesTarget,
              protein: plan.macrosTarget?.protein || 180,
              carbs: plan.macrosTarget?.carbs || 250,
              fat: plan.macrosTarget?.fat || 80
            };
            setTargets(planTargets);
            setTempTargets(planTargets);
          }
        } else if (profileRes.data.success && profileRes.data.data?.macroTargets) {
          setTargets(profileRes.data.data.macroTargets);
          setTempTargets(profileRes.data.data.macroTargets);
        }
      } catch (err) {
        console.error('Failed to fetch diet data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveTargets = async () => {
    try {
      const res = await api.put('/users/macro-targets', tempTargets);
      if (res.data.success) {
        setTargets(tempTargets);
        setIsTargetsModalOpen(false);
        toast.success("Macro targets updated!");
      }
    } catch (err) {
      toast.error("Failed to update targets");
    }
  };

  const addMeal = async (meal: any) => {
    try {
      const res = await api.post('/diet/log', {
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        type: meal.type
      });
      if (res.data.success) {
        setConsumed(prev => ({
          calories: prev.calories + meal.calories,
          protein: prev.protein + meal.protein,
          carbs: prev.carbs + meal.carbs,
          fat: prev.fat + meal.fat,
        }));
        toast.success(`Logged ${meal.name}`);
        setIsDrawerOpen(false);
      }
    } catch (err) {
      toast.error('Failed to log meal');
    }
  };

  const updateWater = async (newGlasses: number) => {
    const val = Math.max(0, Math.min(12, newGlasses));
    setWaterGlasses(val);
    try {
      await api.post('/diet/water', { waterIntake: val });
    } catch (err) {
      console.error('Failed to save water intake', err);
      toast.error('Failed to sync hydration');
    }
  };

  const addWater = () => {
    if (waterGlasses < 12) updateWater(waterGlasses + 1);
  };

  const removeWater = () => {
    if (waterGlasses > 0) updateWater(waterGlasses - 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Nutrition</h1>
          <p className="text-text-muted mt-1">Track your macros, stay hydrated, and fuel your body.</p>
          <Link href="/member/diet/plans" className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80 transition-colors bg-accent/10 px-4 py-2 rounded-xl mt-2">
            <LayoutList className="w-4 h-4" /> View Diet Plans
          </Link>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Log Meal
        </button>
      </div>

      {assignedPlan && (
        <div className="bg-primary/10 border border-primary/20 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              <Apple className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent">Active Protocol</span>
                {assignedPlan.coachId?.name && (
                  <span className="text-xs text-text-muted">Coach {assignedPlan.coachId.name}</span>
                )}
              </div>
              <h3 className="font-display font-bold text-lg text-text-primary mt-0.5">{assignedPlan.name}</h3>
              <p className="text-xs text-text-muted">Targets {assignedPlan.caloriesTarget} kcal • P: {assignedPlan.macrosTarget?.protein}g • C: {assignedPlan.macrosTarget?.carbs}g • F: {assignedPlan.macrosTarget?.fat}g</p>
            </div>
          </div>
          <Link href="/member/diet/plans" className="text-xs font-bold text-primary hover:underline px-4 py-2 rounded-xl bg-background border border-border shrink-0">
            View Details ↗
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Macros */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface rounded-3xl p-8 border border-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-accent" /> Daily Macros
              </h2>
              <button 
                onClick={() => setIsTargetsModalOpen(true)}
                className="text-xs font-bold text-primary hover:text-primary-hover px-3 py-1.5 border border-primary/20 rounded-full hover:bg-primary/10 transition-colors"
              >
                Edit Goals
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
              {/* Calories (Main) */}
              <div className="flex flex-col items-center">
                <CircularProgress 
                  percentage={Math.min((consumed.calories / targets.calories) * 100, 100)} 
                  label={`${consumed.calories}`} 
                  sublabel={`/ ${targets.calories} kcal`} 
                  size={180} 
                  strokeWidth={14} 
                />
                <div className="mt-3 text-center">
                  <span className="text-xs text-text-muted">Remaining</span>
                  <p className="font-mono font-bold text-sm text-accent">
                    {Math.max(0, targets.calories - consumed.calories)} kcal
                  </p>
                </div>
              </div>

              {/* P/C/F Smaller Gauges */}
              <div className="flex gap-6">
                {[
                  { label: 'Protein', consumed: consumed.protein, target: targets.protein, color: '#6C63FF' },
                  { label: 'Carbs', consumed: consumed.carbs, target: targets.carbs, color: '#00F5A0' },
                  { label: 'Fat', consumed: consumed.fat, target: targets.fat, color: '#FF4C6A' }
                ].map(macro => (
                  <div key={macro.label} className="flex flex-col items-center">
                    <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                      <svg width="80" height="80" className="transform -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="var(--color-border)" strokeWidth="6" fill="transparent" />
                        <motion.circle
                          cx="40" cy="40" r="34" stroke={macro.color} strokeWidth="6" fill="transparent" strokeLinecap="round"
                          strokeDasharray={213}
                          initial={{ strokeDashoffset: 213 }}
                          animate={{ strokeDashoffset: 213 - (Math.min((macro.consumed / macro.target) * 100, 100) / 100) * 213 }}
                          transition={{ duration: 1.5 }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-sm font-bold font-mono">{macro.consumed}g</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted mt-2 uppercase tracking-wide">{macro.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meal Library */}
          <div>
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-primary" /> Recommended Meals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meals.map((meal) => (
                <div key={meal._id} className="group bg-surface border border-border rounded-2xl p-4 flex gap-4 hover:border-primary/50 transition-colors relative overflow-hidden">
                  <div className="w-20 h-20 bg-background rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                    {meal.type === 'breakfast' ? <Coffee /> : <Apple />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold">{meal.name}</h3>
                    <span className="text-xs text-text-muted mb-2 capitalize">{meal.type} • {meal.calories} kcal</span>
                    
                    {/* Hover Macros Overlay */}
                    <div className="flex gap-3 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-4 bg-surface/90 backdrop-blur-sm px-2 py-1 rounded">
                      <span className="text-primary">P:{meal.protein}g</span>
                      <span className="text-accent">C:{meal.carbs}g</span>
                      <span className="text-danger">F:{meal.fat}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Water Tracker */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-3xl p-8 border border-border text-center sticky top-24">
            <h2 className="text-xl font-display font-bold mb-8 flex items-center justify-center gap-2">
              <Droplet className="w-5 h-5 text-[#3b82f6]" /> Hydration
            </h2>
            
            <div className="relative w-32 h-48 mx-auto mb-8 border-4 border-border rounded-b-3xl rounded-t-lg overflow-hidden bg-background">
              {/* Animated Water Fill */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#2563eb] to-[#60a5fa] opacity-80"
                initial={{ height: 0 }}
                animate={{ height: `${(waterGlasses / 8) * 100}%` }}
                transition={{ type: "spring", bounce: 0.4, duration: 1 }}
              >
                {/* Surface Wave Effect (CSS mock) */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-full blur-[1px]"></div>
              </motion.div>
            </div>

            <div className="text-3xl font-mono font-bold mb-2">{waterGlasses} <span className="text-lg text-text-muted">/ 8</span></div>
            <p className="text-sm text-text-muted mb-6">Glasses of water today ({waterGlasses * 250} ml)</p>
            
            <div className="flex gap-2">
              <button 
                onClick={removeWater}
                disabled={waterGlasses <= 0}
                className="flex-1 bg-surface border border-border hover:bg-background text-text-muted hover:text-text-primary py-2.5 rounded-xl font-bold transition-all disabled:opacity-40"
                title="Remove 1 glass"
              >
                - 1 Glass
              </button>
              <button 
                onClick={addWater}
                disabled={waterGlasses >= 12}
                className="flex-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2.5 px-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
              >
                <Droplet className="w-4 h-4 fill-current" /> + Add Glass
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-in Meal Logger Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full md:w-96 bg-surface border-l border-border z-50 p-6 flex flex-col shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Log a Meal</h2>
              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {meals.map(meal => (
                  <div key={meal._id} className="bg-background border border-border p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{meal.name}</h4>
                      <p className="text-xs text-text-muted">{meal.calories} kcal</p>
                    </div>
                    <button 
                      onClick={() => addMeal(meal)}
                      className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="mt-6 w-full py-3 bg-border text-text-primary rounded-xl font-medium">
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Targets Modal */}
      <AnimatePresence>
        {isTargetsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsTargetsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6">Edit Macro Targets</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-text-muted mb-2">Calories (kcal)</label>
                  <input type="number" value={tempTargets.calories} onChange={e => setTempTargets({...tempTargets, calories: Number(e.target.value)})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2 text-primary">Protein (g)</label>
                    <input type="number" value={tempTargets.protein} onChange={e => setTempTargets({...tempTargets, protein: Number(e.target.value)})} className="w-full bg-background border border-border rounded-xl px-2 py-2 text-center" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2 text-accent">Carbs (g)</label>
                    <input type="number" value={tempTargets.carbs} onChange={e => setTempTargets({...tempTargets, carbs: Number(e.target.value)})} className="w-full bg-background border border-border rounded-xl px-2 py-2 text-center" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2 text-danger">Fat (g)</label>
                    <input type="number" value={tempTargets.fat} onChange={e => setTempTargets({...tempTargets, fat: Number(e.target.value)})} className="w-full bg-background border border-border rounded-xl px-2 py-2 text-center" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setIsTargetsModalOpen(false)} className="flex-1 py-3 bg-border text-text-primary rounded-xl font-bold">Cancel</button>
                <button onClick={saveTargets} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Save Targets</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
