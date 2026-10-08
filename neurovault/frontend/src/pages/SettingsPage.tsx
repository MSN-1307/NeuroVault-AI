import React, { useState } from 'react';
import { 
  Settings, Shield, Sliders, Database, Check, 
  Cpu, Key, Trash2, RefreshCw, CheckCircle2, Lock, Sparkles 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [autoDecayEnabled, setAutoDecayEnabled] = useState(true);
  const [importanceThreshold, setImportanceThreshold] = useState(65);
  const [similarityThreshold, setSimilarityThreshold] = useState(72);
  const [selectedModel, setSelectedModel] = useState('Ollama qwen2.5:3b (Local / Private)');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearCache = () => {
    localStorage.removeItem('neurovault_active_conv');
    alert('Local session cache cleared successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
              System Configuration
            </span>
            <span className="text-xs text-slate-400">• Security & Cognitive Rules</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-blue-600" />
            Platform Settings & Privacy Control
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure AI memory extraction rules, consent policies, LLM providers, and MySQL 8.0+ storage parameters.
          </p>
        </div>

        {saved && (
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Preferences Saved
          </span>
        )}
      </div>

      {/* Memory Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 transition-colors">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          Autonomous Cognitive Memory Policies
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Real-Time Extraction Pipeline</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically extract candidate facts, preferences, and projects from user chat prompts.
              </div>
            </div>
            <input
              type="checkbox"
              checked={memoryEnabled}
              onChange={(e) => setMemoryEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Hybrid Context Personalization</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Inject top-K retrieved memories with explanation tokens into assistant prompt context.
              </div>
            </div>
            <input
              type="checkbox"
              checked={personalizationEnabled}
              onChange={(e) => setPersonalizationEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Autonomous Decay & Forgetting Sweep</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Prune low-importance unaccessed memories using the Ebbinghaus forgetting curve formula.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoDecayEnabled}
              onChange={(e) => setAutoDecayEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Immutable Audit Logging (WAL)</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Log memory lifecycle transitions, trigger executions, and vector queries to MySQL audit_logs table.
              </div>
            </div>
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Sliders for Thresholds */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Min Ingestion Importance</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{importanceThreshold}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              value={importanceThreshold}
              onChange={(e) => setImportanceThreshold(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Facts below this threshold require confirmation</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Cosine Similarity Cutoff</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{similarityThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Minimum semantic score for memory retrieval</span>
          </div>
        </div>
      </div>

      {/* LLM & AI Engine Configuration */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-600" />
          LLM Provider & Vector Inference Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-medium">Selected Cognitive Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Ollama qwen2.5:3b (Local / Private)">Ollama qwen2.5:3b (Local / 100% Private)</option>
              <option value="OpenAI GPT-4o-mini (Cloud)">OpenAI GPT-4o-mini (Cloud)</option>
              <option value="Ollama llama3.2:3b (Local)">Ollama llama3.2:3b (Local)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-medium">Vector Embedding Model</label>
            <div className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>nomic-embed-text (768-dim)</span>
              <span className="text-[10px] font-bold text-emerald-500">Active</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Save All Preferences
          </button>

          <button
            onClick={handleClearCache}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Local Session
          </button>
        </div>
      </div>

      {/* Database & Environment Telemetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-white">
          <Database className="w-4 h-4 text-blue-400" />
          MySQL 8.0+ / 8.4+ Engine Architecture Telemetry
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans">Storage Engine</span>
            <span className="text-emerald-400 font-bold">InnoDB (Full ACID)</span>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans">Connection Pool</span>
            <span className="text-blue-400 font-bold">asyncmy pool</span>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans">Normalization</span>
            <span className="text-purple-400 font-bold">3NF Relational</span>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <span className="text-[10px] text-slate-400 block font-sans">Encryption</span>
            <span className="text-amber-400 font-bold">AES-256 + DDM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
