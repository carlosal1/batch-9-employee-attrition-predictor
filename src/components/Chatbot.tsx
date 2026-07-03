import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Hello! I am your **Patria RetentionML Assistant**. I am linked live to our active workforce risk directory and the Gradient Boosting model.\n\nAsk me about **model metrics**, **high-risk employees**, or how the **What-If simulator** computes dynamic probabilities! How can I help you support our talent today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat log when messages are updated
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Quick prompt presets
  const presetPrompts = [
    { label: '📊 Model Metrics', prompt: 'Show the model performance and accuracy metrics.' },
    { label: '🔍 Who is at risk?', prompt: 'Who are the highest risk employees in the system right now?' },
    { label: '🎛️ What-If Simulator', prompt: 'How do I use the What-If Simulator to calculate probabilities?' },
    { label: '⚙️ Model Training', prompt: 'Does the webapp retrain the model on every execution?' }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsError(false);

    // Prepare message stream
    const targetMessages = [...messages, userMessage];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: targetMessages })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate chatbot connection.');
      }

      // Read chunked response stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error('ReadableStream not supported on target environment.');
      }

      // Add a blank model message that we will stream into
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      let accumulatedResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        
        // Parse the Event Stream lines
        const lines = chunkText.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6).trim();
              if (dataStr) {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedResponse += parsed.text;
                  setMessages(prev => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last.role === 'model') {
                      last.content = accumulatedResponse;
                    }
                    return next;
                  });
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              }
            } catch (e) {
              // Ignore partial chunk parse errors
            }
          } else if (line.startsWith('event: end')) {
            // End of stream indicator
            break;
          }
        }
      }

    } catch (err: any) {
      console.error('Streaming error:', err);
      setIsError(true);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: "⚠️ **System Communication Alert:** I experienced an issue communicating with the AI service. Please ensure your `GEMINI_API_KEY` is fully configured in the Settings panel or try your query again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic custom markdown-like formatter to keep it ultra lightweight and React 19 compliant
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      // Unordered list items
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const text = line.slice(2);
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed mb-1" id={`msg-item-${lineIdx}`}>
            {parseBoldText(text)}
          </li>
        );
      }
      // Ordered list items
      const orderedMatch = line.match(/^(\d+)\.\s(.*)/);
      if (orderedMatch) {
        const text = orderedMatch[2];
        return (
          <li key={lineIdx} className="ml-4 list-decimal text-xs text-slate-700 leading-relaxed mb-1" id={`msg-item-${lineIdx}`}>
            {parseBoldText(text)}
          </li>
        );
      }
      // Standard paragraphs
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-2" id={`msg-space-${lineIdx}`} />;
      }
      return (
        <p key={lineIdx} className="text-xs text-slate-700 leading-relaxed mb-2" id={`msg-paragraph-${lineIdx}`}>
          {parseBoldText(line)}
        </p>
      );
    });
  };

  // Helper to highlight **bold** text and `inline code`
  const parseBoldText = (text: string) => {
    // Match both **text** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={partIdx} className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-indigo-600 font-semibold">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="chatbot-container">
      {/* Floating Panel Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-80 sm:w-[380px] h-[520px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden mb-4"
            id="chatbot-window"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-800" id="chatbot-header">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    Patria AI Assistant
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">
                      Dynamic Inference
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                id="chatbot-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" id="chatbot-logs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  id={`chat-msg-row-${idx}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs border ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 border-indigo-700 text-white rounded-tr-none'
                        : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                    id={`chat-msg-bubble-${idx}`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-1">
                        {formatContent(msg.content)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start" id="chat-loading-row">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Preset Prompts (Visible only when not actively streaming/loading) */}
            {!isLoading && messages.length <= 2 && (
              <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-1.5 shrink-0" id="preset-container">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Suggested Queries
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {presetPrompts.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(preset.prompt)}
                      className="text-left text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 font-semibold transition-all duration-150 flex items-center justify-between group"
                      id={`preset-btn-${i}`}
                    >
                      <span>{preset.label}</span>
                      <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0 items-center"
              id="chatbot-form"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about risk models, metrics, or what-if..."
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:outline-none focus:border-indigo-500 focus:bg-white disabled:opacity-50 transition-colors"
                id="chatbot-input-field"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0"
                id="chatbot-send-btn"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launch Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900 hover:bg-indigo-600 text-white rounded-full p-4 shadow-xl border border-slate-800 hover:border-indigo-500 flex items-center justify-center gap-2.5 group transition-colors duration-300"
        id="chatbot-launcher"
      >
        <div className="relative">
          <Bot className="w-5.5 h-5.5 group-hover:rotate-6 transition-transform" />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900" />
        </div>
        <span className="text-xs font-bold tracking-wide pr-1 hidden sm:inline">
          Ask Retention AI
        </span>
      </motion.button>
    </div>
  );
}
