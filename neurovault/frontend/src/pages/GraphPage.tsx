import React, { useEffect, useState, useRef, useMemo } from 'react';
import { apiService } from '../services/api';
import { GraphNode, GraphEdge } from '../types';
import { 
  Layers, Info, Sparkles, Share2, Database, 
  ShieldCheck, AlertTriangle, ArrowRight, RefreshCw, ZoomIn, ZoomOut,
  Maximize2, Eye, Compass, Search, Filter, Cpu, CheckCircle2
} from 'lucide-react';
import { CognitiveLoadingScreen } from '../components/CognitiveLoadingScreen';

export const GraphPage: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');

  const canvasRef = useRef<HTMLDivElement>(null);

  const fetchGraph = async () => {
    try {
      const res = await apiService.getGraph();
      const rawNodes = res.nodes || [];
      const rawEdges = res.edges || [];
      setNodes(rawNodes);
      setEdges(rawEdges);
      if (rawNodes.length > 0 && !selectedNode) {
        setSelectedNode(rawNodes[0]);
      }
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGraph();
  };

  // Color mapping per entity type
  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'FACT': return { bg: '#3b82f6', text: '#93c5fd', border: '#2563eb', light: 'bg-blue-500/15 border-blue-500/30 text-blue-300' };
      case 'PROJECT': return { bg: '#10b981', text: '#6ee7b7', border: '#059669', light: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' };
      case 'PREFERENCE': return { bg: '#8b5cf6', text: '#c4b5fd', border: '#7c3aed', light: 'bg-purple-500/15 border-purple-500/30 text-purple-300' };
      case 'SKILL': return { bg: '#f59e0b', text: '#fcd34d', border: '#d97706', light: 'bg-amber-500/15 border-amber-500/30 text-amber-300' };
      case 'EDUCATION': return { bg: '#06b6d4', text: '#67e8f9', border: '#0891b2', light: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' };
      case 'GOAL': return { bg: '#ec4899', text: '#f472b6', border: '#db2777', light: 'bg-pink-500/15 border-pink-500/30 text-pink-300' };
      default: return { bg: '#64748b', text: '#cbd5e1', border: '#475569', light: 'bg-slate-500/15 border-slate-500/30 text-slate-300' };
    }
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchType = filterType === 'ALL' || n.type.toUpperCase() === filterType.toUpperCase();
      const matchSearch = !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase()) || (n.content && n.content.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [nodes, filterType, searchTerm]);

  // Dynamic visual layout for filtered nodes on a virtual 1000x800 coordinate plane
  const positionedNodes = useMemo(() => {
    const total = filteredNodes.length;
    if (total === 0) return [];
    
    // Group into concentric cluster rings based on type and importance
    return filteredNodes.map((node, i) => {
      // Use existing x/y if available or compute harmonic force layout
      const angle = (2 * Math.PI * i) / total;
      const baseRadius = 260;
      // High importance nodes sit closer to core
      const importanceJitter = (100 - (node.importance || 70)) * 1.5;
      const radius = baseRadius + importanceJitter;
      const x = 500 + radius * Math.cos(angle);
      const y = 400 + radius * Math.sin(angle);
      return {
        ...node,
        computedX: node.x ? node.x + 100 : x,
        computedY: node.y ? node.y + 100 : y,
      };
    });
  }, [filteredNodes]);

  // Create lookup dictionary for fast SVG edge rendering
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; node: any }>();
    positionedNodes.forEach(pn => {
      map.set(pn.id, { x: pn.computedX, y: pn.computedY, node: pn });
    });
    return map;
  }, [positionedNodes]);

  // Edges that connect visible nodes
  const visibleEdges = useMemo(() => {
    return edges.filter(e => nodePositionMap.has(e.source) && nodePositionMap.has(e.target));
  }, [edges, nodePositionMap]);

  // Edges connected to the selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [edges, selectedNode]);

  // Mouse pan drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.4), 2.2));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <CognitiveLoadingScreen
        featureName="Vector Knowledge Graph & Relational Topology"
        subtitle="Mapping bidirectional relational edges (memory_relations) & computing multi-hop clusters..."
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. TOP EDITORIAL HERO BANNER (Abatable Style) */}
      <div className="relative overflow-hidden bg-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-24 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="abatable-pill bg-blue-500/15 border-blue-500/30 text-blue-300">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span>Semantic Vector Mesh &amp; Topological Graph</span>
              </span>
              <span className="abatable-pill bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>MySQL 8.4 InnoDB Foreign Keys</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Relational Vector Knowledge Graph
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
              Interactive 2D topological canvas rendering real semantic vector connections, relational foreign keys (<code className="text-emerald-400 font-mono">memory_relations</code>), 
              and multi-hop cognitive clusters. Zero external graph database required.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sync Mesh</span>
            </button>
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 px-4 text-xs flex items-center gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Mesh Density</span>
                <span className="text-white font-bold text-sm font-mono">{nodes.length} Nodes • {edges.length} Edges</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Filter Bar & View Toggle */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'FACT', 'PROJECT', 'PREFERENCE', 'SKILL', 'EDUCATION', 'GOAL'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === type
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-900/70 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search graph entities..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('canvas')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'canvas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Mesh
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Entities
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: INTERACTIVE CANVAS + NODE DETAIL DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Graph Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="abatable-card p-4 relative overflow-hidden flex flex-col h-[650px] shadow-xl">
            {/* Canvas Control Floating Toolbar */}
            <div className="absolute top-6 left-6 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl text-white">
              <button
                onClick={() => handleZoom(0.15)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(-0.15)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold"
                title="Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 px-2 border-l border-slate-700">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Quick Status Legend Pill */}
            <div className="absolute top-6 right-6 z-20 hidden md:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 px-3.5 rounded-2xl text-[11px] text-slate-300 shadow-xl">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                <span>Vector Cosine Edge</span>
              </span>
              <span className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Relational FK</span>
              </span>
              <span className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Contradiction</span>
              </span>
            </div>

            {/* View Mode: Dynamic SVG 2D Canvas */}
            {viewMode === 'canvas' ? (
              <div
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden rounded-2xl bg-slate-950/90"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.06) 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}
              >
                <svg
                  className="w-full h-full absolute inset-0 transition-transform duration-75"
                  viewBox="0 0 1000 800"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: '500px 400px'
                  }}
                >
                  <defs>
                    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
                    </linearGradient>
                    <linearGradient id="conflictGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Render Visual Vector & Relational Edges */}
                  <g className="edges-layer">
                    {visibleEdges.map((edge) => {
                      const src = nodePositionMap.get(edge.source);
                      const tgt = nodePositionMap.get(edge.target);
                      if (!src || !tgt) return null;

                      const isSelectedEdge = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);
                      const isConflict = edge.type.toUpperCase().includes('CONFLICT') || edge.type.toUpperCase().includes('CONTRADICT');

                      return (
                        <g key={edge.id} className="transition-opacity">
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke={
                              isConflict
                                ? 'url(#conflictGrad)'
                                : isSelectedEdge
                                ? '#38bdf8'
                                : 'rgba(148, 163, 184, 0.25)'
                            }
                            strokeWidth={isSelectedEdge ? 2.5 : isConflict ? 2 : 1.2}
                            strokeDasharray={edge.id.startsWith('vec-') ? '4 3' : undefined}
                          />
                        </g>
                      );
                    })}
                  </g>

                  {/* Render Interactive Graph Nodes */}
                  <g className="nodes-layer">
                    {positionedNodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const isHovered = hoveredNode?.id === node.id;
                      const typeTheme = getTypeColor(node.type);
                      const isConflict = node.status === 'CONFLICTED';
                      const radius = isSelected ? 22 : isHovered ? 20 : 16;

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.computedX}, ${node.computedY})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                          }}
                          onMouseEnter={() => setHoveredNode(node)}
                          onMouseLeave={() => setHoveredNode(null)}
                          className="cursor-pointer transition-all duration-150"
                        >
                          {/* Outer Selection Glow Halo */}
                          {(isSelected || isHovered) && (
                            <circle
                              r={radius + 8}
                              fill="none"
                              stroke={isConflict ? '#f43f5e' : typeTheme.bg}
                              strokeWidth={2}
                              strokeOpacity={0.6}
                              filter="url(#glow)"
                            />
                          )}

                          {/* Node Main Circle */}
                          <circle
                            r={radius}
                            fill={isConflict ? '#881337' : '#0f172a'}
                            stroke={isConflict ? '#f43f5e' : isSelected ? '#ffffff' : typeTheme.bg}
                            strokeWidth={isSelected ? 3 : 2}
                          />

                          {/* Inner Type Indicator Dot */}
                          <circle
                            r={radius * 0.45}
                            fill={typeTheme.bg}
                          />

                          {/* Node Label Below */}
                          <text
                            y={radius + 14}
                            textAnchor="middle"
                            fill={isSelected ? '#ffffff' : '#cbd5e1'}
                            fontSize={isSelected ? '12px' : '10px'}
                            fontWeight={isSelected ? 'bold' : 'normal'}
                            className="pointer-events-none drop-shadow-md select-none font-sans"
                          >
                            {node.label.length > 20 ? node.label.slice(0, 18) + '...' : node.label}
                          </text>

                          {/* Node ID Badge Inside */}
                          <text
                            y={3}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8px"
                            fontWeight="bold"
                            className="pointer-events-none font-mono"
                          >
                            #{node.id}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Bottom Canvas Hints */}
                <div className="absolute bottom-4 left-6 z-10 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  <span>Click node to inspect • Drag to pan • Scroll/buttons to zoom</span>
                </div>
              </div>
            ) : (
              /* View Mode: Entity Cards Grid */
              <div className="w-full h-full overflow-y-auto p-4 space-y-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {positionedNodes.map((n) => {
                    const isSelected = selectedNode?.id === n.id;
                    const typeTheme = getTypeColor(n.type);
                    return (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNode(n)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                          isSelected
                            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-950/40 shadow-lg'
                            : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${typeTheme.light}`}>
                              {n.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">#{n.id}</span>
                          </div>
                          <p className="text-xs font-bold text-white line-clamp-2 leading-relaxed">
                            {n.label}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                          <span>Imp: <strong className="text-slate-200">{n.importance}%</strong></span>
                          <span>Conf: <strong className="text-emerald-400">{n.confidence}%</strong></span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Node Relational Detail & Edge Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {selectedNode ? (
            <div className="abatable-card p-6 space-y-5">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(selectedNode.type).light}`}>
                      {selectedNode.type} Entity
                    </span>
                    <span className="text-xs font-mono text-slate-400">Node #{selectedNode.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {selectedNode.label}
                  </h3>
                </div>
              </div>

              {/* Full Content Preview */}
              {selectedNode.content && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  {selectedNode.content}
                </div>
              )}

              {/* Importance & Confidence Telemetry */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Cognitive Importance</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedNode.importance}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${selectedNode.importance}%` }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Epistemic Confidence</span>
                    <span className="font-bold font-mono text-emerald-500">{selectedNode.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${selectedNode.confidence}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Connected Relationships & Vector Edges */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Relational Connections ({connectedEdges.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Multi-Hop Links</span>
                </div>

                {connectedEdges.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 text-center">
                    No active edges linked to this entity.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {connectedEdges.map((edge) => {
                      const otherId = edge.target === selectedNode.id ? edge.source : edge.target;
                      const otherNode = nodes.find(n => n.id === otherId);
                      const isVectorEdge = edge.id.startsWith('vec-');

                      return (
                        <div
                          key={edge.id}
                          onClick={() => otherNode && setSelectedNode(otherNode)}
                          className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-[10px] block">
                              {edge.type}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold text-[11px] line-clamp-1">
                              {otherNode ? otherNode.label : `Target #${otherId}`}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-mono text-emerald-500 font-bold">
                              {edge.confidence}% {isVectorEdge ? 'Sim' : 'Conf'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 ml-auto mt-0.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MySQL 3NF Verification Badge */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  <span>MySQL 3NF Foreign Keys</span>
                </span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Indexed</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="abatable-card p-12 text-center text-slate-400 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-xs">Click any node in the vector mesh to inspect relationships.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
