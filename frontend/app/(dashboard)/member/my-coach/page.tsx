"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  User, MessageSquare, ListTodo, Dumbbell, Apple, Video,
  Circle, CheckCircle2, Target, Send, Loader2, ArrowRight,
  Clock, Calendar as CalendarIcon
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const TABS = [
  { key: "tasks", label: "Today's Tasks", icon: ListTodo },
  { key: "program", label: "My Program", icon: Dumbbell },
  { key: "diet", label: "Diet Plan", icon: Apple },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "meetings", label: "Online Meetings", icon: Video },
];

export default function MyCoachPage() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [coach, setCoach] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [assignedProgram, setAssignedProgram] = useState<any>(null);
  const [assignedDiet, setAssignedDiet] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [coachRes, msgRes, taskRes, progRes, dietRes, apptRes] = await Promise.allSettled([
        api.get('/users/my-coach').catch(() => ({ data: { success: false } })),
        api.get('/users/my-messages').catch(() => ({ data: { success: false, data: [] } })),
        api.get(`/tasks/my?date=${today}`).catch(() => ({ data: { success: false, data: [] } })),
        api.get('/workouts/my-program').catch(() => ({ data: { success: false } })),
        api.get('/diet/my-plan').catch(() => ({ data: { success: false } })),
        api.get('/appointments/my-appointments').catch(() => ({ data: { success: false, data: [] } })),
      ]);
      if (coachRes.status === 'fulfilled' && coachRes.value.data?.success) setCoach(coachRes.value.data.data);
      if (msgRes.status === 'fulfilled' && msgRes.value.data?.success) setMessages(msgRes.value.data.data);
      if (taskRes.status === 'fulfilled' && taskRes.value.data?.success) setTasks(taskRes.value.data.data);
      if (progRes.status === 'fulfilled' && progRes.value.data?.success) setAssignedProgram(progRes.value.data.data);
      if (dietRes.status === 'fulfilled' && dietRes.value.data?.success) setAssignedDiet(dietRes.value.data.data);
      if (apptRes.status === 'fulfilled' && apptRes.value.data?.success) setAppointments(apptRes.value.data.data);
    } catch {} finally { setLoading(false); setTasksLoading(false); }
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
    fetchAll(); 
    const interval = setInterval(fetchMessagesOnly, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleTask = async (id: string) => {
    try {
      const res = await api.put(`/tasks/my/${id}`);
      if (res.data.success) setTasks(tasks.map(t => t._id === id ? res.data.data : t));
    } catch { toast.error('Failed to update'); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post('/users/my-messages', { content: msgInput });
      if (res.data.success) { setMessages([...messages, res.data.data]); setMsgInput(""); }
    } catch {} finally { setSending(false); }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!coach) {
    return (
      <div className="max-w-3xl mx-auto pb-10">
        <div className="text-center py-20 border border-dashed border-border rounded-3xl">
          <User className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Coach Assigned</h2>
          <p className="text-text-muted mb-6">Browse our coaches and set one as your coach to get started.</p>
          <Link href="/member/coaches"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg">
            Browse Coaches <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      {/* Coach Info Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-3xl p-6 md:p-8 border border-border flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
          {coach.coachId?.name?.charAt(0) || 'C'}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">{coach.coachId?.name || 'My Coach'}</h1>
          <p className="text-text-muted text-sm">Your personal coach — assigned programs, meal plans, daily tasks, and messaging all in one place.</p>
        </div>
        <Link href="/member/appointments"
          className="inline-flex items-center gap-2 bg-primary text-white hover:bg-primary-hover px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg hover:shadow-primary/30 shrink-0">
          <Video className="w-4 h-4" /> Book Online Meeting
        </Link>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-border">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === "tasks" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <ListTodo className="text-primary w-6 h-6" /> Today's Tasks
            </h3>
            {tasksLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-text-muted" /></div>
            ) : tasks.length === 0 ? (
              <p className="text-text-muted text-sm">No tasks for today. Enjoy your rest day!</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t: any) => (
                  <div key={t._id} onClick={() => toggleTask(t._id)}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      t.completed ? 'bg-accent/5' : 'bg-background hover:bg-background/80'
                    }`}>
                    <div className="mt-0.5">
                      {t.completed ? <CheckCircle2 className="w-5 h-5 text-accent" /> : <Circle className="w-5 h-5 text-text-muted hover:text-primary transition-colors" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${t.completed ? 'line-through text-text-muted' : ''}`}>{t.title}</span>
                      {t.description && <p className="text-xs text-text-muted mt-0.5">{t.description}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium self-center ${
                      t.type === 'workout' ? 'bg-primary/20 text-primary' :
                      t.type === 'diet' ? 'bg-accent/20 text-accent' :
                      t.type === 'habit' ? 'bg-warning/20 text-warning' : 'bg-border text-text-muted'
                    }`}>{t.type}</span>
                  </div>
                ))}
                <p className="text-xs text-text-muted text-center pt-2">{tasks.filter((t: any) => t.completed).length}/{tasks.length} completed</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "program" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <Dumbbell className="text-primary w-6 h-6" /> My Program
            </h3>
            {assignedProgram ? (
              <div className="space-y-4">
                <div className="bg-background rounded-xl p-5 border border-border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold">{assignedProgram.name}</h4>
                      <p className="text-sm text-text-muted mt-2">{assignedProgram.description}</p>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium whitespace-nowrap">{assignedProgram.durationWeeks} weeks</span>
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {assignedProgram.goal?.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {assignedProgram.difficulty || 'beginner'}</span>
                    {assignedProgram.coachId?.name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> by {assignedProgram.coachId.name}</span>}
                  </div>
                </div>
                {assignedProgram.schedule?.length > 0 && (
                  <div>
                    <h5 className="font-bold text-sm mb-3 text-text-muted uppercase tracking-wider">Schedule</h5>
                    <div className="space-y-2">
                      {assignedProgram.schedule.map((day: any, i: number) => (
                        <div key={i} className="bg-background rounded-xl p-4 border border-border flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{day.day || i + 1}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{day.exercise || day.name || `Day ${day.day || i + 1}`}</p>
                            {day.sets && <p className="text-xs text-text-muted">{day.sets} sets x {day.reps} reps</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <Dumbbell className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                <p className="text-text-muted">No program assigned yet.</p>
                <p className="text-xs text-text-muted mt-1">Your coach will assign a program tailored for you.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "diet" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <Apple className="text-accent w-6 h-6" /> Diet Plan
            </h3>
            {assignedDiet ? (
              <div className="space-y-4">
                <div className="bg-background rounded-xl p-5 border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold">{assignedDiet.name}</h4>
                      <p className="text-sm text-text-muted mt-1">Goal: {assignedDiet.goal?.replace('_', ' ')}</p>
                    </div>
                    <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-medium">{assignedDiet.caloriesTarget} cal/day</span>
                  </div>
                  {assignedDiet.macrosTarget && (
                    <div className="flex gap-3">
                      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex-1 text-center">
                        <span className="text-lg font-bold text-primary">{assignedDiet.macrosTarget.protein}g</span>
                        <p className="text-[10px] text-text-muted uppercase mt-1">Protein</p>
                      </div>
                      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex-1 text-center">
                        <span className="text-lg font-bold text-accent">{assignedDiet.macrosTarget.carbs}g</span>
                        <p className="text-[10px] text-text-muted uppercase mt-1">Carbs</p>
                      </div>
                      <div className="bg-surface border border-border rounded-xl px-4 py-3 flex-1 text-center">
                        <span className="text-lg font-bold text-warning">{assignedDiet.macrosTarget.fat}g</span>
                        <p className="text-[10px] text-text-muted uppercase mt-1">Fat</p>
                      </div>
                    </div>
                  )}
                </div>
                {assignedDiet.meals?.length > 0 && (
                  <div>
                    <h5 className="font-bold text-sm mb-3 text-text-muted uppercase tracking-wider">Meals</h5>
                    <div className="space-y-2">
                      {assignedDiet.meals.map((meal: any, i: number) => (
                        <div key={i} className="bg-background rounded-xl p-4 border border-border flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{meal.name}</p>
                            <p className="text-xs text-text-muted">{meal.type}</p>
                          </div>
                          <span className="text-xs font-mono font-bold">{meal.calories} cal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <Apple className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                <p className="text-text-muted">No diet plan assigned yet.</p>
                <p className="text-xs text-text-muted mt-1">Your coach will create a nutrition plan for you.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "messages" && (
          <div className="bg-surface rounded-3xl border border-border overflow-hidden flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                  <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                  <p>No messages yet. Start a conversation with your coach!</p>
                </div>
              ) : (
                messages.map((msg: any, idx: number) => {
                  const isMine = msg.senderId === user?._id || msg.senderId === user?.id;
                  return (
                    <div key={msg._id || idx} className={`flex gap-3 ${isMine ? "justify-end" : ""}`}>
                      {!isMine && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                          {coach.coachId?.name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMine ? "bg-primary text-white rounded-br-md" : "bg-background border border-border rounded-bl-md"
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
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-4 border-t border-border bg-background/50 flex gap-3">
              <input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm" />
              <button type="submit" disabled={!msgInput.trim() || sending}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white p-3 rounded-xl transition-all">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        )}

        {activeTab === "meetings" && (
          <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-xl flex items-center gap-2">
                  <Video className="text-primary w-6 h-6" /> Online Meetings & Sessions
                </h3>
                <p className="text-sm text-text-muted mt-1">View your scheduled 1-on-1 virtual sessions with {coach.coachId?.name || 'your coach'}.</p>
              </div>
              <Link href="/member/appointments" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shrink-0">
                <CalendarIcon className="w-4 h-4" /> Book New Session
              </Link>
            </div>

            <div className="space-y-4">
              {appointments.filter(a => a.coachId?._id === coach.coachId?._id || a.coachId === coach.coachId?._id || a.coachId?.name === coach.coachId?.name).length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                  <Video className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-text-muted font-medium">No online meetings scheduled with this coach.</p>
                  <p className="text-xs text-text-muted mt-1 mb-4">Book a 1-on-1 video call session to discuss your form, progress, or custom plan.</p>
                  <Link href="/member/appointments" className="inline-flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
                    Schedule a Session Now
                  </Link>
                </div>
              ) : (
                appointments.map((appt) => (
                  <div key={appt._id} className="bg-background border border-border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          appt.status === 'confirmed' ? 'bg-accent/10 text-accent border-accent/20' :
                          appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          'bg-text-muted/10 text-text-muted border-text-muted/20'
                        }`}>
                          {appt.status?.toUpperCase()}
                        </span>
                        <span className="text-xs text-text-muted font-mono">{appt.type === 'online' ? '1-on-1 Video Session' : 'In-Person Session'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-medium pt-1">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-primary" /> {appt.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {appt.startTime || appt.time}</span>
                      </div>
                    </div>

                    <div>
                      {appt.meetingLink ? (
                        <a href={appt.meetingLink} target="_blank" rel="noreferrer">
                          <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2">
                            <Video className="w-4 h-4" /> Join Video Call
                          </button>
                        </a>
                      ) : (
                        <span className="text-xs text-text-muted italic">Meeting link ready upon confirmation</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
