"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User, MessageSquare, Loader2, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function CoachInboxPage() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('client');
  
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const fetchClients = async () => {
    try {
      const res = await api.get('/coach-dashboard/clients');
      if (res.data.success) {
        setClients(res.data.data);
        if (!selectedClientId && res.data.data.length > 0) {
          setSelectedClientId(res.data.data[0].clientId._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchMessages = async (clientId: string) => {
    try {
      const res = await api.get(`/coach-dashboard/clients/${clientId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchMessages(selectedClientId);
      const interval = setInterval(() => fetchMessages(selectedClientId), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedClientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !selectedClientId) return;
    setSending(true);
    try {
      const res = await api.post(`/coach-dashboard/clients/${selectedClientId}/messages`, { content: input });
      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        setInput("");
      }
    } catch (err) {
      console.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClientData = clients.find(c => c.clientId?._id === selectedClientId)?.clientId;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6 pb-6">
      {/* Left Sidebar - Client List */}
      <div className="w-full md:w-80 flex flex-col bg-surface border border-border rounded-3xl overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-border bg-background/50">
          <h2 className="font-display font-bold text-lg mb-4">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredClients.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-8">No clients found.</p>
          ) : (
            filteredClients.map((client) => {
              const c = client.clientId;
              const isSelected = selectedClientId === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() => setSelectedClientId(c._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                    isSelected ? 'bg-primary text-white shadow-md' : 'hover:bg-background'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                  }`}>
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      c.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isSelected ? 'text-white' : 'text-text-primary'}`}>
                      {c.name}
                    </p>
                    <p className={`text-xs truncate ${isSelected ? 'text-white/70' : 'text-text-muted'}`}>
                      {client.currentGoal?.replace('_', ' ') || 'Client'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Main Area - Chat */}
      <div className="flex-1 bg-surface border border-border rounded-3xl overflow-hidden flex flex-col shadow-sm">
        {selectedClientData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-background/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {selectedClientData.avatar ? (
                  <img src={selectedClientData.avatar} alt={selectedClientData.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  selectedClientData.name?.charAt(0) || 'U'
                )}
              </div>
              <div>
                <h3 className="font-bold">{selectedClientData.name}</h3>
                <p className="text-xs text-text-muted">{selectedClientData.email}</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
                  return (
                    <motion.div
                      key={msg._id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${isMine ? "justify-end" : ""}`}
                    >
                      {!isMine && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                          {selectedClientData.name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-background border border-border rounded-bl-md"
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-text-muted"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isMine && (
                        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-border bg-background/50 flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white p-3 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-muted p-6">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a client</p>
            <p className="text-sm">Choose a client from the sidebar to view your conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
