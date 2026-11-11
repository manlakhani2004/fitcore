"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Users, 
  Search, 
  User, 
  MessageSquare, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  ListTodo, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Dumbbell, 
  Apple, 
  Flame, 
  X, 
  Loader2, 
  TrendingUp, 
  Clock, 
  MoveHorizontal, 
  Eye, 
  Send,
  AlertCircle,
  ClipboardCheck,
  Scale
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from "recharts";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ThreeBodyModel } from "@/components/ui/ThreeBodyModel";

type BodyPart = 'chest' | 'waist' | 'arms' | 'thighs' | 'shoulders' | 'lats' | 'glutes';

function ClientsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlTab = searchParams.get('tab') || 'roster';
  const urlClient = searchParams.get('client') || '';

  const [activeTab, setActiveTab] = useState<'roster' | 'tasks' | 'progress' | 'checkins'>((urlTab as any) || 'roster');
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync tab with URL
  useEffect(() => {
    if (urlTab && ['roster', 'tasks', 'progress', 'checkins'].includes(urlTab)) {
      setActiveTab(urlTab as any);
    }
  }, [urlTab]);

  // Fetch Clients
  const fetchClients = async () => {
    try {
      const res = await api.get('/coach-dashboard/clients');
      if (res.data.success) {
        setClients(res.data.data || []);
      }
    } catch (err: any) {
      if (err?.response?.status !== 401 && err?.response?.status !== 403) {
        toast.error("Failed to fetch clients");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // ==========================================
  // TAB 2: TASKS STATE & ACTIONS
  // ==========================================
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskClient, setSelectedTaskClient] = useState<string>(urlClient || "");
  const [selectedTaskDate, setSelectedTaskDate] = useState<string>("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    clientId: "",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "general"
  });

  const fetchTasks = async () => {
    try {
      let url = '/tasks/coach?';
      if (selectedTaskClient) url += `clientId=${selectedTaskClient}&`;
      if (selectedTaskDate) url += `date=${selectedTaskDate}&`;

      const res = await api.get(url);
      if (res.data.success) setTasks(res.data.data);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    if (activeTab === 'tasks') {
      fetchTasks();
    }
  }, [activeTab, selectedTaskClient, selectedTaskDate]);

  useEffect(() => {
    if (clients.length > 0 && !taskForm.clientId) {
      setTaskForm(prev => ({ ...prev, clientId: clients[0].clientId?._id || clients[0]._id }));
    }
  }, [clients]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.clientId || !taskForm.title.trim()) {
      toast.error("Please select a client and enter task title");
      return;
    }
    setIsSubmittingTask(true);
    try {
      const res = await api.post('/tasks/coach', taskForm);
      if (res.data.success) {
        toast.success("Task assigned to athlete!");
        setIsTaskModalOpen(false);
        setTaskForm({
          clientId: clients[0]?.clientId?._id || clients[0]?._id || "",
          title: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
          type: "general"
        });
        fetchTasks();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/coach/${taskId}`);
      toast.success("Task removed");
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch {
      toast.error("Failed to delete task");
    }
  };

  // ==========================================
  // TAB 3: 3D PROGRESS & BIOMETRICS STATE
  // ==========================================
  const [selectedProgressClient, setSelectedProgressClient] = useState<string>(urlClient || "");
  const [clientDetailData, setClientDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [chartMetric, setChartMetric] = useState<'weight' | 'bodyFat'>('weight');
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>('chest');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

  useEffect(() => {
    if (clients.length > 0 && !selectedProgressClient) {
      const firstId = clients[0].clientId?._id || clients[0]._id;
      setSelectedProgressClient(firstId);
    }
  }, [clients, selectedProgressClient]);

  useEffect(() => {
    if (urlClient) {
      setSelectedProgressClient(urlClient);
      setSelectedTaskClient(urlClient);
    }
  }, [urlClient]);

  // 360 rotation handlers
  useEffect(() => {
    let interval: any;
    if (isSpinning) {
      interval = setInterval(() => {
        setRotationAngle(prev => (prev + 3) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isSpinning]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
    setIsSpinning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseXRef.current;
    lastMouseXRef.current = e.clientX;
    setRotationAngle(prev => {
      let next = (prev + deltaX * 0.8) % 360;
      return next < 0 ? next + 360 : next;
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  useEffect(() => {
    if (!selectedProgressClient || activeTab !== 'progress') return;
    const fetchClientDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await api.get(`/coach-dashboard/clients/${selectedProgressClient}`);
        if (res.data?.success) {
          setClientDetailData(res.data.data);
        }
      } catch {
        // non-fatal
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchClientDetail();
  }, [selectedProgressClient, activeTab]);

  // ==========================================
  // TAB 4: ATHLETE CHECK-INS STATE
  // ==========================================
  const [allCheckIns, setAllCheckIns] = useState<any[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState<Record<string, boolean>>({});

  const fetchAllCheckIns = async () => {
    setLoadingCheckIns(true);
    try {
      const res = await api.get('/check-ins/coach/all');
      if (res.data?.success) {
        setAllCheckIns(res.data.data || []);
      }
    } catch {
      // non-fatal
    } finally {
      setLoadingCheckIns(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'checkins') {
      fetchAllCheckIns();
    }
  }, [activeTab]);

  const handleSendFeedback = async (checkInId: string) => {
    const feedback = feedbackInputs[checkInId]?.trim();
    if (!feedback) {
      toast.error("Please enter feedback before submitting");
      return;
    }
    setSubmittingFeedback(prev => ({ ...prev, [checkInId]: true }));
    try {
      const res = await api.put(`/check-ins/${checkInId}/review`, { feedback });
      if (res.data?.success) {
        toast.success("Feedback sent to athlete! 🎯");
        fetchAllCheckIns();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [checkInId]: false }));
    }
  };

  // Filtered clients for roster
  const filteredClients = clients.filter(c => {
    const name = c.clientId?.name || c.name || "";
    const email = c.clientId?.email || c.email || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Client Management Hub</h1>
          <p className="text-text-muted mt-1 text-sm">
            Unified workspace for client rosters, daily tasks, 3D biometric tracking, and weekly check-in reviews.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 bg-surface border border-border rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'roster' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Roster & Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'tasks' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Daily Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'progress' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>3D Body & Biometrics</span>
          </button>

          <button
            onClick={() => setActiveTab('checkins')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'checkins' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Weekly Check-Ins</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CLIENT ROSTER & OVERVIEW                          */}
      {/* ========================================================= */}
      {activeTab === 'roster' && (
        <div className="bg-surface border border-border rounded-3xl overflow-hidden space-y-6 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
            <div>
              <h2 className="text-xl font-display font-bold">Active Athletes ({clients.length})</h2>
              <p className="text-xs text-text-muted">Manage assignments, open dossiers, and trigger fast coaching actions.</p>
            </div>
            
            <div className="relative w-full sm:w-72">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background/50 text-xs font-bold text-text-muted uppercase tracking-wider">
                  <th className="p-4">Athlete Name</th>
                  <th className="p-4">Current Goal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Check-In</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredClients.map((client) => {
                  const cId = client.clientId?._id || client._id;
                  const cName = client.clientId?.name || client.name || "Athlete";
                  const cEmail = client.clientId?.email || client.email || "";
                  const cAvatar = client.clientId?.avatar;

                  return (
                    <tr key={client._id} className="hover:bg-background/40 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold overflow-hidden shrink-0">
                            {cAvatar ? (
                              <img src={cAvatar} alt={cName} className="w-full h-full object-cover" />
                            ) : (
                              cName.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">{cName}</span>
                            <span className="text-xs text-text-muted">{cEmail}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-text-muted font-medium">
                        {client.currentGoal || 'General Fitness'}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          client.status === 'active' 
                            ? 'bg-accent/10 text-accent border-accent/20' 
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {client.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="p-4 text-xs text-text-muted">
                        {client.lastCheckInDate ? new Date(client.lastCheckInDate).toLocaleDateString() : 'No Check-ins'}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/coach/clients/${cId}`}>
                            <button className="px-3 py-1.5 rounded-lg bg-background hover:bg-border/60 border border-border text-xs font-bold text-text-primary transition-colors">
                              Dossier
                            </button>
                          </Link>

                          <button 
                            onClick={() => {
                              setSelectedTaskClient(cId);
                              setActiveTab('tasks');
                            }}
                            className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Daily Tasks"
                          >
                            <ListTodo className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => {
                              setSelectedProgressClient(cId);
                              setActiveTab('progress');
                            }}
                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="3D Progress"
                          >
                            <Activity className="w-4 h-4" />
                          </button>

                          <Link href={`/coach/inbox?client=${cId}`}>
                            <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Message">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-text-muted">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DAILY TASKS & ACCOUNTABILITY                      */}
      {/* ========================================================= */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <h2 className="text-xl font-display font-bold">Athlete Daily Tasks & Habits</h2>
                <p className="text-xs text-text-muted">Assign nutrition, training, recovery, and hydration tasks to clients.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:opacity-90 shadow-md shadow-primary/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign New Task</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedTaskClient}
                onChange={(e) => setSelectedTaskClient(e.target.value)}
                className="bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-primary font-medium"
              >
                <option value="">All Athletes</option>
                {clients.map(c => (
                  <option key={c._id} value={c.clientId?._id || c._id}>
                    {c.clientId?.name || c.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={selectedTaskDate}
                onChange={(e) => setSelectedTaskDate(e.target.value)}
                className="bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
              />

              {(selectedTaskClient || selectedTaskDate) && (
                <button
                  onClick={() => { setSelectedTaskClient(""); setSelectedTaskDate(""); }}
                  className="text-xs font-bold text-text-muted hover:text-text-primary underline px-2"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Tasks List */}
            {tasks.length === 0 ? (
              <div className="p-10 rounded-2xl bg-background/50 border border-border/60 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-text-muted mx-auto opacity-40" />
                <p className="text-sm font-bold text-text-primary">No Tasks Found</p>
                <p className="text-xs text-text-muted">No daily tasks matching the selected filters. Assign a task above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div 
                    key={task._id} 
                    className="p-5 rounded-2xl bg-background border border-border hover:border-primary/40 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          task.type === 'workout' ? 'bg-primary/10 text-primary border-primary/20' :
                          task.type === 'diet' ? 'bg-accent/10 text-accent border-accent/20' :
                          'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {task.type}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          task.completed ? 'bg-accent/10 text-accent' : 'bg-border text-text-muted'
                        }`}>
                          {task.completed ? '✓ Completed' : 'Pending'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-text-primary">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-text-muted">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-text-muted">
                      <span>Athlete: <strong className="text-text-primary">{task.clientId?.name || 'Athlete'}</strong></span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{new Date(task.date).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-1 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: 3D BODY & BIOMETRICS                              */}
      {/* ========================================================= */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-surface border border-border p-4 rounded-2xl">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Select Athlete:</span>
            <select
              value={selectedProgressClient}
              onChange={(e) => setSelectedProgressClient(e.target.value)}
              className="bg-background border border-border rounded-xl px-4 py-2 text-xs font-bold text-text-primary focus:outline-none focus:border-primary"
            >
              {clients.map(c => (
                <option key={c._id} value={c.clientId?._id || c._id}>
                  {c.clientId?.name || c.name} ({c.currentGoal || 'Fitness'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* 3D Visualizer Card */}
            <div className="lg:col-span-6 bg-surface border border-border rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden min-h-[500px]">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-accent" />
                    Interactive 3D Body Model
                  </h3>
                  <button
                    onClick={() => setIsSpinning(!isSpinning)}
                    className="px-3 py-1 rounded-xl bg-background border border-border text-xs font-bold hover:border-accent text-accent transition-colors"
                  >
                    {isSpinning ? 'Pause 360°' : 'Spin 360°'}
                  </button>
                </div>

                <div 
                  className="relative w-full h-[360px] bg-background/60 rounded-2xl border border-border flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <ThreeBodyModel 
                    selectedPart={selectedBodyPart}
                    onSelectPart={(part) => setSelectedBodyPart(part as BodyPart)}
                    rotationAngle={rotationAngle}
                    isSpinning={isSpinning}
                  />
                  <div className="absolute bottom-3 left-3 text-[11px] text-text-muted bg-surface/80 backdrop-blur px-2.5 py-1 rounded-lg border border-border pointer-events-none">
                    Drag to rotate · Click muscle groups
                  </div>
                </div>
              </div>

              {/* Muscle Selector Pills */}
              <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border">
                {(['chest', 'arms', 'waist', 'thighs', 'shoulders', 'lats', 'glutes'] as BodyPart[]).map(bp => (
                  <button
                    key={bp}
                    onClick={() => setSelectedBodyPart(bp)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      selectedBodyPart === bp 
                        ? 'bg-accent text-background shadow-md' 
                        : 'bg-background border border-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {bp}
                  </button>
                ))}
              </div>
            </div>

            {/* Biometric Trends & Measurements */}
            <div className="lg:col-span-6 bg-surface border border-border rounded-3xl p-6 space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                  <h3 className="font-display font-bold text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Biometrics & Weight Trend
                  </h3>
                  <div className="flex items-center gap-1.5 bg-background border border-border p-1 rounded-xl">
                    <button
                      onClick={() => setChartMetric('weight')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        chartMetric === 'weight' ? 'bg-primary text-white' : 'text-text-muted'
                      }`}
                    >
                      Weight (kg)
                    </button>
                    <button
                      onClick={() => setChartMetric('bodyFat')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        chartMetric === 'bodyFat' ? 'bg-primary text-white' : 'text-text-muted'
                      }`}
                    >
                      Body Fat %
                    </button>
                  </div>
                </div>

                {loadingDetail ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="h-64 w-full">
                    {clientDetailData?.measurements && clientDetailData.measurements.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={clientDetailData.measurements.map((m: any) => ({
                          date: new Date(m.date).toLocaleDateString(),
                          val: chartMetric === 'weight' ? m.weight : (m.bodyFat || 15)
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2230" />
                          <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                          <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: '#12141C', borderColor: '#1E2230', borderRadius: '8px' }} />
                          <Line type="monotone" dataKey="val" stroke="#6366F1" strokeWidth={2} dot={{ r: 4, fill: '#6366F1' }} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-text-muted space-y-2">
                        <Scale className="w-8 h-8 opacity-40" />
                        <p>No biometric measurements recorded for this athlete yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vitals Summary Footer */}
              <div className="p-4 rounded-2xl bg-background border border-border/80 flex items-center justify-around text-center text-xs">
                <div>
                  <span className="text-text-muted block">Latest Weight</span>
                  <span className="font-bold text-text-primary text-sm">
                    {clientDetailData?.measurements?.[0]?.weight ? `${clientDetailData.measurements[0].weight} kg` : '--'}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-border" />
                <div>
                  <span className="text-text-muted block">Workouts Logged</span>
                  <span className="font-bold text-accent text-sm">
                    {clientDetailData?.workoutLogs?.length || 0}
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-border" />
                <div>
                  <span className="text-text-muted block">Active Program</span>
                  <span className="font-bold text-primary text-sm">
                    {clientDetailData?.programs?.[0]?.name || 'Standard'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ATHLETE WEEKLY CHECK-INS                          */}
      {/* ========================================================= */}
      {activeTab === 'checkins' && (
        <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h2 className="text-xl font-display font-bold">Athlete Weekly Check-Ins & Reviews</h2>
              <p className="text-xs text-text-muted">Review submitted athlete check-ins and submit direct coach feedback.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              {allCheckIns.length} Total Check-Ins
            </span>
          </div>

          {loadingCheckIns ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : allCheckIns.length === 0 ? (
            <div className="p-12 text-center space-y-2 bg-background/50 rounded-2xl border border-border">
              <ClipboardCheck className="w-10 h-10 text-text-muted mx-auto opacity-40" />
              <p className="text-sm font-bold text-text-primary">No Check-Ins Submitted Yet</p>
              <p className="text-xs text-text-muted">When your athletes complete their weekly check-ins, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allCheckIns.map((ci) => {
                const athleteName = ci.memberId?.name || "Athlete";
                const isSubmitting = submittingFeedback[ci._id];
                const isReviewed = ci.status === 'reviewed';

                return (
                  <div key={ci._id} className="p-6 rounded-2xl bg-background border border-border space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                          {athleteName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-text-primary">{athleteName}</h4>
                          <span className="text-xs text-text-muted">
                            Submitted {new Date(ci.date || ci.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isReviewed ? 'bg-accent/10 text-accent border-accent/20' : 'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {isReviewed ? '✓ Reviewed' : 'Pending Review'}
                        </span>
                      </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-surface border border-border/80">
                        <span className="text-[11px] text-text-muted block">Fasted Weight</span>
                        <strong className="text-sm text-text-primary">{ci.weight} kg</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-surface border border-border/80">
                        <span className="text-[11px] text-text-muted block">Sleep Score</span>
                        <strong className="text-sm text-accent">{ci.sleepQuality || 4}/5 ({ci.sleepHours || 7}h)</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-surface border border-border/80">
                        <span className="text-[11px] text-text-muted block">Energy & Stress</span>
                        <strong className="text-sm text-primary">Energy {ci.energyLevel || 4}/5</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-surface border border-border/80">
                        <span className="text-[11px] text-text-muted block">Diet Adherence</span>
                        <strong className="text-sm text-text-primary">{ci.dietAdherence || '100%'}</strong>
                      </div>
                    </div>

                    {ci.notes && (
                      <div className="p-3 bg-surface border border-border/60 rounded-xl text-xs text-text-muted italic">
                        &ldquo;{ci.notes}&rdquo;
                      </div>
                    )}

                    {/* Coach Feedback Section */}
                    {ci.coachFeedback && isReviewed ? (
                      <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-1">
                        <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Coach Feedback Sent:</span>
                        <p className="text-xs text-text-primary">{ci.coachFeedback}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Type personalized coaching feedback..."
                          value={feedbackInputs[ci._id] || ""}
                          onChange={(e) => setFeedbackInputs(prev => ({ ...prev, [ci._id]: e.target.value }))}
                          className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary transition-colors"
                        />
                        <button
                          onClick={() => handleSendFeedback(ci._id)}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
                        >
                          {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Deliver Review</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Assign Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-border/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold">Assign Daily Athlete Task</h3>
                  <p className="text-xs text-text-muted">Create a goal, habit, or recovery task for your athlete.</p>
                </div>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Select Athlete</label>
                  <select
                    value={taskForm.clientId}
                    onChange={(e) => setTaskForm({ ...taskForm, clientId: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                  >
                    {clients.map(c => (
                      <option key={c._id} value={c.clientId?._id || c._id}>
                        {c.clientId?.name || c.name} ({c.currentGoal || 'Fitness'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10,000 Steps + 15 min Post-Workout Stretch"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted">Date</label>
                    <input
                      type="date"
                      value={taskForm.date}
                      onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted">Category</label>
                    <select
                      value={taskForm.type}
                      onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                    >
                      <option value="workout">Workout</option>
                      <option value="diet">Diet & Nutrition</option>
                      <option value="habit">Habit & Recovery</option>
                      <option value="general">General Check-In</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Specific notes or instructions..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTask}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Assign Task</span>
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

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}>
      <ClientsContent />
    </Suspense>
  );
}
