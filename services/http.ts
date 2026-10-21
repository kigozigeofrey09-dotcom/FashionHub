import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pgeomsujudvcjrryupbp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dag-N0A5lV-xpDVEX5jLYg__COcS21Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: 'not-connected' | 'unauthorized' | 'forbidden' | 'not-found' | 'validation' | 'server',
    readonly status?: number,
    readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiBaseUrl = '/api';

/**
 * Direct Supabase Request Adapter (Path A)
 * Maps REST-style API paths to direct Supabase table operations.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    const method = init.method || 'GET';
    const cleanPath = path.split('?')[0]; // strip query params for routing
    const segments = cleanPath.split('/').filter(Boolean);
    const tableName = segments[0]; // e.g. 'products', 'orders', 'users'
    const recordId = segments[1];   // e.g. ID if updating/fetching single record

    if (!tableName) {
      throw new Error(`Invalid API path: ${path}`);
    }

    let query = supabase.from(tableName);

    if (method === 'GET') {
      let q = recordId ? query.select('*').eq('id', recordId).single() : query.select('*');
      const { data, error } = await q;
      if (error) throw error;
      return data as T;
    } 
    
    if (method === 'POST') {
      const bodyData = init.body ? JSON.parse(init.body as string) : {};
      const { data, error } = await query.insert(bodyData).select().single();
      if (error) throw error;
      return data as T;
    } 
    
    if (method === 'PUT' || method === 'PATCH') {
      const bodyData = init.body ? JSON.parse(init.body as string) : {};
      const { data, error } = await query.update(bodyData).eq('id', recordId).select().single();
      if (error) throw error;
      return data as T;
    } 
    
    if (method === 'DELETE') {
      const { error } = await query.delete().eq('id', recordId);
      if (error) throw error;
      return undefined as T;
    }

    throw new ApiError(`Unsupported method ${method}`, 'server', 400);
  } catch (error: any) {
    throw new ApiError(
      error.message || `Database request failed: ${path}`,
      error.code === 'PGRST116' ? 'not-found' : 'server',
      error.status || 500
    );
  }
}

export const postJson = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const putJson = (body: unknown): RequestInit => ({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const patchJson = (body: unknown): RequestInit => ({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export function errorMessage(error: unknown): string {
  if (error instanceof Error && !(error instanceof ApiError) && error.message) return error.message;
  if (error instanceof ApiError) {
    if (error.code === 'not-connected') return 'Database connection issue. Please check your network.';
    if (error.code === 'unauthorized') return error.message || 'Please sign in to continue.';
    if (error.code === 'forbidden') return error.message || 'Your account role does not have access to this page.';
    if (error.code === 'not-found') return error.message || 'This record is not available.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}