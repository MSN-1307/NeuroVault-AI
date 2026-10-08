import React, { useState, useRef } from 'react';
import { apiService } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  AreaChart, Area, PieChart, Pie
} from 'recharts';
import { 
  UploadCloud as UploadIcon, FileSpreadsheet as SheetIcon, Check as CheckIcon, 
  Copy as CopyIcon, Sparkles as SparkleIcon, AlertCircle as AlertIcon, 
  RefreshCw as RefreshIcon, Table2 as TableIcon, BarChart3 as ChartIcon, 
  FileText as FileDocIcon, CheckCircle2, TrendingUp, PieChart as PieIcon,
  Activity, Clock, Hash, BookOpen, Layers, Search, Download, Plus, ArrowRight,
  Database, Shield, Eye, Leaf, ShieldAlert, Cpu, Sparkles, ChevronRight
} from 'lucide-react';

export const DocumentIntelligencePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [autoExtract, setAutoExtract] = useState(true);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'overview' | 'graphs' | 'findings' | 'explorer'>('overview');
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'area' | 'pie' | 'page' | 'table'>('bar');
  const [tableSearch, setTableSearch] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [manualIngestSuccess, setManualIngestSuccess] = useState<string | null>(null);
  const [batchIngesting, setBatchIngesting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const executeAnalysis = async (fileToAnalyze: File, customQuery?: string) => {
    setError('');
    setLoading(true);

    try {
      const res = await apiService.uploadAndAnalyzeDocument(
        fileToAnalyze, 
        customQuery !== undefined ? customQuery : question, 
        autoExtract
      );
      setAnalysisResult(res);
      // Auto-switch to page view if it's a multi-page PDF and has few numerical points
      if (res.chart_title?.toLowerCase().includes('page') && res.page_stats?.length > 1) {
        setChartViewMode('page');
      } else {
        setChartViewMode('bar');
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to upload and analyze document.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || loading) return;
    executeAnalysis(selectedFile);
  };

  // 1-Click Diverse Preset Samples (Abatable + AI + Finance + Health + ESG + Cyber)
  const handleLoadFinancialSalesCSV = () => {
    const csvContent = "Month,Sales,Revenue,Profit,Margin_Pct\nJan,12000,45000,12000,26.6\nFeb,15000,52000,14500,27.8\nMar,18000,61000,18200,29.8\nApr,22000,74000,21000,28.3\nMay,27000,89000,26500,29.7\nJun,31000,98000,31200,31.8";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'Q1_Q2_financial_performance.csv', { type: 'text/csv' });
    setSelectedFile(file);
    setQuestion('Analyze quarterly gross revenue, operating margin trends, and key highlights.');
    executeAnalysis(file, 'Analyze quarterly gross revenue, operating margin trends, and key highlights.');
  };

  const handleLoadAIBenchmarksPDF = () => {
    const textContent = `NeuroVault Cognitive Architecture: System Latency & Retrieval Benchmarks
Author: Systems & Cognitive Intelligence Laboratory (DBTHON 2026)

Executive Abstract & Key Measurements:
This empirical study evaluates hybrid vector-relational indexing leveraging MySQL 8.4 InnoDB buffer pools and full-text inverted indexes.
Across 100,000 multi-hop queries, our evaluation recorded:
Cosine_Similarity: 94.2
Retrieval_Recall: 96.8
Cache_Hit_Rate: 98.5
Indexed_Throughput: 1450
Mean_Latency_ms: 12.4
Memory_Efficiency: 88.6

Comparative Analysis:
Traditional vector-only stores suffer 34% higher transaction isolation overhead during concurrent ACID commits.
NeuroVault 3NF normalization combined with schema triggers guarantees zero orphan metadata during memory versioning rollbacks.
Average execution time for hybrid search was measured at 12.4ms under sustained workloads of 5,000 queries per second.
Conclusion:
The combination of relational foreign keys with deterministic cosine vector scoring establishes an uncompromising operating foundation.`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new File([blob], 'NeuroVault_AI_Benchmarks_2026.txt', { type: 'text/plain' });
    setSelectedFile(file);
    setQuestion('What are the key benchmark numbers, latency metrics, and architectural conclusions?');
    executeAnalysis(file, 'What are the key benchmark numbers, latency metrics, and architectural conclusions?');
  };

  const handleLoadESGCarbonCSV = () => {
    const csvContent = `Registry_Project,Vintage_Year,Credits_Issued,Price_Per_Ton_USD,Integrity_Score,Co_Benefits
Amazon_Rainforest_REDD,2024,450000,18.5,94.2,Biodiversity_High
Direct_Air_Capture_Facility,2025,85000,125.0,98.6,Permanent_Storage
Cookstove_Efficiency_Initiative,2024,320000,12.0,88.4,Community_Health
Mangrove_Coastal_Restoration,2025,180000,28.0,96.0,Coastal_Protection
Biochar_Agricultural_Carbon,2025,140000,85.0,95.5,Soil_Nutrient
Solar_Grid_Decarbonization,2025,290000,16.5,91.0,Clean_Energy`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'ESG_Carbon_Asset_Procurement_Audit.csv', { type: 'text/csv' });
    setSelectedFile(file);
    setQuestion('Analyze high-integrity environmental carbon assets, pricing distributions, and total credits.');
    executeAnalysis(file, 'Analyze high-integrity environmental carbon assets, pricing distributions, and total credits.');
  };

  const handleLoadClinicalTrialReport = () => {
    const textContent = `Clinical Trial Evaluation: Autonomous Health Assistant Trial Phase II
Principal Investigator: Dr. A. Vance, Health Informatics

Executive Overview:
A double-blind multi-center study evaluated patient retention, dosage adherence, and symptom reduction across 480 enrolled participants over 180 days.

Quantitative Results Recorded:
Enrolled_Patients: 480
Adherence_Rate: 96.2
Symptom_Reduction_Pct: 82.4
Adverse_Events: 4
Recovery_Acceleration: 78.5
Patient_Satisfaction: 94.0

Observations & Methodology:
Patients utilizing personalized conversational memory reminders demonstrated a 96.2% adherence rate compared to 68.4% in the unassisted control group.
Zero critical adverse events were reported in the intervention arm.
Average time to recovery decreased from 24.2 days to 14.8 days under proactive protocol monitoring.
Recommendations:
Phase III validation is recommended for nationwide hospital deployment.`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new File([blob], 'Clinical_Trial_Phase_II_Results.txt', { type: 'text/plain' });
    setSelectedFile(file);
    setQuestion('Summarize clinical trial findings, adherence percentage, and outcomes.');
    executeAnalysis(file, 'Summarize clinical trial findings, adherence percentage, and outcomes.');
  };

  const handleLoadCyberThreatReport = () => {
    const textContent = `Cybersecurity Threat Telemetry Brief: Sovereign Cloud Infrastructure 2026
Prepared for CISO Operations Command

Quantitative Threat Vectors & Incident Response:
Attacks_Mitigated: 142000
Mean_Time_To_Detect: 4.2
Mean_Time_To_Remediate: 16.8
Phishing_Neutralization_Pct: 99.4
Zero_Day_Deflections: 18
Firewall_Throughput_Gbps: 120
System_Availability: 99.99

Key Operational Findings:
Automated behavioral anomaly detection blocked 142,000 volumetric attacks with zero customer downtime.
Average time to isolate malicious access tokens decreased to 4.2 minutes following heuristic trigger deployment.
Multi-region MySQL failover completed within 1.2 seconds during simulated hardware partition tests.`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new File([blob], 'Cyber_Threat_Defense_Intelligence.txt', { type: 'text/plain' });
    setSelectedFile(file);
    setQuestion('Extract total attacks mitigated, MTTR, and security uptime metrics.');
    executeAnalysis(file, 'Extract total attacks mitigated, MTTR, and security uptime metrics.');
  };

  const handleLoadHRDepartmentCSV = () => {
    const csvContent = "Department,Headcount,Budget_Thousands,Projects_Delivered,Satisfaction_Score\nEngineering,48,650,24,92.5\nProduct,16,220,18,89.0\nData Science,22,380,14,94.2\nMarketing,19,260,11,86.5\nCustomer Success,28,310,29,91.8";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'enterprise_department_metrics.csv', { type: 'text/csv' });
    setSelectedFile(file);
    setQuestion('Compare headcount versus delivered projects and identify the highest efficiency department.');
    executeAnalysis(file, 'Compare headcount versus delivered projects and identify the highest efficiency department.');
  };

  const handleCopyAnswer = () => {
    if (analysisResult?.answer) {
      navigator.clipboard.writeText(analysisResult.answer);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  const handleManualIngestFact = async (factText: string) => {
    try {
      await apiService.createMemory({
        content: factText,
        memory_type: 'FACT',
        importance_score: 85,
        confidence_score: 95,
        tags: ['document-extracted', analysisResult?.filename?.split('.')[0] || 'doc']
      });
      setManualIngestSuccess(`Committed fact to MySQL vault: "${factText.slice(0, 45)}..."`);
      setTimeout(() => setManualIngestSuccess(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to commit fact to MySQL.');
    }
  };

  const handleBatchIngestAllFacts = async () => {
    if (!analysisResult?.extracted_facts?.length) return;
    setBatchIngesting(true);
    try {
      let count = 0;
      for (const fact of analysisResult.extracted_facts) {
        await apiService.createMemory({
          content: fact,
          memory_type: 'FACT',
          importance_score: 88,
          confidence_score: 95,
          tags: ['batch-doc-import', analysisResult?.filename?.split('.')[0] || 'doc']
        });
        count++;
      }
      setManualIngestSuccess(`Successfully batch-committed ${count} verified facts to MySQL Vault!`);
      setTimeout(() => setManualIngestSuccess(null), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to batch ingest all facts.');
    } finally {
      setBatchIngesting(false);
    }
  };

  const handleFollowUpAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || !selectedFile || followUpLoading) return;
    setFollowUpLoading(true);
    try {
      const res = await apiService.uploadAndAnalyzeDocument(selectedFile, followUpQuestion, false);
      setAnalysisResult((prev: any) => ({
        ...prev,
        answer: `${prev.answer}\n\n---\n\n**Q: "${followUpQuestion}"**\n\n${res.answer}`
      }));
      setFollowUpQuestion('');
    } catch (err: any) {
      alert('Error querying document: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#14b8a6'];

  const filteredTabularRows = analysisResult?.tabular_data?.rows?.filter((r: any) => {
    if (!tableSearch) return true;
    return Object.values(r).some(v => String(v).toLowerCase().includes(tableSearch.toLowerCase()));
  }) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* 1. ABATABLE-INSPIRED EDITORIAL HERO BANNER */}
      <div className="relative overflow-hidden bg-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 text-white shadow-2xl">
        {/* Soft Ambient Radial Glows */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Pill Kicker with Emerald Pulse (Abatable Style) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="abatable-pill bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Document Intelligence & Asset Intelligence</span>
              </span>
              <span className="abatable-pill bg-blue-500/15 border-blue-500/30 text-blue-300">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>MySQL 8.0+ Hybrid Engine</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Enterprise Document Intelligence & Asset Procurement
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
              Ingest complex PDFs, ESG environmental audits, financial ledgers, and technical benchmarks. 
              NeuroVault extracts authentic empirical trajectories into multi-view Recharts visuals, compiles verified statements, and ingests them into MySQL with transactional safety.
            </p>
          </div>

          {/* Quick Attribution Badge */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-1.5 shrink-0 backdrop-blur-md">
            <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Engineering Platform</div>
            <div className="text-slate-200 font-bold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>DBTHON'26 Innovation Track</span>
            </div>
            <div className="text-[11px] text-slate-400">
              by <span className="font-semibold text-blue-400">Sai Nikhit</span> &amp; <span className="font-semibold text-indigo-400">Sohan</span>
            </div>
          </div>
        </div>

        {/* 1-Click Test Scenarios (Abatable Horizontal Carousel with Smooth 3D Snapping) */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <SparkleIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>1-Click Test Datasets (Smooth Horizontal Carousel):</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline flex items-center gap-1">
              Scroll ↔ Interactive Showcase
            </span>
          </div>

          <div className="scroll-showcase flex overflow-x-auto gap-3.5 pb-2 pt-1 perspective-container">
            {/* 1. ESG Carbon Procurement (Abatable direct inspiration) */}
            <button
              onClick={handleLoadESGCarbonCSV}
              className="card-3d min-w-[250px] flex-1 p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500 rounded-2xl text-left transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-emerald-400">
                  <Leaf className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ESG Carbon Asset Audit</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-emerald-400 transition-all" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1">Scope credits, price/ton & integrity score</p>
              <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md">
                Environmental Asset CSV
              </span>
            </button>

            {/* 2. AI Benchmark PDF */}
            <button
              onClick={handleLoadAIBenchmarksPDF}
              className="card-3d min-w-[250px] flex-1 p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-500 rounded-2xl text-left transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-blue-400">
                  <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>AI Benchmark Report</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-blue-400 transition-all" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1">Cosine similarity, latency ms & throughput</p>
              <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md">
                Systems Research PDF
              </span>
            </button>

            {/* 3. Financial Sales CSV */}
            <button
              onClick={handleLoadFinancialSalesCSV}
              className="card-3d min-w-[250px] flex-1 p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500 rounded-2xl text-left transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-amber-400">
                  <SheetIcon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Financial Sales Ledger</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1">Revenue progression & operating margin</p>
              <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md">
                Corporate Ledger CSV
              </span>
            </button>

            {/* 4. Clinical Trial Report */}
            <button
              onClick={handleLoadClinicalTrialReport}
              className="card-3d min-w-[250px] flex-1 p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-rose-500 rounded-2xl text-left transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-rose-400">
                  <Activity className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Clinical Trial Phase II</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-rose-400 transition-all" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1">Patient enrollees, adherence % & recovery</p>
              <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md">
                Medical Brief PDF
              </span>
            </button>

            {/* 5. Cyber Threat Defense */}
            <button
              onClick={handleLoadCyberThreatReport}
              className="card-3d min-w-[250px] flex-1 p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500 rounded-2xl text-left transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-indigo-400">
                  <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Cyber Defense Telemetry</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-indigo-400 transition-all" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1">Attacks neutralized, MTTR & throughput</p>
              <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md">
                CISO Security Brief
              </span>
            </button>

            {/* 6. HR Department Metrics */}
            <button
              onClick={handleLoadHRDepartmentCSV}
              className="card-3d min-w-[250px] flex-1 p-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-purple-500 rounded-2xl text-left transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-purple-400">
                  <TableIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Enterprise HR & Teams</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 group-hover:text-purple-400 transition-all" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-1">Headcount, budget & project delivery</p>
              <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md">
                Organization CSV
              </span>
            </button>
          </div>
        </div>
      </div>

      {manualIngestSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">{manualIngestSuccess}</span>
          </div>
          <button onClick={() => setManualIngestSuccess(null)} className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Upload Controls & Dropzone (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="abatable-card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UploadIcon className="w-4 h-4 text-emerald-600" />
                <span>File Ingestion Dropzone</span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">PDF / DOCX / CSV</span>
            </div>

            <form onSubmit={handleUploadAndAnalyze} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-800 hover:border-emerald-500/70 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc,.csv,.xlsx,.xls,.txt,.md,.json"
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-2.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
                    selectedFile
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {selectedFile ? <CheckIcon className="w-6 h-6 text-emerald-600" /> : <UploadIcon className="w-6 h-6" />}
                  </div>

                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white break-all">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for Deep Parsing
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Drag and drop file here
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        or click to select PDF, CSV, or DOCX from device
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Focus Question */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Analytical Inquiry (Optional):</span>
                  <span className="text-[10px] text-slate-400 font-normal">Custom focus</span>
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. Extract numerical benchmarks, revenue growth, or patient recovery metrics..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Memory Auto-Commit Checkbox */}
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-xs">
                <input
                  type="checkbox"
                  id="autoExtract"
                  checked={autoExtract}
                  onChange={(e) => setAutoExtract(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
                <label htmlFor="autoExtract" className="text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer">
                  Auto-commit key findings into MySQL Memory Vault
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedFile || loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <>
                    <RefreshIcon className="w-4 h-4 animate-spin" />
                    <span>Extracting Empirical Metrics...</span>
                  </>
                ) : (
                  <>
                    <SparkleIcon className="w-4 h-4" />
                    <span>Analyze Document & Visualize</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertIcon className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Visual Graphs, Summaries & Tables (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {analysisResult ? (
            <div className="space-y-5 animate-in fade-in">
              {/* Document Overview Bar */}
              <div className="abatable-card p-5 flex flex-wrap gap-4 items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <FileDocIcon className="w-4 h-4 text-emerald-500" />
                    <span>{analysisResult.filename}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {analysisResult.word_count.toLocaleString()} words • Format: {analysisResult.extension.toUpperCase()} • {analysisResult.read_time_minutes || 1} min read
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {analysisResult.extracted_memories_count > 0 && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      +{analysisResult.extracted_memories_count} Ingested to MySQL
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Quantitative Telemetry Gauges with 3D Depth */}
              {analysisResult.key_metrics && analysisResult.key_metrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 perspective-container">
                  {analysisResult.key_metrics.map((km: any, idx: number) => (
                    <div key={idx} className="card-3d p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {km.label}
                      </span>
                      <p className="text-lg font-black text-slate-900 dark:text-white mt-1 font-mono">
                        {km.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* HIGH-CLARITY PLAIN-ENGLISH BREAKDOWN CARD */}
              <div className="abatable-card p-6 bg-gradient-to-br from-emerald-500/5 via-slate-900/40 to-blue-500/5 border border-emerald-500/20 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Plain-Language Document Explanation
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {analysisResult.doc_summary?.category || 'Executive Analysis & Core Takeaways'}
                      </p>
                    </div>
                  </div>
                  <span className="abatable-pill bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[11px] self-start sm:self-auto">
                    Simple English Breakdown
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                      1. What is this document about?
                    </span>
                    <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {analysisResult.doc_summary?.core_purpose || analysisResult.extracted_facts?.[0] || `A comprehensive document examining ${analysisResult.filename}.`}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                      2. Primary Conclusion & Significance
                    </span>
                    <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {analysisResult.doc_summary?.key_takeaway || analysisResult.extracted_facts?.[1] || 'Empirical measurements have been recorded and cross-referenced with transactional consistency.'}
                    </p>
                  </div>

                  {analysisResult.doc_summary?.highlights && analysisResult.doc_summary.highlights.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1.5">
                        3. Numbers You Should Know
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.doc_summary.highlights.map((h: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-semibold">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BUTTON-ACTIVATED VIEW SWITCHER TABS */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveResultTab('overview')}
                  className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeResultTab === 'overview'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <SparkleIcon className="w-3.5 h-3.5" />
                  <span>Executive Brief</span>
                </button>

                <button
                  onClick={() => setActiveResultTab('graphs')}
                  className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeResultTab === 'graphs'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ChartIcon className="w-3.5 h-3.5" />
                  <span>Visual Charts</span>
                </button>

                <button
                  onClick={() => setActiveResultTab('findings')}
                  className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    activeResultTab === 'findings'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Empirical Facts ({analysisResult.extracted_facts?.length || 0})</span>
                </button>

                {analysisResult.tabular_data && (
                  <button
                    onClick={() => setActiveResultTab('explorer')}
                    className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeResultTab === 'explorer'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Raw Dataset</span>
                  </button>
                )}
              </div>

              {/* TAB 1: EXECUTIVE BRIEF & FOLLOW-UP Q&A */}
              {activeResultTab === 'overview' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="abatable-card p-6 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <SparkleIcon className="w-4 h-4 text-emerald-500" />
                        <span>Executive Intelligence Brief</span>
                      </h3>
                      <button
                        onClick={handleCopyAnswer}
                        className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedAnswer ? <CheckIcon className="w-3.5 h-3.5 text-emerald-500" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        <span>{copiedAnswer ? 'Copied' : 'Copy Brief'}</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl text-xs md:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap border border-slate-100 dark:border-slate-800">
                      {analysisResult.answer}
                    </div>
                  </div>

                  {/* Core Domain Topics Mesh */}
                  {analysisResult.extracted_entities && analysisResult.extracted_entities.length > 0 && (
                    <div className="abatable-card p-5 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Core Topics & Entities Identified:
                      </span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {analysisResult.extracted_entities.map((entity: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/60 dark:border-emerald-900/40"
                          >
                            #{entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Follow-up Q&A Console */}
                  <div className="abatable-card p-6 space-y-3">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-emerald-500" />
                      <span>Ask Follow-Up Question About This Document</span>
                    </h3>
                    <form onSubmit={handleFollowUpAsk} className="flex gap-2">
                      <input
                        type="text"
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        placeholder="e.g. What were the specific pricing, adherence, or latency values?"
                        className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={followUpLoading || !followUpQuestion.trim()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {followUpLoading ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        <span>Ask AI</span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: VISUAL CHARTS */}
              {activeResultTab === 'graphs' && (
                <div className="space-y-5 animate-in fade-in">
                  {analysisResult.has_visual_chart && analysisResult.chart_data?.length > 0 ? (
                    <div className="card-3d abatable-card p-6 shadow-md space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <ChartIcon className="w-4 h-4 text-emerald-500" />
                            <span>{analysisResult.chart_title || "Extracted Metric Trajectory"}</span>
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Quantitative parameters parsed directly from the uploaded document.
                          </p>
                        </div>

                        {/* Chart View Switcher */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                          <button
                            onClick={() => setChartViewMode('bar')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              chartViewMode === 'bar'
                                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Bar Chart
                          </button>
                          <button
                            onClick={() => setChartViewMode('area')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              chartViewMode === 'area'
                                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Trend Line
                          </button>
                          <button
                            onClick={() => setChartViewMode('pie')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              chartViewMode === 'pie'
                                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Donut Share
                          </button>
                          {analysisResult.page_stats?.length > 1 && (
                            <button
                              onClick={() => setChartViewMode('page')}
                              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                chartViewMode === 'page'
                                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              Pages ({analysisResult.page_stats.length})
                            </button>
                          )}
                          <button
                            onClick={() => setChartViewMode('table')}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              chartViewMode === 'table'
                                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Matrix
                          </button>
                        </div>
                      </div>

                      {/* Render Bar Chart */}
                      {chartViewMode === 'bar' && (
                        <div className="h-72 pt-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analysisResult.chart_data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0f172a', 
                                  borderColor: '#334155', 
                                  borderRadius: '0.75rem', 
                                  color: '#f8fafc',
                                  fontSize: '12px'
                                }}
                                formatter={(val: any) => [typeof val === 'number' ? val.toLocaleString() : val, 'Value']}
                              />
                              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {analysisResult.chart_data.map((_: any, idx: number) => (
                                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Render Area Chart */}
                      {chartViewMode === 'area' && (
                        <div className="h-72 pt-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analysisResult.chart_data}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0f172a', 
                                  borderColor: '#334155', 
                                  borderRadius: '0.75rem', 
                                  color: '#f8fafc',
                                  fontSize: '12px'
                                }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#10b981" 
                                fill="#10b981" 
                                fillOpacity={0.25} 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Render Pie / Donut Chart */}
                      {chartViewMode === 'pie' && (
                        <div className="h-72 pt-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analysisResult.chart_data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={85}
                                paddingAngle={3}
                              >
                                {analysisResult.chart_data.map((_: any, idx: number) => (
                                  <Cell key={`cell-pie-${idx}`} fill={COLORS[idx % COLORS.length]} />
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
                      )}

                      {/* Render Page Breakdown Chart */}
                      {chartViewMode === 'page' && analysisResult.page_stats?.length > 0 && (
                        <div className="h-72 pt-3">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analysisResult.page_stats}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: '#0f172a', 
                                  borderColor: '#334155', 
                                  borderRadius: '0.75rem', 
                                  color: '#f8fafc',
                                  fontSize: '12px'
                                }}
                                formatter={(val: any) => [`${val} Words`, 'Page Content']}
                              />
                              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Render Matrix Table */}
                      {chartViewMode === 'table' && (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500">
                              <tr>
                                <th className="py-2.5 px-3">Metric Dimension</th>
                                <th className="py-2.5 px-3 text-right">Extracted Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {analysisResult.chart_data.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                    <span>{item.name}</span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                    {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="abatable-card p-12 text-center text-slate-400 text-xs">
                      No numerical metrics found for visualization in this document.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VERIFIED EMPIRICAL FINDINGS */}
              {activeResultTab === 'findings' && (
                <div className="space-y-4 animate-in fade-in">
                  {analysisResult.extracted_facts && analysisResult.extracted_facts.length > 0 ? (
                    <div className="abatable-card p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Verified Document Statements & Knowledge Facts</span>
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            High-value empirical statements extracted and indexed with full-text scoring
                          </p>
                        </div>

                        <button
                          onClick={handleBatchIngestAllFacts}
                          disabled={batchIngesting}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{batchIngesting ? 'Committing...' : 'Commit All to MySQL'}</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {analysisResult.extracted_facts.map((fact: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/60 transition-colors"
                          >
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                              {fact}
                            </p>
                            <button
                              onClick={() => handleManualIngestFact(fact)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-[11px] flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Commit to Vault</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="abatable-card p-12 text-center text-slate-400 text-xs">
                      No atomic facts extracted yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TABULAR RAW DATASET EXPLORER */}
              {activeResultTab === 'explorer' && analysisResult.tabular_data && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="abatable-card p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <TableIcon className="w-4 h-4 text-emerald-600" />
                        <span>Tabular Dataset Preview ({analysisResult.tabular_data.total_rows} total rows)</span>
                      </h3>

                      <div className="relative w-full sm:w-60">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          placeholder="Search table rows..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-72 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 font-mono text-[11px] text-slate-500">
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            {analysisResult.tabular_data.columns.map((c: string) => (
                              <th key={c} className="py-2.5 px-3.5 whitespace-nowrap">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredTabularRows.slice(0, 25).map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-[11px]">
                              {analysisResult.tabular_data.columns.map((col: string) => (
                                <td key={col} className="py-2 px-3.5 whitespace-nowrap text-slate-800 dark:text-slate-200 max-w-xs truncate font-mono">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="abatable-card p-16 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-float-3d">
                <FileDocIcon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                No Document Ingested Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Upload any PDF or Word document, or click any of the <strong>6 Preloaded Test Scenarios</strong> on top to view automated visual charts, executive takeaways, and atomic knowledge facts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
