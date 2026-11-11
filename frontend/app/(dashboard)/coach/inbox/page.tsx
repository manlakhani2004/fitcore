"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion } from "framer-motion";
import { Send, User, MessageSquare, Loader2, Search, CheckCheck, Clock } from "lucide-react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function CoachInboxContent() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('client');
  
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId || null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
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
          const firstId = res.data.data[0].clientId?._id || res.data.data[0]._id;
          setSelectedClientId(firstId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get('/coach-dashboard/unread-count');
      if (res.data?.success) {
        setUnreadMap(res.data.data?.byClient || {});
      }
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchClients();
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async (clientId: string) => {
    try {
      const res = await api.get(`/coach-dashboard/clients/${clientId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
        // Clear unread count locally for this client
        setUnreadMap(prev => ({ ...prev, [clientId]: 0 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedClientId) {
      fetchMessages(selectedClientId);
      const interval = setInterval(() => fetchMessages(selectedClientId), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedClientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setUnreadMap(prev => ({ ...prev, [clientId]: 0 }));
    setClients(prev => prev.map(c => {
      const id = c.clientId?._id || c._id;
      return id === clientId ? { ...c, unreadCount: 0 } : c;
    }));
  };

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

  const selectedClientData = clients.find(c => (c.clientId?._id || c._id) === selectedClientId)?.clientId;

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row h-[calc(100vh-8rem)] gap-6 pb-6">
      {/* Left Sidebar - Client List */}
      <div className="w-full md:w-80 flex flex-col bg-surface border border-border rounded-3xl overflow-hidden shadow-sm shrink-0">
        <div className="p-4 border-b border-border bg-background/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Messages</h2>
            {Object.values(unreadMap).reduce((a, b) => a + b, 0) > 0 && (
              <span className="bg-danger text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md shadow-danger/40 animate-pulse">
                {Object.values(unreadMap).reduce((a, b) => a + b, 0)} new
              </span>
            )}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredClients.length === 0 ? (
            <p className="text-center text-text-muted text-xs py-8">No clients found.</p>
          ) : (
            filteredClients.map((client) => {
              const c = client.clientId || client;
              const isSelected = selectedClientId === c._id;
              const unread = isSelected ? 0 : (unreadMap[c._id] !== undefined ? unreadMap[c._id] : (client.unreadCount || 0));

              return (
                <button
                  key={c._id}
                  onClick={() => selectClient(c._id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left group ${
                    isSelected ? 'bg-primary text-white shadow-md' : 'hover:bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          c.name?.charAt(0) || 'U'
                        )}
                      </div>
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-danger rounded-full ring-2 ring-surface animate-pulse" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isSelected ? 'text-white font-bold' : unread > 0 ? 'text-text-primary font-bold' : 'text-text-primary'}`}>
                        {c.name}
                      </p>
                      <p className={`text-xs truncate ${isSelected ? 'text-white/70' : unread > 0 ? 'text-accent font-semibold' : 'text-text-muted'}`}>
                        {unread > 0 ? `${unread} pending message${unread > 1 ? 's' : ''}` : (client.currentGoal?.replace('_', ' ') || 'Client')}
                      </p>
                    </div>
                  </div>

                  {unread > 0 && (
                    <span className="ml-2 bg-danger text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-md shadow-danger/40 animate-pulse shrink-0">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
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
            <div className="p-4 border-b border-border bg-background/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden">
                  {selectedClientData.avatar ? (
                    <img src={selectedClientData.avatar} alt={selectedClientData.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedClientData.name?.charAt(0) || 'U'
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text-primary">{selectedClientData.name}</h3>
                  <p className="text-xs text-text-muted">{selectedClientData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Live Chat
                </span>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-30 text-primary" />
                  <p className="text-sm font-bold text-text-primary">No Messages Yet</p>
                  <p className="text-xs text-text-muted">Say hello or share today&apos;s workout focus!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
                  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div 
                      key={msg._id || idx} 
                      className={`flex gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden mt-1">
                          {selectedClientData.avatar ? (
                            <img src={selectedClientData.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            selectedClientData.name?.charAt(0) || 'U'
                          )}
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm space-y-1 ${
                        isMine 
                          ? 'bg-primary text-white rounded-br-none' 
                          : 'bg-background border border-border text-text-primary rounded-bl-none'
                      }`}>
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 text-[10px] ${isMine ? 'text-white/70 justify-end' : 'text-text-muted justify-start'}`}>
                          <span>{time}</span>
                          {isMine && (
                            <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-accent' : 'text-white/60'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={sendMessage} className="p-3 md:p-4 border-t border-border bg-background/50 flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Type your message..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-md shadow-primary/20 shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8 text-center">
            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-bold text-text-primary">No Conversation Selected</p>
            <p className="text-xs text-text-muted">Select an athlete from the left roster to view their conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoachInboxPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}>
      <CoachInboxContent />
    </Suspense>
  );
}
