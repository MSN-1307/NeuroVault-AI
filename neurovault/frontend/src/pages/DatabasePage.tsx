import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { DatabaseTable } from '../types';
import { 
  Table2, Key, Database, Play, Terminal, 
  CheckCircle2, RefreshCw, Eye, Sparkles, Layers,
  Wand2, Clock, Cpu, BarChart2, Zap
} from 'lucide-react';
import { CognitiveLoadingScreen } from '../components/CognitiveLoadingScreen';

export const DatabasePage: React.FC = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('memories');
  const [sampleData, setSampleData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  // Raw SQL Console state
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT id, memory_type, content, importance_score, status FROM memories LIMIT 5;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string>('');
  const [queryRunning, setQueryRunning] = useState(false);

  // Natural Language to SQL state
  const [nlQuery, setNlQuery] = useState<string>('Show me all high importance active memories');
  const [nlResult, setNlResult] = useState<any>(null);
  const [nlRunning, setNlRunning] = useState(false);
  const [nlError, setNlError] = useState('');

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [tablesData, metricsData] = await Promise.all([
          apiService.getDatabaseTables(),
          apiService.getDbmsMetrics()
        ]);
        setTables(tablesData);
        setMetrics(metricsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  useEffect(() => {
    if (!selectedTable) return;
    const fetchSample = async () => {
      setLoadingSample(true);
      try {
        const res = await apiService.getTableSampleData(selectedTable);
        setSampleData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSample(false);
      }
    };
    fetchSample();
  }, [selectedTable]);

  const handleRunQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setQueryError('');
    setQueryResult(null);
    setQueryRunning(true);
    try {
      const res = await apiService.executeCustomQuery(sqlQuery);
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err?.response?.data?.detail || 'Error executing SQL query.');
    } finally {
      setQueryRunning(false);
    }
  };

  const handleRunNl2Sql = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim() || nlRunning) return;
    setNlError('');
    setNlResult(null);
    setNlRunning(true);
    try {
      const res = await apiService.naturalLanguageToSql(nlQuery);
      setNlResult(res);
    } catch (err: any) {
      setNlError(err?.response?.data?.detail || 'Error translating natural language to SQL.');
    } finally {
      setNlRunning(false);
    }
  };

  const nlQuickPrompts = [
    'Show me all high importance active memories',
    'Find conflicting preferences requiring review',
    'Count memories grouped by category with average importance',
    'Select recent 10 created memories ordered by timestamp'
  ];

  if (loading) {
    return (
      <CognitiveLoadingScreen
        featureName="MySQL 8.0+ Schema Explorer & NL2SQL Console"
        subtitle="Inspecting 14 relational tables, InnoDB WAL buffer metrics, and SQL query compiler..."
      />
    );
  }

  const currentTableMeta = tables.find((t) => t.table_name === selectedTable);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Intelligent Query Processing & MySQL Explorer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Natural Language to SQL compiler, EXPLAIN plan optimizer, 3NF schema browser, and live SQL execution.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            NL2SQL Engine Active
          </span>
        </div>
      </div>

      {/* Advanced DBMS Architecture KPI Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Normalization</span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{metrics.normalization.split('(')[0]}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">3NF Zero Redundancy</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Foreign Key Constraints</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{metrics.foreign_key_relations} FK Enforcements</span>
            <p className="text-[10px] text-slate-500 mt-0.5">ON DELETE CASCADE/SET NULL</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">FullText & B-Tree Indexes</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{metrics.indexes_active} Active Indexes</span>
            <p className="text-[10px] text-slate-500 mt-0.5">FULLTEXT Boolean key</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Triggers & Views</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{metrics.active_triggers} Triggers • {metrics.views_configured} Views</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Auto-versioning snapshot</p>
          </div>
        </div>
      )}

      {/* FEATURE 1: Natural Language to SQL (NL2SQL) Intelligent Query Processing */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-blue-200/80 dark:border-blue-900/60 shadow-md space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Natural Language to SQL (NL2SQL Engine)
          </h3>
          <span className="text-[11px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200/60 dark:border-blue-800">
            Intelligent Compiler
          </span>
        </div>

        <form onSubmit={handleRunNl2Sql} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="E.g., Find conflicting preferences or Show memories grouped by category..."
              className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={nlRunning || !nlQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {nlRunning ? 'Compiling...' : 'Translate & Run'}
            </button>
          </div>

          {/* Quick chip suggestions */}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {nlQuickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNlQuery(p)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </form>

        {nlError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-mono">
            {nlError}
          </div>
        )}

        {/* Translation & Execution Breakdown */}
        {nlResult && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Query Intent & Logic</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">{nlResult.explanation}</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Execution Profile</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  {nlResult.execution.execution_time_ms} ms Latency • {nlResult.execution.row_count} rows
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Target Entities</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 text-xs">
                  {nlResult.target_tables.join(', ')}
                </span>
              </div>
            </div>

            {/* Compiled SQL Query */}
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Generated MySQL Statement</span>
              <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
                {nlResult.generated_sql}
              </pre>
            </div>

            {/* Results Table */}
            {nlResult.execution.rows && nlResult.execution.rows.length > 0 && (
              <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0 font-mono text-[11px] text-slate-500">
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      {nlResult.execution.columns.map((c: string) => (
                        <th key={c} className="py-2.5 px-3 whitespace-nowrap">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {nlResult.execution.rows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-[11px]">
                        {nlResult.execution.columns.map((col: string) => (
                          <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 max-w-xs truncate">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FEATURE 2: Interactive Read-Only SQL Console */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-600" />
            Live SQL Query Console (SELECT Mode)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Directly test MySQL queries for evaluation
          </span>
        </div>

        <form onSubmit={handleRunQuery} className="space-y-3">
          <div className="relative">
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={3}
              placeholder="SELECT * FROM memories WHERE status = 'ACTIVE' LIMIT 10;"
              className="w-full p-3.5 font-mono text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => setSqlQuery('SELECT id, name, email, role FROM users;')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Sample: users
              </button>
              <button
                type="button"
                onClick={() => setSqlQuery('SELECT memory_id, user_name, category_name, content, tags_list FROM vw_active_memory_summary;')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Sample: View (Active Summary)
              </button>
              <button
                type="button"
                onClick={() => setSqlQuery('SELECT memory_id, version_number, change_reason, changed_by, created_at FROM memory_versions;')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Sample: Trigger Versions
              </button>
            </div>

            <button
              type="submit"
              disabled={queryRunning}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              {queryRunning ? 'Executing...' : 'Execute Query'}
            </button>
          </div>
        </form>

        {queryError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-mono">
            {queryError}
          </div>
        )}

        {queryResult && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex justify-between">
              <span>Query Result: {queryResult.row_count} rows returned</span>
              <span className="text-emerald-600 font-mono">{queryResult.execution_time_ms} ms</span>
            </div>
            <div className="overflow-x-auto max-h-64 rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 sticky top-0">
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {queryResult.columns.map((c: string) => (
                      <th key={c} className="py-2.5 px-3 whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {queryResult.rows.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-[11px]">
                      {queryResult.columns.map((col: string) => (
                        <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200 max-w-xs truncate">
                          {typeof r[col] === 'object' ? JSON.stringify(r[col]) : String(r[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Tables Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase px-3 py-2">Entities ({tables.length})</h3>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {tables.map((t) => (
              <button
                key={t.table_name}
                onClick={() => setSelectedTable(t.table_name)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTable === t.table_name
                    ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Table2 className="w-3.5 h-3.5" />
                  <span>{t.table_name}</span>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                  {t.row_count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span>Table Schema:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">{selectedTable}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-2.5 px-3">Column Name</th>
                    <th className="py-2.5 px-3">Data Type</th>
                    <th className="py-2.5 px-3">Nullable</th>
                    <th className="py-2.5 px-3">Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentTableMeta?.columns.map((c) => (
                    <tr key={c.name} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 font-mono text-[11px]">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {c.key === 'PRI' && <Key className="w-3 h-3 text-amber-500" />}
                        {c.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{c.type}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{c.nullable}</td>
                      <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400">{c.key || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
