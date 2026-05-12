import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, CheckCircle } from 'lucide-react';
import axios from 'axios';
import api, { API_BASE_URL } from '../api';

const publicApi = axios.create({
  baseURL: API_BASE_URL,
});

const InterviewSession = () => {
  const { sessionId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const accessToken = searchParams.get('token');
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSession = async () => {
    try {
      const endpoint = accessToken
        ? `/interviews/public/${accessToken}`
        : `/interviews/${sessionId}`;
      const { data } = await (accessToken ? publicApi.get(endpoint) : api.get(endpoint));
      setSession(data);
      setMessages(data.history);
      if (data.status === 'completed') setIsCompleted(true);
    } catch (error) {
      console.error("Failed to fetch session", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || isCompleted) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // Optimistically add user message
    const newUserMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const endpoint = accessToken
        ? `/interviews/public/${accessToken}/message`
        : `/interviews/${sessionId}/message`;
      const { data } = await (accessToken ? publicApi.post(endpoint, { message: userMessage }) : api.post(endpoint, { message: userMessage }));
      setMessages(prev => [...prev, data]);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const endpoint = accessToken
        ? `/interviews/public/${accessToken}/complete`
        : `/interviews/${sessionId}/complete`;
      await (accessToken ? publicApi.post(endpoint) : api.post(endpoint));
      setIsCompleted(true);
      fetchSession();
    } catch (error) {
      console.error("Failed to complete interview", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold">H</div>
          <div>
            <h1 className="text-sm font-semibold">AI Technical Interview</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium">HireFlow AI Session</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isCompleted ? (
            <div className="flex items-center gap-2 text-green-400 text-xs font-medium bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
              <CheckCircle size={14} /> Interview Completed
            </div>
          ) : (
            <button 
              onClick={handleComplete}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-lg transition-all"
            >
              Finish Interview
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6 overflow-y-auto">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-purple-600' : 'bg-white/5 border border-white/10'
              }`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} className="text-purple-400" />}
              </div>
              <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-50' 
                  : 'bg-white/5 border border-white/10 text-white/90 shadow-xl'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-purple-400 animate-pulse" />
            </div>
            <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl flex gap-1">
              <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </motion.div>
        )}

        {isCompleted && session?.final_report && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-400" />
              <h2 className="text-xl font-bold">Interview Summary</h2>
            </div>
            <p className="text-white/70 whitespace-pre-wrap text-sm leading-relaxed">
              {session.final_report}
            </p>
            <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-white/40 italic">
              Your results have been sent to the recruiter. They will contact you shortly.
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      {!isCompleted && (
        <footer className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl sticky bottom-0">
          <div className="max-w-4xl w-full mx-auto relative">
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer here..."
                disabled={sending}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="absolute right-3 top-3 w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:hover:bg-purple-600"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="mt-3 text-[10px] text-center text-white/30 uppercase tracking-widest font-medium">
              Powered by HireFlow AI · Powered by Qwen 2.5
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default InterviewSession;
