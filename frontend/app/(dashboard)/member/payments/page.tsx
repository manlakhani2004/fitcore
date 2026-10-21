"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Download, Search, AlertCircle, X, CheckCircle2, Clock } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/history');
        if (res.data.success) {
          setPayments(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch payment history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => 
    (p.type || p.description || 'Payment').toLowerCase().includes(searchTerm.toLowerCase()) || 
    p._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    } catch (err) {
      toast.error("Failed to submit refund request");
    } finally {
      setRefundModalOpen(false);
      setSelectedPayment(null);
      setRefundReason("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-primary" /> Billing & Payments
        </h1>
        <p className="text-text-muted mt-1">Manage your subscriptions, view invoices, and request refunds.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Payment History</h2>
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

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-sm text-text-muted">
                <th className="p-4 font-bold">Transaction ID / Date</th>
                <th className="p-4 font-bold">Description</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((p) => (
                <tr key={p._id} className="hover:bg-background/50 transition-colors">
                  <td className="p-4">
                    <div className="font-mono text-sm">{p._id}</div>
                    <div className="text-xs text-text-muted">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 font-bold text-sm">{p.type || p.description || 'Payment'}</td>
                  <td className="p-4 font-bold text-sm">₹{p.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${
                        p.status === 'completed' ? 'bg-accent/10 text-accent border-accent/20' :
                        p.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-danger/10 text-danger border-danger/20'
                      }`}>
                        {p.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {p.status === 'pending' && <Clock className="w-3 h-3" />}
                        {p.status.toUpperCase()}
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
                          <button className="p-2 bg-background border border-border rounded-lg text-text-muted hover:text-text-primary hover:border-text-primary transition-colors tooltip-trigger" title="Download Invoice">
                            <Download className="w-4 h-4" />
                          </button>
                        </a>
                      ) : (
                        <button onClick={() => toast.error("Invoice not available for this transaction")} className="p-2 bg-background border border-border rounded-lg text-text-muted opacity-50 cursor-not-allowed tooltip-trigger" title="Invoice Unavailable">
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
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Modal */}
      <AnimatePresence>
        {refundModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setRefundModalOpen(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl"
            >
              <button onClick={() => setRefundModalOpen(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 text-danger">
                <AlertCircle className="w-8 h-8" />
                <h2 className="text-xl font-display font-bold">Request Refund</h2>
              </div>

              <p className="text-sm text-text-muted mb-6">
                You are requesting a refund for transaction <strong className="text-text-primary">{selectedPayment}</strong>. 
                Please note that refunds are subject to our terms of service and may take 5-7 business days to process once approved.
              </p>

              <form onSubmit={handleRefundSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-text-muted mb-2">Reason for refund <span className="text-danger">*</span></label>
                  <textarea 
                    required
                    rows={4}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Please explain why you are requesting a refund..."
                    className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-danger transition-colors resize-none"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRefundModalOpen(false)} className="flex-1 py-3 rounded-full border border-border font-bold hover:bg-background transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-3 rounded-full bg-danger hover:bg-red-600 text-white font-bold transition-colors">
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
