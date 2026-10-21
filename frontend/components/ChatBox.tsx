"use client";

import { useState, useEffect, useRef } from "react";
import { Send, User } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function ChatBox({ clientId }: { clientId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/coach-dashboard/clients/${clientId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch messages");
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // simple polling
    return () => clearInterval(interval);
  }, [clientId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const res = await api.post(`/coach-dashboard/clients/${clientId}/messages`, { content: input });
      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        setInput("");
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Failed to send message");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-96 bg-surface border border-border rounded-3xl overflow-hidden shadow-lg">
      <div className="bg-background border-b border-border p-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Direct Messages
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
          return (
            <div key={msg._id || i} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMine ? 'bg-primary text-white rounded-br-none' : 'bg-background border border-border rounded-bl-none text-text-primary'}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-border bg-background flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-surface border border-border rounded-full px-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm"
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          className="bg-primary hover:bg-primary-hover text-white p-2 rounded-full transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
