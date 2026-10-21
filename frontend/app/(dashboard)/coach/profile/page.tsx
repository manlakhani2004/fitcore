"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCircle, Save, Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function CoachProfileSetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");
  const [experience, setExperience] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/coaches/profile");
        if (res.data.success) {
          const p = res.data.data;
          setProfile(p);
          setBio(p.bio || "");
          setSpecializations(p.specializations || []);
          setExperience(p.experience || 0);
          setHourlyRate(p.hourlyRate || 0);
        }
      } catch (err) {
        console.error("No profile yet", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const addSpec = () => {
    const s = specInput.trim();
    if (s && !specializations.includes(s)) {
      setSpecializations([...specializations, s]);
      setSpecInput("");
    }
  };

  const removeSpec = (idx: number) => {
    setSpecializations(specializations.filter((_, i) => i !== idx));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = { bio, specializations, experience: Number(experience), hourlyRate: Number(hourlyRate) };
      if (profile) {
        await api.put("/coaches/profile", payload);
        toast.success("Profile updated!");
      } else {
        await api.post("/coaches/register", payload);
        toast.success("Coach profile created!");
      }
      setProfile({ ...(profile || {}), ...payload });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-primary" /> Coach Profile
        </h1>
        <p className="text-text-muted mt-1">{profile ? "Update your coaching profile." : "Set up your coaching profile to get started."}</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl p-8 space-y-6">
        <div>
          <label className="block text-sm font-bold text-text-muted mb-2">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Tell potential clients about yourself, your training philosophy, and what makes you unique..." />
        </div>

        <div>
          <label className="block text-sm font-bold text-text-muted mb-2">Specializations</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {specializations.map((s, i) => (
              <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-sm font-medium">
                {s} <button onClick={() => removeSpec(i)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={specInput} onChange={(e) => setSpecInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors text-sm"
              placeholder="e.g. Strength Training" />
            <button onClick={addSpec} className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2">Experience (years)</label>
            <input type="number" value={experience} onChange={(e) => setExperience(Number(e.target.value))} min={0}
              className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2">Hourly Rate (₹)</label>
            <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} min={0}
              className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <button onClick={saveProfile} disabled={isSaving}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {profile ? "Update Profile" : "Create Profile"}
        </button>
      </div>
    </div>
  );
}
