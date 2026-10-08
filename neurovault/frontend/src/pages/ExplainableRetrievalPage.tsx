import React, { useState } from 'react';
import { apiService } from '../services/api';
import { 
  Sparkles, CheckCircle2, HelpCircle, Layers, 
  ArrowRight, Brain, Zap, Target, ShieldCheck, Search
} from 'lucide-react';
import { CognitiveLoadingScreen } from '../components/CognitiveLoadingScreen';

export const ExplainableRetrievalPage: React.FC = () => {
  const [query, setQuery] = useState('What database architecture and tech stack does NeuroVault use?');
  const [explainResult, setExplainResult] = useState<any>(null);
  const [predictResult, setPredictResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'explain' | 'predict'>('explain');

  const handleRunExplain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const [exp, pred] = await Promise.all([
        apiService.explainRetrieval(query, 4),
        apiService.predictContext(query)
      ]);
      setExplainResult(exp);
      setPredictResult(pred);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'What database architecture and tech stack does NeuroVault use?',
    'What are my technical preferences for backend development?',
    'How does NeuroVault handle deduplication and triggers?'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              P1 Explainability & Prediction
            </span>
            <span className="text-xs text-slate-400">• NeuroVault RAG Glassbox</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Explainable Retrieval & Predictive Context
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Never wonder why an AI remembered something. Inspect mathematical score breakdowns across semantic similarity, keyword matching, importance weights, and recency.
          </p>
        </div>
      </div>

      {/* Query Search Form */}
      <form onSubmit={handleRunExplain} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any test query to explain retrieval weights..."
            className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            Explain Retrieval
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">Test presets:</span>
          {sampleQueries.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(q);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </form>

      {/* Sub Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('explain')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'explain'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Explainable Retrieval Breakdown
        </button>
        <button
          onClick={() => setActiveSubTab('predict')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'predict'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Predictive Context Candidates
        </button>
      </div>

      {/* Content Stream */}
      {loading ? (
        <CognitiveLoadingScreen
          featureName="Explainable RAG & Hybrid Scoring Engine"
          subtitle="Decomposing semantic cosine similarity, keyword density, and importance weights..."
        />
      ) : activeSubTab === 'explain' && explainResult ? (
        <div className="space-y-4">
          {explainResult.explained_results?.map((res: any, idx: number) => (
            <div
              key={res.id}
              className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md font-mono mr-2">
                    Rank #{idx + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {res.summary || `Memory #${res.id}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Retrieval Score:</span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {res.final_retrieval_score}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                "{res.content}"
              </p>

              {/* Score Breakdown Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Semantic</span>
                  <p className="text-sm font-bold text-blue-600 mt-0.5">{res.breakdown.semantic_similarity_pct}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Keyword</span>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">{res.breakdown.keyword_match_pct}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Importance</span>
                  <p className="text-sm font-bold text-amber-600 mt-0.5">{res.breakdown.importance_pct}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Confidence</span>
                  <p className="text-sm font-bold text-indigo-600 mt-0.5">{res.breakdown.confidence_pct}%</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Freshness</span>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">{res.breakdown.freshness_pct}%</p>
                </div>
              </div>

              {/* Natural Language Reasons */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Why this memory was retrieved:
                </span>
                <div className="flex flex-wrap gap-2">
                  {res.reasons.map((r: string, rIdx: number) => (
                    <span
                      key={rIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeSubTab === 'predict' && predictResult ? (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            Predicted Context Pool for Upcoming LLM Prompts
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            NeuroVault proactively evaluates query affinity to inject high-utility background knowledge before model inference.
          </p>

          <div className="space-y-3 pt-2">
            {predictResult.predicted_context_candidates?.map((cand: any) => (
              <div
                key={cand.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs flex justify-between items-center gap-4"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5">
                    {cand.title}
                  </div>
                  <span className="text-slate-400 text-[11px]">Type: {cand.memory_type} • Importance: {cand.importance}%</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 block mb-1">
                    {cand.suggested_action}
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{cand.affinity_score}% Affinity</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Click "Explain Retrieval" above to run glassbox diagnostics.
        </div>
      )}
    </div>
  );
};
