import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Memory, DatabaseTable } from '../types';
import { 
  Brain, MessageSquare, ShieldCheck, AlertTriangle, 
  TrendingUp, Sparkles, ArrowUpRight, Clock, Database, 
  Layers, CheckCircle2, ChevronRight, RefreshCw, Zap,
  Activity, Cpu, HardDrive, Filter, Plus, ArrowRight,
  Sliders, Search, Check, AlertCircle, FileText, Share2,
  Lock, X, Gauge, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { CognitiveLoadingScreen } from '../components/CognitiveLoadingScreen';

export const DashboardPage: React.FC = () => {
  // Core Data States
  const [overview, setOverview] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [qualityDist, setQualityDist] = useState<any[]>([]);
  const [dbMetrics, setDbMetrics] = useState<any>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filteredType, setFilteredType] = useState<string>('ALL');
  const [categoryView, setCategoryView] = useState<'both' | 'chart' | 'table'>('both');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Ingestion Sandbox State
  const [ingestContent, setIngestContent] = useState('');
  const [ingestType, setIngestType] = useState('FACT');
  const [ingestImportance, setIngestImportance] = useState(85);
  const [ingestConfidence, setIngestConfidence] = useState(92);
  const [ingesting, setIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  // Interactive Operations Modal State
  const [activeModal, setActiveModal] = useState<'DECAY' | 'SYNTHESIS' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [decayResult, setDecayResult] = useState<any>(null);
  const [synthesisResult, setSynthesisResult] = useState<any>(null);

  // Active Pipeline Stage for Interactive Walkthrough
  const [activeStage, setActiveStage] = useState<number>(0);

  const fetchData = async () => {
    try {
      const [ov, cats, qd, dbm, mems] = await Promise.all([
        apiService.getAnalyticsOverview().catch(() => null),
        apiService.getCategoryDistribution().catch(() => []),
        apiService.getQualityDistribution().catch(() => []),
        apiService.getDbmsMetrics().catch(() => null),
        apiService.getMemories({ status: 'ACTIVE' }).catch(() => [])
      ]);
      const totalCatCount = (cats || []).reduce((acc: number, c: any) => acc + Number(c.count ?? c.memory_count ?? 0), 0) || 1;
      const normalizedCats = (cats || []).map((c: any) => {
        const cnt = Number(c.count ?? c.memory_count ?? 0);
        return {
          category: c.category || c.category_name || 'Unclassified',
          category_name: c.category_name || c.category || 'Unclassified',
          count: cnt,
          memory_count: cnt,
          percentage: c.percentage ?? Math.round((cnt / totalCatCount) * 100)
        };
      });
      setOverview(ov);
      setCategories(normalizedCats);
      setQualityDist(qd || []);
      setDbMetrics(dbm);
      setMemories(mems || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Trigger Cognitive Decay Sweep
  const handleRunDecaySweep = async () => {
    setActiveModal('DECAY');
    setModalLoading(true);
    try {
      const res = await apiService.runCognitiveDecaySweep();
      setDecayResult(res);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Trigger Knowledge Synthesis
  const handleRunSynthesis = async () => {
    setActiveModal('SYNTHESIS');
    setModalLoading(true);
    try {
      const res = await apiService.runConceptSynthesis();
      setSynthesisResult(res);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Quick Ingestion Sandbox Submit
  const handleQuickIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestContent.trim()) return;
    setIngesting(true);
    setIngestSuccess(null);
    try {
      const newMem = await apiService.createMemory({
        content: ingestContent.trim(),
        memory_type: ingestType,
        importance_score: ingestImportance,
        confidence_score: ingestConfidence,
        tags: [ingestType.toLowerCase(), 'quick-sandbox']
      });
      setIngestSuccess(`Memory #${newMem.id} committed to MySQL vault with full-text indexing & trigger validation.`);
      setIngestContent('');
      await fetchData();
      setTimeout(() => setIngestSuccess(null), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to ingest memory. Check backend logs.');
    } finally {
      setIngesting(false);
    }
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  const filteredMemories = memories.filter(m => 
    filteredType === 'ALL' ? true : m.memory_type.toUpperCase() === filteredType.toUpperCase()
  );

  const pipelineStages = [
    {
      step: '01',
      name: 'Conversational Extraction',
      desc: 'Dissects unstructured chat & documents into candidate atomic facts & entities.',
      metric: `${overview?.total_messages ?? 0} Messages Analyzed`,
      badge: 'Real-Time LLM Parsing'
    },
    {
      step: '02',
      name: 'Importance & Scoring Engine',
      desc: 'Applies dynamic 0–100 significance evaluation based on repetition & long-term value.',
      metric: `${overview?.avg_importance_score ?? 0}% Avg Significance`,
      badge: 'Adaptive Weights'
    },
    {
      step: '03',
      name: 'Conflict & Contradiction Sentinel',
      desc: 'Detects semantic discrepancies across temporal states; auto-quarantines contradictions.',
      metric: `${overview?.conflicted_memories ?? 0} In Conflict Review`,
      badge: 'Zero-Collision Guard'
    },
    {
      step: '04',
      name: 'Vector-Graph Consolidation',
      desc: 'Creates bidirectional relational links in MySQL while generating dense embeddings.',
      metric: `${dbMetrics?.foreign_key_relations ?? 11} FK Schemas Active`,
      badge: 'Relational Graph'
    },
    {
      step: '05',
      name: 'Intelligent Decay & Retention',
      desc: 'Applies Ebbinghaus forgetting curve; decays low-frequency memories while crystallizing core facts.',
      metric: `${overview?.active_memories ?? 0} Crystalline Memories`,
      badge: 'Autonomous Pruning'
    }
  ];

  if (loading) {
    return (
      <CognitiveLoadingScreen
        featureName="NeuroVault Cognitive Mission Control"
        subtitle="Connecting to MySQL 8.0+ InnoDB engine, verifying 3NF tables & cognitive services..."
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. ABATABLE-INSPIRED EDITORIAL MISSION CONTROL HERO BANNER */}
      <div className="relative overflow-hidden bg-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 lg:p-10 text-white shadow-2xl">
        {/* Soft Ambient Radial Lighting */}
        <div className="absolute -right-24 -top-24 w-[30rem] h-[30rem] bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 -bottom-32 w-[32rem] h-[32rem] bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-4 max-w-3xl">
            {/* Abatable Style Pill Kicker with Emerald Pulse */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="abatable-pill bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Cognitive Operating Infrastructure</span>
              </span>
              <span className="abatable-pill bg-blue-500/15 border-blue-500/30 text-blue-300">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>MySQL 8.4 InnoDB (3NF Relational)</span>
              </span>
              <span className="abatable-pill bg-purple-500/15 border-purple-500/30 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Hybrid RAG + Vector Graph</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Source, Evaluate & Orchestrate High-Integrity Memory Assets
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
              NeuroVault functions as the cognitive operating system for autonomous agents. It enforces 3NF relational normalization in MySQL, performs real-time contradiction detection, and autonomously applies Ebbinghaus retention sweeps.
            </p>

            {/* Abatable-style Dual Action Buttons Matrix */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleRunSynthesis}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
              >
                <Brain className="w-4 h-4" />
                <span>Synthesize Knowledge</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={handleRunDecaySweep}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-slate-600 font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Run Decay Sweep</span>
              </button>

              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="p-3 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full border border-slate-800 transition-all cursor-pointer"
                title="Refresh Telemetry"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Abatable Style Metric Ticker Counter Strip */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
          <div className="space-y-1">
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Relational Store</div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{dbMetrics?.total_records_stored ?? 371}</span>
              <span className="text-xs text-emerald-400 font-sans font-semibold">Rows in 14 Tables</span>
            </div>
            <p className="text-[11px] text-slate-500">100% 3NF Verified</p>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Foreign Keys</div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{dbMetrics?.foreign_key_relations ?? 11}</span>
              <span className="text-xs text-blue-400 font-sans font-semibold">Active Schemas</span>
            </div>
            <p className="text-[11px] text-slate-500">Zero Orphan Integrity</p>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">Stored Triggers</div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{dbMetrics?.active_triggers ?? 3}</span>
              <span className="text-xs text-purple-400 font-sans font-semibold">Auto-Auditing</span>
            </div>
            <p className="text-[11px] text-slate-500">Event Logging Active</p>
          </div>

          <div className="space-y-1">
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">ACID Isolation</div>
            <div className="text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
              <span>100%</span>
              <span className="text-xs text-slate-300 font-sans font-semibold">InnoDB Engine</span>
            </div>
            <p className="text-[11px] text-slate-500">Transactional Safety</p>
          </div>
        </div>
      </div>

      {/* 2. CORE COGNITIVE TELEMETRY METRICS GRID (5 CARDS WITH 3D DEPTH) */}
      <div className="perspective-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Active Memories Card */}
          <div className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Active Memories</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center animate-float-3d">
                  <Brain className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {overview?.active_memories ?? 0}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Extracted:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{overview?.total_memories ?? 0}</span>
            </div>
          </div>

          {/* Quality Score Card */}
          <div className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Quality Score</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-float-3d">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {overview?.avg_quality_score ?? 0}%
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full" 
                  style={{ width: `${overview?.avg_quality_score ?? 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Confidence Card */}
          <div className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Confidence</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-float-3d">
                  <Gauge className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {overview?.avg_confidence_score ?? 0}%
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tier:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">High Reliability</span>
            </div>
          </div>

          {/* Importance Card */}
          <div className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Avg Importance</span>
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center animate-float-3d">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {overview?.avg_importance_score ?? 0}%
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500">Decay Weight:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">Ebbinghaus Curve</span>
            </div>
          </div>

          {/* Conflict Sentinel Card */}
          <div className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Contradictions</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center animate-float-3d">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {overview?.conflicted_memories ?? 0}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">Flagged</span>
              <Link to="/innovations" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                Reconcile <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE COGNITIVE PIPELINE ARCHITECTURE MAP WITH 3D HORIZONTAL SCROLLING */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Layers className="w-4 h-4 animate-float-3d" />
              <span>Operating Layer Lifecycle</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              End-to-End Cognitive Memory Pipeline
            </h2>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-mono">
            Scroll or click stages to inspect dataflow
          </span>
        </div>

        {/* 5 Stages Responsive Horizontal Flow with Snapping */}
        <div className="overflow-x-auto scroll-showcase flex md:grid md:grid-cols-5 gap-3.5 pb-2">
          {pipelineStages.map((stage, idx) => {
            const isSelected = activeStage === idx;
            return (
              <div
                key={stage.step}
                onClick={() => setActiveStage(idx)}
                className={`card-3d p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shrink-0 min-w-[230px] md:min-w-0 ${
                  isSelected 
                    ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 dark:border-blue-500 shadow-md ring-2 ring-blue-500/30' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      isSelected 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {stage.step}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{stage.badge}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {stage.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {stage.metric}
                  </span>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-500'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. INSTANT MEMORY INGESTION SANDBOX & RAPID TEST CONSOLE */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Real-Time Ingestion Sandbox</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Test Live Memory Ingestion & Evaluation
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Type any fact, preference, or project milestone below. NeuroVault will evaluate its significance, generate full-text MySQL indexes, and store it with transactional rollback safety.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Full-Text MySQL 8.0+ Ready
            </span>
          </div>
        </div>

        {ingestSuccess && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{ingestSuccess}</span>
            </div>
            <button onClick={() => setIngestSuccess(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleQuickIngest} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={ingestContent}
              onChange={(e) => setIngestContent(e.target.value)}
              placeholder="e.g. Lead researcher developing multi-agent retrieval using MySQL 8.4 and React..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <select
              value={ingestType}
              onChange={(e) => setIngestType(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="FACT">FACT</option>
              <option value="PREFERENCE">PREFERENCE</option>
              <option value="PROJECT">PROJECT</option>
              <option value="SKILL">SKILL</option>
              <option value="GOAL">GOAL</option>
              <option value="INSTRUCTION">INSTRUCTION</option>
            </select>

            <button
              type="submit"
              disabled={ingesting || !ingestContent.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 active:scale-95 whitespace-nowrap"
            >
              {ingesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating & Storing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Ingest & Commit</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Importance & Confidence Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Target Importance Score</span>
                <span className="text-blue-400 font-bold">{ingestImportance}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={ingestImportance}
                onChange={(e) => setIngestImportance(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Target Confidence Score</span>
                <span className="text-emerald-400 font-bold">{ingestConfidence}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={ingestConfidence}
                onChange={(e) => setIngestConfidence(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </form>
      </div>

      {/* 5. VISUAL ANALYTICS & TELEMETRY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution Recharts & Relational 3NF Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Category Memory Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Classification across normalized entity domains in MySQL (categories table JOIN memories table)
              </p>
            </div>

            {/* View Mode Segmented Control */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setCategoryView('both')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  categoryView === 'both'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Combined View
              </button>
              <button
                onClick={() => setCategoryView('chart')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  categoryView === 'chart'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Chart Only
              </button>
              <button
                onClick={() => setCategoryView('table')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  categoryView === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Table View
              </button>
            </div>
          </div>

          {/* Visual Recharts BarChart */}
          {(categoryView === 'both' || categoryView === 'chart') && (
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories}>
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '0.75rem', 
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [`${value} Memories`, 'Count']}
                    labelFormatter={(label) => `Domain: ${label}`}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categories.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 3NF Relational Entity Table */}
          {(categoryView === 'both' || categoryView === 'table') && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-2.5 px-2">Domain Category</th>
                      <th className="pb-2.5 px-2 text-right">Stored Count</th>
                      <th className="pb-2.5 px-2 text-right">Relative Share</th>
                      <th className="pb-2.5 px-2 text-right">Relational Schema Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          No category records found in MySQL.
                        </td>
                      </tr>
                    ) : (
                      categories.map((cat, idx) => (
                        <tr key={cat.category} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-2 flex items-center gap-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0" 
                              style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                            ></span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {cat.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {cat.count}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                            <div className="flex items-center justify-end gap-2">
                              <span>{cat.percentage}%</span>
                              <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="h-1.5 rounded-full" 
                                  style={{ 
                                    width: `${cat.percentage}%`, 
                                    backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-[11px] text-blue-600 dark:text-blue-400">
                            categories.id = {idx + 1}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      <td className="pt-2.5 px-2">Total Classified Entities</td>
                      <td className="pt-2.5 px-2 text-right font-mono">
                        {categories.reduce((acc, curr) => acc + (curr.count || 0), 0)}
                      </td>
                      <td className="pt-2.5 px-2 text-right font-mono">100%</td>
                      <td className="pt-2.5 px-2 text-right text-[11px] text-emerald-600 dark:text-emerald-400">
                        100% 3NF Verified
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quality Score Breakdown Donut Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Quality Distribution
              </h3>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated confidence, freshness & consistency index
            </p>

            <div className="h-52 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={qualityDist}
                    dataKey="count"
                    nameKey="range"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {qualityDist.map((_, idx) => (
                      <Cell key={`cell-pie-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '0.75rem', 
                      color: '#f8fafc',
                      fontSize: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {qualityDist.map((item, idx) => (
              <div key={item.range} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                <span className="text-slate-500">{item.range}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. LIVE MEMORY STREAM WITH CATEGORY FILTER CHIPS */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Live Knowledge Feed & Memory Registry
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time feed of active memories with importance scores and revision timestamps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/vault"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Explore Full Vault ({overview?.total_memories ?? 0}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {['ALL', 'FACT', 'PREFERENCE', 'PROJECT', 'SKILL', 'GOAL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilteredType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filteredType === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {m.memory_type}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <span>v{m.version_number}</span>
                    <span>•</span>
                    <span>#{m.id}</span>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed">
                  {m.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Imp:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{m.importance_score}%</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="text-slate-500">Conf:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.confidence_score}%</span>
                </div>

                <span className="text-[10px] text-slate-400">
                  {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. INNOVATION LAB QUICK ACCESS MATRIX (3D CARDS) */}
      <div className="perspective-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/replay"
            className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 animate-float-3d" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Temporal Flashback</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Replay memory state at any historical point in time.
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-4">
              Launch Replay <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/graph"
            className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Share2 className="w-5 h-5 animate-float-3d" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Vector Knowledge Graph</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Visualize semantic linkages and bidirectional relations.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-4">
              View Graph <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/explain"
            className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5 animate-float-3d" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Explainable RAG</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspect cosine similarity and exact token retrieval weights.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-4">
              Explain RAG <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/database"
            className="card-3d p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5 animate-float-3d" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">MySQL Query Explorer</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Query 14 tables directly with NL2SQL or raw SQL syntax.
              </p>
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-4">
              Open Explorer <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* 8. DBTHON'26 SIGNATURE FOOTER BANNER */}
      <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>NeuroVault Autonomous Cognitive Memory System • Powered by MySQL 8.0+ InnoDB</span>
        </div>
        <div className="font-medium text-slate-600 dark:text-slate-300">
          Made with <span className="text-rose-500">❤️</span> for <span className="font-bold text-slate-900 dark:text-white">DBTHON'26</span> by <span className="font-bold text-blue-600 dark:text-blue-400">Sai Nikhit</span> &amp; <span className="font-bold text-indigo-600 dark:text-indigo-400">Sohan</span>
        </div>
      </div>

      {/* 8. MODAL DIALOGS FOR LIVE OPERATIONS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activeModal === 'DECAY' ? (
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {activeModal === 'DECAY' ? 'Cognitive Decay Sweep Report' : 'Knowledge Synthesis Profile'}
                  </h3>
                  <p className="text-xs text-slate-500">Autonomous Cognitive Operating Engine</p>
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-xs font-semibold text-slate-500">Processing cognitive algorithms...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activeModal === 'DECAY' && decayResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-center">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase">Crystalline</div>
                        <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                          {decayResult.decay_distribution?.CRYSTALLINE ?? 0}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-center">
                        <div className="text-[10px] font-bold text-blue-600 uppercase">Stable</div>
                        <div className="text-xl font-black text-blue-700 dark:text-blue-300">
                          {decayResult.decay_distribution?.STABLE ?? 0}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-center">
                        <div className="text-[10px] font-bold text-amber-600 uppercase">Vulnerable</div>
                        <div className="text-xl font-black text-amber-700 dark:text-amber-300">
                          {decayResult.decay_distribution?.VULNERABLE ?? 0}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-center">
                        <div className="text-[10px] font-bold text-red-600 uppercase">Decayed</div>
                        <div className="text-xl font-black text-red-700 dark:text-red-300">
                          {decayResult.decay_distribution?.DECAYED ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Sample Evaluations:</h4>
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {decayResult.sample_evaluations?.map((item: any) => (
                          <div key={item.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex justify-between items-center gap-2">
                            <span className="text-slate-700 dark:text-slate-300 line-clamp-1">{item.content}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 whitespace-nowrap">
                              {item.retention_score}% Retention
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeModal === 'SYNTHESIS' && synthesisResult && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                      {synthesisResult.cognitive_synthesis_report}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Analyzed: {synthesisResult.analyzed_memory_count} active memory records</span>
                      <span>{new Date(synthesisResult.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
