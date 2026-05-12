import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, Mail, Phone, User, 
  ArrowRight, Loader2, Sparkles, AlertCircle, UploadCloud, ChevronLeft
} from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';

export default function CandidateApply() {
  const { jobId } = useParams();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    code: '',
  });

  const { data: job, isLoading: jobLoading, error: jobError } = useQuery({
    queryKey: ['publicJob', jobId],
    queryFn: () => api.get(`/public/jobs/${jobId}`).then((res) => res.data),
  });

  const requestCodeMutation = useMutation({
    mutationFn: () => api.post(`/public/jobs/${jobId}/request-code`, { name: form.name, email: form.email }),
    onSuccess: () => {
      addToast('Verification code sent to your email', 'success');
      setStep(2);
    },
    onError: (err) => addToast(err?.response?.data?.detail || 'Failed to send code', 'error')
  });

  const verifyCodeMutation = useMutation({
    mutationFn: () => api.post(`/public/jobs/${jobId}/verify-code`, { email: form.email, code: form.code }),
    onSuccess: ({ data }) => {
      setVerificationToken(data.verification_token);
      setStep(3);
      addToast('Email verified successfully', 'success');
    },
    onError: (err) => addToast(err?.response?.data?.detail || 'Invalid code', 'error')
  });

  const applyMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('verification_token', verificationToken);
      fd.append('resume', file);
      return api.post(`/public/jobs/${jobId}/apply`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => setStep(4),
    onError: (err) => addToast(err?.response?.data?.detail || 'Submission failed', 'error')
  });

  if (jobLoading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (jobError || !job) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
      <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
      <h1 className="text-xl font-bold text-white mb-2">Job Not Found</h1>
      <p className="text-slate-400 mb-6 text-center">This job posting may have expired or been removed.</p>
      <Link to="/" className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">Back to Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center py-12 px-4 relative">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-2xl relative z-10">
        <header className="mb-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-indigo-600/20">
              {job.company_name?.charAt(0) || 'H'}
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">
            <Sparkles className="w-3 h-3" /> {job.company_name || 'HireFlow AI'} Hiring
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{job.title}</h1>
          <p className="text-slate-400 flex items-center justify-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {job.job_type}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span>{job.experience_level || 'All Levels'}</span>
          </p>
        </header>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                step >= s ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-slate-500'
              }`}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-px mx-4 ${step > s ? 'bg-indigo-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={(e) => { e.preventDefault(); requestCodeMutation.mutate(); }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Smith" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 transition-all outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 transition-all outline-none" />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={requestCodeMutation.isPending} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                  {requestCodeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Request Verification Code
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={(e) => { e.preventDefault(); verifyCodeMutation.mutate(); }}
                className="space-y-8 py-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Verify your email</h3>
                  <p className="text-sm text-slate-400">We've sent a 6-digit code to <strong>{form.email}</strong></p>
                </div>
                <input required maxLength={6} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="000000" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 text-center text-4xl font-black tracking-[0.4em] text-white focus:border-indigo-500 transition-all outline-none" />
                <div className="flex flex-col gap-3">
                  <button type="submit" disabled={verifyCodeMutation.isPending} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                    {verifyCodeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Verify Code
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-white flex items-center justify-center gap-1.5 transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Change email address
                  </button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form 
                key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={(e) => { e.preventDefault(); if(file) applyMutation.mutate(); }}
                className="space-y-8"
              >
                <div 
                  className={`relative group border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${
                    file ? 'bg-indigo-500/5 border-indigo-500/40' : 'bg-black/20 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 ${file ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-500'}`}>
                    {file ? <CheckCircle className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{file ? file.name : 'Upload your resume'}</h3>
                  <p className="text-sm text-slate-500">{file ? 'File selected successfully' : 'Supported format: PDF (Max 5MB)'}</p>
                </div>

                <button type="submit" disabled={applyMutation.isPending || !file} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                  {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Submit Application
                </button>
              </motion.form>
            )}

            {step === 4 && (
              <motion.div 
                key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10 space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">Application Received!</h2>
                  <p className="text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Thanks for applying, <strong>{form.name}</strong>. Our AI is now analyzing your resume. 
                    If shortlisted, you will receive an interview link via email.
                  </p>
                </div>
                <div className="pt-6">
                   <Link to="/" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Return to Homepage</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="mt-12 space-y-8">
           <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-4">Role Description</h3>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4">Requirements</h3>
                <ul className="space-y-2">
                  {job.requirements?.map((r, i) => (
                    <li key={i} className="text-xs text-slate-400 flex gap-2">
                      <span className="text-emerald-500">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-4">Skills Preferred</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required?.map((s, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase tracking-tighter">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
