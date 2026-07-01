import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  HelpCircle, 
  Briefcase, 
  Brain, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Employee } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface RetentionCopilotProps {
  employees: Employee[];
}

export default function RetentionCopilot({ employees }: RetentionCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `### 👋 Welcome, Jordan Davis! 

I am your **AI Retention Copilot**. I specialize in explaining our scikit-learn machine learning classification engine, interpreting individual SHAP (Shapley Additive exPlanations) risk drivers, and formulating highly customized stay agreements and executive action talk-tracks.

How can I assist you with your retention strategy today?`,
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Suggested prompt quick chips
  const quickPrompts = [
    {
      label: 'SHAP Values Explained',
      prompt: 'Explain what SHAP (Shapley Additive exPlanations) values are and how we use them in the Talent Sandbox.'
    },
    {
      label: 'GBC Model Specifications',
      prompt: 'Explain the technical specifications, accuracy, and hyperparameters of Dr. Harry Patria\'s Gradient Boosting model.'
    },
    {
      label: 'Probability Milestones',
      prompt: 'What do the 0.4 and 0.7 risk milestones mean for retention intervention planning?'
    }
  ];

  // Load employee context directly into prompt
  const handleSelectEmployeeContext = (empId: string) => {
    setSelectedEmployeeId(empId);
    if (!empId) return;

    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    // Simulate an attrition score
    const score = emp.OverTime === 'Yes' ? 0.76 : 0.32;
    const scorePct = (score * 100).toFixed(0);

    const customPrompt = `Analyze employee profile for ${emp.id === 'emp-1' ? 'Sonali M.' : emp.id === 'emp-3' ? 'Narsinh K.' : 'Staff Member ' + emp.employee_ref} (${emp.job_role}, ${emp.department}):
- Attrition risk score estimate: ${scorePct}%
- Key factors: OverTime is ${emp.OverTime}, DistanceFromHome is ${emp.DistanceFromHome}km, YearsAtCompany is ${emp.YearsAtCompany} years.
How should we draft an immediate retention strategy for them?`;

    setInput(customPrompt);
  };

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
      // Structure messages list into role-text pairs
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
        throw new Error(errData.error || 'Server responded with error');
      }
    } catch (err: any) {
      console.error('Failed to query Copilot API:', err);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Connection Error**: Unable to contact the AttritionPro Copilot service. \n\n*Error details: ${err.message || 'Server offline'}. Please ensure your Express backend is running and GEMINI_API_KEY is configured if you wish to use live model suggestions.*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: `### 👋 Chat reset complete.

I am ready to assist you again. Select an employee context or ask me any question about our attrition classification model!`,
        timestamp: new Date()
      }
    ]);
    setSelectedEmployeeId('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] border border-slate-800 bg-slate-900/40 rounded-sm overflow-hidden backdrop-blur-md relative">
      
      {/* Top Banner Control Section */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
              Retention AI Copilot <span className="bg-cyan-500 text-slate-950 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-normal leading-none">Ultra Responsive</span>
            </h1>
            <p className="text-[11px] text-slate-400">Interactive advisor for SHAP drivers, model hyper-parameters, and stay guidelines.</p>
          </div>
        </div>

        {/* Clear & Options */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all cursor-pointer"
            title="Reset Chat History"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Middle Interactive Grid (Chat + Side Context Selector) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Conversation Box */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-950/20">
          
          {/* Scrollable Messages Pane */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Icon */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 self-start mt-1">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-sm p-4 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-950/30 border border-cyan-800/40 text-slate-200'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="markdown-body prose prose-invert prose-sm max-w-none prose-cyan prose-p:leading-relaxed prose-pre:bg-slate-950/80 prose-pre:border prose-pre:border-slate-850">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* User Icon */}
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0 self-start mt-1">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
              </div>
            ))}

            {/* Simulated generation loading bubble */}
            {isGenerating && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0 self-start mt-1">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-sm p-4 text-sm text-slate-400 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="font-mono text-xs text-slate-500 uppercase tracking-wider animate-pulse">Copilot is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick chip triggers */}
          <div className="px-4 py-2 border-t border-slate-900 bg-slate-900/20 flex flex-wrap gap-2 shrink-0">
            {quickPrompts.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.prompt)}
                disabled={isGenerating}
                className="text-[10px] font-mono border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-cyan-400 px-2.5 py-1.5 rounded-sm transition-all cursor-pointer select-none disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Bottom input form */}
          <div className="p-4 border-t border-slate-900 bg-slate-900/40 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about SHAP feature drivers, model params, or retention strategies..."
                disabled={isGenerating}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold p-2.5 rounded-sm transition-all flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Side Context Panel (Desktop Only) */}
        <div className="hidden lg:block w-72 bg-slate-900/40 border-l border-slate-800 p-5 space-y-5 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" /> Attrition Context lookup
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">Select an active employee profile to inject their scikit-learn features and risk scores directly into your query builder.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-1.5">Load Employee context</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleSelectEmployeeContext(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 text-xs rounded-sm py-2 px-3 text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="">-- No Context Loaded --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.id === 'emp-1' ? 'Sonali M.' : emp.id === 'emp-3' ? 'Narsinh K.' : `REF-${emp.employee_ref}`} ({emp.job_role})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected profile summary card */}
            {selectedEmployeeId && (() => {
              const emp = employees.find(e => e.id === selectedEmployeeId);
              if (!emp) return null;
              const isHighRisk = emp.OverTime === 'Yes';
              return (
                <div className="bg-slate-950 border border-slate-850 rounded-sm p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        {emp.id === 'emp-1' ? 'Sonali M.' : emp.id === 'emp-3' ? 'Narsinh K.' : `Staff REF-${emp.employee_ref}`}
                      </h4>
                      <p className="text-[10px] text-slate-500">{emp.job_role}</p>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      isHighRisk 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-[10px] font-mono border-t border-slate-900 pt-3">
                    <div>
                      <p className="text-slate-500">Overtime:</p>
                      <p className={isHighRisk ? 'text-rose-400 font-bold' : 'text-slate-300'}>{emp.OverTime}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Home Distance:</p>
                      <p className="text-slate-300">{emp.DistanceFromHome} km</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Years at Company:</p>
                      <p className="text-slate-300">{emp.YearsAtCompany} yrs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Department:</p>
                      <p className="text-slate-300 truncate" title={emp.department}>{emp.department.split(' ')[0]}</p>
                    </div>
                  </div>

                  <div className="bg-cyan-950/10 border border-cyan-900/25 p-2 rounded-sm text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Clicking this profile loaded its scikit-learn parameters into the chat field. Hit send to build their strategy plan!</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

    </div>
  );
}
