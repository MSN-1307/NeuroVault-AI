import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Database, Brain, MessageSquare, Layers, 
  BarChart3, Shield, Table2, Settings, Sparkles,
  LogOut, Terminal, HelpCircle, FileText, History, Zap,
  Cpu, Activity
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: 'Mission Control', icon: BarChart3 },
    { to: '/guide', label: 'Architecture Guide', icon: HelpCircle },
    { to: '/chat', label: 'Cognitive Chat', icon: MessageSquare },
    { to: '/documents', label: 'Document & ESG Q&A', icon: FileText, highlight: true },
    { to: '/explainable', label: 'Explainable RAG', icon: Sparkles },
    { to: '/replay', label: 'Memory Flashback', icon: History },
    { to: '/vault', label: 'Memory Vault', icon: Brain },
    { to: '/graph', label: 'Vector Graph', icon: Layers },
    { to: '/innovations', label: 'Innovations Lab', icon: Zap },
    { to: '/analytics', label: 'Telemetry Analytics', icon: Activity },
    { to: '/database', label: 'MySQL 3NF Explorer', icon: Table2 },
    { to: '/audit', label: 'Compliance Audit', icon: Shield },
    { to: '/settings', label: 'Engine Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#080b11] border-r border-slate-200/80 dark:border-white/10 flex flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 shadow-xs transition-colors overflow-y-auto">
      <div className="p-3">
        {/* Subtle Section Label */}
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Cognitive Operating Rail
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Footer Attribution */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/10 space-y-2.5 bg-slate-50/50 dark:bg-white/[0.02]">
        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c111d] border border-slate-200/80 dark:border-white/10 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || 'Lead Researcher'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {user?.email || 'operator@neurovault.ai'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Engine Status */}
        <div className="px-2.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
          <span className="font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            MySQL 8.0+ InnoDB
          </span>
          <span className="font-mono text-[9px] text-emerald-600/80 dark:text-emerald-400/80">Full ACID</span>
        </div>

        {/* Creator Attribution */}
        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed pt-1">
          Made with <span className="text-rose-500">❤️</span> for <span className="font-bold text-slate-700 dark:text-slate-300">DBTHON'26</span>
          <br />
          by <span className="font-bold text-emerald-600 dark:text-emerald-400">Sai Nikhit</span> &amp; <span className="font-bold text-blue-600 dark:text-blue-400">Sohan</span>
        </div>
      </div>
    </aside>
  );
};
