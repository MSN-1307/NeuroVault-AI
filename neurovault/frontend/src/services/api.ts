import axios from 'axios';
import { Memory, ChatMessage, GraphNode, GraphEdge, DatabaseTable, AuditLog, User } from '../types';

const api = axios.create({
  baseURL: '/api'
});

// Attach Authorization Bearer token dynamically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neurovault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>('/auth/register', { name, email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },

  // Memories
  getMemories: async (params?: { status?: string; category_id?: number; search?: string }) => {
    const res = await api.get<Memory[]>('/memories', { params });
    return res.data;
  },
  getMemory: async (id: number) => {
    const res = await api.get<Memory>(`/memories/${id}`);
    return res.data;
  },
  createMemory: async (data: Partial<Memory>) => {
    const res = await api.post<Memory>('/memories', data);
    return res.data;
  },
  updateMemory: async (id: number, data: Partial<Memory> & { change_reason?: string }) => {
    const res = await api.patch<Memory>(`/memories/${id}`, data);
    return res.data;
  },
  archiveMemory: async (id: number) => {
    const res = await api.post(`/memories/${id}/archive`);
    return res.data;
  },
  restoreMemory: async (id: number) => {
    const res = await api.post(`/memories/${id}/restore`);
    return res.data;
  },
  deleteMemory: async (id: number) => {
    const res = await api.delete(`/memories/${id}`);
    return res.data;
  },

  // Search
  searchMemories: async (query: string, top_k = 8) => {
    const res = await api.post('/search/memories', { query, top_k });
    return res.data;
  },

  // Chat
  sendMessage: async (message: string, conversation_id?: number) => {
    const res = await api.post('/chat', { message, conversation_id });
    return res.data;
  },
  getConversations: async () => {
    const res = await api.get('/conversations');
    return res.data;
  },
  getConversation: async (id: number) => {
    const res = await api.get(`/conversations/${id}`);
    return res.data;
  },
  deleteConversation: async (id: number) => {
    const res = await api.delete(`/conversations/${id}`);
    return res.data;
  },

  // Graph
  getGraph: async () => {
    const res = await api.get<{ nodes: GraphNode[]; edges: GraphEdge[] }>('/memories/graph');
    return res.data;
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },
  getCategoryDistribution: async () => {
    const res = await api.get('/analytics/categories');
    return res.data;
  },
  getQualityDistribution: async () => {
    const res = await api.get('/analytics/quality-distribution');
    return res.data;
  },

  // Advanced DBMS Explorer & Query Console
  getDatabaseTables: async () => {
    const res = await api.get<DatabaseTable[]>('/database/tables');
    return res.data;
  },
  getTableSampleData: async (tableName: string, limit = 25) => {
    const res = await api.get(`/database/tables/${tableName}/data`, { params: { limit } });
    return res.data;
  },
  executeCustomQuery: async (sqlQuery: string) => {
    const res = await api.post('/database/query', { query: sqlQuery });
    return res.data;
  },
  naturalLanguageToSql: async (nlQuery: string) => {
    const res = await api.post('/database/nl2sql', { natural_language_query: nlQuery });
    return res.data;
  },
  // Advanced Database Innovations
  traverseVectorGraph: async (query: string, max_depth = 2) => {
    const res = await api.post('/innovations/vector-graph/traverse', { query, max_depth });
    return res.data;
  },
  temporalFlashback: async (timestamp_iso?: string) => {
    const res = await api.post('/innovations/temporal/flashback', { timestamp_iso });
    return res.data;
  },
  getSecurityAudit: async () => {
    const res = await api.get('/innovations/security/audit');
    return res.data;
  },
  getTuningRecommendations: async () => {
    const res = await api.get('/innovations/tuning/recommendations');
    return res.data;
  },
  getDbmsMetrics: async () => {
    const res = await api.get('/database/metrics');
    return res.data;
  },
  uploadAndAnalyzeDocument: async (file: File, question?: string, auto_extract_memories = true) => {
    const formData = new FormData();
    formData.append('file', file);
    if (question) formData.append('question', question);
    formData.append('auto_extract_memories', String(auto_extract_memories));

    const res = await api.post('/documents/upload-and-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Neuro-Symbolic Cognitive Engine
  runCognitiveDecaySweep: async () => {
    const res = await api.post('/innovations/cognitive/decay-sweep');
    return res.data;
  },
  runConceptSynthesis: async () => {
    const res = await api.post('/innovations/cognitive/concept-synthesis');
    return res.data;
  },
  reconcileContradiction: async (memory_id: number, strategy: string, clarification_note?: string) => {
    const res = await api.post('/innovations/cognitive/reconcile-contradiction', {
      memory_id,
      strategy,
      clarification_note
    });
    return res.data;
  },

  // Adaptive Workload & Energy/Carbon Profiling
  getWorkloadHeatmaps: async () => {
    const res = await api.get('/innovations/workload/heatmaps');
    return res.data;
  },
  profileQueryEnergy: async (sqlQuery: string) => {
    const res = await api.post('/innovations/workload/energy-profile', { sql_query: sqlQuery });
    return res.data;
  },
  getDataQualityAudit: async () => {
    const res = await api.get('/innovations/workload/data-quality-audit');
    return res.data;
  },

  // Intelligent Memory Operating Layer Features
  pinMemory: async (id: number, pinned: boolean = true) => {
    const res = await api.post(`/memories/${id}/pin?pinned=${pinned}`);
    return res.data;
  },
  consolidateMemories: async (memory_ids: number[], title?: string) => {
    const res = await api.post('/memories/consolidate', { memory_ids, title });
    return res.data;
  },
  explainRetrieval: async (query: string, top_k = 3) => {
    const res = await api.post('/memories/explain-retrieval', { query, top_k });
    return res.data;
  },
  replayMemory: async (target_date?: string) => {
    const res = await api.get('/memories/replay', { params: { target_date } });
    return res.data;
  },
  predictContext: async (query: string) => {
    const res = await api.post('/memories/predict-context', { query });
    return res.data;
  },
  forgetStaleMemories: async (days_threshold = 30) => {
    const res = await api.post('/memories/forget-stale', { days_threshold });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (limit = 50) => {
    const res = await api.get<AuditLog[]>('/audit-logs', { params: { limit } });
    return res.data;
  },

  // Metadata
  getCategories: async () => {
    const res = await api.get('/categories');
    return res.data;
  },
  getTags: async () => {
    const res = await api.get('/tags');
    return res.data;
  }
};
