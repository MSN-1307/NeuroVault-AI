import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
  Database, Brain, Sparkles, ChevronDown, 
  ArrowRight, Moon, Sun, Shield, Terminal, 
  FileText, History, Layers, Zap, MessageSquare,
  BarChart3, Plus, LogOut, CheckCircle2
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  const solutions = [
    {
      title: 'Document & ESG Asset Intelligence',
      desc: 'Ingest PDFs, ESG carbon audits & extract empirical metrics',
      to: '/documents',
      icon: FileText,
      badge: 'Multi-Modal'
    },
    {
      title: 'Explainable Hybrid RAG',
      desc: 'Inspect exact cosine vector similarities & full-text scores',
      to: '/explainable',
      icon: Sparkles,
      badge: 'Zero Hallucination'
    },
    {
      title: 'Memory Flashback & Temporal Replay',
      desc: 'Replay historical system states at any chronological timestamp',
      to: '/replay',
      icon: History,
      badge: 'Time-Travel'
    },
    {
      title: 'Relational Vector Knowledge Graph',
      desc: 'Bidirectional graph linking normalized entities in MySQL 3NF',
      to: '/graph',
      icon: Layers,
      badge: 'Relational 3NF'
    },
    {
      title: 'DBMS Cognitive Innovations Lab',
      desc: 'Ebbinghaus forgetting sweep & concept synthesis triggers',
      to: '/innovations',
      icon: Zap,
      badge: 'Autonomous'
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-[#080b11]/85 border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Editorial Kicker */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base font-sans">
                NeuroVault
              </span>
              <span className="hidden sm:inline-flex abatable-pill text-[9px] py-0.5 px-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                MySQL 8.4
              </span>
            </div>
          </Link>

          {/* Abatable Style Mega Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                location.pathname === '/' 
                  ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-white/10' 
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Platform
            </Link>

            {/* Solutions Dropdown Menu */}
            <div className="relative" onMouseLeave={() => setSolutionsOpen(false)}>
              <button
                onClick={() => setSolutionsOpen(!solutionsOpen)}
                onMouseEnter={() => setSolutionsOpen(true)}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer ${
                  solutionsOpen 
                    ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10' 
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Solutions</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${solutionsOpen ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {/* Dropdown Panel (Abatable mega-nav style) */}
              {solutionsOpen && (
                <div 
                  className="absolute left-0 mt-1 w-96 rounded-2xl bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-white/10 shadow-2xl p-3 space-y-1 animate-in fade-in zoom-in-95 z-50"
                  onMouseEnter={() => setSolutionsOpen(true)}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Cognitive Memory Modules
                  </div>
                  {solutions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setSolutionsOpen(false)}
                        className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/chat"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                location.pathname === '/chat' 
                  ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-white/10' 
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              AI Chat
            </Link>

            <Link
              to="/vault"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                location.pathname === '/vault' 
                  ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-white/10' 
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Memory Vault
            </Link>

            <Link
              to="/database"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                location.pathname === '/database' 
                  ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-white/10' 
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              MySQL 3NF
            </Link>

            <Link
              to="/guide"
              className={`px-3 py-1.5 rounded-full transition-colors ${
                location.pathname === '/guide' 
                  ? 'text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-white/10' 
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Architecture
            </Link>
          </nav>
        </div>

        {/* Right Action Matrix (Abatable Style) */}
        <div className="flex items-center gap-2.5">
          {/* Live Engine Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MySQL ACID Online</span>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Abatable Style Solid Primary CTA Pill */}
          <Link
            to="/documents"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95 group"
          >
            <span>Analyze File</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </header>
  );
};
