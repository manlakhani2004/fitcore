"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search, User, MessageSquare, Activity, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await api.get('/coach-dashboard/clients');
        if (res.data.success) {
          setClients(res.data.data);
        }
      } catch (err: any) {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          toast.error("Failed to fetch clients");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    c.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">My Clients</h1>
          <p className="text-text-muted mt-1">Manage and track your active clients.</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="p-4 font-medium text-text-muted">Client Name</th>
                <th className="p-4 font-medium text-text-muted">Goal</th>
                <th className="p-4 font-medium text-text-muted">Status</th>
                <th className="p-4 font-medium text-text-muted">Last Check-in</th>
                <th className="p-4 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, idx) => (
                <motion.tr 
                  key={client._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border-b border-border hover:bg-background/50 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold overflow-hidden">
                        {client.clientId?.avatar ? (
                          <img src={client.clientId.avatar} alt={client.clientId.name} className="w-full h-full object-cover" />
                        ) : (
                          client.clientId?.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <span className="font-medium text-text-primary">{client.clientId?.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-text-muted">{client.currentGoal || 'General Fitness'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'
                    }`}>
                      {client.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-4 text-text-muted">
                    {client.lastCheckInDate ? new Date(client.lastCheckInDate).toLocaleDateString() : 'No Check-ins'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/coach/clients/${client.clientId?._id}`}>
                        <button className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-primary/10 tooltip-trigger" title="View Progress">
                          <Activity className="w-5 h-5" />
                        </button>
                      </Link>
                      <Link href={`/coach/inbox?client=${client.clientId?._id}`}>
                        <button className="p-2 text-text-muted hover:text-primary transition-colors rounded-lg hover:bg-primary/10 tooltip-trigger" title="Message">
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
