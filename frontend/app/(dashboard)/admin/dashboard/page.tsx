"use client";

import { useState, useEffect } from "react";
import { Users, DollarSign, Activity, ShieldAlert, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoaches: 0,
    totalMembers: 0,
    estimatedMRR: 0
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch admin data', err);
      const msg = err.response?.data?.message || 'Failed to fetch admin data';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace(user.role === 'coach' ? '/coach/dashboard' : '/member/workouts');
      return;
    }
    fetchAdminData();
  }, [user, router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success("Role updated successfully");
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      toast.error("Failed to update role");
    } finally {
      setOpenDropdown(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" /> Platform Administration
        </h1>
        <p className="text-text-muted mt-1">Monitor platform health, manage users, and oversee revenue.</p>
      </div>

      {/* Global Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-text-muted">Total Users</p>
          </div>
          <p className="text-3xl font-mono font-bold">{stats.totalUsers.toLocaleString()}</p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-text-muted">Active Coaches</p>
          </div>
          <p className="text-3xl font-mono font-bold">{stats.totalCoaches}</p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-text-muted">Active Members</p>
          </div>
          <p className="text-3xl font-mono font-bold">{stats.totalMembers.toLocaleString()}</p>
        </div>

        <div className="bg-surface border border-border p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-text-muted">Est. MRR</p>
          </div>
          <p className="text-3xl font-mono font-bold">${stats.estimatedMRR.toLocaleString()}</p>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-display font-bold">User Management</h2>
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors w-full md:w-64"
          />
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-sm text-text-muted">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Joined</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-background/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold">{u.name || (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : 'User')}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
                      u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' :
                      u.role === 'coach' ? 'bg-accent/10 text-accent border-accent/20' :
                      'bg-border text-text-muted border-transparent'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-accent text-sm font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent" /> Active
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right relative">
                    <button 
                      onClick={() => setOpenDropdown(openDropdown === u._id ? null : u._id)}
                      className="p-2 text-text-muted hover:text-primary transition-colors inline-block"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {openDropdown === u._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-8 top-10 w-48 bg-surface border border-border rounded-xl shadow-xl z-10 py-1"
                        >
                          <div className="px-3 py-2 text-xs font-bold text-text-muted border-b border-border">Change Role</div>
                          <button onClick={() => handleRoleChange(u._id, 'member')} className="w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors">Make Member</button>
                          <button onClick={() => handleRoleChange(u._id, 'coach')} className="w-full text-left px-4 py-2 text-sm hover:bg-background transition-colors">Make Coach</button>
                          <button onClick={() => handleRoleChange(u._id, 'admin')} className="w-full text-left px-4 py-2 text-sm hover:bg-background text-primary transition-colors">Make Admin</button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
