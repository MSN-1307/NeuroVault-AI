export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export interface MemoryVersion {
  id: number;
  version_number: number;
  previous_content?: string;
  new_content: string;
  change_reason?: string;
  changed_by: string;
  created_at: string;
}

export interface Memory {
  id: number;
  user_id: number;
  category_id?: number;
  category_name?: string;
  source_message_id?: number;
  source_conversation_id?: number;
  memory_type: string;
  content: string;
  summary?: string;
  importance_score: number;
  confidence_score: number;
  freshness_score: number;
  quality_score: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'CONFLICTED' | 'EXPIRED' | 'DELETED';
  is_sensitive: boolean;
  conflict_with_id?: number;
  version_number: number;
  created_at: string;
  updated_at?: string;
  last_accessed_at?: string;
  tags: string[];
  versions: MemoryVersion[];
}

export interface RetrievedCitation {
  id: number;
  content: string;
  category?: string;
  memory_type: string;
  score: number;
  importance: number;
  confidence: number;
}

export interface ChatMessage {
  id?: number;
  sender_type: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  created_at?: string;
  retrieved_memories?: RetrievedCitation[];
  conflict_detected?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  content?: string;
  category_id?: number;
  type: string;
  status: string;
  importance: number;
  confidence: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  weight?: number;
}

export interface DatabaseTable {
  table_name: string;
  row_count: number;
  columns: {
    name: string;
    type: string;
    nullable: string;
    key: string;
    comment: string;
  }[];
}

export interface AuditLog {
  id: number;
  user_id?: number;
  actor_type: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  metadata_json?: any;
  created_at: string;
}
