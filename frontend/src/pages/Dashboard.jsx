import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserPlus, CheckCircle, Clock, 
  Search, Bell, Settings, LogOut, FileText, BarChart3, Plus, Target, Inbox, Mail, Copy,
  X, ExternalLink, ChevronRight, Filter, SortDesc, TrendingUp, BrainCircuit, AlertCircle, Briefcase, Loader2,
  Building, LayoutDashboard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import CreateJobModal from '../components/CreateJobModal';
import UploadResumeModal from '../components/UploadResumeModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isJobModalOpen, setJobModalOpen] = useState(false);
  const [isResumeModalOpen, setResumeModalOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Queries
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['myJobs'],
    queryFn: () => api.get('/my-jobs').then(res => res.data)
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['candidates', activeJobId],
    queryFn: () => {
      const url = activeJobId ? `/candidates?job_id=${activeJobId}` : '/candidates';
      return api.get(url).then(res => res.data);
    }
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/analytics/summary').then(res => res.data),
    enabled: activeTab === 'analytics'
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ candidateId, status }) => 
      api.patch(`/candidates/${candidateId}/status?status=${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      addToast('Candidate moved', 'success');
    }
  });

  const sendInviteMutation = useMutation({
    mutationFn: ({ candidateId, jobId }) =>
      api.post('/interviews/invite', {
        candidate_id: candidateId,
        job_id: jobId,
        difficulty: 'medium',
        total_questions: 6
      }),
    onSuccess: () => addToast('Interview invite sent!', 'success'),
    onError: (err) => addToast(err?.response?.data?.detail || 'Failed to send invite', 'error')
  });

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    return candidates.filter(c => 
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [candidates, searchQuery]);

  const pipeline = useMemo(() => {
    const grouped = { new: [], screening: [], interview: [], interviewed: [], hired: [] };
    filteredCandidates.forEach(c => {
      if (grouped[c.status] !== undefined) grouped[c.status].push(c);
    });
    return grouped;
  }, [filteredCandidates]);

  // Drag & Drop
  const handleDragStart = (e, candidateId) => e.dataTransfer.setData('candidateId', candidateId);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, status) => {
    const candidateId = e.dataTransfer.getData('candidateId');
    if (candidateId) updateStatusMutation.mutate({ candidateId, status });
  };

  const copyApplyLink = async (jobId) => {
    const link = `${window.location.origin}/apply/${jobId}`;
    try {
      await navigator.clipboard.writeText(link);
      addToast('Apply link copied', 'success');
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 flex overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-2xl flex flex-col hidden lg:flex relative z-30">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <span className="font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">HireFlow AI</span>
          </Link>
        </div>
        
        <nav className="p-4 flex-1 space-y-2">
          <NavItem icon={<Inbox className="w-4 h-4" />} label="Pipeline" active={activeTab === 'pipeline'} onClick={() => setActiveTab('pipeline')} />
          <NavItem icon={<BarChart3 className="w-4 h-4" />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<FileText className="w-4 h-4" />} label="My Jobs" />
          <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => navigate('/settings')} />
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.company_name || 'Personal Account'}</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-rose-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative h-screen">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-[#020617]/50 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all text-white"
              />
            </div>
            
            <div className="flex items-center gap-2 text-slate-300">
              <Filter className="w-4 h-4" />
              <select 
                value={activeJobId} 
                onChange={e => setActiveJobId(e.target.value)}
                className="bg-transparent text-sm focus:outline-none cursor-pointer hover:text-white appearance-none"
              >
                <option value="" className="bg-[#0F172A]">All Job Roles</option>
                {jobs?.map(job => (
                  <option key={job._id} value={job._id} className="bg-[#0F172A]">{job.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setJobModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded-lg transition-all">
              <Plus className="w-3.5 h-3.5" /> New Job
            </button>
            <button onClick={() => setResumeModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-indigo-600/20">
              <UserPlus className="w-3.5 h-3.5" /> Add Candidate
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto custom-scrollbar relative">
          <div className="p-8 max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'pipeline' ? (
                <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                  {/* Pipeline Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Total Candidates" value={candidates?.length || 0} icon={<Users className="w-4 h-4" />} color="indigo" />
                    <StatCard title="Interviewed" value={pipeline.interviewed.length} icon={<BrainCircuit className="w-4 h-4" />} color="purple" />
                    <StatCard title="Average Match" value={analytics?.avg_match_score ? `${analytics.avg_match_score}%` : 'N/A'} icon={<TrendingUp className="w-4 h-4" />} color="emerald" />
                    <StatCard title="Active Jobs" value={jobs?.length || 0} icon={<Briefcase className="w-4 h-4" />} color="amber" />
                  </div>

                  {/* Public Links Banner */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-indigo-400" /> Public Application Links
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Share these to receive resumes</p>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {jobs?.length > 0 ? jobs.map(job => (
                        <div key={job._id} className="flex-shrink-0 flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer group" onClick={() => copyApplyLink(job._id)}>
                          <span className="text-xs font-medium text-slate-300">{job.title}</span>
                          <Copy className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                        </div>
                      )) : <p className="text-xs text-slate-500 italic">No active jobs to show links for.</p>}
                    </div>
                  </div>

                  {/* Kanban Board */}
                  {candidatesLoading ? (
                    <div className="flex gap-6 overflow-x-auto pb-4">
                      {[1, 2, 3, 4, 5].map(i => <KanbanSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] custom-scrollbar">
                      <KanbanCol title="New Applied" status="new" items={pipeline.new} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onSelect={setSelectedCandidate} onInvite={(c) => sendInviteMutation.mutate({ candidateId: c._id, jobId: c.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanCol title="Screening" status="screening" items={pipeline.screening} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onSelect={setSelectedCandidate} onInvite={(c) => sendInviteMutation.mutate({ candidateId: c._id, jobId: c.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanCol title="Interview" status="interview" items={pipeline.interview} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onSelect={setSelectedCandidate} onInvite={(c) => sendInviteMutation.mutate({ candidateId: c._id, jobId: c.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanCol title="Interviewed" status="interviewed" items={pipeline.interviewed} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onSelect={setSelectedCandidate} onInvite={(c) => sendInviteMutation.mutate({ candidateId: c._id, jobId: c.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanCol title="Hired" status="hired" items={pipeline.hired} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onSelect={setSelectedCandidate} onInvite={(c) => sendInviteMutation.mutate({ candidateId: c._id, jobId: c.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Funnel Chart */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" /> Pipeline conversion
                      </h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Applied', value: pipeline.new.length },
                            { name: 'Screening', value: pipeline.screening.length },
                            { name: 'Interview', value: pipeline.interview.length },
                            { name: 'Interviewed', value: pipeline.interviewed.length },
                            { name: 'Hired', value: pipeline.hired.length }
                          ]}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                              {[0,1,2,3,4].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#6366f1', '#818cf8', '#a78bfa', '#c084fc', '#10b981'][index]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Match Score Area Chart */}
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" /> Top Talent Ranking
                      </h3>
                      <div className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.top_candidates || []}>
                              <defs>
                                <linearGradient id="colorMatch" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" hide />
                              <YAxis domain={[0, 100]} hide />
                              <Tooltip content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-[#0F172A] border border-white/10 p-3 rounded-xl shadow-2xl">
                                      <p className="text-xs font-bold text-white">{payload[0].payload.name}</p>
                                      <p className="text-xs text-indigo-400 font-black mt-1">Match: {payload[0].value}%</p>
                                    </div>
                                  );
                                }
                                return null;
                              }} />
                              <Area type="monotone" dataKey="match_score" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorMatch)" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Modals & Drawer */}
      <CreateJobModal isOpen={isJobModalOpen} onClose={() => setJobModalOpen(false)} />
      <UploadResumeModal isOpen={isResumeModalOpen} onClose={() => setResumeModalOpen(false)} />
      
      <AnimatePresence>
        {selectedCandidate && (
          <CandidateDrawer 
            candidate={selectedCandidate} 
            onClose={() => setSelectedCandidate(null)} 
            onInvite={(c) => sendInviteMutation.mutate({ candidateId: c._id, jobId: c.applied_job_id })}
            inviteLoading={sendInviteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}>
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="nav-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
    </button>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
      <div className={`absolute top-4 right-4 p-2 rounded-lg ${colors[color] || colors.indigo} border`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-white mt-2 tracking-tight">{value}</p>
    </div>
  );
}

function KanbanCol({ title, status, items, onDragStart, onDrop, onDragOver, onSelect, onInvite, inviteLoading }) {
  return (
    <div className="flex flex-col w-[320px] flex-shrink-0" onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          {title} <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">{items.length}</span>
        </h3>
      </div>
      <div className="flex-1 space-y-3 min-h-[500px]">
        {items.map(c => (
          <CandidateCard key={c._id} candidate={c} onDragStart={onDragStart} onClick={() => onSelect(c)} onInvite={onInvite} inviteLoading={inviteLoading} />
        ))}
        {items.length === 0 && (
          <div className="h-24 rounded-2xl border border-white/5 border-dashed flex items-center justify-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Empty Stage</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, onDragStart, onClick, onInvite, inviteLoading }) {
  const { name = 'Unknown', match_score, ai_insights } = candidate;
  const color = match_score >= 80 ? 'emerald' : match_score >= 60 ? 'amber' : 'rose';
  
  return (
    <motion.div 
      layout
      draggable
      onDragStart={(e) => onDragStart(e, candidate._id)}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 cursor-pointer shadow-xl relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-xs font-bold text-white border border-white/10">
            {name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate max-w-[140px]">{name}</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-bold">
              Applied: {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>
        {match_score !== null && (
          <div className={`px-2 py-1 rounded-lg border text-[10px] font-black ${
            color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
            color === 'amber' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
            'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {match_score}%
          </div>
        )}
      </div>

      {ai_insights ? (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">"{ai_insights.summary}"</p>
          <div className="flex gap-1.5 flex-wrap">
            {ai_insights.missing_points?.slice(0, 2).map((s, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold truncate max-w-[80px]">{s}</span>
            ))}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onInvite(candidate); }}
            disabled={inviteLoading}
            className="w-full py-2 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Mail className="w-3 h-3" /> {inviteLoading ? 'Sending...' : 'Send Interview'}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Analyzing...</span>
        </div>
      )}
    </motion.div>
  );
}

function CandidateDrawer({ candidate, onClose, onInvite, inviteLoading }) {
  const name = candidate?.name || 'Unknown Candidate';
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
      <motion.div 
        initial={{ x: '100%' }} 
        animate={{ x: 0 }} 
        exit={{ x: '100%' }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full max-w-xl bg-[#0F172A] border-l border-white/10 z-[70] shadow-2xl overflow-y-auto custom-scrollbar"
      >
        <div className="p-8">
          <header className="flex items-center justify-between mb-8">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <div className="flex gap-3">
              <button onClick={() => onInvite(candidate)} disabled={inviteLoading} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20">
                <Mail className="w-4 h-4" /> {inviteLoading ? 'Sending...' : 'Send AI Interview'}
              </button>
            </div>
          </header>

          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white">{name}</h2>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {candidate?.email || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Match Score</p>
              <p className={`text-2xl font-black ${candidate?.match_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {candidate?.match_score || 0}%
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recommendation</p>
              <p className="text-sm font-bold text-white">{candidate?.ai_insights?.recommendation_label || 'Processing'}</p>
            </div>
          </div>

          <section className="space-y-8">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">AI Analysis Summary</h3>
              <p className="text-slate-300 leading-relaxed text-sm bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-2xl italic">
                "{candidate?.ai_insights?.summary || 'No summary available.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">Key Strengths</h3>
                <ul className="space-y-3">
                  {candidate?.ai_insights?.good_points?.map((p, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-300 leading-tight">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-rose-400 mb-4">Missing Skills</h3>
                <ul className="space-y-3">
                  {candidate?.ai_insights?.missing_points?.map((p, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-300 leading-tight">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-4">Recommended Questions</h3>
              <div className="space-y-3">
                {candidate?.ai_insights?.interview_questions?.map((q, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </>
  );
}

function KanbanSkeleton() {
  return (
    <div className="w-[320px] flex-shrink-0 animate-pulse">
      <div className="h-4 w-24 bg-white/5 rounded mb-4" />
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5" />)}
      </div>
    </div>
  );
}
