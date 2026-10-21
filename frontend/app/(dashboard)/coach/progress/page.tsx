"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, TrendingUp, Users, Target, Activity, CheckCircle2, 
  ArrowRight, Loader2, Award, Flame, Dumbbell, Apple, Calendar, 
  ChevronDown, User, Heart, Scale, Sparkles, RefreshCw, Eye, MoveHorizontal
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from "recharts";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ThreeBodyModel } from "@/components/ui/ThreeBodyModel";

type BodyPart = 'chest' | 'waist' | 'arms' | 'thighs' | 'shoulders' | 'lats' | 'glutes';

export default function ClientProgressPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientDetailData, setClientDetailData] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Active chart metric ('weight' | 'bodyFat')
  const [chartMetric, setChartMetric] = useState<'weight' | 'bodyFat'>('weight');

  // Selected Body Part
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart>('chest');

  // 3D Rotation State
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const lastMouseXRef = useRef<number>(0);

  // 360 Auto-spin Effect
  useEffect(() => {
    let interval: any;
    if (isSpinning) {
      interval = setInterval(() => {
        setRotationAngle(prev => (prev + 3) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isSpinning]);

  // Drag to rotate handlers
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
    const fetchClients = async () => {
      try {
        const res = await api.get('/coach-dashboard/clients');
        if (res.data?.success) {
          const list = res.data.data || [];
          setClients(list);
          if (list.length > 0) {
            const firstId = list[0].clientId?._id || list[0]._id;
            setSelectedClientId(firstId);
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          console.warn("Coach dashboard access requires coach role authorization.");
        } else {
          console.error("Failed to fetch clients", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Fetch full details when a client is selected
  useEffect(() => {
    if (!selectedClientId) {
      setClientDetailData(null);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await api.get(`/coach-dashboard/clients/${selectedClientId}`);
        if (res.data?.success) {
          setClientDetailData(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to load client detailed progress");
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedClientId]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Selected client helper
  const selectedClientObj = clients.find(c => {
    const cid = c.clientId?._id || c._id;
    return cid === selectedClientId;
  });

  const selectedUser = selectedClientObj?.clientId || selectedClientObj || {};

  // Format measurement logs for chart
  const measurements = clientDetailData?.measurements || [];
  const chartData = measurements.length > 0 ? measurements.map((m: any) => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight,
    bodyFat: m.bodyFat || 18,
    chest: m.chest || 98,
    waist: m.waist || 82,
    arms: m.arms || 36,
    thighs: m.thighs || 56
  })).reverse() : [
    { date: "Week 1", weight: 72, bodyFat: 21, chest: 102, waist: 86, arms: 38, thighs: 58 },
    { date: "Week 2", weight: 71, bodyFat: 20, chest: 101, waist: 85, arms: 37, thighs: 57 },
    { date: "Week 3", weight: 70, bodyFat: 19, chest: 99, waist: 83, arms: 37, thighs: 56.5 },
    { date: "Week 4", weight: 68.5, bodyFat: 18, chest: 98, waist: 82, arms: 36, thighs: 56 }
  ];

  const latestMeas = measurements[0] || { chest: 98, waist: 82, arms: 36, thighs: 56, weight: 68.5, bodyFat: 18 };

  // Is viewing back side (angle between 90° and 270°)
  const isBackView = rotationAngle > 90 && rotationAngle < 270;

  // Body part configuration mapping for 3D body HOTSPOTS
  const BODY_PARTS: Record<BodyPart, { label: string; value: string; delta: string; pos: { top: string; left: string }; side: 'front' | 'back' }> = {
    shoulders: { label: "Shoulders", value: "112 cm", delta: "-2 cm", pos: { top: "22%", left: "50%" }, side: 'front' },
    chest: { label: "Chest", value: `${latestMeas.chest || 98} cm`, delta: "-4 cm", pos: { top: "30%", left: "50%" }, side: 'front' },
    arms: { label: "Arms / Biceps", value: `${latestMeas.arms || 36} cm`, delta: "+1.5 cm", pos: { top: "38%", left: "32%" }, side: 'front' },
    waist: { label: "Waist / Core", value: `${latestMeas.waist || 82} cm`, delta: "-5 cm", pos: { top: "46%", left: "50%" }, side: 'front' },
    thighs: { label: "Thighs / Quads", value: `${latestMeas.thighs || 56} cm`, delta: "-2 cm", pos: { top: "68%", left: "44%" }, side: 'front' },
    lats: { label: "Lats / Upper Back", value: "108 cm", delta: "-3 cm", pos: { top: "32%", left: "50%" }, side: 'back' },
    glutes: { label: "Glutes / Hips", value: "96 cm", delta: "-2.5 cm", pos: { top: "54%", left: "50%" }, side: 'back' }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">
      
      {/* Header & Sleek Client Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <LineChart className="w-8 h-8 text-accent" /> Client Progress Tracker
          </h1>
          <p className="text-text-muted mt-1">Interactive weight charts & 360° rotatable 3D body measurement analytics.</p>
        </div>

        {clients.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider hidden sm:inline">Client:</span>
            <div className="relative min-w-[220px]">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full appearance-none bg-surface border border-primary/50 text-text-primary font-bold text-sm rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-primary shadow-sm cursor-pointer"
              >
                {clients.map((c) => {
                  const clientInfo = c.clientId || c;
                  const cid = clientInfo._id || c._id;
                  return (
                    <option key={cid} value={cid} className="bg-surface text-text-primary">
                      {clientInfo.name || `${clientInfo.firstName || ''} ${clientInfo.lastName || ''}`}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-primary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Sleek Horizontal Client Tabs Bar */}
      {clients.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {clients.map((c) => {
            const clientInfo = c.clientId || c;
            const cid = clientInfo._id || c._id;
            const isSelected = cid === selectedClientId;
            return (
              <button
                key={cid}
                onClick={() => setSelectedClientId(cid)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-surface text-text-muted border-border hover:border-primary/40 hover:text-text-primary'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  isSelected ? 'bg-white text-primary' : 'bg-primary/20 text-primary'
                }`}>
                  {clientInfo.name?.charAt(0) || 'C'}
                </div>
                <span>{clientInfo.name || `${clientInfo.firstName || ''} ${clientInfo.lastName || ''}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* FULL DETAILED ANALYTICS FOR SELECTED CLIENT */}
      {loadingDetail ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <motion.div key={selectedClientId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Selected Client Profile Header Card */}
          <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {selectedUser.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedUser.name || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`}</h2>
                <p className="text-xs text-text-muted">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Goal Adherence: 92%
                  </span>
                  <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                    Status: Active
                  </span>
                </div>
              </div>
            </div>

            <Link href={`/coach/clients/${selectedClientId}`}>
              <button className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2">
                <User className="w-4 h-4" /> Full Profile & Programs
              </button>
            </Link>
          </div>

          {/* MAIN SECTION: PROGRESS TREND CHART + 3D ROTATABLE HUMAN BODY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT 2 COLUMNS: RECHARTS INTERACTIVE TREND CHART */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-surface border border-border rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-display font-bold flex items-center gap-2">
                      <Scale className="text-primary w-5 h-5" /> Weight & Body Analytics Chart
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">Interactive transformation trend curve over time.</p>
                  </div>

                  <div className="flex bg-background border border-border rounded-xl p-1">
                    <button 
                      onClick={() => setChartMetric('weight')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMetric === 'weight' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      Weight (kg)
                    </button>
                    <button 
                      onClick={() => setChartMetric('bodyFat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMetric === 'bodyFat' ? 'bg-surface text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                    >
                      Body Fat (%)
                    </button>
                  </div>
                </div>

                {/* Recharts Chart Canvas */}
                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-surface)', 
                          border: '1px solid var(--color-border)', 
                          borderRadius: '16px', 
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' 
                        }}
                        itemStyle={{ color: chartMetric === 'weight' ? '#6C63FF' : '#00F5A0', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={chartMetric} 
                        stroke={chartMetric === 'weight' ? '#6C63FF' : '#00F5A0'} 
                        strokeWidth={4}
                        dot={{ fill: 'var(--color-surface)', strokeWidth: 3, r: 6, stroke: chartMetric === 'weight' ? '#6C63FF' : '#00F5A0' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        animationDuration={1200}
                      />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Metrics Cards Below Chart */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Chest", val: latestMeas.chest ? `${latestMeas.chest} cm` : "98 cm", part: 'chest' as BodyPart },
                  { label: "Arms", val: latestMeas.arms ? `${latestMeas.arms} cm` : "36 cm", part: 'arms' as BodyPart },
                  { label: "Waist", val: latestMeas.waist ? `${latestMeas.waist} cm` : "82 cm", part: 'waist' as BodyPart },
                  { label: "Thighs", val: latestMeas.thighs ? `${latestMeas.thighs} cm` : "56 cm", part: 'thighs' as BodyPart }
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setSelectedBodyPart(item.part)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedBodyPart === item.part
                        ? 'bg-primary/10 border-primary shadow-md'
                        : 'bg-surface border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">{item.label}</span>
                    <span className="text-lg font-mono font-bold text-text-primary block mt-0.5">{item.val}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT 1 COLUMN: 360° ROTATABLE 3D HUMAN BODY MEASUREMENT MAP */}
            <div className="lg:col-span-1 bg-surface border border-border p-6 rounded-3xl flex flex-col items-center justify-between space-y-5 relative overflow-hidden shadow-sm">
              <div className="w-full flex items-center justify-between">
                <h3 className="font-display font-bold text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" /> 3D Rotatable Body Map
                </h3>
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20 flex items-center gap-1">
                  <MoveHorizontal className="w-3 h-3" /> Drag to Rotate
                </span>
              </div>

              {/* Three.js WebGL 3D Perspective Viewport */}
              <div className="relative w-full h-80 flex items-center justify-center bg-background/50 border border-border rounded-3xl p-2 select-none overflow-hidden">
                {/* 3D Grid Glow Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#6C63FF_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

                {/* Real-time Three.js WebGL Canvas Component */}
                <ThreeBodyModel 
                  selectedPart={selectedBodyPart}
                  onSelectPart={(part) => setSelectedBodyPart(part as BodyPart)}
                  rotationAngle={rotationAngle}
                  onAngleChange={(deg) => setRotationAngle(deg)}
                  isSpinning={isSpinning}
                />
              </div>

              {/* 3D Rotation Preset Controls & Slider */}
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-text-muted">
                  <span>3D Angle: {Math.round(rotationAngle)}°</span>
                  <button 
                    onClick={() => setIsSpinning(!isSpinning)}
                    className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all ${
                      isSpinning ? 'bg-accent text-white border-accent' : 'bg-background text-text-muted border-border hover:text-primary'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSpinning ? 'animate-spin' : ''}`} /> {isSpinning ? 'Spinning...' : '360° Spin'}
                  </button>
                </div>

                {/* View Angle Preset Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { setRotationAngle(0); setIsSpinning(false); }}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      rotationAngle === 0 ? 'bg-primary text-white border-primary' : 'bg-background text-text-muted border-border hover:border-primary/40'
                    }`}
                  >
                    Front View
                  </button>
                  <button
                    onClick={() => { setRotationAngle(90); setIsSpinning(false); }}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      rotationAngle === 90 ? 'bg-primary text-white border-primary' : 'bg-background text-text-muted border-border hover:border-primary/40'
                    }`}
                  >
                    Side Profile
                  </button>
                  <button
                    onClick={() => { setRotationAngle(180); setIsSpinning(false); }}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      rotationAngle === 180 ? 'bg-primary text-white border-primary' : 'bg-background text-text-muted border-border hover:border-primary/40'
                    }`}
                  >
                    Back View
                  </button>
                </div>

                {/* Manual Rotation Slider */}
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotationAngle}
                  onChange={(e) => { setRotationAngle(Number(e.target.value)); setIsSpinning(false); }}
                  className="w-full accent-primary cursor-pointer h-1.5 bg-background border border-border rounded-lg"
                />
              </div>

              {/* Telemetry Card */}
              <div className="w-full bg-background border border-border rounded-2xl p-4 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Selected Zone</span>
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                    {BODY_PARTS[selectedBodyPart]?.delta || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-sm text-text-primary">{BODY_PARTS[selectedBodyPart]?.label || 'Chest'}</h4>
                  <span className="font-mono font-bold text-lg text-primary">{BODY_PARTS[selectedBodyPart]?.value || '-'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Workout & Log History Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Body Measurements Log Table
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {measurements.map((m: any, idx: number) => (
                  <div key={m._id || idx} className="bg-background border border-border rounded-2xl p-4 text-sm space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-text-muted">
                      <span>{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-accent font-mono font-bold text-sm">{m.weight} kg</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1 border-t border-border/50">
                      <div className="bg-surface p-1.5 rounded-lg border border-border/50">
                        <span className="text-[10px] text-text-muted block uppercase">Chest</span>
                        <span>{m.chest || '-'} cm</span>
                      </div>
                      <div className="bg-surface p-1.5 rounded-lg border border-border/50">
                        <span className="text-[10px] text-text-muted block uppercase">Waist</span>
                        <span>{m.waist || '-'} cm</span>
                      </div>
                      <div className="bg-surface p-1.5 rounded-lg border border-border/50">
                        <span className="text-[10px] text-text-muted block uppercase">Arms</span>
                        <span>{m.arms || '-'} cm</span>
                      </div>
                      <div className="bg-surface p-1.5 rounded-lg border border-border/50">
                        <span className="text-[10px] text-text-muted block uppercase">Thighs</span>
                        <span>{m.thighs || '-'} cm</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-border p-6 rounded-3xl space-y-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" /> Recent Workout Activity Logs
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {clientDetailData?.workoutLogs?.map((log: any, idx: number) => (
                  <div key={log._id || idx} className="bg-background border border-border rounded-2xl p-4 text-sm flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{log.programId?.name || 'Workout Session'}</p>
                      <p className="text-xs text-text-muted">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                        {log.completionPercent || 100}% Completed
                      </span>
                      {log.totalDuration && <p className="text-[10px] text-text-muted mt-1">{log.totalDuration} min • {log.caloriesBurned || 0} cal</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </motion.div>
      )}

    </div>
  );
}
