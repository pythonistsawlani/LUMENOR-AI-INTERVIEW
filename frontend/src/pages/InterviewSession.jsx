import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, CheckCircle, AlertCircle, Clock, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api';

// Public axios instance — no auth token, uses same base URL as authenticated api
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export default function InterviewSession() {
  const { sessionId } = useParams();
  const accessToken = new URLSearchParams(window.location.search).get('token');

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('loading'); // loading | ready | completed | error | expired
  const [errorMsg, setErrorMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const fetchSession = async () => {
    try {
      setStatus('loading');
      let data;
      if (accessToken) {
        // Public candidate-facing endpoint — uses token hash lookup
        const res = await publicApi.get(`/interviews/public/${accessToken}`);
        data = res.data;
      } else {
        // This path is for recruiters viewing a session (requires JWT in cookie/storage)
        // We still use publicApi but without auth; will 401 if not logged in
        const token = localStorage.getItem('hireflow_token');
        const res = await publicApi.get(`/interviews/${sessionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        data = res.data;
      }

      setSession(data);
      setMessages(data.history || []);
      setStatus(data.status === 'completed' ? 'completed' : 'ready');
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || '';
      if (status === 410 || detail.toLowerCase().includes('expired')) {
        setStatus('expired');
      } else if (status === 404 || detail.toLowerCase().includes('invalid')) {
        setErrorMsg('This interview link is invalid or has already been used.');
        setStatus('error');
      } else {
        setErrorMsg(detail || 'Could not load interview session. Please try again.');
        setStatus('error');
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || status !== 'ready') return;

    const userText = input.trim();
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date().toISOString() }]);

    try {
      const endpoint = accessToken
        ? `/interviews/public/${accessToken}/message`
        : `/interviews/${sessionId}/message`;

      const headers = {};
      if (!accessToken) {
        const token = localStorage.getItem('hireflow_token');
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const { data } = await publicApi.post(endpoint, { message: userText }, { headers });
      setMessages(prev => [...prev, data]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Failed to get a response. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleComplete = async () => {
    try {
      setStatus('loading');
      const endpoint = accessToken
        ? `/interviews/public/${accessToken}/complete`
        : `/interviews/${sessionId}/complete`;

      const headers = {};
      if (!accessToken) {
        const token = localStorage.getItem('hireflow_token');
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      await publicApi.post(endpoint, {}, { headers });
      await fetchSession();
    } catch (err) {
      setErrorMsg('Failed to submit interview. Please try again.');
      setStatus('ready');
    }
  };

  // ─── Screens ────────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="text-white/50 text-sm">Loading your interview session...</p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Link Expired</h1>
          <p className="text-white/50 leading-relaxed">This interview link has expired. Please contact the recruiter to request a new link.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Invalid Link</h1>
          <p className="text-white/50 leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // ─── Main Interview UI ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg">
            H
          </div>
          <div>
            <h1 className="text-sm font-bold">AI Technical Interview</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
              {session?.job_title || 'HireFlow AI Session'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status === 'completed' ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
              <CheckCircle className="w-3.5 h-3.5" /> Completed
            </div>
          ) : (
            <button
              onClick={handleComplete}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-lg transition-all font-medium"
            >
              Finish Interview
            </button>
          )}
        </div>
      </header>

      {/* Welcome banner */}
      {session?.candidate_name && (
        <div className="border-b border-white/5 bg-indigo-600/5 px-6 py-3 text-center">
          <p className="text-sm text-white/60">
            Welcome, <strong className="text-white">{session.candidate_name}</strong> · Role: <strong className="text-indigo-400">{session.job_title}</strong>
          </p>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-5 overflow-y-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 border border-white/10'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4" />
                  : <Sparkles className="w-4 h-4 text-purple-400" />
                }
              </div>
              <div className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-50'
                  : 'bg-white/5 border border-white/10 text-white/90 shadow-xl'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </motion.div>
        )}

        {/* Final report */}
        {status === 'completed' && session?.final_report && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-8 rounded-3xl bg-gradient-to-br from-purple-600/15 to-indigo-600/15 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-emerald-400 w-5 h-5" />
              <h2 className="text-lg font-bold">Interview Summary</h2>
            </div>
            <p className="text-white/70 whitespace-pre-wrap text-sm leading-relaxed">{session.final_report}</p>
            <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-white/40 italic">
              Your results have been submitted to the recruiter. They will contact you shortly.
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      {status === 'ready' && (
        <footer className="p-4 lg:p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl sticky bottom-0">
          <div className="max-w-4xl w-full mx-auto">
            <form onSubmit={handleSend} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                }}
                rows={2}
                disabled={sending}
                placeholder="Type your answer here... (Enter to send, Shift+Enter for new line)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-16 focus:outline-none focus:border-purple-500/50 transition-all text-sm resize-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="absolute right-3 bottom-3 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 transition-colors disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="mt-2 text-[10px] text-center text-white/25 uppercase tracking-widest font-medium">
              Powered by HireFlow AI
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
