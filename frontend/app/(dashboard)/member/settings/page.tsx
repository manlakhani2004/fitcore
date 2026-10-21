"use client";

import { useState } from "react";
import { Lock, Download, Trash2, Shield, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { logout } = useAuthStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('security');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error("New passwords don't match");
    }
    
    try {
      const res = await api.put('/users/password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      if (res.data.success) {
        toast.success("Password updated successfully");
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update password");
    }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/users/export-data');
      if (res.data.success) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "fitcore_data_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("Data exported successfully");
      }
    } catch (err) {
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you absolutely sure? This action cannot be undone and will delete all your data permanently.")) {
      try {
        const res = await api.delete('/users/account');
        if (res.data.success) {
          toast.success("Account deleted");
          logout();
          router.push('/login');
        }
      } catch (err) {
        toast.error("Failed to delete account");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Account Settings</h1>
        <p className="text-text-muted mt-2">Manage your security and data preferences.</p>
      </div>

      <div className="bg-surface border border-border rounded-3xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Sidebar */}
        <div className="md:w-64 bg-background border-r border-border p-6 space-y-2">
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'security' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface hover:text-primary'}`}
          >
            <Shield className="w-5 h-5" /> Security
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'privacy' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface hover:text-primary'}`}
          >
            <Lock className="w-5 h-5" /> Data & Privacy
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          
          {activeTab === 'security' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold mb-6">Change Password</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Current Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwords.current}
                      onChange={e => setPasswords({...passwords, current: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwords.new}
                      onChange={e => setPasswords({...passwords, new: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      required
                      value={passwords.confirm}
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-all shadow-md">
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold mb-4">Export Your Data</h2>
                <p className="text-text-muted mb-6 text-sm">
                  Download a copy of all your profile information, workout history, and diet logs in JSON format.
                </p>
                <button 
                  onClick={handleExportData}
                  className="bg-surface hover:bg-background border border-border text-text-primary px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Download className="w-5 h-5" /> Export Data
                </button>
              </div>

              <div className="pt-8 border-t border-border">
                <h2 className="text-xl font-bold mb-4 text-danger flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Danger Zone
                </h2>
                <p className="text-text-muted mb-6 text-sm">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button 
                  onClick={handleDeleteAccount}
                  className="bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/20 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" /> Delete Account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
