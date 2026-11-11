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
          api.get('/diet/meals').catch(() => ({ data: { success: false, data: [] } })),
          api.get('/diet/macros/today').catch(() => ({ data: { success: false, data: {} } })),
          api.get('/users/profile').catch(() => ({ data: { success: false, data: {} } })),
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
    } catch {
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
    } catch {
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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 relative">
      
      {/* 1. Header Overview Bar */}
      <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none rounded-2xl p-6 md:p-7 relative overflow-hidden transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Nutritional Telemetry & Fueling
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Nutrition & Macro Targets
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Track daily caloric burn, hit protein targets, and log hydration intake.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/member/diet/plans">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1017] dark:hover:bg-white/[0.05] border border-slate-200 dark:border-[#1E2230] text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shadow-sm">
                <LayoutList className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Coach Diet Plans</span>
              </button>
            </Link>

            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Meal</span>
            </button>
          </div>
        </div>
      </div>

      {assignedPlan && (
        <div className="bg-white dark:bg-[#12141C] border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Apple className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Active Protocol
                </span>
                {assignedPlan.coachId?.name && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Coach {assignedPlan.coachId.name}</span>
                )}
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white mt-1">{assignedPlan.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                Target: {assignedPlan.caloriesTarget} kcal • P: {assignedPlan.macrosTarget?.protein || 0}g • C: {assignedPlan.macrosTarget?.carbs || 0}g • F: {assignedPlan.macrosTarget?.fat || 0}g
              </p>
            </div>
          </div>
          <Link href="/member/diet/plans" className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] shrink-0 transition-colors shadow-sm">
            View Details ↗
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Macros & Food Diary (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Daily Macros Card */}
          <div className="bg-white dark:bg-[#12141C] rounded-2xl p-6 border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#1E2230] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Daily Macronutrient Targets</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Energy balance and macro distribution</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTargetsModalOpen(true)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 border border-slate-200 dark:border-[#1E2230] rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[#0E1017] dark:hover:bg-white/[0.05] transition-colors shadow-sm"
              >
                Edit Targets
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-around gap-6">
              {/* Calories (Main Circular Gauge) */}
              <div className="flex flex-col items-center">
                <CircularProgress 
                  percentage={Math.min((consumed.calories / targets.calories) * 100, 100)} 
                  label={`${consumed.calories}`} 
                  sublabel={`/ ${targets.calories} kcal`} 
                  size={170} 
                  strokeWidth={12} 
                />
                <div className="mt-3 text-center">
                  <span className="text-[11px] text-slate-500 uppercase font-semibold">Remaining</span>
                  <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                    {Math.max(0, targets.calories - consumed.calories)} kcal
                  </p>
                </div>
              </div>

              {/* P/C/F Smaller Gauges */}
              <div className="flex gap-5">
                {[
                  { label: 'Protein', consumed: consumed.protein, target: targets.protein, color: '#6366F1' },
                  { label: 'Carbs', consumed: consumed.carbs, target: targets.carbs, color: '#10B981' },
                  { label: 'Fat', consumed: consumed.fat, target: targets.fat, color: '#F59E0B' }
                ].map(macro => (
                  <div key={macro.label} className="flex flex-col items-center">
                    <div className="relative flex items-center justify-center" style={{ width: 76, height: 76 }}>
                      <svg width="76" height="76" className="transform -rotate-90">
                        <circle cx="38" cy="38" r="32" className="stroke-slate-200 dark:stroke-[#1E2230]" strokeWidth="5" fill="transparent" />
                        <motion.circle
                          cx="38" cy="38" r="32" stroke={macro.color} strokeWidth="5" fill="transparent" strokeLinecap="round"
                          strokeDasharray={201}
                          initial={{ strokeDashoffset: 201 }}
                          animate={{ strokeDashoffset: 201 - (Math.min((macro.consumed / macro.target) * 100, 100) / 100) * 201 }}
                          transition={{ duration: 1.2 }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">{macro.consumed}g</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide font-medium">{macro.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">/ {macro.target}g</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Food Diary */}
          <div className="bg-white dark:bg-[#12141C] rounded-2xl p-6 border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2230] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Today&apos;s Food Diary</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Chronological logs of nutrition consumed</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDrawerTab('custom');
                  setIsDrawerOpen(true);
                }}
                className="text-xs font-semibold text-white px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Meal</span>
              </button>
            </div>

            {loggedMeals.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 dark:border-[#1E2230] rounded-xl bg-slate-50 dark:bg-[#0E1017] space-y-2 p-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                  <Coffee className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">No Meals Logged Today</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Fueling your body with adequate protein and clean calories is key to hitting your performance goals.
                </p>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 bg-white dark:bg-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-[#1E2230] text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Log First Meal
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {loggedMeals.map((item, idx) => {
                  const m = item.mealId || item;
                  const mealType = item.time || m.type || 'snack';
                  return (
                    <div
                      key={item._id || idx}
                      className="bg-slate-50 dark:bg-[#0E1017] border border-slate-200/80 dark:border-[#1E2230] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm dark:shadow-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                          {mealType === 'breakfast' ? <Coffee className="w-4 h-4" /> : <Apple className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] text-slate-600 dark:text-slate-400">
                              {mealType}
                            </span>
                            <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{m.name || 'Logged Meal'}</h4>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                            {m.calories} kcal
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] px-3 py-1 rounded-lg shadow-sm dark:shadow-none">
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">P: {m.protein || 0}g</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">C: {m.carbs || 0}g</span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">F: {m.fat || 0}g</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Hydration Tracker (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#12141C] rounded-2xl p-6 border border-slate-200/80 dark:border-[#1E2230] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none text-center space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2230] pb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Hydration Tracker</h3>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                {waterGlasses * 250} ml
              </span>
            </div>
            
            <div className="relative w-28 h-40 mx-auto border-2 border-slate-200 dark:border-[#1E2230] rounded-b-2xl rounded-t-md overflow-hidden bg-slate-50 dark:bg-[#0B0C10]">
              {/* Animated Water Fill */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-600 to-sky-400 opacity-80"
                initial={{ height: 0 }}
                animate={{ height: `${Math.min(100, (waterGlasses / 8) * 100)}%` }}
                transition={{ type: "spring", bounce: 0.3, duration: 1 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/40 rounded-full blur-[1px]"></div>
              </motion.div>
            </div>

            <div>
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{waterGlasses} <span className="text-sm text-slate-400 dark:text-slate-500">/ 8</span></div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Glasses of water today</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={removeWater}
                disabled={waterGlasses <= 0}
                className="flex-1 bg-slate-100 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] hover:bg-slate-200 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-40 text-xs shadow-sm"
              >
                - 1 Glass
              </button>
              <button 
                onClick={addWater}
                disabled={waterGlasses >= 12}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs shadow-sm"
              >
                <Droplet className="w-3.5 h-3.5 fill-current" /> + Add Glass
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1017] border border-slate-200/80 dark:border-[#1E2230] text-left">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">Hydration Guidance</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Aim for 2.5 - 3.5 liters daily to maximize muscle protein synthesis and optimize workout recovery.
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
              className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm z-40"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-white dark:bg-[#12141C] border-l border-slate-200 dark:border-[#1E2230] z-50 p-6 flex flex-col shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1E2230]">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Log Custom Meal</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Record nutritional intake and macros</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-transparent hover:border-slate-200 dark:hover:border-[#1E2230] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Custom Meal Form */}
              <form onSubmit={handleCustomMealSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">Meal / Food Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Grilled Chicken & Sweet Potato"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">Category</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCustomForm({ ...customForm, type })}
                        className={`py-2 text-xs font-medium rounded-lg capitalize transition-all border ${
                          customForm.type === type
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-[#0E1017] border-slate-200 dark:border-[#1E2230] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">Total Calories (kcal)</label>
                  <input
                    type="number"
                    placeholder="e.g. 450"
                    value={customForm.calories}
                    onChange={(e) => setCustomForm({ ...customForm, calories: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 text-center">Protein (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customForm.protein}
                      onChange={(e) => setCustomForm({ ...customForm, protein: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-lg px-2 py-2 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 text-center">Carbs (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customForm.carbs}
                      onChange={(e) => setCustomForm({ ...customForm, carbs: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-lg px-2 py-2 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 text-center">Fat (g)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={customForm.fat}
                      onChange={(e) => setCustomForm({ ...customForm, fat: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-lg px-2 py-2 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingMeal}
                  className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{submittingMeal ? "Logging..." : "Log Custom Meal"}</span>
                </button>
              </form>

              <button 
                onClick={() => setIsDrawerOpen(false)} 
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative bg-white dark:bg-[#12141C] border border-slate-200 dark:border-[#1E2230] rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            >
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Edit Macro Targets</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400 mb-1.5">Calories (kcal)</label>
                  <input 
                    type="number" 
                    value={tempTargets.calories} 
                    onChange={e => setTempTargets({...tempTargets, calories: Number(e.target.value)})} 
                    className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 text-center">Protein (g)</label>
                    <input 
                      type="number" 
                      value={tempTargets.protein} 
                      onChange={e => setTempTargets({...tempTargets, protein: Number(e.target.value)})} 
                      className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-lg px-2 py-2 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 text-center">Carbs (g)</label>
                    <input 
                      type="number" 
                      value={tempTargets.carbs} 
                      onChange={e => setTempTargets({...tempTargets, carbs: Number(e.target.value)})} 
                      className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-lg px-2 py-2 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1 text-center">Fat (g)</label>
                    <input 
                      type="number" 
                      value={tempTargets.fat} 
                      onChange={e => setTempTargets({...tempTargets, fat: Number(e.target.value)})} 
                      className="w-full bg-slate-50 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] rounded-lg px-2 py-2 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500" 
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2.5 pt-3">
                <button 
                  onClick={() => setIsTargetsModalOpen(false)} 
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#0E1017] border border-slate-200 dark:border-[#1E2230] text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveTargets} 
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-sm"
                >
                  Save Targets
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
