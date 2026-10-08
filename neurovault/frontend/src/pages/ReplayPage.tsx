import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { 
  History, Calendar, Play, CheckCircle2, Archive, 
  Layers, Clock, Filter, ArrowRight, RotateCcw, Brain, Sparkles, ChevronRight
} from 'lucide-react';
import { CognitiveLoadingScreen } from '../components/CognitiveLoadingScreen';

export const ReplayPage: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [replayData, setReplayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReplay = async (dateStr?: string) => {
    setLoading(true);
    try {
      const data = await apiService.replayMemory(dateStr ? `${dateStr}T23:59:59` : undefined);
      setReplayData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplay(targetDate);
  }, []);

  const handleRunReplay = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReplay(targetDate);
  };

  const presetDates = [
    { label: 'Today (Live State)', daysAgo: 0 },
    { label: '7 Days Ago', daysAgo: 7 },
    { label: '30 Days Ago', daysAgo: 30 },
    { label: '60 Days Ago', daysAgo: 60 }
  ];

  const handleSelectPreset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    setTargetDate(dateStr);
    fetchReplay(dateStr);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              P1 Temporal Feature
            </span>
            <span className="text-xs text-slate-400">• Point-in-Time Reconstruction</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            Memory Replay & Historical State Inspector
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Reconstruct what the AI assistant knew at any historical date. Uses MySQL <code className="font-mono text-blue-600">memory_versions</code> and triggers to time-travel without overwriting active data.
          </p>
        </div>

        {/* Date Selector Form */}
        <form onSubmit={handleRunReplay} className="flex gap-2 w-full md:w-auto">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Replay Date
          </button>
        </form>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mr-1">
          <Clock className="w-3.5 h-3.5" /> Quick Timelines:
        </span>
        {presetDates.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(p.daysAgo)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Replay Results */}
      {loading ? (
        <CognitiveLoadingScreen
          featureName="Temporal Memory Replay & Point-in-Time Reconstruction"
          subtitle="Reconstructing relational snapshot from MySQL memory_versions & trigger audit tables..."
        />
      ) : replayData && (
        <div className="space-y-6">
          {/* Summary KPI Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Snapshot Target</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {new Date(replayData.replay_timestamp).toLocaleDateString()}
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Known Active Memories</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {replayData.active_memories_count}
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Archived at That Time</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {replayData.archived_memories_count}
              </p>
            </div>
          </div>

          {/* Active Memories at that Point in Time */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              Reconstructed Active Knowledge Vault ({replayData.active_memories?.length || 0})
            </h3>

            {replayData.active_memories?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active memories existed on or prior to this date.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {replayData.active_memories?.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="text-blue-600 font-mono">#{m.id}</span>
                        <span>{m.summary || 'Memory Item'}</span>
                      </span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-mono">
                        v{m.version_at_date}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {m.content}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between">
                      <span>Type: {m.memory_type}</span>
                      <span>Created: {new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
