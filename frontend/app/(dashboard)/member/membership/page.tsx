"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { CircularProgress } from "@/components/ui/CircularProgress";
import api from "@/lib/api";

export default function MembershipPage() {
  const [couponCode, setCouponCode] = useState('');
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
  const [shake, setShake] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  
  const [activeMembership, setActiveMembership] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, membershipRes] = await Promise.all([
          api.get('/memberships/plans'),
          api.get('/memberships/my-membership').catch(e => ({ data: { success: false, data: null } })) // catch 404
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

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsCheckingCoupon(true);
    
    try {
      const res = await api.post('/memberships/apply-coupon', { code: couponCode });
      if (res.data.success) {
        toast.success('Coupon applied successfully!');
      }
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to cancel subscription');
    }
  };

  const progressPercentage = activeMembership ? (() => {
    const start = new Date(activeMembership.startDate).getTime();
    const end = new Date(activeMembership.endDate).getTime();
    const now = Date.now();
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const daysRemaining = (end - now) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (daysRemaining / totalDays) * 100));
  })() : 0;
  
  const daysLeft = activeMembership ? Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Membership & Billing</h1>
        <p className="text-text-muted mt-1">Manage your active subscription and billing details.</p>
      </div>

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
    </div>
  );
}
