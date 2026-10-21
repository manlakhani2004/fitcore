"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Apple, Target, User as UserIcon, Flame, Loader2, ChevronRight } from "lucide-react";
import api from "@/lib/api";

export default function DietPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/diet/plans");
        if (res.data.success) setPlans(res.data.data);
      } catch (err) {
        console.error("Failed to fetch diet plans", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const goalLabels: Record<string, string> = {
    weight_loss: "Weight Loss",
    muscle_gain: "Muscle Gain",
    maintenance: "Maintenance"
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Apple className="w-8 h-8 text-primary" /> Diet Plans
        </h1>
        <p className="text-text-muted mt-1">Nutrition plans crafted by expert coaches to match your goals.</p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : plans.length === 0 ? (
        <div className="p-16 border border-dashed border-border rounded-3xl text-center text-text-muted">
          No diet plans available yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Apple className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="flex items-center gap-1 text-xs text-text-muted"><Target className="w-3 h-3" /> {goalLabels[plan.goal] || plan.goal}</span>
                {plan.coachId?.name && (
                  <span className="flex items-center gap-1 text-xs text-text-muted"><UserIcon className="w-3 h-3" /> {plan.coachId.name}</span>
                )}
              </div>

              <div className="bg-background border border-border rounded-2xl p-4 space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">Daily Calories</span>
                  <span className="font-bold font-mono text-accent">{plan.caloriesTarget} kcal</span>
                </div>
                {plan.macrosTarget && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Protein</span>
                      <span className="font-bold font-mono text-primary">{plan.macrosTarget.protein || 0}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Carbs</span>
                      <span className="font-bold font-mono text-primary">{plan.macrosTarget.carbs || 0}g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-muted">Fat</span>
                      <span className="font-bold font-mono text-primary">{plan.macrosTarget.fat || 0}g</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Flame className="w-4 h-4" />
                <span>{plan.meals?.length || 0} meals included</span>
              </div>

              <button className="mt-4 w-full py-2.5 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
                View Details <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
