import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { 
  Sparkles, Briefcase, User, Menu, LogOut, 
  Settings, ChevronDown, LayoutDashboard, Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 15 }}
              className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]"
            >
              <span className="text-white text-sm font-bold">H</span>
            </motion.div>
            <Link to="/" className="text-xl font-bold tracking-tight text-white">
              HireFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">AI</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 pl-2 py-1 rounded-full hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-200">{user.name}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <>
                        <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-[#0F172A] border border-white/10 rounded-xl shadow-2xl z-50 py-2"
                        >
                          <div className="px-4 py-2 border-b border-white/5 mb-1">
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Recruiter Account</p>
                            <p className="text-sm text-white font-semibold truncate">{user.email}</p>
                            {user.company_name && (
                              <p className="text-[10px] text-indigo-400 mt-0.5 flex items-center gap-1">
                                <Building className="w-2.5 h-2.5" /> {user.company_name}
                              </p>
                            )}
                          </div>
                          <Link to="/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                            <Settings className="w-4 h-4" /> Account Settings
                          </Link>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/5 transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log in</button>
                <button onClick={() => navigate('/')} className="text-sm font-medium bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">Get Started</button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <Menu className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>
    </nav>
  );
}
