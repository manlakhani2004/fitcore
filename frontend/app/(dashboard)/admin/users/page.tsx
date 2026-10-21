"use client";

import { useState, useEffect } from "react";
import { Users, Search, MoreVertical, Edit, UserX, Shield, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success("User role updated");
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      toast.error("Failed to update role");
    }
    setOpenDropdown(null);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> User Management
        </h1>
        <p className="text-text-muted mt-1">Manage accounts, roles, and platform access.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="member">Members</option>
            <option value="coach">Coaches</option>
            <option value="admin">Admins</option>
          </select>
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
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-background/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold">{u.name}</div>
                    <div className="text-xs text-text-muted">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${
                      u.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' :
                      u.role === 'coach' ? 'bg-accent/10 text-accent border-accent/20' :
                      'bg-border text-text-muted border-transparent'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {/* Assuming no explicit status field right now, just showing Active for everyone or handling if exists */}
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
                          className="absolute right-8 top-10 w-48 bg-surface border border-border rounded-xl shadow-xl z-10 py-1 overflow-hidden"
                        >
                          {u.role !== 'admin' && (
                            <button 
                              onClick={() => handleRoleChange(u._id, 'admin')}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-background flex items-center gap-2 transition-colors"
                            >
                              <Shield className="w-4 h-4" /> Make Admin
                            </button>
                          )}
                          {u.role !== 'member' && (
                            <button 
                              onClick={() => handleRoleChange(u._id, 'member')}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-background flex items-center gap-2 transition-colors"
                            >
                              <UserX className="w-4 h-4" /> Demote to Member
                            </button>
                          )}
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
