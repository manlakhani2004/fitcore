"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Apple, 
  Plus, 
  Search, 
  Flame, 
  Users, 
  Utensils, 
  Check, 
  X, 
  Loader2,
  PieChart
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function CoachDietPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'plans' | 'meals'>('plans');
  const [isLoading, setIsLoading] = useState(true);

  // Plan Form Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: "",
    goal: "Lean Muscle Building",
    caloriesTarget: 2400,
    macrosTarget: {
      protein: 180,
      carbs: 240,
      fat: 70
    }
  });

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [assignClientId, setAssignClientId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Meal Creator Modal
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    name: "",
    calories: 450,
    protein: 35,
    carbs: 45,
    fat: 12,
    type: "breakfast"
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, mealsRes, clientsRes] = await Promise.all([
        api.get('/diet/plans'),
        api.get('/diet/meals'),
        api.get('/coach-dashboard/clients')
      ]);

      if (plansRes.data.success) setPlans(plansRes.data.data);
      if (mealsRes.data.success) setMeals(mealsRes.data.data);
      if (clientsRes.data.success) setClients(clientsRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load nutrition library");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) {
      toast.error("Please enter a diet plan name");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/diet/plans', planForm);
      if (res.data.success) {
        toast.success("Diet plan created!");
        setIsPlanModalOpen(false);
        setPlans(prev => [res.data.data, ...prev]);
        setPlanForm({
          name: "",
          goal: "Lean Muscle Building",
          caloriesTarget: 2400,
          macrosTarget: { protein: 180, carbs: 240, fat: 70 }
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/diet/meals', mealForm);
      if (res.data.success) {
        toast.success("Meal added to database!");
        setIsMealModalOpen(false);
        setMeals(prev => [res.data.data, ...prev]);
        setMealForm({ name: "", calories: 450, protein: 35, carbs: 45, fat: 12, type: "breakfast" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add meal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignPlan = async () => {
    if (!selectedPlan || !assignClientId) {
      toast.error("Please select an athlete");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await api.post(`/coach-dashboard/clients/${assignClientId}/diet-plan`, {
        name: selectedPlan.name,
        goal: selectedPlan.goal,
        caloriesTarget: selectedPlan.caloriesTarget,
        macrosTarget: selectedPlan.macrosTarget
      });

      if (res.data.success) {
        toast.success(`Assigned ${selectedPlan.name} to athlete!`);
        setAssignModalOpen(false);
        setSelectedPlan(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign diet plan");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredPlans = plans.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.goal?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMeals = meals.filter(m => m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.type?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Apple className="w-8 h-8 text-accent" /> Nutrition & Meal Planner
          </h1>
          <p className="text-text-muted mt-1">Build macro profiles, meal templates, and assign personalized meal plans.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMealModalOpen(true)}
            className="bg-surface hover:bg-background border border-border px-4 py-2.5 rounded-full font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Utensils className="w-4 h-4 text-accent" /> Add Recipe / Food
          </button>
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-md shadow-primary/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Meal Plan
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface border border-border p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'plans' ? "bg-primary text-white" : "bg-background text-text-muted hover:text-text-primary"
            }`}
          >
            Diet Plan Templates ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab('meals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'meals' ? "bg-primary text-white" : "bg-background text-text-muted hover:text-text-primary"
            }`}
          >
            Recipe Database ({meals.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder={activeTab === 'plans' ? "Search diet plans..." : "Search recipes..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading nutrition library...</p>
        </div>
      ) : activeTab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPlans.map((plan, idx) => (
              <motion.div
                key={plan._id || idx}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface border border-border rounded-3xl p-6 hover:border-accent/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20">
                      {plan.goal || 'Nutrition Plan'}
                    </span>
                    <span className="text-sm font-mono font-bold text-text-primary flex items-center gap-1">
                      <Flame className="w-4 h-4 text-accent" /> {plan.caloriesTarget || 2000} kcal
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-xl mb-3">{plan.name}</h3>

                  <div className="grid grid-cols-3 gap-2 bg-background/50 border border-border p-3 rounded-2xl mb-6 text-center">
                    <div>
                      <span className="block text-[10px] font-bold text-text-muted">PROTEIN</span>
                      <span className="font-mono font-bold text-sm text-primary">{plan.macrosTarget?.protein || 0}g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-text-muted">CARBS</span>
                      <span className="font-mono font-bold text-sm text-accent">{plan.macrosTarget?.carbs || 0}g</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-text-muted">FAT</span>
                      <span className="font-mono font-bold text-sm text-yellow-500">{plan.macrosTarget?.fat || 0}g</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlan(plan);
                    if (clients.length > 0) setAssignClientId(clients[0]?.clientId?._id || "");
                    setAssignModalOpen(true);
                  }}
                  disabled={clients.length === 0}
                  className="w-full py-2.5 bg-accent/10 hover:bg-accent text-accent hover:text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Users className="w-3.5 h-3.5" /> Assign to Athlete
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredMeals.map((meal, idx) => (
              <motion.div
                key={meal._id || idx}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface border border-border rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-background text-text-muted border border-border">
                      {meal.type}
                    </span>
                    <span className="text-xs font-mono font-bold text-accent">{meal.calories} kcal</span>
                  </div>
                  <h4 className="font-bold text-sm mb-3">{meal.name}</h4>
                </div>

                <div className="text-[11px] text-text-muted flex justify-between pt-2 border-t border-border">
                  <span>P: <strong className="text-text-primary">{meal.protein}g</strong></span>
                  <span>C: <strong className="text-text-primary">{meal.carbs}g</strong></span>
                  <span>F: <strong className="text-text-primary">{meal.fat}g</strong></span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Plan Creator Modal */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPlanModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface border border-border w-full max-w-lg rounded-3xl p-6 relative z-10 shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-display font-bold text-lg">Create Diet Template</h3>
                <button onClick={() => setIsPlanModalOpen(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Plan Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. High-Protein Fat Loss Strategy"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Primary Goal</label>
                    <input
                      type="text"
                      value={planForm.goal}
                      onChange={(e) => setPlanForm({ ...planForm, goal: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Daily Calories (kcal)</label>
                    <input
                      type="number"
                      value={planForm.caloriesTarget}
                      onChange={(e) => setPlanForm({ ...planForm, caloriesTarget: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 bg-background/50 border border-border p-4 rounded-2xl">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1">Protein (g)</label>
                    <input
                      type="number"
                      value={planForm.macrosTarget.protein}
                      onChange={(e) => setPlanForm({ ...planForm, macrosTarget: { ...planForm.macrosTarget, protein: Number(e.target.value) } })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={planForm.macrosTarget.carbs}
                      onChange={(e) => setPlanForm({ ...planForm, macrosTarget: { ...planForm.macrosTarget, carbs: Number(e.target.value) } })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1">Fat (g)</label>
                    <input
                      type="number"
                      value={planForm.macrosTarget.fat}
                      onChange={(e) => setPlanForm({ ...planForm, macrosTarget: { ...planForm.macrosTarget, fat: Number(e.target.value) } })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm text-center font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssignModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface border border-border w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-display font-bold text-lg">Assign Diet Plan</h3>
                <button onClick={() => setAssignModalOpen(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
              </div>

              <div>
                <p className="text-xs text-text-muted mb-4">
                  Assigning <strong className="text-text-primary">{selectedPlan?.name}</strong> ({selectedPlan?.caloriesTarget} kcal) to an athlete.
                </p>

                <label className="block text-xs font-bold text-text-muted mb-1.5">Select Athlete</label>
                <select
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                >
                  {clients.map(c => (
                    <option key={c.clientId?._id} value={c.clientId?._id}>
                      {c.clientId?.name} ({c.clientId?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setAssignModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm">Cancel</button>
                <button type="button" disabled={isAssigning || !assignClientId} onClick={handleAssignPlan} className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-background font-bold text-sm disabled:opacity-50">
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Assignment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Recipe Modal */}
      <AnimatePresence>
        {isMealModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMealModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface border border-border w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-display font-bold text-lg">Add Recipe to Library</h3>
                <button onClick={() => setIsMealModalOpen(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateMeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Meal / Food Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grilled Salmon with Quinoa"
                    value={mealForm.name}
                    onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Meal Category</label>
                    <select
                      value={mealForm.type}
                      onChange={(e) => setMealForm({ ...mealForm, type: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      value={mealForm.calories}
                      onChange={(e) => setMealForm({ ...mealForm, calories: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1">Protein (g)</label>
                    <input
                      type="number"
                      value={mealForm.protein}
                      onChange={(e) => setMealForm({ ...mealForm, protein: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={mealForm.carbs}
                      onChange={(e) => setMealForm({ ...mealForm, carbs: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted mb-1">Fat (g)</label>
                    <input
                      type="number"
                      value={mealForm.fat}
                      onChange={(e) => setMealForm({ ...mealForm, fat: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm text-center font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => setIsMealModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-accent text-background font-bold text-sm">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Recipe"}
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
