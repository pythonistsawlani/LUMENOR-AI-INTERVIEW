import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Cpu, BarChart3, ArrowRight, Sparkles, 
  CheckCircle, Loader2, X, Users, Target, Zap, Shield
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
  if (err?.code === 'ECONNABORTED') {
    return 'Backend is taking too long to respond. Check Render logs and MongoDB connection.';
  }

  if (err?.code === 'ERR_NETWORK' || !err?.response) {
    return 'Cannot reach backend. Check VITE_API_URL and backend CORS settings.';
  }

  return err?.response?.data?.detail || 'Authentication failed. Please try again.';
}

export default function Landing() {
  const [authMode, setAuthMode] = useState(null); // 'login' | 'signup' | null
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'login') {
        await login(form.email, form.password);
        addToast('Welcome back! Redirecting to dashboard...', 'success');
      } else {
        await register(form.name, form.email, form.password);
        addToast('Account created! Welcome to HireFlow AI.', 'success');
      }
      navigate('/dashboard');
    } catch (err) {
      addToast(getAuthErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
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
          {/* Badge */}
          <motion.div variants={ITEM} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-sm font-medium mb-8 ai-glow">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-indigo-300">Powered by Qwen2.5 · Hugging Face · FastAPI</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            variants={ITEM}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none"
          >
            Hire smarter with{' '}
            <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-500">
              Artificial Intelligence
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            variants={ITEM}
            className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed"
          >
            An AI-powered recruitment platform that automates resume screening, ranks candidates by job fit, 
            and moves talent through your pipeline — intelligently.
          </motion.p>

          {/* CTA */}
          <motion.div variants={ITEM} className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => setAuthMode('signup')}
              className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)]"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => setAuthMode('login')}
              className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-slate-300 transition-all duration-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:text-white backdrop-blur-xl"
            >
              Sign In
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div 
            variants={ITEM}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl border border-white/10 overflow-hidden max-w-3xl mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-6 px-4 bg-[#0F172A]/60 backdrop-blur-sm">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{s.value}</span>
                <span className="text-xs text-slate-400 mt-1 font-medium tracking-wide">{s.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Dashboard mockup */}
          <motion.div 
            variants={ITEM}
            className="mt-20 relative mx-auto max-w-5xl group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
            <div className="relative rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl overflow-hidden">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                </div>
                <div className="mx-auto px-4 py-0.5 rounded bg-black/40 text-xs text-slate-400 font-mono border border-white/5">
                  hireflow.ai/dashboard
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="p-5 bg-[#020617]">
                {/* Stat cards row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Candidates', val: '24', color: 'indigo' },
                    { label: 'Shortlisted', val: '11', color: 'purple' },
                    { label: 'Active Jobs', val: '5', color: 'pink' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-white/5 border border-white/5 p-4 flex flex-col">
                      <span className="text-[11px] text-slate-400 font-medium">{s.label}</span>
                      <span className={`text-2xl font-bold mt-1 text-transparent bg-clip-text bg-gradient-to-r from-${s.color}-400 to-${s.color}-600`}>{s.val}</span>
                    </div>
                  ))}
                </div>

                {/* Kanban columns */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Applied', count: 8, candidates: [
                      { name: 'Alice Chen', match: 92, color: 'emerald' },
                      { name: 'Bob Kumar', match: 81, color: 'indigo' },
                    ]},
                    { label: 'Screening', count: 5, candidates: [
                      { name: 'Carol White', match: 95, color: 'emerald' },
                    ]},
                    { label: 'Interview', count: 3, candidates: [
                      { name: 'Diana Park', match: 98, color: 'emerald' },
                    ]},
                    { label: 'Hired', count: 1, candidates: [
                      { name: 'Eric Johnson', match: 97, color: 'emerald' },
                    ]},
                  ].map((col) => (
                    <div key={col.label} className="rounded-lg bg-white/3 border border-white/5 p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{col.label}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">{col.count}</span>
                      </div>
                      <div className="space-y-1.5">
                        {col.candidates.map((c) => (
                          <div key={c.name} className="rounded-md bg-white/5 border border-white/5 p-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full bg-${c.color}-500/20 border border-${c.color}-500/30 flex items-center justify-center text-[9px] font-bold text-${c.color}-300`}>
                                {c.name.charAt(0)}
                              </div>
                              <span className="text-[10px] text-slate-300 font-medium truncate max-w-[55px]">{c.name}</span>
                            </div>
                            <div className={`text-[10px] px-1.5 py-0.5 rounded bg-${c.color}-500/10 text-${c.color}-400 font-bold border border-${c.color}-500/20`}>
                              {c.match}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ─── Features Grid ─── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Everything you need to build a world-class team
            </h2>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              One platform. AI automation at every step of your hiring workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group relative p-7 rounded-2xl bg-white/3 border border-white/8 hover:bg-white/6 hover:-translate-y-1 hover:border-white/15 transition-all duration-300 hover:shadow-[0_8px_30px_-8px_rgba(99,102,241,0.25)] backdrop-blur-sm"
              >
                <div className="inline-flex items-center justify-center p-2.5 bg-white/5 rounded-xl border border-white/10 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ─── AI Workflow Section ─── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              How the AI workflow works
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              From PDF upload to ranked candidate in under 60 seconds.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            {['Resume Upload', 'PDF Parsing', 'Skill Extraction', 'LLM Analysis', 'Match Score', 'Card Update'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-indigo-400">{i + 1}</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-2 font-medium text-center">{step}</span>
                </div>
                {i < 5 && <ArrowRight className="w-4 h-4 text-indigo-500/40 hidden md:block mt-[-20px]" />}
              </div>
            ))}
          </div>
        </div>

        {/* ─── CTA Banner ─── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative p-10 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 text-center backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5 pointer-events-none" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your hiring process?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              Join forward-thinking teams using AI to hire the top 1% of talent faster than ever.
            </p>
            <button
              onClick={() => setAuthMode('signup')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] transition-all duration-300"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </main>

      {/* ─── Auth Modal ─── */}
      <AnimatePresence>
        {authMode && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
              onClick={() => setAuthMode(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-white/8 flex items-start justify-between bg-gradient-to-br from-indigo-600/10 to-purple-600/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">H</span>
                    </div>
                    <span className="text-sm font-semibold text-white">HireFlow AI</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {authMode === 'login' ? 'Welcome back' : 'Create your account'}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {authMode === 'login' ? 'Sign in to your recruiter dashboard' : 'Start hiring smarter with AI'}
                  </p>
                </div>
                <button onClick={() => setAuthMode(null)} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 mt-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuth} className="p-6 space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Full Name</label>
                    <input
                      required type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Email Address</label>
                  <input
                    required type="email" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <input
                    required type="password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <p className="text-center text-sm text-slate-400 pt-1">
                  {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    {authMode === 'login' ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
