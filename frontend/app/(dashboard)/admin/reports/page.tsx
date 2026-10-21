"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Loader2, Users, CreditCard, TrendingUp, Calendar } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const downloadReport = async (endpoint: string, filename: string, title: string) => {
    setExporting(endpoint);
    try {
      const res = await api.get(`/reports/export/${endpoint}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${title} exported successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to export ${title}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" /> Reports & System Exports
        </h1>
        <p className="text-text-muted mt-1">Download platform telemetry, revenue ledger, and user audits in CSV format.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Export */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">User Roster Audit</h3>
                <p className="text-sm text-text-muted">Export all registered users, roles, and join dates</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-6">
              Complete snapshot of members, coaches, and administrators across the platform.
            </p>
          </div>

          <button 
            onClick={() => downloadReport('users', 'fitcore_users.csv', 'User Roster')} 
            disabled={exporting !== null}
            className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting === 'users' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Export Users CSV
          </button>
        </motion.div>

        {/* Revenue Export */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-3xl p-6 hover:border-accent/50 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Revenue & Billing Ledger</h3>
                <p className="text-sm text-text-muted">Transaction logs, membership fees, and refunds</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-6">
              Financial breakdown of all Stripe and mock payments with user linkage and status.
            </p>
          </div>

          <button 
            onClick={() => downloadReport('revenue', 'fitcore_revenue_report.csv', 'Revenue Ledger')}
            disabled={exporting !== null}
            className="w-full py-3 bg-accent/10 text-accent font-bold rounded-xl hover:bg-accent hover:text-background transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting === 'revenue' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Export Revenue CSV
          </button>
        </motion.div>

        {/* Analytics Export */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Workout & Progress Analytics</h3>
                <p className="text-sm text-text-muted">Total volume, calories burned, and duration metrics</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-6">
              Deep training telemetry logged by members, sets completed, and volume lifted.
            </p>
          </div>

          <button 
            onClick={() => downloadReport('analytics', 'fitcore_analytics_report.csv', 'Workout Analytics')}
            disabled={exporting !== null}
            className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting === 'analytics' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Export Analytics CSV
          </button>
        </motion.div>

        {/* Activity Log Export */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/50 transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Appointments & Sessions Audit</h3>
                <p className="text-sm text-text-muted">Full log of 1-on-1 coaching bookings</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mb-6">
              Coaching schedule logs, member-coach pairings, timestamps, and session statuses.
            </p>
          </div>

          <button 
            onClick={() => downloadReport('activity', 'fitcore_activity_audit.csv', 'Appointments Audit')}
            disabled={exporting !== null}
            className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting === 'activity' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            Export Sessions CSV
          </button>
        </motion.div>
      </div>
    </div>
  );
}
