import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { 
  Sparkles, Layers, History, ShieldAlert, 
  Cpu, ArrowRight, CheckCircle2, Zap, Clock, ShieldCheck, Database,
  BrainCircuit, Activity, Leaf, AlertTriangle, RefreshCw, BarChart2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const InnovationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'vector-graph' | 'temporal' | 'cognitive' | 'energy' | 'workload' | 'security' | 'tuning'
  >('cognitive');

  // Vector-Graph state
  const [vgQuery, setVgQuery] = useState('MySQL architecture and projects');
  const [vgResult, setVgResult] = useState<any>(null);
  const [vgLoading, setVgLoading] = useState(false);

  // Temporal state
  const [temporalResult, setTemporalResult] = useState<any>(null);
  const [temporalLoading, setTemporalLoading] = useState(false);

  // Security state
  const [securityData, setSecurityData] = useState<any>(null);
  const [securityLoading, setSecurityLoading] = useState(false);

  // Tuning state
  const [tuningData, setTuningData] = useState<any>(null);
  const [tuningLoading, setTuningLoading] = useState(false);

  // Cognitive State
  const [decayResult, setDecayResult] = useState<any>(null);
  const [decayLoading, setDecayLoading] = useState(false);
  const [synthesisResult, setSynthesisResult] = useState<any>(null);
  const [synthesisLoading, setSynthesisLoading] = useState(false);

  // Energy & Workload State
  const [energyQuery, setEnergyQuery] = useState('SELECT id, content, importance_score FROM memories WHERE status = "ACTIVE"');
  const [energyResult, setEnergyResult] = useState<any>(null);
  const [energyLoading, setEnergyLoading] = useState(false);

  const [workloadData, setWorkloadData] = useState<any>(null);
  const [workloadLoading, setWorkloadLoading] = useState(false);

  const [qualityData, setQualityData] = useState<any>(null);
  const [qualityLoading, setQualityLoading] = useState(false);

  // Auto-fetch data on tab switch
  useEffect(() => {
    if (activeTab === 'cognitive' && !decayResult) {
      loadCognitiveDecay();
    } else if (activeTab === 'energy' && !energyResult) {
      runEnergyProfile();
    } else if (activeTab === 'workload' && !workloadData) {
      loadWorkload();
    } else if (activeTab === 'temporal' && !temporalResult) {
      loadTemporal();
    } else if (activeTab === 'security' && !securityData) {
      loadSecurity();
    } else if (activeTab === 'tuning' && !tuningData) {
      loadTuning();
    }
  }, [activeTab]);

  const loadCognitiveDecay = async () => {
    setDecayLoading(true);
    try {
      const res = await apiService.runCognitiveDecaySweep();
      setDecayResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDecayLoading(false);
    }
  };

  const runConceptSynthesis = async () => {
    setSynthesisLoading(true);
    try {
      const res = await apiService.runConceptSynthesis();
      setSynthesisResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSynthesisLoading(false);
    }
  };

  const runEnergyProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEnergyLoading(true);
    try {
      const res = await apiService.profileQueryEnergy(energyQuery);
      setEnergyResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setEnergyLoading(false);
    }
  };

  const loadWorkload = async () => {
    setWorkloadLoading(true);
    setQualityLoading(true);
    try {
      const [wl, qd] = await Promise.all([
        apiService.getWorkloadHeatmaps(),
        apiService.getDataQualityAudit()
      ]);
      setWorkloadData(wl);
      setQualityData(qd);
    } catch (err) {
      console.error(err);
    } finally {
      setWorkloadLoading(false);
      setQualityLoading(false);
    }
  };

  const runVectorGraph = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVgLoading(true);
    try {
      const res = await apiService.traverseVectorGraph(vgQuery, 2);
      setVgResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setVgLoading(false);
    }
  };

  const loadTemporal = async () => {
    setTemporalLoading(true);
    try {
      const res = await apiService.temporalFlashback();
      setTemporalResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTemporalLoading(false);
    }
  };

  const loadSecurity = async () => {
    setSecurityLoading(true);
    try {
      const res = await apiService.getSecurityAudit();
      setSecurityData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSecurityLoading(false);
    }
  };

  const loadTuning = async () => {
    setTuningLoading(true);
    try {
      const res = await apiService.getTuningRecommendations();
      setTuningData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTuningLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Next-Gen Database & Cognitive Innovations Lab
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Neuro-Symbolic Memory Decay, Concept Induction, Energy/Carbon Profiling, Adaptive Indexing & Vector-Graph Traversal.
          </p>
        </div>
      </div>

      {/* Innovation Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <button
          onClick={() => setActiveTab('cognitive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'cognitive'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Cognitive Decay & Synthesis
        </button>

        <button
          onClick={() => setActiveTab('energy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'energy'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Leaf className="w-4 h-4 text-emerald-500" />
          Energy & Carbon Profiler
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'workload'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-500" />
          Workload Heatmaps & Quality
        </button>

        <button
          onClick={() => setActiveTab('vector-graph')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'vector-graph'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Vector-Graph Traversal
        </button>

        <button
          onClick={() => setActiveTab('temporal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'temporal'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          Temporal Flashback
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Security Anomaly Audit
        </button>

        <button
          onClick={() => setActiveTab('tuning')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tuning'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          InnoDB Tuning
        </button>
      </div>

      {/* TAB: Cognitive Memory Decay & Concept Synthesis */}
      {activeTab === 'cognitive' && (
        <div className="space-y-6">
          {/* Ebbinghaus Forgetting Curve Sweep */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-blue-600" />
                  Ebbinghaus Memory Retention Decay Curve & Spaced Reinforcement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  R(t) = exp(-t / (S * (1 + ln(1 + n_access))))
                </p>
              </div>
              <button
                onClick={loadCognitiveDecay}
                disabled={decayLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${decayLoading ? 'animate-spin' : ''}`} />
                Run Retention Decay Sweep
              </button>
            </div>

            {decayResult && (
              <div className="space-y-4">
                {/* Distribution Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Crystalline (&gt;80%)</span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {decayResult.decay_distribution?.CRYSTALLINE || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Stable (50-80%)</span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {decayResult.decay_distribution?.STABLE || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Vulnerable (25-50%)</span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {decayResult.decay_distribution?.VULNERABLE || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Decayed (&lt;25%)</span>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {decayResult.decay_distribution?.DECAYED || 0}
                    </p>
                  </div>
                </div>

                {/* Sample items table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500">
                      <tr>
                        <th className="py-2.5 px-3">Memory Content</th>
                        <th className="py-2.5 px-3">Days Elapsed</th>
                        <th className="py-2.5 px-3">Calculated Retention</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {decayResult.sample_evaluations?.map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{m.content}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{m.days_elapsed} d</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{m.retention_score}%</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.classification === 'CRYSTALLINE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                              m.classification === 'STABLE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                              m.classification === 'VULNERABLE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {m.classification}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sleep Cycle Concept Induction / Synthesis */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Autonomous Sleep-Cycle Concept Induction & Knowledge Synthesis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Deduces high-order behavioral rules and overarching mental models across episodic memory fragments.
                </p>
              </div>
              <button
                onClick={runConceptSynthesis}
                disabled={synthesisLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${synthesisLoading ? 'animate-spin' : ''}`} />
                Induce High-Order Rules
              </button>
            </div>

            {synthesisResult && (
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {synthesisResult.cognitive_synthesis_report}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Energy & Carbon Profiler */}
      {activeTab === 'energy' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-500" />
              Green Database: Real-Time Query Energy & Carbon Profiler
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Computes CPU cycle watt-hours, InnoDB buffer pool hit ratios, and estimated carbon emission footprint (µg CO2e) per SQL transaction.
            </p>
          </div>

          <form onSubmit={runEnergyProfile} className="space-y-3">
            <textarea
              value={energyQuery}
              onChange={(e) => setEnergyQuery(e.target.value)}
              rows={2}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter SQL query to profile energy..."
            />
            <button
              type="submit"
              disabled={energyLoading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Leaf className="w-3.5 h-3.5" />
              Profile Query Joules & Carbon
            </button>
          </form>

          {energyResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Energy Consumption</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {energyResult.estimated_energy_millijoules} mJ
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">TDP scaled model</span>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900">
                  <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">Carbon Footprint</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {energyResult.estimated_carbon_footprint_micrograms} µg
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">CO2 equivalent</span>
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">Buffer Hit Ratio</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                    {energyResult.innodb_buffer_hit_rate_pct}%
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">Zero disk seek overhead</span>
                </div>

                <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Efficiency Grade</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {energyResult.energy_efficiency_rating}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{energyResult.execution_time_ms} ms</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">DBMS Green Optimization: </span>
                {energyResult.optimization_tip}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Workload Heatmaps & Data Quality Audit */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          {/* Workload heatmaps */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Adaptive Workload Heatmaps & Query Pattern Frequencies
            </h3>
            {workloadData?.workload_heatmaps && (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData.workload_heatmaps}>
                    <XAxis dataKey="pattern" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {workloadData.workload_heatmaps.map((_: any, idx: number) => (
                        <Cell key={`bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Data Quality & Anomaly Detection */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Data Quality & Semantic Anomaly Pipeline
              </h3>
              {qualityData && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Health Grade: {qualityData.health_grade} ({qualityData.data_health_score}/100)
                </span>
              )}
            </div>

            {qualityData && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Total Scanned</span>
                    <p className="text-base font-bold text-slate-800 dark:text-white mt-1">{qualityData.total_records_scanned}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Missing Embeddings</span>
                    <p className="text-base font-bold text-rose-600 mt-1">{qualityData.detected_anomalies?.missing_embeddings}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Low Confidence Outliers</span>
                    <p className="text-base font-bold text-amber-600 mt-1">{qualityData.detected_anomalies?.low_confidence_anomalies}</p>
                  </div>
                </div>

                {qualityData.anomalous_records?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Flagged Anomaly Items</h4>
                    {qualityData.anomalous_records.map((ano: any, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl text-xs flex justify-between items-center">
                        <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">Memory #{ano.id} • {ano.anomaly_type}</span>
                        <span className="text-slate-500">{ano.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: Vector-Graph Unification */}
      {activeTab === 'vector-graph' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Unified Vector Embedding & Multi-Hop Graph Traversal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Locates seed memory nodes via Cosine Similarity on MySQL JSON vectors, then immediately executes a 2-hop BFS graph walk through <code className="font-mono text-blue-600">memory_relations</code>.
            </p>
          </div>

          <form onSubmit={runVectorGraph} className="flex gap-2">
            <input
              type="text"
              value={vgQuery}
              onChange={(e) => setVgQuery(e.target.value)}
              placeholder="Search query to seed vector graph walk..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={vgLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              Traverse Graph
            </button>
          </form>

          {vgResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900">
                  <span className="text-slate-500">Seed Nodes</span>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1">{vgResult.seed_nodes_count}</p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900">
                  <span className="text-slate-500">Traversed Nodes</span>
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-1">{vgResult.traversed_nodes_count}</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <span className="text-slate-500">Connected Edges</span>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">{vgResult.connected_edges_count}</p>
                </div>
              </div>

              {/* Traversed Paths */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Multi-Hop Traversal Walks</h4>
                {vgResult.traversal_paths?.map((path: string, idx: number) => (
                  <div key={idx} className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {path}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Temporal Flashback */}
      {activeTab === 'temporal' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Point-in-Time Historical Flashback Queries
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Reconstructs past states of the database using MySQL BEFORE UPDATE triggers & <code className="font-mono text-blue-600">memory_versions</code>.
              </p>
            </div>
            <button
              onClick={loadTemporal}
              disabled={temporalLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Clock className="w-3.5 h-3.5" />
              Reconstruct Current State
            </button>
          </div>

          {temporalResult && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs">
                <span className="font-bold text-blue-800 dark:text-blue-300">Snapshot Timestamp: </span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{temporalResult.snapshot_timestamp}</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Memory ID</th>
                      <th className="py-2.5 px-3">Content</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Effective Version</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {temporalResult.memories?.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">#{m.id}</td>
                        <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{m.content}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {m.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">v{m.effective_version}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Security & Privacy */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              Dynamic Data Masking (DDM) & Query Burst Anomaly Detection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Protects sensitive records via real-time regex redaction and analyzes access spikes in <code className="font-mono text-blue-600">memory_access_logs</code>.
            </p>
          </div>

          {securityLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Scanning access logs and privacy rules...</div>
          ) : securityData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
                  <span className="text-slate-500">Query Burst Threat Level</span>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {securityData.anomaly_detection?.threat_level}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900">
                  <span className="text-slate-500">Recent Access Volume</span>
                  <p className="text-base font-bold text-blue-700 dark:text-blue-300 mt-1">
                    {securityData.anomaly_detection?.recent_access_count} requests in 10m
                  </p>
                </div>
              </div>

              {/* Sample Masked Memories */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Dynamic Masking Verification (Masked PII)</h4>
                {securityData.masked_memories_sample?.map((mem: any) => (
                  <div key={mem.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">Memory #{mem.id}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-semibold">
                        {mem.is_sensitive ? 'SENSITIVE (MASKED)' : 'STANDARD'}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-mono text-[11px]">{mem.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Tuning */}
      {activeTab === 'tuning' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Automated Workload Tuning & Adaptive Index Recommendations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Evaluates MySQL InnoDB system variables, table fragmentation, and proposes automated compound index speedups.
            </p>
          </div>

          {tuningLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Analyzing query workload metrics...</div>
          ) : tuningData && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Adaptive Index Recommendations</h4>
                {tuningData.automated_index_recommendations?.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{rec.proposed_index}</span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        {rec.estimated_speedup}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{rec.reason}</p>
                  </div>
                ))}
              </div>

              {/* Engine Tuning Parameters */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">InnoDB Engine Configuration</h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {tuningData.system_tuning_parameters && Object.entries(tuningData.system_tuning_parameters).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-slate-400">{k}:</span> <span className="text-slate-800 dark:text-slate-200 font-semibold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
