"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Clock, Target, User as UserIcon, Search, Filter, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function WorkoutProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [goalFilter, setGoalFilter] = useState("all");

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get("/workouts/programs");
        if (res.data.success) setPrograms(res.data.data);
      } catch (err) {
        console.error("Failed to fetch programs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  const filtered = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesGoal = goalFilter === "all" || p.goal === goalFilter;
    return matchesSearch && matchesGoal;
  });

  const goalLabels: Record<string, string> = {
    weight_loss: "Weight Loss",
    muscle_gain: "Muscle Gain",
    endurance: "Endurance",
    flexibility: "Flexibility",
    maintenance: "Maintenance"
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-primary" /> Workout Programs
        </h1>
        <p className="text-text-muted mt-1">Browse structured training programs designed by expert coaches.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Search programs..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {["all", "weight_loss", "muscle_gain", "endurance", "flexibility"].map(g => (
            <button key={g} onClick={() => setGoalFilter(g)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                goalFilter === g ? "bg-primary text-white" : "bg-surface border border-border text-text-muted hover:border-primary"
              }`}>
              {g === "all" ? "All" : goalLabels[g] || g}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-16 border border-dashed border-border rounded-3xl text-center text-text-muted">No programs found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((program, idx) => (
            <motion.div
              key={program._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">{program.name}</h3>
              <p className="text-sm text-text-muted mb-4 line-clamp-2">{program.description || "No description provided."}</p>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="flex items-center gap-1 text-xs text-text-muted"><Clock className="w-3 h-3" /> {program.durationWeeks} weeks</span>
                <span className="flex items-center gap-1 text-xs text-text-muted"><Target className="w-3 h-3" /> {goalLabels[program.goal] || program.goal}</span>
                {program.coachId?.name && (
                  <span className="flex items-center gap-1 text-xs text-text-muted"><UserIcon className="w-3 h-3" /> {program.coachId.name}</span>
                )}
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">
                View Program <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
