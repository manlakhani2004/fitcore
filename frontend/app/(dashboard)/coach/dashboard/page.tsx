"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Activity, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function CoachDashboard() {
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeClients: 0, mrr: 0, actionRequired: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [clientsRes, statsRes] = await Promise.all([
          api.get('/coach-dashboard/clients'),
          api.get('/coach-dashboard/stats')
        ]);
        
        if (clientsRes.data.success) {
          const fetchedClients = clientsRes.data.data;
          setClients(fetchedClients);
          
          let mrr = 0;
          let active = fetchedClients.length;
          
          if (statsRes.data.success) {
            mrr = statsRes.data.data.mrr;
            active = statsRes.data.data.activeClients;
          }
          
          setStats({
            activeClients: active,
            mrr: mrr,
            actionRequired: fetchedClients.filter((c: any) => c.status === 'needs_attention').length || 2
          });
        }
      } catch (err) {
        console.error('Failed to fetch clients', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Coach Hub</h1>
        <p className="text-text-muted mt-1">Manage your roster, review progress, and grow your business.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted font-bold">Active Clients</p>
            <p className="text-2xl font-mono font-bold">{stats.activeClients}</p>
          </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted font-bold">Monthly MRR</p>
            <p className="text-2xl font-mono font-bold">${stats.mrr.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-surface border border-border p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-danger/20 text-danger flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-muted font-bold">Action Required</p>
            <p className="text-2xl font-mono font-bold">{stats.actionRequired}</p>
          </div>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="bg-surface border border-border rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-display font-bold">Client Roster</h2>
          <button className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-sm text-text-muted">
                <th className="p-4 font-bold">Client Name</th>
                <th className="p-4 font-bold">Membership Plan</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Last Active</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((client) => (
                <tr key={client._id} className="hover:bg-background/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center font-bold text-xs">
                      {client.memberId?.firstName?.charAt(0) || '?'}
                    </div>
                    <span className="font-bold">{client.memberId?.firstName} {client.memberId?.lastName}</span>
                  </td>
                  <td className="p-4 text-sm text-text-muted">{client.plan || 'Standard'}</td>
                  <td className="p-4">
                    {client.status === 'active' || client.status === 'on_track' ? (
                      <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent px-2.5 py-1 rounded-full text-xs font-bold border border-accent/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> On Track
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                        <AlertCircle className="w-3 h-3" /> Needs Attention
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-text-muted">{new Date(client.updatedAt || Date.now()).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Link href={`/coach/clients/${client._id}`}>
                      <button className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-hover transition-colors">
                        Review <ChevronRight className="w-4 h-4" />
                      </button>
                    </Link>
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
