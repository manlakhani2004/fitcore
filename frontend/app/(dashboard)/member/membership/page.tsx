"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Loader2, Sparkles, AlertCircle, CreditCard, 
  Download, Search, CheckCircle2, Clock, X, Receipt 
} from "lucide-react";
import toast from "react-hot-toast";
import { CircularProgress } from "@/components/ui/CircularProgress";
import api from "@/lib/api";
import { useSearchParams } from "next/navigation";

function MembershipContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "billing" ? "billing" : "plans";

  const [activeTab, setActiveTab] = useState<"plans" | "billing">(initialTab);
  const [couponCode, setCouponCode] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [shake, setShake] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  
  const [activeMembership, setActiveMembership] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Billing & Payment History State
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "billing") setActiveTab("billing");
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, membershipRes] = await Promise.all([
          api.get('/memberships/plans'),
          api.get('/memberships/my-membership').catch(() => ({ data: { success: false, data: null } }))
        ]);
        
        if (plansRes.data.success) {
          setPlans(plansRes.data.data);
        }
        if (membershipRes.data?.success) {
          setActiveMembership(membershipRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch membership data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.get('/payments/history');
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch {
      toast.error("Failed to fetch payment history");
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (activeTab === "billing") {
      fetchPayments();
    }
  }, [activeTab]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsCheckingCoupon(true);
    
    try {
      const res = await api.post('/memberships/apply-coupon', { code: couponCode });
      if (res.data.success) {
        toast.success('Coupon applied successfully!');
      }
    } catch {
      setShake(true);
      toast.error('Invalid or expired coupon');
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setIsProcessingPayment(planId);
    
    try {
      const res = await api.post('/memberships/purchase', { planId, couponCode });
      if (res.data.success && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch {
      toast.error('Failed to initiate purchase');
      setIsProcessingPayment(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      const res = await api.post('/memberships/cancel');
      if (res.data.success) {
        toast.success('Subscription cancelled');
        setActiveMembership(null);
      }
    } catch {
      toast.error('Failed to cancel subscription');
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !refundReason.trim()) return;

    try {
      const res = await api.post('/payments/refund-request', { paymentId: selectedPayment, reason: refundReason });
      if (res.data.success) {
        toast.success("Refund request submitted");
        setPayments(payments.map(p => 
          p._id === selectedPayment ? { ...p, refundStatus: 'requested' } : p
        ));
      }
    } catch {
      toast.error("Failed to submit refund request");
    } finally {
      setRefundModalOpen(false);
      setSelectedPayment(null);
      setRefundReason("");
    }
  };

  const filteredPayments = payments.filter(p => 
    (p.type || p.description || 'Payment').toLowerCase().includes(searchTerm.toLowerCase()) || 
    p._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const progressPercentage = activeMembership ? (() => {
    const start = new Date(activeMembership.startDate).getTime();
    const end = new Date(activeMembership.endDate).getTime();
    const now = Date.now();
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const daysRemaining = (end - now) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  })() : 0;
  
  const daysLeft = activeMembership ? Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Membership & Billing</h1>
          <p className="text-text-muted mt-1">Manage your active subscription, upgrade tiers, and view past invoices.</p>
        </div>

        <div className="flex bg-surface p-1.5 rounded-2xl border border-border self-start">
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "plans" 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Plans & Tier
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "billing" 
                ? "bg-primary text-white shadow-md shadow-primary/20" 
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Receipt className="w-4 h-4" /> Billing History
          </button>
        </div>
      </div>

      {activeTab === "plans" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Active Membership */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-surface rounded-3xl p-8 border border-border flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden h-full"
            >
              <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />
              
              {activeMembership ? (
                <>
                  <h2 className="text-xl font-display font-bold mb-8">Active Plan: {activeMembership.planId?.name}</h2>
                  
                  <CircularProgress 
                    percentage={progressPercentage} 
                    label={`${daysLeft}`} 
                    sublabel="Days Left" 
                    size={180}
                    strokeWidth={14}
                  />
                  
                  <div className="mt-8 space-y-2 w-full">
                    <div className="flex justify-between items-center text-sm p-3 bg-background rounded-lg border border-border">
                      <span className="text-text-muted">Status</span>
                      <span className="font-bold text-accent capitalize">{activeMembership.status}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-background rounded-lg border border-border">
                      <span className="text-text-muted">Renews On</span>
                      <span className="font-medium">{new Date(activeMembership.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button onClick={handleCancel} className="w-full mt-6 text-danger hover:text-red-400 text-sm font-medium transition-colors">
                    Cancel Subscription
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <AlertCircle className="w-12 h-12 text-text-muted mb-4" />
                  <h3 className="text-xl font-display font-bold text-text-muted">No Active Plan</h3>
                  <p className="text-sm text-text-muted mt-2">Subscribe to a plan to unlock all features.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Upgrade / Plans */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Coupon Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-3xl p-6 border border-border"
            >
              <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" /> Have a promo code?
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.div 
                  className="flex-1 relative"
                  animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code (e.g., FITCORE20)"
                    className={`w-full bg-background border ${shake ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'} rounded-xl px-4 py-3 text-text-primary focus:outline-none transition-colors uppercase`}
                  />
                  {shake && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-danger" />}
                </motion.div>
                <button 
                  onClick={handleApplyCoupon}
                  disabled={!couponCode || isCheckingCoupon}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 min-w-[120px] flex justify-center items-center"
                >
                  {isCheckingCoupon ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply"}
                </button>
              </div>
            </motion.div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`bg-surface rounded-3xl p-6 flex flex-col relative border-2 transition-all ${
                    plan.isPopular ? 'border-primary shadow-[0_0_20px_rgba(108,99,255,0.15)]' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-pulse">
                      MOST POPULAR
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-display font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-mono font-bold">${plan.price}</span>
                      <span className="text-text-muted mb-1">/{plan.duration === 30 ? 'mo' : plan.duration === 365 ? 'yr' : 'term'}</span>
                    </div>
                    <p className="text-sm text-text-muted h-10">{plan.description}</p>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-3 mb-8">
                      {plan.features?.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-5 h-5 text-accent shrink-0" />
                          <span className="text-text-primary">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSubscribe(plan._id)}
                    disabled={isProcessingPayment === plan._id}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                      plan.isPopular 
                        ? 'bg-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-primary/30' 
                        : 'bg-background hover:bg-border text-text-primary border border-border'
                    }`}
                  >
                    {isProcessingPayment === plan._id ? <Loader2 className="w-5 h-5 animate-spin" /> : "Subscribe"}
                  </button>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      ) : (
        /* Billing & Payment History Tab */
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" /> Invoices & Transactions
                </h2>
                <p className="text-xs text-text-muted mt-1">Review past payments, download receipts, or initiate refund requests.</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors w-full md:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {loadingPayments ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-background/50 border-b border-border text-xs uppercase tracking-wider text-text-muted font-bold">
                      <th className="p-4">Transaction ID / Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPayments.map((p) => (
                      <tr key={p._id} className="hover:bg-background/50 transition-colors">
                        <td className="p-4">
                          <div className="font-mono text-sm font-semibold">{p._id}</div>
                          <div className="text-xs text-text-muted">{new Date(p.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4 font-bold text-sm">{p.type || p.description || 'Membership Subscription'}</td>
                        <td className="p-4 font-bold text-sm">₹{p.amount?.toFixed(2) || '0.00'}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${
                              p.status === 'completed' ? 'bg-accent/10 text-accent border-accent/20' :
                              p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                              'bg-danger/10 text-danger border-danger/20'
                            }`}>
                              {p.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                              {p.status === 'pending' && <Clock className="w-3 h-3" />}
                              {p.status?.toUpperCase()}
                            </span>
                            
                            {p.refundStatus && p.refundStatus !== 'none' && (
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                p.refundStatus === 'requested' ? 'text-yellow-500' :
                                p.refundStatus === 'rejected' ? 'text-danger' : 'text-accent'
                              }`}>
                                Refund: {p.refundStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.invoiceUrl ? (
                              <a href={p.invoiceUrl} target="_blank" rel="noreferrer">
                                <button className="p-2 bg-background border border-border rounded-lg text-text-muted hover:text-text-primary hover:border-text-primary transition-colors" title="Download Invoice">
                                  <Download className="w-4 h-4" />
                                </button>
                              </a>
                            ) : (
                              <button onClick={() => toast.error("Invoice receipt downloaded to cache")} className="p-2 bg-background border border-border rounded-lg text-text-muted hover:text-text-primary transition-colors" title="Download Receipt">
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            
                            {p.status === 'completed' && (!p.refundStatus || p.refundStatus === 'none') && (
                              <button 
                                onClick={() => { setSelectedPayment(p._id); setRefundModalOpen(true); }}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-bold text-text-muted hover:text-danger hover:border-danger transition-colors"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-text-muted">
                          No transaction records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Refund Modal */}
      <AnimatePresence>
        {refundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setRefundModalOpen(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-2"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-display font-bold mb-2">Request Refund</h3>
              <p className="text-sm text-text-muted mb-4">Please provide a reason for your refund request. Our finance team will review it within 48 hours.</p>

              <form onSubmit={handleRefundSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Reason for Refund</label>
                  <textarea 
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                    placeholder="e.g., Accidental charge, incorrect subscription tier..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-colors text-text-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setRefundModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-danger hover:bg-danger/90 text-white text-sm font-bold transition-all shadow-md"
                  >
                    Submit Request
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

export default function MembershipPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <MembershipContent />
    </Suspense>
  );
}
