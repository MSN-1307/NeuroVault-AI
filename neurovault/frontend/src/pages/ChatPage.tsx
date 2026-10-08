import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { ChatMessage, RetrievedCitation } from '../types';
import { 
  Send, Sparkles, Brain, Bot, User, AlertCircle, 
  RefreshCw, Check, Copy, Zap, Database, Shield, BookOpen, Layers,
  Terminal, Sliders, Info, MessageSquare, Trash2, ChevronRight,
  ExternalLink, Search, ArrowRight, Plus, Download, CornerDownLeft,
  ChevronLeft, Clock, Bookmark, ShieldCheck, Cpu, ArrowUpRight
} from 'lucide-react';

interface ConversationItem {
  id: number;
  title: string;
  created_at: string;
}

export const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [savedMemoryIdx, setSavedMemoryIdx] = useState<number | null>(null);

  // Layout Drawers
  const [showHistory, setShowHistory] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<RetrievedCitation | null>(null);
  const [memoryTag, setMemoryTag] = useState<'AUTO' | 'FACT' | 'PREFERENCE' | 'GOAL'>('AUTO');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation list
  const loadConversations = async () => {
    try {
      const res = await apiService.getConversations();
      setConversations(res || []);
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  const selectConversation = async (convId: number) => {
    setActiveConversationId(convId);
    setLoading(true);
    try {
      const conv = await apiService.getConversation(convId);
      if (conv && conv.messages) {
        setMessages(conv.messages.map((m: any) => ({
          sender_type: m.sender_type,
          content: m.content,
          retrieved_memories: m.retrieved_memories,
          conflict_detected: m.conflict_detected
        })));
      }
    } catch (err) {
      console.error('Failed to load conversation messages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setInput('');
  };

  const handleDeleteConversation = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation thread?')) {
      try {
        await apiService.deleteConversation(convId);
        if (activeConversationId === convId) {
          handleNewChat();
        }
        await loadConversations();
      } catch (err) {
        console.error('Failed to delete conversation', err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    let userText = input.trim();
    if (memoryTag !== 'AUTO') {
      userText = `[${memoryTag}] ${userText}`;
    }

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessage = { sender_type: 'USER', content: userText };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const resp = await apiService.sendMessage(userText, activeConversationId);
      if (!activeConversationId && resp.conversation_id) {
        setActiveConversationId(resp.conversation_id);
        loadConversations();
      }

      const assistantMsg: ChatMessage = {
        sender_type: 'ASSISTANT',
        content: resp.response,
        retrieved_memories: resp.retrieved_memories,
        conflict_detected: resp.conflict_detected
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender_type: 'ASSISTANT',
          content: 'I encountered an issue communicating with the backend. Please check server logs.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSaveAsMemory = async (content: string, idx: number) => {
    try {
      await apiService.createMemory({
        content: content.slice(0, 300),
        memory_type: 'FACT',
        importance_score: 90,
        confidence_score: 95,
        tags: ['saved-from-chat']
      });
      setSavedMemoryIdx(idx);
      setTimeout(() => setSavedMemoryIdx(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to commit memory to MySQL vault.');
    }
  };

  const handleExportTranscript = () => {
    if (messages.length === 0) return;
    const transcript = messages.map(m => `### ${m.sender_type}\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([transcript], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NeuroVault_Chat_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const promptStarters = [
    {
      title: 'Database Architecture',
      desc: '3NF normalization & ACID triggers',
      prompt: 'Explain the 14 relational tables in MySQL and how ACID transaction isolation guarantees memory integrity.',
      icon: Database,
      tag: 'Architecture'
    },
    {
      title: 'Teach New Preference',
      desc: 'Commit preference to MySQL vault',
      prompt: 'Remember that our engineering team develops microservices in Go and Python using MySQL 8.4 InnoDB.',
      icon: Brain,
      tag: 'Preference'
    },
    {
      title: 'Contradiction Sentinel',
      desc: 'Test conflict detection guard',
      prompt: 'I never use relational databases and strictly prefer unstructured flat files.',
      icon: ShieldCheck,
      tag: 'Sentinel Guard'
    },
    {
      title: 'Hybrid Retrieval Formula',
      desc: 'Cosine similarity + full-text indexing',
      prompt: 'How does NeuroVault combine dense cosine vector math with inverted full-text search weights?',
      icon: Sparkles,
      tag: 'Retrieval'
    }
  ];

  return (
    <div className="flex h-[calc(100vh-6.5rem)] gap-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* 1. COLLAPSIBLE CONVERSATION HISTORY SIDEBAR */}
      {showHistory && (
        <div className="w-64 abatable-card flex flex-col justify-between shrink-0 h-full p-4 space-y-4 animate-in slide-in-from-left duration-200">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-1">
              <span>Past Sessions ({conversations.length})</span>
              <Clock className="w-3 h-3" />
            </div>

            {/* Conversation Threads Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No saved conversations yet. Start a new chat!
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConversationId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      className={`group p-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className="truncate">{c.title || `Chat #${c.id}`}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                        title="Delete thread"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Engine Telemetry Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              MySQL 8.4 RAG
            </span>
            <span className="font-mono">3NF Verified</span>
          </div>
        </div>
      )}

      {/* 2. MAIN CONVERSATION ARENA */}
      <div className="flex-1 flex flex-col abatable-card overflow-hidden h-full shadow-lg">
        {/* Editorial Top Chat Bar */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/90 dark:bg-[#080b11]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={showHistory ? 'Hide Sidebar' : 'Show Sidebar'}
            >
              {showHistory ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                    NeuroVault Cognitive Assistant
                  </h2>
                  <span className="abatable-pill text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Hybrid RAG Active
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Persistent Memory • Automated Deduplication • Zero-Collision Integrity
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInspector(!showInspector)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showInspector
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Inspect Retrieved Context"
            >
              <Info className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Memory Inspector</span>
            </button>

            <button
              onClick={handleExportTranscript}
              disabled={messages.length === 0}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Export Markdown Transcript"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50/40 dark:bg-black/30">
          {messages.length === 0 ? (
            /* Abatable-Style Clean Welcome & Starter Prompts */
            <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-in fade-in">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-float-3d shadow-lg shadow-emerald-500/10">
                <Brain className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="abatable-pill bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Autonomous Cognitive Memory OS
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  How can NeuroVault assist your research today?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Every conversation leverages persistent 3NF MySQL storage, hybrid semantic embeddings, and automated contradiction guards.
                </p>
              </div>

              {/* 4 Interactive Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2 perspective-container">
                {promptStarters.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setInput(item.prompt)}
                      className="card-3d p-4 rounded-2xl bg-white dark:bg-[#0c111d] border border-slate-200/90 dark:border-white/10 hover:border-emerald-500/60 text-left transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {item.tag}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Messages List */
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3.5 max-w-3xl ${m.sender_type === 'USER' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs ${
                    m.sender_type === 'USER'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {m.sender_type === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Content */}
                <div className="space-y-2.5 max-w-2xl">
                  <div
                    className={`p-4 md:p-5 rounded-3xl text-xs md:text-sm leading-relaxed relative group ${
                      m.sender_type === 'USER'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-tr-xs shadow-md'
                        : 'abatable-card text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {m.sender_type === 'ASSISTANT' && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(m.content, idx)}
                            className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                          </button>

                          <span>•</span>

                          <button
                            onClick={() => handleSaveAsMemory(m.content, idx)}
                            className="hover:text-emerald-500 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${savedMemoryIdx === idx ? 'text-emerald-500 fill-emerald-500' : ''}`} />
                            <span>{savedMemoryIdx === idx ? 'Committed!' : 'Commit to Vault'}</span>
                          </button>
                        </div>

                        <span className="font-mono text-[10px]">MySQL Persistent</span>
                      </div>
                    )}
                  </div>

                  {/* Contradiction Flag Alert */}
                  {m.conflict_detected && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-amber-800 dark:text-amber-200 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Contradiction Flagged: Opposing historical state quarantined in MySQL for review.</span>
                    </div>
                  )}

                  {/* Retrieved Citations Badge Strip */}
                  {m.retrieved_memories && m.retrieved_memories.length > 0 && (
                    <div className="p-3 bg-white dark:bg-[#0c111d] rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-emerald-500" />
                          Retrieved MySQL Citations ({m.retrieved_memories.length})
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-normal lowercase">click to inspect score</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {m.retrieved_memories.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedCitation(c);
                              setShowInspector(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/60 text-left transition-all cursor-pointer max-w-xs group"
                          >
                            <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 flex items-center justify-between gap-3">
                              <span>Memory #{c.id}</span>
                              <span className="font-mono text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                                {((c.score || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.content}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 mr-auto items-center animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-white/10 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Consulting MySQL Hybrid Store & Verifying Deduplication...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 3. ELEVATED FLOATING INPUT CONSOLE */}
        <div className="p-4 bg-white dark:bg-[#080b11] border-t border-slate-100 dark:border-white/10 space-y-2.5">
          {/* Fast Memory Tag Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Tag:</span>
            {(['AUTO', 'FACT', 'PREFERENCE', 'GOAL'] as const).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setMemoryTag(tag)}
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                  memoryTag === tag
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or state a preference to commit into persistent memory (Enter to send, Shift+Enter for newline)..."
              className="w-full pl-4 pr-12 py-3 text-xs md:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c111d] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 bottom-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl font-bold transition-all cursor-pointer active:scale-95 shadow-md shadow-emerald-600/20"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 4. SLIDE-OUT RETRIEVED MEMORY INSPECTOR DRAWER */}
      {showInspector && (
        <div className="w-80 abatable-card p-5 flex flex-col justify-between shrink-0 h-full overflow-y-auto animate-in slide-in-from-right duration-200 shadow-xl space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Memory Context Inspector</span>
              </h3>
              <button
                onClick={() => setShowInspector(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedCitation ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">Memory #{selectedCitation.id}</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                      {((selectedCitation.score || 0) * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed pt-1">
                    "{selectedCitation.content}"
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Relational Properties</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">Type</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{selectedCitation.memory_type}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400 block text-[10px]">Importance</span>
                      <span className="font-bold text-amber-600">{selectedCitation.importance || 85}%</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-white block">Hybrid Scoring Formula:</span>
                  <p className="text-[10px] leading-relaxed font-mono">
                    Score = (0.45*Vector) + (0.20*FULLTEXT) + (0.15*Importance) + (0.10*Confidence) + (0.10*Recency)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Click any citation chip inside an AI response to inspect its exact mathematical score and MySQL storage record.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
            <span>MySQL 8.4 InnoDB</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
