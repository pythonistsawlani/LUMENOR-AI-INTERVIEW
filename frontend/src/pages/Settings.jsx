import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building, Shield, Bell, Trash2, 
  Save, Loader2, Key, CheckCircle2, AlertCircle 
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';

export default function Settings() {
  const { user, updateProfileState, refreshProfile } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', company_name: '' });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        company_name: user.company_name || '',
        website: user.website || '',
        company_description: user.company_description || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/profile', profileForm);
      updateProfileState(data);
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return addToast('Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      addToast('Password changed successfully', 'success');
    } catch (err) {
      addToast(err?.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    { id: 'company', label: 'Company Info', icon: <Building className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-black mb-2">Account Settings</h1>
          <p className="text-slate-400">Manage your recruiter profile and security preferences.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
                >
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-400" /> Basic Information
                  </h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Full Name</label>
                        <input
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Email Address (Locked)</label>
                        <input
                          disabled
                          value={user?.email || ''}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === 'company' && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
                >
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-400" /> Company Profile
                  </h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Company Name</label>
                        <input
                          required
                          value={profileForm.company_name}
                          onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                          placeholder="e.g. Acme Innovations"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Company Website</label>
                        <input
                          value={profileForm.website || ''}
                          onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                          placeholder="https://acme.inc"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Company Description</label>
                      <textarea
                        value={profileForm.company_description || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, company_description: e.target.value })}
                        placeholder="Tell candidates about your company culture and mission..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 transition-all min-h-[100px] resize-none"
                      />
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        Company info is displayed on public job application pages.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Update Company Info
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8"
                >
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" /> Change Password
                  </h3>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-400">Current Password</label>
                      <input
                        required
                        type="password"
                        value={passwordForm.old_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">New Password</label>
                        <input
                          required
                          type="password"
                          minLength={6}
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400">Confirm New Password</label>
                        <input
                          required
                          type="password"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                      Change Password
                    </button>
                  </form>

                  <div className="mt-12 pt-8 border-t border-white/5">
                    <h4 className="text-rose-400 font-bold mb-4 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Danger Zone
                    </h4>
                    <p className="text-sm text-slate-400 mb-6">Once you delete your account, there is no going back. Please be certain.</p>
                    <button className="px-6 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all font-medium">
                      Delete My Account
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
