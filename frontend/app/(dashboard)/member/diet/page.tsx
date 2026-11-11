"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Plus, Utensils, Apple, Coffee, Flame, LayoutList, Clock, Sparkles, X, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { CircularProgress } from "@/components/ui/CircularProgress";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function DietDashboard() {
  const [consumed, setConsumed] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [meals, setMeals] = useState<any[]>([]);
  const [loggedMeals, setLoggedMeals] = useState<any[]>([]);
  const [targets, setTargets] = useState({ calories: 2500, protein: 180, carbs: 250, fat: 80 });
  const [assignedPlan, setAssignedPlan] = useState<any>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'custom' | 'staples'>('custom');
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [tempTargets, setTempTargets] = useState(targets);
  const [isLoading, setIsLoading] = useState(true);
  const [submittingMeal, setSubmittingMeal] = useState(false);

  // Custom meal form state
  const [customForm, setCustomForm] = useState({
    name: "",
    type: "snack",
    calories: "",
    protein: "",
    carbs: "",
    fat: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealsRes, macrosRes, profileRes, planRes] = await Promise.all([
          api.get('/diet/meals'),
          api.get('/diet/macros/today'),
          api.get('/users/profile'),
          api.get('/diet/my-plan').catch(() => ({ data: { success: false } }))
        ]);
        
        if (mealsRes.data?.success) {
          setMeals(mealsRes.data.data || []);
        }
        
        if (macrosRes.data?.success && macrosRes.data.data) {
          const data = macrosRes.data.data;
          setConsumed({
            calories: data.totalCalories || 0,
            protein: data.totalMacros?.protein || 0,
            carbs: data.totalMacros?.carbs || 0,
            fat: data.totalMacros?.fat || 0
          });
          setWaterGlasses(data.waterIntake || 0);
          if (Array.isArray(data.mealsConsumed)) {
            setLoggedMeals(data.mealsConsumed);
          }
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
        } else if (profileRes.data?.success && profileRes.data.data?.macroTargets) {
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

  const addMeal = async (meal: { name: string; calories: number; protein: number; carbs: number; fat: number; type: string }) => {
    try {
      setSubmittingMeal(true);
      const res = await api.post('/diet/log', {
        name: meal.name,
        calories: Number(meal.calories) || 0,
        protein: Number(meal.protein) || 0,
        carbs: Number(meal.carbs) || 0,
        fat: Number(meal.fat) || 0,
        type: meal.type || 'snack'
      });
      if (res.data?.success) {
        setConsumed(prev => ({
          calories: prev.calories + Number(meal.calories || 0),
          protein: prev.protein + Number(meal.protein || 0),
          carbs: prev.carbs + Number(meal.carbs || 0),
          fat: prev.fat + Number(meal.fat || 0),
        }));
        
        // Append to local food diary
        setLoggedMeals(prev => [
          ...prev,
          {
            mealId: {
              _id: res.data.data?._id || Date.now().toString(),
              name: meal.name,
              calories: Number(meal.calories) || 0,
              protein: Number(meal.protein) || 0,
              carbs: Number(meal.carbs) || 0,
              fat: Number(meal.fat) || 0,
              type: meal.type
            },
            time: meal.type,
            servings: 1
          }
        ]);

        toast.success(`Logged ${meal.name}`);
        setIsDrawerOpen(false);
        setCustomForm({ name: "", type: "snack", calories: "", protein: "", carbs: "", fat: "" });
      }
    } catch (err) {
      toast.error('Failed to log meal');
    } finally {
      setSubmittingMeal(false);
    }
  };

  const handleCustomMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name.trim()) {
      toast.error("Please enter a meal name");
      return;
    }
    if (!customForm.calories || Number(customForm.calories) <= 0) {
      toast.error("Please enter calories");
      return;
    }

    addMeal({
      name: customForm.name.trim(),
      type: customForm.type,
      calories: Number(customForm.calories),
      protein: Number(customForm.protein) || 0,
      carbs: Number(customForm.carbs) || 0,
      fat: Number(customForm.fat) || 0
    });
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
          <p className="text-text-muted mt-1">Track your daily calories, hit macronutrient splits, and maintain optimal hydration.</p>
          <div className="flex items-center gap-3 mt-3">
            <Link href="/member/diet/plans" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/80 transition-colors bg-accent/10 px-3 py-1.5 rounded-xl">
              <LayoutList className="w-3.5 h-3.5" /> View Coach Diet Plans
            </Link>
            <span className="text-xs text-text-muted">
              • Clean custom tracking & coach protocols
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
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
              <p className="text-xs text-text-muted">Targets {assignedPlan.caloriesTarget} kcal • P: {assignedPlan.macrosTarget?.protein || 0}g • C: {assignedPlan.macrosTarget?.carbs || 0}g • F: {assignedPlan.macrosTarget?.fat || 0}g</p>
            </div>
          </div>
          <Link href="/member/diet/plans" className="text-xs font-bold text-primary hover:underline px-4 py-2 rounded-xl bg-background border border-border shrink-0">
            View Details ↗
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Macros & Food Diary */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Macros Card */}
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
              {/* Calories (Main Circular Gauge) */}
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
                    <span className="text-[10px] text-text-muted">/ {macro.target}g</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Food Diary */}
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-xl font-display font-bold flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-primary" /> Today's Food Diary
                </h3>
                <p className="text-xs text-text-muted mt-0.5">Summary of meals logged today</p>
              </div>
              <button
                onClick={() => {
                  setDrawerTab('custom');
                  setIsDrawerOpen(true);
                }}
                className="text-xs font-bold text-primary hover:text-primary-hover px-3 py-1.5 bg-primary/10 rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Meal
              </button>
            </div>

            {loggedMeals.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-2xl space-y-2">
                <Coffee className="w-10 h-10 text-text-muted mx-auto opacity-40" />
                <p className="text-sm font-bold text-text-primary">No Meals Logged Today</p>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Fueling your body with adequate protein and clean calories is key to hitting your performance goals.
                </p>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Log First Meal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {loggedMeals.map((item, idx) => {
                  const m = item.mealId || item;
                  const mealType = item.time || m.type || 'snack';
                  return (
                    <div
                      key={item._id || idx}
                      className="bg-background border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {mealType === 'breakfast' ? <Coffee className="w-5 h-5" /> : <Apple className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface border border-border text-text-muted">
                              {mealType}
                            </span>
                            <h4 className="font-bold text-sm text-text-primary">{m.name || 'Logged Meal'}</h4>
                          </div>
                          <span className="text-xs text-text-muted font-mono mt-0.5 block">
                            {m.calories} kcal
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono bg-surface border border-border px-3 py-1.5 rounded-xl">
                        <span className="text-primary font-bold">P: {m.protein || 0}g</span>
                        <span className="text-accent font-bold">C: {m.carbs || 0}g</span>
                        <span className="text-danger font-bold">F: {m.fat || 0}g</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended Clean Fitness Staples */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" /> Clean Fitness Staples
                </h2>
                <p className="text-xs text-text-muted">Quick 1-click logging for high-protein athlete staples</p>
              </div>
              <span className="text-xs font-mono font-bold text-text-muted bg-surface px-3 py-1 rounded-full border border-border">
                {meals.length} Staples
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meals.map((meal) => (
                <div key={meal._id} className="group bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between hover:border-primary/50 transition-colors relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                      {meal.type === 'breakfast' ? <Coffee className="w-5 h-5" /> : <Apple className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{meal.type}</span>
                        <span className="text-xs font-mono font-bold text-accent">{meal.calories} kcal</span>
                      </div>
                      <h4 className="font-bold text-sm text-text-primary truncate mt-0.5">{meal.name}</h4>
                      {meal.recipe && (
                        <p className="text-[11px] text-text-muted line-clamp-1 mt-1">{meal.recipe}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                    <div className="flex gap-2 text-[11px] font-mono">
                      <span className="text-primary font-bold">P:{meal.protein}g</span>
                      <span className="text-accent font-bold">C:{meal.carbs}g</span>
                      <span className="text-danger font-bold">F:{meal.fat}g</span>
                    </div>

                    <button
                      onClick={() => addMeal(meal)}
                      disabled={submittingMeal}
                      className="px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Quick Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Hydration Tracker */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-3xl p-8 border border-border text-center sticky top-24 space-y-6">
            <h2 className="text-xl font-display font-bold flex items-center justify-center gap-2">
              <Droplet className="w-5 h-5 text-[#3b82f6]" /> Hydration Tracker
            </h2>
            
            <div className="relative w-32 h-48 mx-auto border-4 border-border rounded-b-3xl rounded-t-lg overflow-hidden bg-background">
              {/* Animated Water Fill */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#2563eb] to-[#60a5fa] opacity-80"
                initial={{ height: 0 }}
                animate={{ height: `${Math.min(100, (waterGlasses / 8) * 100)}%` }}
                transition={{ type: "spring", bounce: 0.4, duration: 1 }}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 rounded-full blur-[1px]"></div>
              </motion.div>
            </div>

            <div>
              <div className="text-3xl font-mono font-bold text-text-primary">{waterGlasses} <span className="text-lg text-text-muted">/ 8</span></div>
              <p className="text-xs text-text-muted mt-1">Glasses of water today ({waterGlasses * 250} ml)</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={removeWater}
                disabled={waterGlasses <= 0}
                className="flex-1 bg-surface border border-border hover:bg-background text-text-muted hover:text-text-primary py-2.5 rounded-xl font-bold transition-all disabled:opacity-40 text-xs"
                title="Remove 1 glass"
              >
                - 1 Glass
              </button>
              <button 
                onClick={addWater}
                disabled={waterGlasses >= 12}
                className="flex-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2.5 px-4 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 text-xs"
              >
                <Droplet className="w-4 h-4 fill-current" /> + Add Glass
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block mb-1">Hydration Tip</span>
              <p className="text-xs text-text-muted">
                Aim for 2.5 - 3.5 liters per day to maximize muscle protein synthesis and post-workout recovery.
              </p>
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
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-surface border-l border-border z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-display font-bold">Log a Meal</h2>
                  <p className="text-xs text-text-muted">Record custom macros or pick a fitness staple</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-background transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector in Drawer */}
              <div className="flex bg-background p-1 rounded-xl border border-border my-4">
                <button
                  type="button"
                  onClick={() => setDrawerTab('custom')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    drawerTab === 'custom' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  ✍️ Custom Food
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('staples')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    drawerTab === 'staples' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  ⚡ Quick Staples ({meals.length})
                </button>
              </div>

              {/* Drawer Tab 1: Custom Meal Form */}
              {drawerTab === 'custom' && (
                <form onSubmit={handleCustomMealSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Meal / Food Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Grilled Chicken & Sweet Potato"
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Meal Category</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setCustomForm({ ...customForm, type })}
                          className={`py-2 text-xs font-bold rounded-xl capitalize transition-all border ${
                            customForm.type === type
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-background border-border text-text-muted hover:border-text-primary'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Total Calories (kcal)</label>
                    <input
                      type="number"
                      placeholder="e.g. 450"
                      value={customForm.calories}
                      onChange={(e) => setCustomForm({ ...customForm, calories: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary transition-colors text-text-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1 text-center">Protein (g)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={customForm.protein}
                        onChange={(e) => setCustomForm({ ...customForm, protein: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm font-mono text-center focus:outline-none focus:border-primary transition-colors text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-accent mb-1 text-center">Carbs (g)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={customForm.carbs}
                        onChange={(e) => setCustomForm({ ...customForm, carbs: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm font-mono text-center focus:outline-none focus:border-primary transition-colors text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-danger mb-1 text-center">Fat (g)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={customForm.fat}
                        onChange={(e) => setCustomForm({ ...customForm, fat: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-2 py-2 text-sm font-mono text-center focus:outline-none focus:border-primary transition-colors text-text-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingMeal}
                    className="w-full mt-6 py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{submittingMeal ? "Logging..." : "Log Custom Meal"}</span>
                  </button>
                </form>
              )}

              {/* Drawer Tab 2: Quick Staples List */}
              {drawerTab === 'staples' && (
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {meals.map((meal) => (
                    <div key={meal._id} className="bg-background border border-border p-3.5 rounded-xl flex justify-between items-center hover:border-primary/40 transition-colors">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-text-muted tracking-wider">{meal.type}</span>
                          <h4 className="font-bold text-xs text-text-primary truncate">{meal.name}</h4>
                        </div>
                        <p className="text-[11px] font-mono text-accent mt-0.5">
                          {meal.calories} kcal • P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                        </p>
                      </div>
                      <button 
                        onClick={() => addMeal(meal)}
                        disabled={submittingMeal}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2 rounded-lg transition-colors shrink-0"
                        title="Add to daily log"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setIsDrawerOpen(false)} 
                className="mt-4 w-full py-2.5 bg-border text-text-muted hover:text-text-primary rounded-xl font-bold text-xs transition-colors"
              >
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
