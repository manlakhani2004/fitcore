"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Edit2, Trash2, Loader2, X, Save } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminMembershipsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [planForm, setPlanForm] = useState({ name: "", description: "", price: 0, duration: 30, isActive: true });

  const [couponForm, setCouponForm] = useState({ code: "", value: 0, discountType: "percentage", usageLimit: 100 });

  const fetchData = async () => {
    try {
      const [plansRes, couponsRes] = await Promise.all([
        api.get('/memberships/plans'),
        api.get('/admin/memberships/coupons')
      ]);
      if (plansRes.data.success) setPlans(plansRes.data.data);
      if (couponsRes.data.success) setCoupons(couponsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({ name: plan.name, description: plan.description || "", price: plan.price, duration: plan.duration, isActive: plan.isActive });
    setShowPlanModal(true);
  };

  const openNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({ name: "", description: "", price: 0, duration: 30, isActive: true });
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    setSaving(true);
    try {
      if (editingPlan) {
        await api.put(`/admin/memberships/plans/${editingPlan._id}`, planForm);
        toast.success("Plan updated!");
      } else {
        await api.post('/admin/memberships/plans', planForm);
        toast.success("Plan created!");
      }
      setShowPlanModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await api.delete(`/admin/memberships/plans/${id}`);
      toast.success("Plan deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete plan");
    }
  };

  const saveCoupon = async () => {
    setSaving(true);
    try {
      await api.post('/admin/memberships/coupons', couponForm);
      toast.success("Coupon created!");
      setShowCouponModal(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to create coupon");
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
            <CreditCard className="w-8 h-8 text-primary" /> Membership Plans
          </h1>
          <p className="text-text-muted mt-1">Manage pricing tiers, features, and coupons.</p>
        </div>
        <button onClick={openNewPlan} className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(108,99,255,0.4)] flex items-center gap-2">
          <Plus className="w-5 h-5" /> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan._id} className={`bg-surface p-6 rounded-3xl relative border ${plan.price > 0 && plans.some(p => p.price > plan.price) ? '' : plan.price > 0 ? 'border-primary shadow-[0_0_30px_rgba(108,99,255,0.15)]' : 'border-border'}`}>
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="text-3xl font-display font-bold mb-6">${plan.price}<span className="text-lg text-text-muted">/{plan.duration} days</span></div>
            {plan.description && <p className="text-sm text-text-muted mb-4">{plan.description}</p>}
            <div className="flex gap-2">
              <button onClick={() => openEditPlan(plan)} className="flex-1 py-2 bg-background border border-border rounded-lg text-sm font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => deletePlan(plan._id)} className="p-2 bg-background border border-border rounded-lg text-text-muted hover:border-danger hover:text-danger transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupons Section */}
      <div className="mt-12 bg-surface border border-border rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Discount Coupons</h2>
          <button onClick={() => setShowCouponModal(true)} className="text-sm font-bold text-primary hover:underline">Add Coupon</button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="pb-3">Code</th>
              <th className="pb-3">Discount</th>
              <th className="pb-3">Usage</th>
              <th className="pb-3">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map((c: any) => (
              <tr key={c._id}>
                <td className="py-4 font-mono font-bold">{c.code}</td>
                <td className="py-4 text-accent font-bold">{c.discountType === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`}</td>
                <td className="py-4 text-text-muted">{c.usedCount || 0} / {c.usageLimit}</td>
                <td className="py-4 text-text-muted">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-text-muted">No coupons yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Plan Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlanModal(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">{editingPlan ? "Edit Plan" : "New Plan"}</h2>
                  <button onClick={() => setShowPlanModal(false)}><X className="w-5 h-5" /></button>
                </div>
                <input placeholder="Plan Name" value={planForm.name} onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                <input placeholder="Description" value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Price (₹)</label>
                    <input type="number" value={planForm.price} onChange={(e) => setPlanForm({...planForm, price: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Duration (days)</label>
                    <input type="number" value={planForm.duration} onChange={(e) => setPlanForm({...planForm, duration: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanForm({...planForm, isActive: e.target.checked})} />
                  Active
                </label>
                <button onClick={savePlan} disabled={saving}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Coupon Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCouponModal(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-surface border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">New Coupon</h2>
                  <button onClick={() => setShowCouponModal(false)}><X className="w-5 h-5" /></button>
                </div>
                <input placeholder="Code (e.g. SUMMER20)" value={couponForm.code} onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 font-mono focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted">Value</label>
                    <input type="number" value={couponForm.value} onChange={(e) => setCouponForm({...couponForm, value: Number(e.target.value)})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted">Type</label>
                    <select value={couponForm.discountType} onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted">Usage Limit</label>
                  <input type="number" value={couponForm.usageLimit} onChange={(e) => setCouponForm({...couponForm, usageLimit: Number(e.target.value)})}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary" />
                </div>
                <button onClick={saveCoupon} disabled={saving}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />} Create
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
