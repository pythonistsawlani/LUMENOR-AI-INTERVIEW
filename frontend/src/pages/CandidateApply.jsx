import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../api';

export default function CandidateApply() {
  const { jobId } = useParams();
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
    onSuccess: () => setStep(2),
  });

  const verifyCodeMutation = useMutation({
    mutationFn: () => api.post(`/public/jobs/${jobId}/verify-code`, { email: form.email, code: form.code }),
    onSuccess: ({ data }) => {
      setVerificationToken(data.verification_token);
      setStep(3);
    },
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
  });

  const statusText = useMemo(() => {
    if (step === 1) return 'Verify your email to continue';
    if (step === 2) return 'Enter the code sent to your email';
    if (step === 3) return 'Upload your resume';
    return 'Application submitted';
  }, [step]);

  if (jobLoading) {
    return <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">Loading...</div>;
  }

  if (jobError || !job) {
    return <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">Job not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-6">
      <div className="max-w-3xl mx-auto bg-[#0F172A] border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-slate-400 mt-1">{job.job_type} · {job.experience_level || 'All levels'}</p>
        <p className="text-slate-300 mt-4 whitespace-pre-wrap">{job.description}</p>
        <p className="mt-6 text-sm text-indigo-300">{statusText}</p>

        {step === 1 && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              requestCodeMutation.mutate();
            }}
          >
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" />
            <button disabled={requestCodeMutation.isPending} className="px-5 py-2 bg-indigo-600 rounded-lg">
              {requestCodeMutation.isPending ? 'Sending...' : 'Send verification code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              verifyCodeMutation.mutate();
            }}
          >
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="6-digit code" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" />
            <button disabled={verifyCodeMutation.isPending} className="px-5 py-2 bg-indigo-600 rounded-lg">
              {verifyCodeMutation.isPending ? 'Verifying...' : 'Verify code'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!file) return;
              applyMutation.mutate();
            }}
          >
            <input required type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2" />
            <button disabled={applyMutation.isPending || !file} className="px-5 py-2 bg-indigo-600 rounded-lg">
              {applyMutation.isPending ? 'Submitting...' : 'Submit application'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            Application submitted successfully. Your resume is now being analyzed by AI.
          </div>
        )}

        {(requestCodeMutation.error || verifyCodeMutation.error || applyMutation.error) && (
          <p className="text-rose-300 text-sm mt-4">
            {requestCodeMutation.error?.response?.data?.detail ||
              verifyCodeMutation.error?.response?.data?.detail ||
              applyMutation.error?.response?.data?.detail ||
              'Something went wrong'}
          </p>
        )}
      </div>
    </div>
  );
}
