import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';

export default function CreateJobModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    skills_required: '',
    experience_level: '',
    salary_range: '',
    job_type: 'Full-time',
    description: '',
    requirements: ''
  });

  const mutation = useMutation({
    mutationFn: (newJob) => api.post('/jobs', newJob).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myJobs'] });
      onClose();
      setFormData({
        title: '', skills_required: '', experience_level: '',
        salary_range: '', job_type: 'Full-time', description: '', requirements: ''
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const skillsArray = formData.skills_required.split(',').map(s => s.trim()).filter(Boolean);
    const requirementsArray = formData.requirements.split('\n').map(r => r.trim()).filter(Boolean);
    
    mutation.mutate({
      ...formData,
      skills_required: skillsArray,
      requirements: requirementsArray
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-semibold text-white">Create New Job Post</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="create-job-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Job Title</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. Senior Frontend Engineer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Job Type</label>
                    <select value={formData.job_type} onChange={e => setFormData({...formData, job_type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 appearance-none">
                      <option className="bg-[#0F172A]">Full-time</option>
                      <option className="bg-[#0F172A]">Part-time</option>
                      <option className="bg-[#0F172A]">Contract</option>
                      <option className="bg-[#0F172A]">Freelance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Experience Level</label>
                    <input required type="text" value={formData.experience_level} onChange={e => setFormData({...formData, experience_level: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. 3-5 years" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Salary Range</label>
                    <input type="text" value={formData.salary_range} onChange={e => setFormData({...formData, salary_range: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. $120k - $150k" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Required Skills (comma separated)</label>
                  <input required type="text" value={formData.skills_required} onChange={e => setFormData({...formData, skills_required: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. React, Node.js, TypeScript" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Job Description</label>
                  <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none" placeholder="Describe the role..." />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Requirements (one per line)</label>
                  <textarea required rows={4} value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none" placeholder="- Must have 5 years experience..." />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" form="create-job-form" disabled={mutation.isPending} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Job'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
