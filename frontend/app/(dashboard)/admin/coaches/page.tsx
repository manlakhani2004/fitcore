"use client";

import { useState, useEffect } from "react";
import { UserPlus, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminCoachesPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/admin/coaches/pending');
        if (res.data.success) {
          setApplications(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to fetch pending applications");
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await api.put(`/admin/coaches/${id}/approve`, { status: action });
      if (res.data.success) {
        toast.success(`Application ${action}d successfully`);
        setApplications(applications.filter(app => app._id !== id));
      }
    } catch (err) {
      toast.error(`Failed to ${action} application`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-primary" /> Coach Approvals
        </h1>
        <p className="text-text-muted mt-1">Review and manage pending coach applications.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {applications.map((app, idx) => (
          <motion.div 
            key={app._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface border border-border p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-bold">{app.userId?.name || 'Unknown User'}</h3>
                {app.specializations && app.specializations[0] && (
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold border border-primary/20">
                    {app.specializations[0]}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted mb-1">{app.userId?.email || 'No email'}</p>
              <p className="text-xs text-text-muted">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleAction(app._id, 'reject')}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-border font-bold hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
              >
                <XCircle className="w-5 h-5" /> Reject
              </button>
              <button 
                onClick={() => handleAction(app._id, 'approve')}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-background font-bold hover:bg-[#00d68b] transition-colors"
              >
                <CheckCircle className="w-5 h-5" /> Approve
              </button>
            </div>
          </motion.div>
        ))}

        {applications.length === 0 && !isLoading && (
          <div className="p-12 border border-dashed border-border rounded-3xl text-center text-text-muted">
            <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">No pending applications</h3>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
