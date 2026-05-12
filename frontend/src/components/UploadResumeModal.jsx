import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../api';

export default function UploadResumeModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    applied_job_id: ''
  });

  const { data: jobs } = useQuery({
    queryKey: ['myJobs'],
    queryFn: () => api.get('/my-jobs').then(res => res.data),
    enabled: isOpen
  });

  const mutation = useMutation({
    mutationFn: (newCandidateData) => api.post('/candidates', newCandidateData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      onClose();
      setFile(null);
      setFormData({ name: '', email: '', phone: '', applied_job_id: '' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !formData.applied_job_id) return;

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('applied_job_id', formData.applied_job_id);
    data.append('resume', file);
    
    mutation.mutate(data);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-semibold text-white">Upload Candidate Resume</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="upload-resume-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Select Job to Apply For</label>
                  <select required value={formData.applied_job_id} onChange={e => setFormData({...formData, applied_job_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 appearance-none">
                    <option value="" disabled className="bg-[#0F172A]">-- Select a Job --</option>
                    {jobs?.map(job => (
                      <option key={job._id} value={job._id} className="bg-[#0F172A]">{job.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Candidate Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-300">Phone (optional)</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500" placeholder="+1 234 567 8900" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Resume PDF</label>
                  <div className="relative group cursor-pointer">
                    <input 
                      required 
                      type="file" 
                      accept=".pdf"
                      onChange={e => setFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className={`border-2 border-dashed ${file ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/20 bg-white/5 group-hover:border-indigo-500/50'} rounded-xl p-8 flex flex-col items-center justify-center transition-colors text-center`}>
                      <UploadCloud className={`w-10 h-10 mb-3 ${file ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <p className="text-sm font-medium text-white mb-1">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-slate-400">PDF documents up to 5MB</p>
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button type="submit" form="upload-resume-form" disabled={mutation.isPending || !file || !formData.applied_job_id} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload & Analyze'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
