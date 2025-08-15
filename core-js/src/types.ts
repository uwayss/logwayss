export interface Entry {
  id: string;
  type: string;
  created_at: string; // ISO8601
  updated_at: string; // ISO8601
  schema_version: number;
  tags?: string[];
  source?: string;
  device_id?: string;
  meta?: Record<string, unknown>;
  payload?: unknown;
}

export interface QueryFilter {
  time?: { from?: string; to?: string };
  type?: string;
  tags?: string[];
}

export interface Pagination {
  limit?: number;
  offset?: number;
}
