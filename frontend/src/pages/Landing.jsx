import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Cpu, BarChart3, ArrowRight, Sparkles, 
  CheckCircle, Loader2, X, Users, Target, Zap, Shield, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } }
};

const ITEM = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80, damping: 18 } }
};

const STATS = [
  { value: '94%', label: 'AI Accuracy' },
  { value: '10×', label: 'Faster Screening' },
  { value: '3 min', label: 'Avg. Analysis Time' },
  { value: '500+', label: 'Resumes Processed' },
];

const FEATURES = [
  {
    icon: <FileText className="h-5 w-5 text-indigo-400" />,
    title: 'Smart Resume Parsing',
    description: 'Extract skills, experience, and education instantly from any PDF using Hugging Face NLP models.',
    color: 'indigo',
  },
  {
    icon: <Cpu className="h-5 w-5 text-purple-400" />,
    title: 'AI Match Scoring',
    description: 'Rank candidates against job descriptions using Qwen2.5 LLM — no manual work required.',
    color: 'purple',
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-pink-400" />,
    title: 'Executive Analytics',
    description: 'Visualize your hiring funnel, match distributions, and candidate leaderboard in real-time.',
    color: 'pink',
  },
  {
    icon: <Zap className="h-5 w-5 text-amber-400" />,
    title: 'Drag & Drop Pipeline',
    description: 'Move candidates through screening, interview, and hired stages in a sleek Kanban board.',
    color: 'amber',
  },
  {
    icon: <Target className="h-5 w-5 text-emerald-400" />,
    title: 'Interview Questions',
    description: 'AI generates custom interview questions based on each candidate\'s skill gaps automatically.',
    color: 'emerald',
  },
  {
    icon: <Shield className="h-5 w-5 text-sky-400" />,
    title: 'Secure & Production-Ready',
    description: 'JWT auth, MongoDB Atlas, CORS hardened, and deployable on Vercel + Render in minutes.',
    color: 'sky',
  },
];

function getAuthErrorMessage(err) {
  return err?.response?.data?.detail || 'Authentication failed. Please try again.';
}

export default function Landing() {
  const [authMode, setAuthMode] = useState(null); // 'login' | 'signup' | null
  const [authStage, setAuthStage] = useState('form'); // 'form' | 'verify'
  const [form, setForm] = useState({ name: '', email: '', password: '', company_name: '', otp: '' });
  const [loading, setLoading] = useState(false);
  
  const { login, verifyLogin, register, verifySignup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleInitialAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        await login(form.email, form.password);
        addToast('OTP sent to your email', 'success');
        setAuthStage('verify');
      } else {
        await register(form.name, form.email, form.password, form.company_name);
        addToast('Signup successful! Verify your email to continue.', 'success');
        setAuthStage('verify');
      }
    } catch (err) {
      addToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        await verifyLogin(form.email, form.otp);
        addToast('Login successful!', 'success');
        navigate('/dashboard');
      } else {
        await verifySignup(form.email, form.otp);
        addToast('Email verified! You can now sign in.', 'success');
        setAuthMode('login');
        setAuthStage('form');
        setForm({ ...form, otp: '' });
      }
    } catch (err) {
      addToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (!form.email) return addToast('Please enter your email', 'error');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      addToast('Reset code sent to your email', 'success');
      setAuthStage('verify');
    } catch (err) {
      addToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!form.password) return addToast('Please enter new password', 'error');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: form.email, otp: form.otp, new_password: form.password });
      addToast('Password reset successful! Please login.', 'success');
      setAuthMode('login');
      setAuthStage('form');
      setForm({ ...form, otp: '', password: '' });
    } catch (err) {
      addToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetAuth = () => {
    setAuthMode(null);
    setAuthStage('form');
    setForm({ name: '', email: '', password: '', company_name: '', otp: '' });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* ─── Ambient background ─── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/15 rounded-full blur-[130px]" />
        <div className="absolute top-[30%] right-[-15%] w-[40vw] h-[40vw] bg-purple-600/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 left-[30%] w-[30vw] h-[30vw] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 pt-28 pb-24">
        {/* ─── Hero ─── */}
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={CONTAINER} initial="hidden" animate="visible"
        >
          <motion.div variants={ITEM} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium mb-8 ai-glow">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-300">HireFlow AI Production 2.0</span>
          </motion.div>

          <motion.h1 variants={ITEM} className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            Hire smarter with <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500">
              Artificial Intelligence
            </span>
          </motion.h1>

          <motion.p variants={ITEM} className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
            A production-grade recruitment platform with 2-step security, AI resume ranking, and automated interviews.
          </motion.p>

          <motion.div variants={ITEM} className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onClick={() => setAuthMode('signup')} className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)]">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => setAuthMode('login')} className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-slate-300 transition-all duration-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white backdrop-blur-xl">
              Sign In
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={ITEM} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl border border-white/10 overflow-hidden max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-6 px-4 bg-[#0F172A]/60 backdrop-blur-sm">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{s.value}</span>
                <span className="text-xs text-slate-400 mt-1 font-medium tracking-wide">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ─── Features Grid ─── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="group p-7 rounded-2xl bg-white/3 border border-white/8 hover:bg-white/6 hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
                <div className="inline-flex items-center justify-center p-2.5 bg-white/5 rounded-xl border border-white/10 mb-5 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* ─── Auth Modal ─── */}
      <AnimatePresence>
        {authMode && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" onClick={resetAuth} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 pb-4 border-b border-white/8 flex items-start justify-between bg-gradient-to-br from-indigo-600/10 to-purple-600/10">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {authStage === 'verify' ? 'Verification Required' : authMode === 'login' ? 'Welcome back' : 'Join HireFlow AI'}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {authStage === 'verify' ? `Enter the code sent to ${form.email}` : authMode === 'login' ? 'Sign in to manage your talent pipeline' : 'Create your secure recruiter account'}
                  </p>
                </div>
                <button onClick={resetAuth} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 mt-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {authStage === 'form' ? (
                <form onSubmit={handleInitialAuth} className="p-6 space-y-4">
                  {authMode === 'signup' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Full Name</label>
                        <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/70 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Company Name</label>
                        <input required type="text" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Acme Inc." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/70 transition-all" />
                      </div>
                    </>
                  )}
                  {authMode === 'forgot' ? (
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Registered Email</label>
                        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/70 transition-all" />
                      </div>
                      <button type="button" onClick={handleForgotPasswordRequest} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-60">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Send Reset Code
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/70 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-slate-300">Password</label>
                          {authMode === 'login' && (
                            <button type="button" onClick={() => setAuthMode('forgot')} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Forgot password?</button>
                          )}
                        </div>
                        <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" minLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/70 transition-all" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-60">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {authMode === 'login' ? 'Request Login OTP' : 'Create Account'}
                      </button>
                    </>
                  )}
                  <p className="text-center text-sm text-slate-400 pt-1">
                    {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                    <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthStage('form'); }} className="text-indigo-400 font-medium">{authMode === 'login' ? 'Sign up free' : 'Sign in'}</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={authMode === 'forgot' ? handleResetPassword : handleVerifyOTP} className="p-6 space-y-4 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-slate-300 block text-center">Enter 6-digit Code</label>
                    <input required type="text" maxLength={6} value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value })} placeholder="000000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-white focus:border-indigo-500/70 transition-all" />
                  </div>
                  {authMode === 'forgot' && (
                    <div className="space-y-1.5 text-left">
                      <label className="text-sm font-medium text-slate-300">New Password</label>
                      <input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" minLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500/70 transition-all" />
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-60">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {authMode === 'forgot' ? 'Reset Password' : 'Verify & Continue'}
                  </button>
                  <button type="button" onClick={() => setAuthStage('form')} className="text-sm text-slate-400 hover:text-white transition-colors">Go back</button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
