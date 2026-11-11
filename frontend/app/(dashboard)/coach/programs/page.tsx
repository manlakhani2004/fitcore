"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Apple, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  Check, 
  X, 
  ChevronRight, 
  Loader2, 
  Trash2, 
  Sparkles,
  Flame,
  Utensils,
  PieChart
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

function LibraryContent() {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab') || 'programs';

  const [activeTab, setActiveTab] = useState<'programs' | 'diet' | 'exercises'>(
    (urlTab as any) || 'programs'
  );

  useEffect(() => {
    if (urlTab && ['programs', 'diet', 'exercises'].includes(urlTab)) {
      setActiveTab(urlTab as any);
    }
  }, [urlTab]);

  const [clients, setClients] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // =========================================================
  // WORKOUT PROGRAMS STATE
  // =========================================================
  const [programs, setPrograms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    goal: "Hypertrophy & Strength",
    durationWeeks: 4,
    difficulty: "intermediate",
    schedule: [
      {
        dayNumber: 1,
        dayName: "Day 1: Upper Body Power",
        exercises: [{ name: "Barbell Bench Press", sets: 4, reps: 8, restSeconds: 90 }]
      },
      {
        dayNumber: 2,
        dayName: "Day 2: Lower Body Power",
        exercises: [{ name: "Barbell Squats", sets: 4, reps: 8, restSeconds: 120 }]
      }
    ]
  });

  // Assign Program Modal
  const [assignProgramModalOpen, setAssignProgramModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [assignProgramClientId, setAssignProgramClientId] = useState("");
  const [isAssigningProgram, setIsAssigningProgram] = useState(false);

  // =========================================================
  // DIET PLANS STATE
  // =========================================================
  const [dietPlans, setDietPlans] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [dietSearch, setDietSearch] = useState("");
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [isSubmittingDiet, setIsSubmittingDiet] = useState(false);
  const [dietForm, setDietForm] = useState({
    name: "",
    goal: "Lean Muscle Building",
    caloriesTarget: 2400,
    macrosTarget: {
      protein: 180,
      carbs: 240,
      fat: 70
    }
  });

  // Assign Diet Modal
  const [assignDietModalOpen, setAssignDietModalOpen] = useState(false);
  const [selectedDietPlan, setSelectedDietPlan] = useState<any>(null);
  const [assignDietClientId, setAssignDietClientId] = useState("");
  const [isAssigningDiet, setIsAssigningDiet] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [progRes, dietRes, mealsRes, clientsRes, exercisesRes] = await Promise.allSettled([
        api.get('/workouts/programs'),
        api.get('/diet/plans'),
        api.get('/diet/meals'),
        api.get('/coach-dashboard/clients'),
        api.get('/workouts/exercises').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (progRes.status === 'fulfilled' && progRes.value.data.success) {
        setPrograms(progRes.value.data.data);
      }
      if (dietRes.status === 'fulfilled' && dietRes.value.data.success) {
        setDietPlans(dietRes.value.data.data);
      }
      if (mealsRes.status === 'fulfilled' && mealsRes.value.data.success) {
        setMeals(mealsRes.value.data.data);
      }
      if (clientsRes.status === 'fulfilled' && clientsRes.value.data.success) {
        setClients(clientsRes.value.data.data);
      }
      if (exercisesRes.status === 'fulfilled' && exercisesRes.value.data.success) {
        setExercises(exercisesRes.value.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load library content");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Program Handlers
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.name.trim()) return toast.error("Please enter a program name");

    setIsSubmittingProgram(true);
    try {
      const res = await api.post('/workouts/programs', programForm);
      if (res.data.success) {
        toast.success("Workout program created!");
        setIsProgramModalOpen(false);
        setPrograms(prev => [res.data.data, ...prev]);
        setProgramForm({
          name: "",
          description: "",
          goal: "Hypertrophy & Strength",
          durationWeeks: 4,
          difficulty: "intermediate",
          schedule: [
            {
              dayNumber: 1,
              dayName: "Day 1: Upper Body Power",
              exercises: [{ name: "Barbell Bench Press", sets: 4, reps: 8, restSeconds: 90 }]
            }
          ]
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create program");
    } finally {
      setIsSubmittingProgram(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedProgram || !assignProgramClientId) return toast.error("Please select an athlete");

    setIsAssigningProgram(true);
    try {
      const res = await api.post(`/coach-dashboard/clients/${assignProgramClientId}/program`, {
        name: selectedProgram.name,
        description: selectedProgram.description,
        goal: selectedProgram.goal,
        durationWeeks: selectedProgram.durationWeeks,
        difficulty: selectedProgram.difficulty,
        schedule: selectedProgram.schedule
      });

      if (res.data.success) {
        toast.success(`Assigned ${selectedProgram.name} to athlete!`);
        setAssignProgramModalOpen(false);
        setSelectedProgram(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign program");
    } finally {
      setIsAssigningProgram(false);
    }
  };

  // Diet Handlers
  const handleCreateDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dietForm.name.trim()) return toast.error("Please enter a diet plan name");

    setIsSubmittingDiet(true);
    try {
      const res = await api.post('/diet/plans', dietForm);
      if (res.data.success) {
        toast.success("Diet plan created!");
        setIsDietModalOpen(false);
        setDietPlans(prev => [res.data.data, ...prev]);
        setDietForm({
          name: "",
          goal: "Lean Muscle Building",
          caloriesTarget: 2400,
          macrosTarget: { protein: 180, carbs: 240, fat: 70 }
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create diet plan");
    } finally {
      setIsSubmittingDiet(false);
    }
  };

  const handleAssignDiet = async () => {
    if (!selectedDietPlan || !assignDietClientId) return toast.error("Please select an athlete");

    setIsAssigningDiet(true);
    try {
      const res = await api.post(`/coach-dashboard/clients/${assignDietClientId}/diet-plan`, {
        name: selectedDietPlan.name,
        goal: selectedDietPlan.goal,
        caloriesTarget: selectedDietPlan.caloriesTarget,
        macrosTarget: selectedDietPlan.macrosTarget
      });

      if (res.data.success) {
        toast.success(`Assigned ${selectedDietPlan.name} to athlete!`);
        setAssignDietModalOpen(false);
        setSelectedDietPlan(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign diet plan");
    } finally {
      setIsAssigningDiet(false);
    }
  };

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.goal?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = difficultyFilter === "all" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const filteredDietPlans = dietPlans.filter(p => {
    return p.name?.toLowerCase().includes(dietSearch.toLowerCase()) || 
           p.goal?.toLowerCase().includes(dietSearch.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Training & Nutrition Library</h1>
          <p className="text-text-muted mt-1 text-sm">
            Central repository of multi-week workout routines, periodized programs, and macro nutrition templates.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-surface border border-border rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('programs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'programs' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Workout Programs</span>
          </button>

          <button
            onClick={() => setActiveTab('diet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'diet' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>Nutrition & Diet Plans</span>
          </button>

          <button
            onClick={() => setActiveTab('exercises')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'exercises' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Exercise DB ({exercises.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: WORKOUT PROGRAMS                                   */}
      {/* ========================================================= */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface border border-border p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search programs or goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {["all", "beginner", "intermediate", "advanced"].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border shrink-0 ${
                    difficultyFilter === diff 
                      ? "bg-primary border-primary text-white" 
                      : "bg-background border-border text-text-muted hover:text-text-primary"
                  }`}
                >
                  {diff}
                </button>
              ))}

              <button
                onClick={() => setIsProgramModalOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-primary/20 flex items-center gap-1.5 shrink-0 ml-2"
              >
                <Plus className="w-3.5 h-3.5" /> New Routine
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-text-muted flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-xs">Loading routines...</p>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-3xl p-8 space-y-3">
              <Dumbbell className="w-12 h-12 text-primary/40 mx-auto" />
              <h3 className="text-base font-bold">No Programs Found</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Create structured routines for hypertrophy, strength, or endurance.
              </p>
              <button
                onClick={() => setIsProgramModalOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs"
              >
                Create Program
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program, idx) => (
                <div
                  key={program._id || idx}
                  className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                        program.difficulty === 'beginner' ? 'bg-accent/10 text-accent border-accent/20' :
                        program.difficulty === 'advanced' ? 'bg-danger/10 text-danger border-danger/20' :
                        'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {program.difficulty}
                      </span>
                      <span className="text-xs text-text-muted flex items-center gap-1 font-bold">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {program.durationWeeks || 4} Weeks
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold group-hover:text-primary transition-colors">
                        {program.name}
                      </h3>
                      <p className="text-xs text-text-muted line-clamp-2 mt-1">
                        {program.description || 'Targeted multi-week hypertrophy split.'}
                      </p>
                    </div>

                    <div className="p-3 bg-background rounded-2xl border border-border/80 text-xs space-y-1">
                      <span className="text-text-muted block text-[10px] uppercase font-bold">Goal:</span>
                      <strong className="text-accent">{program.goal || 'General Fitness'}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted font-mono">
                      {program.schedule?.length || 2} Days / Week
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProgram(program);
                        setAssignProgramClientId(clients[0]?.clientId?._id || clients[0]?._id || "");
                        setAssignProgramModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20"
                    >
                      Assign to Athlete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: NUTRITION & DIET PLANS                             */}
      {/* ========================================================= */}
      {activeTab === 'diet' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface border border-border p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search diet plans or goals..."
                value={dietSearch}
                onChange={(e) => setDietSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              onClick={() => setIsDietModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Diet Plan
            </button>
          </div>

          {filteredDietPlans.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-dashed border-border rounded-3xl p-8 space-y-3">
              <Apple className="w-12 h-12 text-accent/40 mx-auto" />
              <h3 className="text-base font-bold">No Nutrition Plans Found</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Create calorie and macro-targeted meal templates for your athletes.
              </p>
              <button
                onClick={() => setIsDietModalOpen(true)}
                className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs"
              >
                Create Diet Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDietPlans.map((plan, idx) => (
                <div
                  key={plan._id || idx}
                  className="bg-surface border border-border rounded-3xl p-6 hover:border-accent/50 transition-all flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                        {plan.goal || 'Nutrition'}
                      </span>
                      <span className="text-xs text-text-muted font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-accent" /> {plan.caloriesTarget} kcal
                      </span>
                    </div>

                    <h3 className="text-base font-bold group-hover:text-accent transition-colors">
                      {plan.name}
                    </h3>

                    {/* Macros Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-background rounded-xl border border-border">
                        <span className="text-[10px] text-text-muted block">Protein</span>
                        <strong className="text-accent">{plan.macrosTarget?.protein || 150}g</strong>
                      </div>
                      <div className="p-2 bg-background rounded-xl border border-border">
                        <span className="text-[10px] text-text-muted block">Carbs</span>
                        <strong className="text-primary">{plan.macrosTarget?.carbs || 200}g</strong>
                      </div>
                      <div className="p-2 bg-background rounded-xl border border-border">
                        <span className="text-[10px] text-text-muted block">Fats</span>
                        <strong className="text-warning">{plan.macrosTarget?.fat || 60}g</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted">Target Macro Split</span>
                    <button
                      onClick={() => {
                        setSelectedDietPlan(plan);
                        setAssignDietClientId(clients[0]?.clientId?._id || clients[0]?._id || "");
                        setAssignDietModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-accent text-background text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-accent/20"
                    >
                      Assign to Athlete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: EXERCISE DATABASE                                  */}
      {/* ========================================================= */}
      {activeTab === 'exercises' && (
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h2 className="text-xl font-display font-bold">Exercise Movement Library</h2>
              <p className="text-xs text-text-muted">Browse foundational lifts, mobility movements, and targeted accessory exercises.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              {exercises.length} Movements
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.slice(0, 15).map((ex: any, idx: number) => (
              <div key={ex._id || idx} className="p-4 rounded-2xl bg-background border border-border hover:border-primary/40 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                    {ex.targetMuscle || 'Compound'}
                  </span>
                  <span className="text-xs text-text-muted">{ex.category || 'Strength'}</span>
                </div>
                <h4 className="font-bold text-sm text-text-primary">{ex.name}</h4>
                {ex.instructions && (
                  <p className="text-xs text-text-muted line-clamp-2">{ex.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Create Program */}
      <AnimatePresence>
        {isProgramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-5 shadow-2xl relative"
            >
              <button onClick={() => setIsProgramModalOpen(false)} className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold">Create Training Program</h3>
              </div>

              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted">Program Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8-Week Hypertrophy & Power"
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">Duration (Weeks)</label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={programForm.durationWeeks}
                      onChange={(e) => setProgramForm({ ...programForm, durationWeeks: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">Difficulty</label>
                    <select
                      value={programForm.difficulty}
                      onChange={(e) => setProgramForm({ ...programForm, difficulty: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted">Description</label>
                  <textarea
                    rows={2}
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsProgramModalOpen(false)} className="px-4 py-2 text-xs font-bold text-text-muted">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProgram}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingProgram ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Program"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Assign Program */}
      <AnimatePresence>
        {assignProgramModalOpen && selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl relative"
            >
              <button onClick={() => setAssignProgramModalOpen(false)} className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold">Assign {selectedProgram.name}</h3>
                <p className="text-xs text-text-muted">Select an athlete to assign this routine.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted">Choose Athlete</label>
                <select
                  value={assignProgramClientId}
                  onChange={(e) => setAssignProgramClientId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                >
                  {clients.map(c => (
                    <option key={c._id} value={c.clientId?._id || c._id}>
                      {c.clientId?.name || c.name} ({c.currentGoal || 'Fitness'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAssignProgramModalOpen(false)} className="px-4 py-2 text-xs font-bold text-text-muted">
                  Cancel
                </button>
                <button
                  onClick={handleAssignProgram}
                  disabled={isAssigningProgram}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {isAssigningProgram ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Assignment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Create Diet Plan */}
      <AnimatePresence>
        {isDietModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-5 shadow-2xl relative"
            >
              <button onClick={() => setIsDietModalOpen(false)} className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  <Apple className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold">Create Nutrition Plan</h3>
              </div>

              <form onSubmit={handleCreateDietPlan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lean Bulk Phase 1"
                    value={dietForm.name}
                    onChange={(e) => setDietForm({ ...dietForm, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">Goal</label>
                    <input
                      type="text"
                      value={dietForm.goal}
                      onChange={(e) => setDietForm({ ...dietForm, goal: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-muted">Calories (kcal)</label>
                    <input
                      type="number"
                      value={dietForm.caloriesTarget}
                      onChange={(e) => setDietForm({ ...dietForm, caloriesTarget: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted">Protein (g)</label>
                    <input
                      type="number"
                      value={dietForm.macrosTarget.protein}
                      onChange={(e) => setDietForm({ ...dietForm, macrosTarget: { ...dietForm.macrosTarget, protein: Number(e.target.value) } })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted">Carbs (g)</label>
                    <input
                      type="number"
                      value={dietForm.macrosTarget.carbs}
                      onChange={(e) => setDietForm({ ...dietForm, macrosTarget: { ...dietForm.macrosTarget, carbs: Number(e.target.value) } })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted">Fat (g)</label>
                    <input
                      type="number"
                      value={dietForm.macrosTarget.fat}
                      onChange={(e) => setDietForm({ ...dietForm, macrosTarget: { ...dietForm.macrosTarget, fat: Number(e.target.value) } })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsDietModalOpen(false)} className="px-4 py-2 text-xs font-bold text-text-muted">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDiet}
                    className="px-6 py-2.5 rounded-xl bg-accent text-background text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingDiet ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Plan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Assign Diet */}
      <AnimatePresence>
        {assignDietModalOpen && selectedDietPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-md w-full space-y-5 shadow-2xl relative"
            >
              <button onClick={() => setAssignDietModalOpen(false)} className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <h3 className="text-xl font-display font-bold">Assign {selectedDietPlan.name}</h3>
                <p className="text-xs text-text-muted">Choose athlete to assign this nutrition plan.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-muted">Choose Athlete</label>
                <select
                  value={assignDietClientId}
                  onChange={(e) => setAssignDietClientId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                >
                  {clients.map(c => (
                    <option key={c._id} value={c.clientId?._id || c._id}>
                      {c.clientId?.name || c.name} ({c.currentGoal || 'Fitness'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAssignDietModalOpen(false)} className="px-4 py-2 text-xs font-bold text-text-muted">
                  Cancel
                </button>
                <button
                  onClick={handleAssignDiet}
                  disabled={isAssigningDiet}
                  className="px-6 py-2.5 rounded-xl bg-accent text-background text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {isAssigningDiet ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Assignment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function CoachProgramsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}>
      <LibraryContent />
    </Suspense>
  );
}
