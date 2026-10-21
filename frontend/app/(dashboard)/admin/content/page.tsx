"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Plus, Search, Dumbbell, Apple, Loader2, X, Save } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'exercises' | 'foods'>('exercises');
  const [exercises, setExercises] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [exerciseForm, setExerciseForm] = useState({ name: "", muscleGroups: [] as string[], equipment: "", difficulty: "beginner" });
  const [mealForm, setMealForm] = useState({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, type: "snack" });

  const fetchData = async () => {
    try {
      const [exRes, mealsRes] = await Promise.all([
        api.get('/workouts/exercises'),
        api.get('/diet/meals')
      ]);
      if (exRes.data.success) setExercises(exRes.data.data);
      if (mealsRes.data.success) setMeals(mealsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredExercises = exercises.filter((e: any) => e.name.toLowerCase().includes(search.toLowerCase()));
  const filteredMeals = meals.filter((m: any) => m.name.toLowerCase().includes(search.toLowerCase()));

  const addExercise = async () => {
    setSaving(true);
    try {
      await api.post('/workouts/exercises', exerciseForm);
      toast.success("Exercise added!");
      setShowAddModal(false);
      setExerciseForm({ name: "", muscleGroups: [], equipment: "", difficulty: "beginner" });
      fetchData();
    } catch (err) {
      toast.error("Failed to add exercise");
    } finally {
      setSaving(false);
    }
  };

  const addMeal = async () => {
    setSaving(true);
    try {
      await api.post('/diet/meals', mealForm);
      toast.success("Food added!");
      setShowAddModal(false);
      setMealForm({ name: "", calories: 0, protein: 0, carbs: 0, fat: 0, type: "snack" });
      fetchData();
    } catch (err) {
      toast.error("Failed to add food");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" /> Content Library
          </h1>
          <p className="text-text-muted mt-1">Manage global exercises and nutritional database.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(108,99,255,0.4)] flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add {activeTab === 'exercises' ? 'Exercise' : 'Food'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-border">
        {['exercises', 'foods'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)}
            className={`pb-3 font-bold text-sm capitalize relative transition-colors ${activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}>
            <span className="flex items-center gap-2">
              {tab === 'exercises' ? <Dumbbell className="w-4 h-4" /> : <Apple className="w-4 h-4" />}
              {tab}
            </span>
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder={`Search ${activeTab}...`} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            {activeTab === 'exercises' ? (
              <tr className="bg-background/50 border-b border-border text-text-muted">
                <th className="p-4 font-bold">Exercise Name</th>
                <th className="p-4 font-bold">Muscle Group</th>
                <th className="p-4 font-bold">Equipment</th>
              </tr>
            ) : (
              <tr className="bg-background/50 border-b border-border text-text-muted">
                <th className="p-4 font-bold">Food Name</th>
                <th className="p-4 font-bold">Calories</th>
                <th className="p-4 font-bold">Macros (P/C/F)</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-border">
            {activeTab === 'exercises' ? (
              filteredExercises.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-text-muted">No exercises found.</td></tr>
              ) : (
                filteredExercises.map((ex: any) => (
                  <tr key={ex._id} className="hover:bg-background/50 transition-colors">
                    <td className="p-4 font-bold">{ex.name}</td>
                    <td className="p-4">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                        {(ex.muscleGroups || []).join(', ') || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-text-muted">{ex.equipment || 'None'}</td>
                  </tr>
                ))
              )
            ) : (
              filteredMeals.length === 0 ? (
                <tr><td colSpan={3} className="p-8 text-center text-text-muted">No foods found.</td></tr>
              ) : (
                filteredMeals.map((meal: any) => (
                  <tr key={meal._id} className="hover:bg-background/50 transition-colors">
                    <td className="p-4 font-bold">{meal.name}</td>
                    <td className="p-4 text-accent font-bold">{meal.calories} kcal</td>
                    <td className="p-4 text-text-muted font-mono">{meal.protein || 0}g / {meal.carbs || 0}g / {meal.fat || 0}g</td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Add {activeTab === 'exercises' ? 'Exercise' : 'Food'}</h2>
                  <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5" /></button>
                </div>

                {activeTab === 'exercises' ? (
                  <>
                    <input placeholder="Exercise Name" value={exerciseForm.name} onChange={(e) => setExerciseForm({...exerciseForm, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                    <input placeholder="Muscle Groups (comma separated)" value={exerciseForm.muscleGroups.join(', ')} onChange={(e) => setExerciseForm({...exerciseForm, muscleGroups: e.target.value.split(',').map(s => s.trim())})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                    <input placeholder="Equipment" value={exerciseForm.equipment} onChange={(e) => setExerciseForm({...exerciseForm, equipment: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                    <select value={exerciseForm.difficulty} onChange={(e) => setExerciseForm({...exerciseForm, difficulty: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    <button onClick={addExercise} disabled={saving || !exerciseForm.name}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} Add Exercise
                    </button>
                  </>
                ) : (
                  <>
                    <input placeholder="Food Name" value={mealForm.name} onChange={(e) => setMealForm({...mealForm, name: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-text-muted">Calories</label>
                        <input type="number" value={mealForm.calories} onChange={(e) => setMealForm({...mealForm, calories: Number(e.target.value)})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">Type</label>
                        <select value={mealForm.type} onChange={(e) => setMealForm({...mealForm, type: e.target.value})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary">
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-text-muted">Protein (g)</label>
                        <input type="number" value={mealForm.protein} onChange={(e) => setMealForm({...mealForm, protein: Number(e.target.value)})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">Carbs (g)</label>
                        <input type="number" value={mealForm.carbs} onChange={(e) => setMealForm({...mealForm, carbs: Number(e.target.value)})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted">Fat (g)</label>
                        <input type="number" value={mealForm.fat} onChange={(e) => setMealForm({...mealForm, fat: Number(e.target.value)})}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                    <button onClick={addMeal} disabled={saving || !mealForm.name}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} Add Food
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
