"use client";

import { useState, useEffect } from "react";
import { LineChart, Search, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/admin/all');
        if (res.data.success) {
          setPayments(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch payments");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const handleRefund = async (id: string, action: 'approved' | 'rejected') => {
    try {
      const res = await api.put(`/payments/admin/refund/${id}`, { status: action });
      if (res.data.success) {
        toast.success(`Refund ${action}`);
        setPayments(payments.map(p => p._id === id ? res.data.data : p));
      }
    } catch (err) {
      toast.error(`Failed to ${action} refund`);
    }
  };

  const refundsQueue = payments.filter(p => p.refundStatus === 'requested');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <LineChart className="w-8 h-8 text-primary" /> Financial Operations
        </h1>
        <p className="text-text-muted mt-1">Monitor revenue and process refund requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Transactions */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Transactions</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" placeholder="Search TxID..." className="bg-background border border-border rounded-xl pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-border">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-background/50">
                  <td className="p-4">
                    <div className="font-mono text-xs">{payment._id}</div>
                    <div className="text-text-muted text-xs">{new Date(payment.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4 font-bold">{payment.userId?.name || payment.type || 'Payment'}</td>
                  <td className="p-4 font-bold text-accent">+${payment.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      payment.status === 'completed' ? 'bg-accent/10 text-accent' :
                      payment.status === 'refunded' ? 'bg-danger/10 text-danger' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {payment.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-text-muted">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Refund Queue */}
        <div className="bg-surface border border-border rounded-3xl p-6 h-fit">
          <h2 className="text-xl font-bold mb-6 flex items-center justify-between">
            Refund Queue
            <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full">{refundsQueue.length}</span>
          </h2>

          <div className="space-y-4">
            {refundsQueue.map((ref) => (
              <motion.div key={ref._id} className="bg-background border border-border p-4 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">{ref.userId?.name || 'Unknown User'}</h4>
                  <span className="font-bold text-danger">${ref.amount.toFixed(2)}</span>
                </div>
                <p className="text-xs text-text-muted mb-4">"{ref.refundReason || 'No reason provided.'}"</p>
                
                <div className="flex gap-2">
                  <button onClick={() => handleRefund(ref._id, 'rejected')} className="flex-1 py-2 border border-border rounded-lg text-xs font-bold hover:bg-danger/10 hover:text-danger hover:border-danger transition-colors">
                    Reject
                  </button>
                  <button onClick={() => handleRefund(ref._id, 'approved')} className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-colors">
                    Approve
                  </button>
                </div>
              </motion.div>
            ))}

            {refundsQueue.length === 0 && (
              <div className="text-center p-6 text-text-muted">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Queue is empty</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
