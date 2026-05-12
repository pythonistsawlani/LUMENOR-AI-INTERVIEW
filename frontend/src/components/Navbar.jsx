import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Briefcase, User, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 w-full z-50 bg-[#020617]/70 backdrop-blur-xl border-b border-white/10 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <motion.div 
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              <span className="text-white text-sm font-bold">H</span>
            </motion.div>
            <Link to="/" className="text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors">
              HireFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">AI</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link to="/features" className="hover:text-white transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            {user && <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 transition-colors">Dashboard</Link>}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-300">Hi, {user.name}</span>
                <button onClick={handleLogout} className="text-sm font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-2 rounded-full hover:bg-rose-500/20 transition-all flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            ) : (
              <>
                <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  Log in
                </button>
                <button className="text-sm font-medium bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] px-5 py-2 rounded-full hover:bg-indigo-500 transition-all backdrop-blur-md">
                  Start Free Trial
                </button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button className="text-slate-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
