import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <h1 className="text-[150px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-600 leading-none tracking-tighter">
          404
        </h1>
        <h2 className="text-3xl font-semibold text-white mb-4 mt-4 tracking-tight">Page Not Found</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          The page you are looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg transition-all font-medium"
        >
          <Home className="w-5 h-5" /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
