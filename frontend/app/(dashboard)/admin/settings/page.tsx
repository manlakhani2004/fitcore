"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Upload, Link as LinkIcon, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformName, setPlatformName] = useState("FitCore");
  const [supportEmail, setSupportEmail] = useState("support@fitcore.com");
  const [stripePK, setStripePK] = useState("");
  const [stripeSK, setStripeSK] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        if (res.data.success && res.data.data) {
          const s = res.data.data;
          setPlatformName(s.platformName || "FitCore");
          setSupportEmail(s.supportEmail || "support@fitcore.com");
          setStripePK(s.stripePublicKey || "");
          setStripeSK(s.stripeSecretKey || "");
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', {
        platformName,
        supportEmail,
        stripePublicKey: stripePK,
        stripeSecretKey: stripeSK
      });
      if (res.data.success) {
        toast.success("Settings saved successfully!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" /> Platform Settings
          </h1>
          <p className="text-text-muted mt-1">Configure global application settings and integrations.</p>
        </div>
        <button onClick={saveSettings} disabled={saving}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(108,99,255,0.4)] flex items-center gap-2 disabled:opacity-70">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-surface border border-border p-6 rounded-3xl">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Branding & Identity</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2">Platform Name</label>
              <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)}
                className="w-full max-w-md bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-background border border-border rounded-xl flex items-center justify-center font-display font-bold text-xl">
                  {platformName.slice(0, 2).toUpperCase()}
                </div>
                <button className="px-4 py-2 border border-border rounded-lg text-sm font-bold hover:bg-background transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Upload New
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-3xl">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Integrations</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Stripe Publishable Key
              </label>
              <input type="password" value={stripePK} onChange={(e) => setStripePK(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Stripe Secret Key
              </label>
              <input type="password" value={stripeSK} onChange={(e) => setStripeSK(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors font-mono text-sm" />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-3xl">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" /> Email Settings
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background" />
              <span className="font-bold">Send welcome emails to new users</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background" />
              <span className="font-bold">Send coach approval notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-background" />
              <span className="font-bold">Weekly platform analytics summary to Admin</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
