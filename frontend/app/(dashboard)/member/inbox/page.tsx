"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, User, MessageSquare, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function MemberInboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [coach, setCoach] = useState<any>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const fetchData = async () => {
    try {
      const [coachRes, msgRes] = await Promise.all([
        api.get('/users/my-coach').catch(() => ({ data: { success: false } })),
        api.get('/users/my-messages')
      ]);
      if (coachRes.data?.success) setCoach(coachRes.data.data);
      if (msgRes.data?.success) setMessages(msgRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessagesOnly = async () => {
    try {
      const msgRes = await api.get('/users/my-messages');
      if (msgRes.data?.success) setMessages(msgRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchMessagesOnly, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post('/users/my-messages', { content: input });
      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        setInput("");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to send message";
      if (msg !== "No coach assigned") console.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!coach) {
    return (
      <div className="max-w-3xl mx-auto pb-10">
        <div className="text-center py-20 border border-dashed border-border rounded-3xl">
          <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Coach Assigned</h2>
          <p className="text-text-muted mb-6">Set a coach to start messaging and receiving daily tasks.</p>
          <Link href="/member/coaches"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg">
            Browse Coaches <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
          {coach.coachId?.name?.charAt(0) || 'C'}
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">{coach.coachId?.name || 'My Coach'}</h1>
          <p className="text-xs text-text-muted">Coach</p>
        </div>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-3xl overflow-hidden flex flex-col">
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
                      {coach.coachId?.name?.charAt(0) || 'C'}
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
            className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white p-3 rounded-xl transition-all"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
