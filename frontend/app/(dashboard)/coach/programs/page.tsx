"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
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
  Sparkles
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function CoachProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Program Creator Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: "",
    description: "",
    goal: "Hypertrophy & Strength",
    durationWeeks: 4,
    difficulty: "intermediate",
    schedule: [
      {
        dayNumber: 1,
        dayName: "Day 1: Chest & Triceps",
        exercises: [{ name: "Bench Press", sets: 4, reps: 10, restSeconds: 90 }]
      },
      {
        dayNumber: 2,
        dayName: "Day 2: Back & Biceps",
        exercises: [{ name: "Pull Ups", sets: 4, reps: 8, restSeconds: 90 }]
      }
    ]
  });

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [assignClientId, setAssignClientId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [programsRes, clientsRes, exercisesRes] = await Promise.all([
        api.get('/workouts/programs'),
        api.get('/coach-dashboard/clients'),
        api.get('/workouts/exercises').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (programsRes.data.success) setPrograms(programsRes.data.data);
      if (clientsRes.data.success) setClients(clientsRes.data.data);
      if (exercisesRes.data.success) setExercises(exercisesRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load workout library");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.name.trim()) {
      toast.error("Please provide a program title");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/workouts/programs', programForm);
      if (res.data.success) {
        toast.success("Workout program created!");
        setIsModalOpen(false);
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
              dayName: "Day 1: Upper Body",
              exercises: [{ name: "Bench Press", sets: 4, reps: 10, restSeconds: 90 }]
            }
          ]
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create program");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!selectedProgram || !assignClientId) {
      toast.error("Please choose a client");
      return;
    }

    setIsAssigning(true);
    try {
      const res = await api.post(`/coach-dashboard/clients/${assignClientId}/program`, {
        name: selectedProgram.name,
        description: selectedProgram.description,
        goal: selectedProgram.goal,
        durationWeeks: selectedProgram.durationWeeks,
        difficulty: selectedProgram.difficulty,
        schedule: selectedProgram.schedule
      });

      if (res.data.success) {
        toast.success(`Assigned ${selectedProgram.name} to athlete!`);
        setAssignModalOpen(false);
        setSelectedProgram(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign program");
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.goal?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = difficultyFilter === "all" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-primary" /> Training Program Library
          </h1>
          <p className="text-text-muted mt-1">Design, customize, and assign multi-week workout routines to athletes.</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md shadow-primary/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Routine
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface border border-border p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search programs or goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "beginner", "intermediate", "advanced"].map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border shrink-0 ${
                difficultyFilter === diff 
                  ? "bg-primary border-primary text-white" 
                  : "bg-background border-border text-text-muted hover:text-text-primary"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Programs Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading training routines...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-dashed border-border rounded-3xl p-8">
          <Dumbbell className="w-12 h-12 text-primary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">No Programs Found</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
            Build custom periodized routines for strength, fat loss, or hypertrophy.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors"
          >
            Create Routine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPrograms.map((program, idx) => (
              <motion.div
                key={program._id || idx}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
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

                  <h3 className="font-display font-bold text-xl mb-1 group-hover:text-primary transition-colors">
                    {program.name}
                  </h3>
                  <p className="text-xs text-text-muted mb-4 line-clamp-2">
                    {program.description || `Specialized routine targeting ${program.goal || 'athletic performance'}.`}
                  </p>

                  <div className="space-y-1.5 mb-6 bg-background/50 border border-border p-3 rounded-xl">
                    <div className="text-[11px] font-bold text-text-muted flex justify-between">
                      <span>Split Structure</span>
                      <span className="text-text-primary">{program.schedule?.length || 3} Days/Week</span>
                    </div>
                    <div className="text-[11px] font-bold text-text-muted flex justify-between">
                      <span>Primary Goal</span>
                      <span className="text-accent">{program.goal || 'General Fitness'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedProgram(program);
                      if (clients.length > 0) setAssignClientId(clients[0]?.clientId?._id || "");
                      setAssignModalOpen(true);
                    }}
                    disabled={clients.length === 0}
                    className="flex-1 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Users className="w-3.5 h-3.5" /> Assign to Athlete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssignModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-display font-bold text-lg">Assign Program</h3>
                <button onClick={() => setAssignModalOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <p className="text-xs text-text-muted mb-4">
                  Assigning <strong className="text-text-primary">{selectedProgram?.name}</strong> to an active client.
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
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAssigning || !assignClientId}
                  onClick={handleAssignProgram}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Assignment"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Program Builder Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface border border-border w-full max-w-2xl rounded-3xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" /> Create Routine Template
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Program Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8-Week Hypertrophy Overhaul"
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Goal</label>
                    <input
                      type="text"
                      placeholder="e.g. Muscle Gain"
                      value={programForm.goal}
                      onChange={(e) => setProgramForm({ ...programForm, goal: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Duration (Weeks)</label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      value={programForm.durationWeeks}
                      onChange={(e) => setProgramForm({ ...programForm, durationWeeks: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Difficulty</label>
                    <select
                      value={programForm.difficulty}
                      onChange={(e) => setProgramForm({ ...programForm, difficulty: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe program objectives, recommended equipment, split cadence..."
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Routine"}
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
