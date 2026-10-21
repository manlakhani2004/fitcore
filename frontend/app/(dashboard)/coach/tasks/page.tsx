"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ListTodo, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  User, 
  Users, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Dumbbell, 
  Apple, 
  Flame, 
  X, 
  Loader2,
  Filter
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

const TASK_TYPES = [
  { value: 'workout', label: 'Workout', icon: Dumbbell },
  { value: 'diet', label: 'Diet & Nutrition', icon: Apple },
  { value: 'habit', label: 'Habit & Recovery', icon: Flame },
  { value: 'general', label: 'General / Check-in', icon: Sparkles }
];

export default function CoachTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Create Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "general"
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let url = '/tasks/coach?';
      if (selectedClientId) url += `clientId=${selectedClientId}&`;
      if (selectedDate) url += `date=${selectedDate}&`;

      const [tasksRes, rosterRes] = await Promise.all([
        api.get(url),
        api.get('/coach-dashboard/clients')
      ]);

      if (tasksRes.data.success) setTasks(tasksRes.data.data);
      if (rosterRes.data.success) setClients(rosterRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load task roster");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClientId, selectedDate]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.title.trim()) {
      toast.error("Please select a client and enter a task title");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/tasks/coach', formData);
      if (res.data.success) {
        toast.success("Task assigned to client!");
        setIsModalOpen(false);
        setFormData({
          clientId: clients[0]?.clientId?._id || "",
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          type: "general"
        });
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await api.delete(`/tasks/coach/${id}`);
      if (res.data.success) {
        toast.success("Task removed");
        setTasks(prev => prev.filter(t => t._id !== id));
      }
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-primary" /> Client Task Management
          </h1>
          <p className="text-text-muted mt-1">Assign daily habits, workouts, and nutrition goals to your athletes.</p>
        </div>

        <button
          onClick={() => {
            if (clients.length > 0 && !formData.clientId) {
              setFormData(prev => ({ ...prev, clientId: clients[0]?.clientId?._id || "" }));
            }
            setIsModalOpen(true);
          }}
          disabled={clients.length === 0}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md shadow-primary/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Assign New Task
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-surface border border-border p-4 rounded-2xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Filter className="w-4 h-4 text-primary" /> Filter by:
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">All Clients</option>
          {clients.map(c => (
            <option key={c.clientId?._id} value={c.clientId?._id}>
              {c.clientId?.name || 'Unnamed Athlete'}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
        />

        {(selectedClientId || selectedDate) && (
          <button
            onClick={() => { setSelectedClientId(""); setSelectedDate(""); }}
            className="text-xs text-primary hover:underline font-bold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Task Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Loading task roster...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-dashed border-border rounded-3xl p-8">
          <ListTodo className="w-12 h-12 text-primary/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">No Tasks Found</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto mb-6">
            {clients.length === 0 
              ? "You do not have any active clients in your roster yet." 
              : "No tasks found matching your filters. Click 'Assign New Task' to set a goal for a client."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div
                key={task._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                      {task.type}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="text-text-muted hover:text-danger p-1 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base mb-1">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-text-muted mb-4 line-clamp-2">{task.description}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-text-primary">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{task.clientId?.name || 'Athlete'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {task.completed ? (
                      <span className="inline-flex items-center gap-1 text-accent font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-text-muted">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Assign Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface border border-border w-full max-w-lg rounded-3xl p-6 relative z-10 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" /> Assign Task to Athlete
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-text-muted hover:text-text-primary rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Select Athlete</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="" disabled>Choose an athlete...</option>
                    {clients.map(c => (
                      <option key={c.clientId?._id} value={c.clientId?._id}>
                        {c.clientId?.name} ({c.clientId?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Task Category</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    >
                      {TASK_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1.5">Due Date</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5km Morning Cardio or Log 150g Protein"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1.5">Description & Guidelines (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Provide specific notes, target heart rates, or instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/25 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign Task"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
