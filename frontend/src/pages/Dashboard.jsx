import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserPlus, CheckCircle, Clock, 
  Search, Bell, Settings, LogOut, FileText, BarChart3, Plus, Target, Inbox, Mail, Copy
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api';
import CreateJobModal from '../components/CreateJobModal';
import UploadResumeModal from '../components/UploadResumeModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [isJobModalOpen, setJobModalOpen] = useState(false);
  const [isResumeModalOpen, setResumeModalOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' or 'analytics'

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

  const updateStatusMutation = useMutation({
    mutationFn: ({ candidateId, status }) => 
      api.patch(`/candidates/${candidateId}/status?status=${status}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      addToast('Candidate status updated successfully');
    },
    onError: () => addToast('Failed to update status', 'error')
  });

  const sendInviteMutation = useMutation({
    mutationFn: ({ candidateId, jobId }) =>
      api.post('/interviews/invite', {
        candidate_id: candidateId,
        job_id: jobId,
        difficulty: 'medium',
        total_questions: 6,
        focus_areas: [],
        custom_instructions: ''
      }),
    onSuccess: () => addToast('Interview link generated and emailed to candidate.', 'success'),
    onError: (err) => addToast(err?.response?.data?.detail || 'Failed to send invite', 'error')
  });

  const pipeline = useMemo(() => {
    const grouped = { new: [], screening: [], interview: [], interviewed: [], hired: [] };
    if (candidates) {
      candidates.forEach(c => {
        if (grouped[c.status] !== undefined) grouped[c.status].push(c);
      });
    }
    return grouped;
  }, [candidates]);

  // Analytics Data Prep
  const funnelData = useMemo(() => [
    { name: 'Applied', value: pipeline.new.length },
    { name: 'Screening', value: pipeline.screening.length },
    { name: 'Interview', value: pipeline.interview.length },
    { name: 'Hired', value: pipeline.hired.length }
  ], [pipeline]);

  const distributionData = useMemo(() => {
    let strong = 0, moderate = 0, weak = 0, processing = 0;
    if (candidates) {
      candidates.forEach(c => {
        if (!c.ai_insights) processing++;
        else if (c.match_score >= 80) strong++;
        else if (c.match_score >= 60) moderate++;
        else weak++;
      });
    }
    return [
      { name: 'Strong Fit (80-100)', count: strong, fill: '#10b981' },
      { name: 'Moderate Fit (60-79)', count: moderate, fill: '#f59e0b' },
      { name: 'Weak Fit (<60)', count: weak, fill: '#f43f5e' },
      { name: 'Processing', count: processing, fill: '#6366f1' }
    ];
  }, [candidates]);

  const handleDragStart = (e, candidateId) => {
    e.dataTransfer.setData('candidateId', candidateId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    const candidateId = e.dataTransfer.getData('candidateId');
    if (candidateId) {
      updateStatusMutation.mutate({ candidateId, status });
    }
  };

  const copyApplyLink = async (jobId) => {
    const link = `${window.location.origin}/apply/${jobId}`;
    try {
      await navigator.clipboard.writeText(link);
      addToast('Apply link copied');
    } catch {
      addToast('Could not copy link', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden flex">
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-xl relative z-20 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all">
               <span className="text-white text-xs font-bold">H</span>
             </div>
             <span className="font-semibold tracking-tight text-white group-hover:text-indigo-400 transition-colors">HireFlow AI</span>
          </Link>
        </div>
        
        <nav className="p-4 flex-1 space-y-1">
          <NavItem icon={<Users />} label="Pipeline" active={activeTab === 'pipeline'} onClick={() => setActiveTab('pipeline')} />
          <NavItem icon={<BarChart3 />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={<FileText />} label="Job Posts" />
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <NavItem icon={<Settings />} label="Settings" />
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white mt-1">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/10 bg-[#0F172A]/50 backdrop-blur-xl">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search candidates or jobs..." 
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            
            <select 
              value={activeJobId} 
              onChange={e => setActiveJobId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer transition-colors hover:bg-white/10"
            >
              <option value="" className="bg-[#0F172A]">All Jobs</option>
              {jobs?.map(job => (
                <option key={job._id} value={job._id} className="bg-[#0F172A]">{job.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{user?.name}</span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-0.5">
                <div className="w-full h-full rounded-full border-2 border-[#0F172A] bg-indigo-900 flex items-center justify-center shadow-inner">
                  <span className="text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {activeTab === 'pipeline' ? 'Hiring Pipeline' : 'Executive Analytics'}
              </h1>
              <div className="flex gap-3">
                <button 
                  onClick={() => setJobModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" /> Create Job
                </button>
                <button 
                  onClick={() => setResumeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                >
                  <UserPlus className="h-4 w-4" /> Upload Candidate
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'pipeline' ? (
                <motion.div 
                  key="pipeline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Candidates" value={candidates?.length || 0} icon={<Users className="h-5 w-5 text-indigo-400" />} />
                    <StatCard title="Shortlisted" value={pipeline.screening.length + pipeline.interview.length} icon={<CheckCircle className="h-5 w-5 text-purple-400" />} />
                    <StatCard title="Active Jobs" value={jobs?.length || 0} icon={<Clock className="h-5 w-5 text-pink-400" />} />
                  </div>

                  <div className="rounded-2xl bg-[#0F172A]/70 border border-white/10 p-5">
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Company Apply Pages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {jobs?.map((job) => (
                        <div key={job._id} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white font-medium">{job.title}</p>
                            <p className="text-xs text-slate-400">Public apply page for this role</p>
                          </div>
                          <button onClick={() => copyApplyLink(job._id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-200">
                            <Copy className="w-3.5 h-3.5" /> Copy Link
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {candidatesLoading ? (
                    <div className="flex gap-6 overflow-x-auto pb-4 pt-4">
                      {[1, 2, 3, 4].map(i => <KanbanSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div className="flex gap-6 overflow-x-auto pb-4 pt-4 custom-scrollbar min-h-[600px]">
                      <KanbanColumn title="New Applied" status="new" items={pipeline.new} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onInvite={(candidate) => sendInviteMutation.mutate({ candidateId: candidate._id, jobId: candidate.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanColumn title="Screening" status="screening" items={pipeline.screening} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onInvite={(candidate) => sendInviteMutation.mutate({ candidateId: candidate._id, jobId: candidate.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanColumn title="Interview" status="interview" items={pipeline.interview} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onInvite={(candidate) => sendInviteMutation.mutate({ candidateId: candidate._id, jobId: candidate.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanColumn title="Interviewed ✓" status="interviewed" items={pipeline.interviewed} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onInvite={(candidate) => sendInviteMutation.mutate({ candidateId: candidate._id, jobId: candidate.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                      <KanbanColumn title="Hired" status="hired" items={pipeline.hired} onDragStart={handleDragStart} onDrop={handleDrop} onDragOver={handleDragOver} onInvite={(candidate) => sendInviteMutation.mutate({ candidateId: candidate._id, jobId: candidate.applied_job_id })} inviteLoading={sendInviteMutation.isPending} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-white/10 backdrop-blur-xl">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-400" /> Hiring Funnel
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {funnelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#6366f1', '#a855f7', '#ec4899', '#10b981'][index]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#0F172A]/80 border border-white/10 backdrop-blur-xl">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-400" /> Match Score Distribution
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distributionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <CreateJobModal isOpen={isJobModalOpen} onClose={() => setJobModalOpen(false)} />
      <UploadResumeModal isOpen={isResumeModalOpen} onClose={() => setResumeModalOpen(false)} />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer ${
      active 
        ? 'bg-indigo-500/10 text-indigo-300 shadow-[inset_2px_0_0_0_#818cf8]' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`}>
      {icon}
      {label}
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-xl bg-[#0F172A]/50 border border-white/10 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all shadow-lg">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-white tracking-tight">
        {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
      </div>
    </motion.div>
  );
}

function AnimatedCounter({ value }) {
  return <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={value}>{value}</motion.span>;
}

function KanbanSkeleton() {
  return (
    <div className="flex flex-col w-[340px] flex-shrink-0">
      <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-4" />
      <div className="flex-1 min-h-[500px] rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({ title, status, items, onDragStart, onDrop, onDragOver, onInvite, inviteLoading }) {
  return (
    <div 
      className="flex flex-col w-[340px] flex-shrink-0"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          {title} 
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">{items.length}</span>
        </h3>
      </div>
      
      <div className={`flex-1 min-h-[500px] rounded-xl bg-[#0F172A]/30 border border-white/5 border-dashed p-3 flex flex-col gap-3 transition-colors hover:bg-white/5 ${items.length === 0 ? 'items-center justify-center' : ''}`}>
        {items.length === 0 ? (
          <div className="text-center p-6 text-slate-500 flex flex-col items-center">
            <Inbox className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">Drop candidates here</p>
          </div>
        ) : (
          items.map(candidate => (
            <CandidateCard key={candidate._id} candidate={candidate} onDragStart={onDragStart} onInvite={onInvite} inviteLoading={inviteLoading} />
          ))
        )}
      </div>
    </div>
  );
}

function CandidateCard({ candidate, onDragStart, onInvite, inviteLoading }) {
  const { name, email, match_score, ai_insights } = candidate;
  const initials = name?.substring(0, 2).toUpperCase() || '??';
  const hasInsights = ai_insights != null;

  return (
    <motion.div 
      layout
      draggable
      onDragStart={(e) => onDragStart(e, candidate._id)}
      whileHover={{ y: -2 }}
      className="p-5 rounded-xl bg-[#1E293B]/80 border border-white/10 hover:border-indigo-500/50 backdrop-blur-md cursor-grab active:cursor-grabbing transition-colors group relative overflow-hidden shadow-xl"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-inner">
            {initials}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white truncate max-w-[150px]">{name}</h4>
            <p className="text-xs text-slate-400 truncate max-w-[150px]">{email}</p>
          </div>
        </div>
        
        {match_score !== null && (
          <div className={`px-2 py-1 rounded-lg border flex flex-col items-center justify-center shadow-inner ${match_score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : match_score >= 60 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-80 mb-0.5">Match</span>
            <span className="text-sm font-bold">{match_score}%</span>
          </div>
        )}
      </div>

      {hasInsights ? (
        <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
          {ai_insights.recommendation_label && (
             <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-white/5 border border-white/10 text-slate-300">
               {ai_insights.recommendation_label}
             </div>
          )}
          
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {ai_insights.summary}
          </p>
          
          {ai_insights.missing_points?.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 mb-1.5 block">Skill Gaps</span>
              <div className="flex flex-wrap gap-1.5">
                {ai_insights.missing_points.slice(0, 2).map((skill, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 truncate max-w-[120px]">
                    {skill}
                  </span>
                ))}
                {ai_insights.missing_points.length > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                    +{ai_insights.missing_points.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => onInvite(candidate)}
            disabled={inviteLoading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/30 disabled:opacity-60"
          >
            <Mail className="w-3.5 h-3.5" />
            {inviteLoading ? 'Sending...' : 'Send Interview Link'}
          </button>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 py-3">
          <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] font-semibold tracking-wide uppercase text-indigo-400">Processing Resume</span>
        </div>
      )}
    </motion.div>
  );
}
