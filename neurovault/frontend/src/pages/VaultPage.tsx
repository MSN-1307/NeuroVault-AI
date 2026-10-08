import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Memory } from '../types';
import { 
  Search, Plus, Archive, Trash2, RotateCcw, 
  ExternalLink, Filter, Shield, Tag as TagIcon, Clock, CheckCircle2,
  Sparkles, History, Layers, AlertCircle, X, Edit3, Save, Pin, GitMerge
} from 'lucide-react';
import { CognitiveLoadingScreen } from '../components/CognitiveLoadingScreen';

export const VaultPage: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Edit & Details modal
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editContent, setEditContent] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // New Memory Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('FACT');
  const [newImportance, setNewImportance] = useState(70);

  const loadMemories = async () => {
    setLoading(true);
    try {
      const data = await apiService.getMemories({
        status: statusFilter || undefined,
        search: search || undefined
      });
      setMemories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMemories();
  };

  // Multi-select for consolidation
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [consolidating, setConsolidating] = useState(false);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleTogglePin = async (id: number, currentPinned: boolean) => {
    try {
      await apiService.pinMemory(id, !currentPinned);
      loadMemories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConsolidateSelected = async () => {
    if (selectedIds.length < 2) return;
    setConsolidating(true);
    try {
      await apiService.consolidateMemories(selectedIds);
      setSelectedIds([]);
      loadMemories();
    } catch (err) {
      console.error(err);
    } finally {
      setConsolidating(false);
    }
  };

  const handleArchive = async (id: number) => {
    await apiService.archiveMemory(id);
    loadMemories();
  };

  const handleRestore = async (id: number) => {
    await apiService.restoreMemory(id);
    loadMemories();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to mark this memory as deleted?')) {
      await apiService.deleteMemory(id);
      loadMemories();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    await apiService.createMemory({
      content: newContent,
      memory_type: newType,
      importance_score: newImportance,
      confidence_score: 90
    });
    setNewContent('');
    setShowCreateModal(false);
    loadMemories();
  };

  const handleOpenEdit = (m: Memory) => {
    setEditingMemory(m);
    setEditContent(m.content);
  };

  const handleSaveEdit = async () => {
    if (!editingMemory || !editContent.trim()) return;
    setSavingEdit(true);
    try {
      await apiService.updateMemory(editingMemory.id, { content: editContent.trim() });
      setEditingMemory(null);
      loadMemories();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories via MySQL FULLTEXT boolean index..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CONFLICTED">Conflicted</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {selectedIds.length >= 2 && (
            <button
              onClick={handleConsolidateSelected}
              disabled={consolidating}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer animate-pulse"
            >
              <GitMerge className="w-4 h-4" />
              Consolidate ({selectedIds.length})
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>
      </div>

      {/* Memories Grid */}
      {loading ? (
        <CognitiveLoadingScreen
          featureName="Memory Vault & ACID Versioning Store"
          subtitle="Querying partitioned memories, versions, and tags from MySQL 8.0+..."
        />
      ) : memories.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          No memories found matching current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {memories.map((m) => (
            <div
              key={m.id}
              className={`p-6 rounded-3xl border bg-white dark:bg-slate-900 shadow-xs transition-all flex flex-col justify-between ${
                m.status === 'CONFLICTED'
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(m.id)}
                      onChange={() => handleToggleSelect(m.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Select for Consolidation"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                      {m.memory_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {m.summary?.startsWith('[PINNED]') && (
                      <span className="p-1 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                        <Pin className="w-3 h-3 fill-current" />
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : m.status === 'CONFLICTED'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 line-clamp-1">
                  {m.summary || 'Memory Record'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {m.content}
                </p>

                {m.tags && m.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {m.tags.map((t) => (
                      <span key={t} className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="text-[11px] text-slate-400 font-mono">
                  v{m.version_number} • Imp: <span className="font-bold text-slate-700 dark:text-slate-300">{m.importance_score}%</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTogglePin(m.id, Boolean(m.summary?.startsWith('[PINNED]')))}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      m.summary?.startsWith('[PINNED]')
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                        : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={m.summary?.startsWith('[PINNED]') ? 'Unpin Memory' : 'Pin Memory for Priority Boost'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${m.summary?.startsWith('[PINNED]') ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit & Trigger MySQL Version Snapshot"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {m.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleArchive(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Archive"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {m.status === 'ARCHIVED' && (
                    <button
                      onClick={() => handleRestore(m.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Restore"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Memory Modal (Demonstrating BEFORE UPDATE trigger) */}
      {editingMemory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Edit Memory #{editingMemory.id}
              </h3>
              <button onClick={() => setEditingMemory(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Editing this content will fire the MySQL <code className="font-mono text-blue-600">BEFORE UPDATE</code> trigger, automatically creating a version snapshot in <code className="font-mono text-blue-600">memory_versions</code>.
            </p>

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={4}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingMemory(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {savingEdit ? 'Updating Trigger...' : 'Save & Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Memory Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Create New Memory
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Memory Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  required
                  placeholder="e.g. User maintains microservices in Go..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="FACT">FACT</option>
                    <option value="PREFERENCE">PREFERENCE</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="SKILL">SKILL</option>
                    <option value="PERSONAL">PERSONAL</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Importance (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newImportance}
                    onChange={(e) => setNewImportance(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-sm"
              >
                Create Memory
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
