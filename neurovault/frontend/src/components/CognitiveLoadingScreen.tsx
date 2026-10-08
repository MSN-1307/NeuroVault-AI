import React from 'react';
import { Brain, Cpu, Database, Sparkles } from 'lucide-react';

interface CognitiveLoadingScreenProps {
  featureName?: string;
  subtitle?: string;
}

export const CognitiveLoadingScreen: React.FC<CognitiveLoadingScreenProps> = ({
  featureName = 'Loading Cognitive Feature...',
  subtitle = 'Querying MySQL 8.0+ InnoDB engine & synchronizing vector-graph embeddings...'
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] p-8 animate-in fade-in duration-300">
      <div className="relative mb-6">
        {/* Outer glowing orbital ring */}
        <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin"></div>
        
        {/* Inner reverse spinning ring */}
        <div className="absolute inset-1 w-18 h-18 rounded-full border-2 border-indigo-500/20 border-b-indigo-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>

        {/* Center glowing brain */}
        <div className="absolute inset-0 m-auto w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
          <Brain className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Feature Name & High-Tech Description */}
      <div className="text-center max-w-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-blue-300">
          <Sparkles className="w-3 h-3 text-amber-500 animate-bounce" />
          <span>NeuroVault Autonomous Engine</span>
        </div>
        <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {featureName}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {subtitle}
        </p>
      </div>

      {/* Live System Ticker Pills */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 font-mono">
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <Database className="w-3 h-3 text-emerald-500" /> MySQL InnoDB WAL
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <Cpu className="w-3 h-3 text-blue-500" /> Vector Graph Top-K
        </span>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> ACID 3NF
        </span>
      </div>
    </div>
  );
};
