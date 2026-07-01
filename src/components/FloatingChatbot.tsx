import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  TrendingUp,
  Brain,
  ShieldAlert
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `### 👋 Hello! I'm AttritionPro Copilot.

I can help explain:
- **SHAP values** and feature attribution drivers.
- **Gradient Boosting Classifier (GBC)** model metrics (CV AUC 82.34%).
- **Calibrated risk segment thresholds** (0.4 & 0.7 milestones).

Ask me anything about our predictive engine!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, isOpen]);

  const quickPrompts = [
    { label: 'What is SHAP?', text: 'Explain what SHAP values are and how they measure feature impacts on attrition.' },
    { label: 'Model Specs', text: 'What is the accuracy and algorithm of our attrition classifier?' },
    { label: 'Risk Thresholds', text: 'How do the 0.4 and 0.7 risk milestones help managers?' }
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const chatHistory = [...messages, userMsg].map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        text: msg.text
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Server error');
      }
    } catch (err: any) {
      console.error('Floating copilot fetch failed:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Connection Error**: Unable to contact the copilot service. \n\n*Error: ${err.message || 'Server offline'}. Please ensure the Express backend is running.*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `### 👋 Chat reset.

Ask me any question about scikit-learn preprocessing pipeline, model.pkl weights, or SHAP impact values!`,
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[80vh] bg-slate-900/95 border border-slate-800 rounded-sm shadow-2xl flex flex-col overflow-hidden backdrop-blur-md"
          >
            {/* Header */}
            <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-1">
                    Attrition Copilot <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                  </h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Expert HR Support</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={resetChat}
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Reset Chat"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-950/20">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-indigo-400" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-sm p-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-950/40 border border-cyan-800/40 text-slate-200'
                      : 'bg-slate-900/80 border border-slate-800 text-slate-300'
                  }`}>
                    <div className="markdown-body prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3 h-3 text-indigo-400" />
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800 rounded-sm p-3 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                    <span className="font-mono text-[10px] uppercase tracking-wider animate-pulse">Analyzing query...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips list */}
            <div className="p-2 border-t border-slate-850 bg-slate-950/40 flex flex-wrap gap-1.5 shrink-0">
              {quickPrompts.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.text)}
                  disabled={isGenerating}
                  className="text-[9px] font-mono border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 px-2 py-1 rounded-sm transition-all cursor-pointer disabled:opacity-40"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input form */}
            <div className="p-3 border-t border-slate-850 bg-slate-900/60 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={isGenerating}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm py-1.5 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold px-3 py-1.5 rounded-sm transition-all flex items-center justify-center shrink-0 cursor-pointer shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/20 cursor-pointer border border-cyan-300 relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-5 h-5" />
              {/* Active notification dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-cyan-300 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-cyan-300"></span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
