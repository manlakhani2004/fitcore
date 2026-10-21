"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Camera, Plus, Scale, Ruler } from "lucide-react";
import { PhotoSlider } from "@/components/ui/PhotoSlider";
import { motion } from "framer-motion";

import api from "@/lib/api";
import toast from "react-hot-toast";
import { AnimatePresence } from "framer-motion";
import { useRef } from "react";

export default function ProgressPage() {
  const [activeChart, setActiveChart] = useState<'weight' | 'bodyFat'>('weight');
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<any>({ chest: 0, arms: 0, waist: 0, thighs: 0 });
  const [photos, setPhotos] = useState<any[]>([]);
  
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [newMetrics, setNewMetrics] = useState({ weight: '', bodyFat: '', chest: '', arms: '', waist: '', thighs: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [measRes, photoRes] = await Promise.all([
          api.get('/progress/measurements'),
          api.get('/progress/photos')
        ]);
        
        if (measRes.data.success && measRes.data.data.length > 0) {
          const data = measRes.data.data;
          setMeasurements(data);
          
          // Format for chart (simplistic month grouping or just raw dates)
          const formatted = data.map((d: any) => {
            const dateObj = new Date(d.date);
            return {
              date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              weight: d.weight,
              bodyFat: d.bodyFat
            };
          }).reverse(); // Ascending order for chart
          setChartData(formatted);

          // Get latest
          const latest = data[0]; // Assuming backend sorts by date desc
          setLatestMetrics({
            chest: latest.chest || 0,
            arms: latest.arms || 0,
            waist: latest.waist || 0,
            thighs: latest.thighs || 0
          });
        }
        
        if (photoRes.data.success) {
          setPhotos(photoRes.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        weight: Number(newMetrics.weight),
        bodyFat: Number(newMetrics.bodyFat),
        chest: Number(newMetrics.chest),
        arms: Number(newMetrics.arms),
        waist: Number(newMetrics.waist),
        thighs: Number(newMetrics.thighs)
      };
      const res = await api.post('/progress/measurements', payload);
      if (res.data.success) {
        toast.success("Metrics logged successfully!");
        setIsMetricsModalOpen(false);
        // Quick reload by refetching data instead of complex local state updates for now
        window.location.reload();
      }
    } catch (err) {
      toast.error("Failed to log metrics");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    formData.append('front', e.target.files[0]);
    
    try {
      toast.loading("Uploading photo...", { id: 'photo-upload' });
      const res = await api.post('/progress/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success("Photo uploaded!", { id: 'photo-upload' });
        window.location.reload();
      }
    } catch (err) {
      toast.error("Upload failed", { id: 'photo-upload' });
    }
  };

  // Determine images for slider
  let beforeImage = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400";
  let afterImage = "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400";
  
  if (photos.length > 0) {
    // Oldest photo first
    const sortedPhotos = [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedPhotos.length === 1) {
      beforeImage = sortedPhotos[0].frontUrl || beforeImage;
      afterImage = sortedPhotos[0].frontUrl || afterImage;
    } else if (sortedPhotos.length >= 2) {
      beforeImage = sortedPhotos[0].frontUrl || beforeImage;
      afterImage = sortedPhotos[sortedPhotos.length - 1].frontUrl || afterImage;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Progress & Analytics</h1>
          <p className="text-text-muted mt-1">Visualize your transformation and log new measurements.</p>
        </div>
        <button 
          onClick={() => setIsMetricsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Log Metrics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Analytics Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface border border-border rounded-3xl p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Scale className="text-primary w-5 h-5" /> Analytics Trends
              </h2>
              <div className="flex bg-background border border-border rounded-lg p-1">
                <button 
                  onClick={() => setActiveChart('weight')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeChart === 'weight' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Weight
                </button>
                <button 
                  onClick={() => setActiveChart('bodyFat')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeChart === 'bodyFat' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                >
                  Body Fat %
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: activeChart === 'weight' ? 'var(--color-primary)' : 'var(--color-accent)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={activeChart} 
                    stroke={activeChart === 'weight' ? 'var(--color-primary)' : 'var(--color-accent)'} 
                    strokeWidth={4}
                    dot={{ fill: 'var(--color-surface)', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Chest', value: `${latestMetrics.chest} in`, icon: Ruler },
              { label: 'Arms', value: `${latestMetrics.arms} in`, icon: Ruler },
              { label: 'Waist', value: `${latestMetrics.waist} in`, icon: Ruler },
              { label: 'Thighs', value: `${latestMetrics.thighs} in`, icon: Ruler },
            ].map((metric, i) => (
              <motion.div 
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center"
              >
                <metric.icon className="w-5 h-5 text-text-muted mb-2" />
                <span className="text-xl font-mono font-bold">{metric.value}</span>
                <span className="text-xs text-text-muted uppercase">{metric.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Col: Photo Gallery & Slider */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                <Camera className="text-accent w-5 h-5" /> Visual Progress
              </h2>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Slider Component */}
            <div className="mb-6">
              <PhotoSlider 
                beforeImage={beforeImage}
                afterImage={afterImage}
              />
            </div>
            
            <p className="text-sm text-text-muted text-center">Drag the slider to compare your Day 1 photo with your most recent upload.</p>
          </div>
        </div>

      </div>

      {/* Log Metrics Modal */}
      <AnimatePresence>
        {isMetricsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMetricsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-surface border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Log New Metrics</h2>
              <form onSubmit={handleLogMetrics} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Weight (lbs/kg)</label>
                    <input required type="number" step="0.1" value={newMetrics.weight} onChange={e => setNewMetrics({...newMetrics, weight: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Body Fat (%)</label>
                    <input type="number" step="0.1" value={newMetrics.bodyFat} onChange={e => setNewMetrics({...newMetrics, bodyFat: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                </div>
                
                <h3 className="text-sm font-bold text-text-muted uppercase mt-6 mb-2">Measurements (inches/cm)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Chest</label>
                    <input type="number" step="0.1" value={newMetrics.chest} onChange={e => setNewMetrics({...newMetrics, chest: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Arms</label>
                    <input type="number" step="0.1" value={newMetrics.arms} onChange={e => setNewMetrics({...newMetrics, arms: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Waist</label>
                    <input type="number" step="0.1" value={newMetrics.waist} onChange={e => setNewMetrics({...newMetrics, waist: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Thighs</label>
                    <input type="number" step="0.1" value={newMetrics.thighs} onChange={e => setNewMetrics({...newMetrics, thighs: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2" />
                  </div>
                </div>

                <div className="flex gap-4 mt-8 pt-4">
                  <button type="button" onClick={() => setIsMetricsModalOpen(false)} className="flex-1 py-3 bg-border text-text-primary rounded-xl font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Save Metrics</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
