"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Apple, Activity, Edit3, Check, Target, Plus, Calendar, TrendingUp, Loader2, ListTodo, Trash2, Clock } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

const TABS = [
  { key: 'programs', label: 'Programs', icon: Dumbbell },
  { key: 'diet', label: 'Diet Plans', icon: Apple },
  { key: 'progress', label: 'Progress', icon: TrendingUp },
  { key: 'notes', label: 'Notes', icon: Edit3 },
];

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [activeTab, setActiveTab] = useState('programs');
  const [data, setData] = useState<any>(null);
  const updateData = (updater: (prev: any) => any) => setData(updater);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  // Notes
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  // Assign program form
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [programForm, setProgramForm] = useState({ name: '', description: '', goal: 'maintenance', durationWeeks: 4, difficulty: 'beginner' });

  // Assign diet form
  const [showDietForm, setShowDietForm] = useState(false);
  const [dietForm, setDietForm] = useState({ name: '', goal: 'maintenance', caloriesTarget: 2000, macrosTarget: { protein: 150, carbs: 200, fat: 60 } });

  // Macros
  const [macroTargets, setMacroTargets] = useState({ protein: 150, carbs: 200, fat: 60 });

  // Daily Tasks
  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0], type: 'general' });

  const fetchData = async () => {
    try {
      const res = await api.get(`/coach-dashboard/clients/${id}`);
      if (res.data.success) {
        setData(res.data.data);
        setNotes(res.data.data.assignment?.coachNotes || '');
        if (res.data.data.profile?.macroTargets) setMacroTargets(res.data.data.profile.macroTargets);
      }
    } catch { toast.error('Failed to load client'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const saveNotes = async () => {
    try {
      await api.put(`/coach-dashboard/clients/${id}/notes`, { coachNotes: notes });
      setEditingNotes(false);
      toast.success('Notes saved');
    } catch { toast.error('Failed to save notes'); }
  };

  const assignProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/coach-dashboard/clients/${id}/program`, programForm);
      if (res.data.success) {
        updateData(prev => ({ ...prev, programs: [res.data.data, ...(prev?.programs || [])] }));
        setShowProgramForm(false);
        setProgramForm({ name: '', description: '', goal: 'maintenance', durationWeeks: 4, difficulty: 'beginner' });
        toast.success('Program assigned!');
      }
    } catch { toast.error('Failed to assign program'); }
  };

  const assignDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(`/coach-dashboard/clients/${id}/diet-plan`, dietForm);
      if (res.data.success) {
        updateData(prev => ({ ...prev, dietPlans: [res.data.data, ...(prev?.dietPlans || [])] }));
        setShowDietForm(false);
        toast.success('Diet plan assigned!');
      }
    } catch { toast.error('Failed to assign diet plan'); }
  };

  const saveMacros = async () => {
    try {
      await api.put(`/coach-dashboard/clients/${id}/macros`, macroTargets);
      toast.success('Macros updated');
    } catch { toast.error('Failed to update macros'); }
  };

  // Daily Tasks
  const fetchTasks = async () => {
    try {
      const res = await api.get(`/tasks/coach?clientId=${id}`);
      if (res.data.success) setTasks(res.data.data);
    } catch {}
  };
  useEffect(() => { if (id) fetchTasks(); }, [id]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return toast.error('Title is required');
    try {
      const res = await api.post('/tasks/coach', { ...taskForm, clientId: id });
      if (res.data.success) {
        setTasks([res.data.data, ...tasks]);
        setShowTaskForm(false);
        setTaskForm({ title: '', description: '', date: new Date().toISOString().split('T')[0], type: 'general' });
        toast.success('Task added!');
      }
    } catch { toast.error('Failed to create task'); }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/coach/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!data) return <div className="text-center py-20 text-text-muted">Client not found</div>;

  const client = data.assignment?.clientId || {};
  const programs = data.programs || [];
  const dietPlans = data.dietPlans || [];
  const measurements = data.measurements || [];
  const workoutLogs = data.workoutLogs || [];
  const latestWeight = measurements[0]?.weight;

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-6">
        <Link href="/coach/clients" className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
      </div>

      {/* Header */}
      <div className="bg-surface border border-border p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-display font-bold text-white shadow-lg">
            {client.name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">{client.name || 'Client'}</h1>
            <p className="text-text-muted text-sm">{client.email}</p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
          {latestWeight && <span className="bg-background border border-border px-3 py-1.5 rounded-full text-sm font-medium">Latest: {latestWeight} kg</span>}
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${
            data.assignment?.status === 'active' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-warning/10 text-warning border-warning/20'
          }`}>
            {data.assignment?.status || 'active'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1.5 mb-8 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
              }`}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'programs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowProgramForm(!showProgramForm)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl transition-all font-medium">
              <Plus className="w-4 h-4" /> Assign Program
            </button>
          </div>
          {showProgramForm && (
            <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={assignProgram} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <input type="text" placeholder="Program name *" value={programForm.name}
                onChange={e => setProgramForm({ ...programForm, name: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors" />
              <textarea placeholder="Description" value={programForm.description}
                onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors resize-none" rows={2} />
              <div className="flex gap-4">
                <select value={programForm.goal} onChange={e => setProgramForm({ ...programForm, goal: e.target.value })}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors">
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="endurance">Endurance</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <select value={programForm.difficulty} onChange={e => setProgramForm({ ...programForm, difficulty: e.target.value })}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <input type="number" placeholder="Weeks" value={programForm.durationWeeks}
                  onChange={e => setProgramForm({ ...programForm, durationWeeks: Number(e.target.value) })}
                  className="w-24 bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-center" />
              </div>
              <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl transition-all font-medium">Assign</button>
            </motion.form>
          )}
          {programs.length === 0 ? (
            <div className="text-center py-16 text-text-muted border border-dashed border-border rounded-3xl">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No programs assigned yet.</p>
            </div>
          ) : (
            programs.map((p: any, i: number) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{p.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.difficulty === 'beginner' ? 'bg-accent/20 text-accent' :
                      p.difficulty === 'intermediate' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                    }`}>{p.difficulty}</span>
                  </div>
                  {p.description && <p className="text-sm text-text-muted mt-1">{p.description}</p>}
                  <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {p.durationWeeks} weeks • {p.goal?.replace('_', ' ')}
                  </p>
                </div>
              </motion.div>
            ))
          )}

          {/* Daily Tasks */}
          <div className="border-t border-border pt-8 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary" /> Daily Tasks
              </h2>
              <button onClick={() => setShowTaskForm(!showTaskForm)}
                className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-all text-sm font-medium">
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>

            {showTaskForm && (
              <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                onSubmit={createTask} className="bg-surface border border-border rounded-2xl p-5 space-y-4 mb-6">
                <input type="text" placeholder="Task title *" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors" />
                <textarea placeholder="Description (optional)" value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors resize-none" rows={2} />
                <div className="flex gap-4">
                  <input type="date" value={taskForm.date}
                    onChange={e => setTaskForm({ ...taskForm, date: e.target.value })}
                    className="bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors" />
                  <select value={taskForm.type} onChange={e => setTaskForm({ ...taskForm, type: e.target.value })}
                    className="bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors">
                    <option value="general">General</option>
                    <option value="workout">Workout</option>
                    <option value="diet">Diet</option>
                    <option value="habit">Habit</option>
                  </select>
                </div>
                <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl transition-all font-medium">Add Task</button>
              </motion.form>
            )}

            {tasks.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8 border border-dashed border-border rounded-2xl">No tasks assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t: any, i: number) => (
                  <motion.div key={t._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`bg-surface border rounded-xl p-4 flex items-start gap-3 ${t.completed ? 'border-accent/20 bg-accent/5' : 'border-border'}`}>
                    <div className={`mt-0.5 ${t.completed ? 'text-accent' : 'text-text-muted'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${t.completed ? 'border-accent bg-accent text-white' : 'border-text-muted'}`}>
                        {t.completed && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${t.completed ? 'line-through text-text-muted' : ''}`}>{t.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          t.type === 'workout' ? 'bg-primary/20 text-primary' :
                          t.type === 'diet' ? 'bg-accent/20 text-accent' :
                          t.type === 'habit' ? 'bg-warning/20 text-warning' :
                          'bg-background text-text-muted border border-border'
                        }`}>{t.type}</span>
                      </div>
                      {t.description && <p className="text-xs text-text-muted mt-0.5">{t.description}</p>}
                      <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => deleteTask(t._id)}
                      className="p-1.5 text-text-muted hover:text-danger transition-colors rounded-lg hover:bg-danger/10 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'diet' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowDietForm(!showDietForm)}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl transition-all font-medium">
              <Plus className="w-4 h-4" /> Assign Diet Plan
            </button>
          </div>
          {showDietForm && (
            <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              onSubmit={assignDietPlan} className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <input type="text" placeholder="Plan name *" value={dietForm.name}
                onChange={e => setDietForm({ ...dietForm, name: e.target.value })}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors" />
              <div className="flex gap-4">
                <select value={dietForm.goal} onChange={e => setDietForm({ ...dietForm, goal: e.target.value })}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors">
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <input type="number" placeholder="Calories" value={dietForm.caloriesTarget}
                  onChange={e => setDietForm({ ...dietForm, caloriesTarget: Number(e.target.value) })}
                  className="w-32 bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-center" />
              </div>
              <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-sm">Macro Targets</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-text-muted">Protein (g)</label>
                    <input type="number" value={dietForm.macrosTarget.protein}
                      onChange={e => setDietForm({ ...dietForm, macrosTarget: { ...dietForm.macrosTarget, protein: Number(e.target.value) } })}
                      className="w-full bg-surface border border-border px-3 py-2 rounded-lg text-sm text-center" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-text-muted">Carbs (g)</label>
                    <input type="number" value={dietForm.macrosTarget.carbs}
                      onChange={e => setDietForm({ ...dietForm, macrosTarget: { ...dietForm.macrosTarget, carbs: Number(e.target.value) } })}
                      className="w-full bg-surface border border-border px-3 py-2 rounded-lg text-sm text-center" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-text-muted">Fat (g)</label>
                    <input type="number" value={dietForm.macrosTarget.fat}
                      onChange={e => setDietForm({ ...dietForm, macrosTarget: { ...dietForm.macrosTarget, fat: Number(e.target.value) } })}
                      className="w-full bg-surface border border-border px-3 py-2 rounded-lg text-sm text-center" />
                  </div>
                </div>
              </div>
              <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl transition-all font-medium">Assign</button>
            </motion.form>
          )}
          {dietPlans.length === 0 ? (
            <div className="text-center py-16 text-text-muted border border-dashed border-border rounded-3xl">
              <Apple className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No diet plans assigned yet.</p>
            </div>
          ) : (
            dietPlans.map((p: any, i: number) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Apple className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-text-muted mt-1">{p.caloriesTarget} cal/day • {p.goal?.replace('_', ' ')}</p>
                  <p className="text-xs text-text-muted mt-1">
                    P: {p.macrosTarget?.protein}g • C: {p.macrosTarget?.carbs}g • F: {p.macrosTarget?.fat}g
                  </p>
                </div>
              </motion.div>
            ))
          )}
          {/* Macro Targets Quick Edit */}
          <div className="bg-surface border border-border rounded-2xl p-6 mt-6">
            <h3 className="font-bold flex items-center gap-2 mb-4"><Target className="w-4 h-4 text-primary" /> Macro Targets</h3>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-xs text-text-muted">Protein (g)</label>
                <input type="number" value={macroTargets.protein} onChange={e => setMacroTargets({ ...macroTargets, protein: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-center focus:outline-none focus:border-primary" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-muted">Carbs (g)</label>
                <input type="number" value={macroTargets.carbs} onChange={e => setMacroTargets({ ...macroTargets, carbs: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-center focus:outline-none focus:border-primary" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-muted">Fat (g)</label>
                <input type="number" value={macroTargets.fat} onChange={e => setMacroTargets({ ...macroTargets, fat: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-center focus:outline-none focus:border-primary" />
              </div>
            </div>
            <button onClick={saveMacros} className="bg-accent hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl transition-all font-medium">Save Macros</button>
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Measurements */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Measurements</h2>
            {measurements.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No measurements recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {measurements.map((m: any) => (
                  <div key={m._id} className="bg-background border border-border rounded-xl p-4 text-sm">
                    <div className="flex justify-between text-text-muted mb-2">
                      <span className="font-medium">{new Date(m.date).toLocaleDateString()}</span>
                      <span>{m.weight} kg</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-text-muted">
                      {m.bodyFat && <span>Body Fat: {m.bodyFat}%</span>}
                      {m.chest && <span>Chest: {m.chest} cm</span>}
                      {m.waist && <span>Waist: {m.waist} cm</span>}
                      {m.arms && <span>Arms: {m.arms} cm</span>}
                      {m.thighs && <span>Thighs: {m.thighs} cm</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workout Logs */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-accent" /> Recent Workouts</h2>
            {workoutLogs.length === 0 ? (
              <p className="text-text-muted text-sm text-center py-8">No workouts logged yet.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {workoutLogs.map((log: any) => (
                  <div key={log._id} className="bg-background border border-border rounded-xl p-4 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{new Date(log.date).toLocaleDateString()}</span>
                      <span className="text-accent">{log.completionPercent || 0}%</span>
                    </div>
                    {log.programId?.name && <p className="text-xs text-text-muted mt-1">{log.programId.name}</p>}
                    {log.totalDuration && <p className="text-xs text-text-muted mt-1">{log.totalDuration} min • {log.caloriesBurned || 0} cal</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="max-w-2xl">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2"><Edit3 className="w-5 h-5 text-primary" /> Private Notes</h2>
              <button onClick={() => editingNotes ? saveNotes() : setEditingNotes(true)}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                {editingNotes ? <><Check className="w-4 h-4" /> Save</> : <><Edit3 className="w-4 h-4" /> Edit</>}
              </button>
            </div>
            {editingNotes ? (
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full h-40 bg-background border border-border rounded-xl p-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
            ) : (
              <div className="bg-background/50 border border-border rounded-xl p-4 text-sm text-text-muted italic min-h-[100px]">
                {notes || 'No notes yet.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
