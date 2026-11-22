import { supabase } from './supabaseClient';
export { supabase };

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

    if (tableName === 'auth') {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        throw new ApiError('Not authenticated', 'unauthorized', 401);
      }
      const session = {
        user: {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          role: (user.user_metadata?.role as any) || 'buyer',
          countryCode: user.user_metadata?.countryCode || 'UG'
        }
      };
      return session as T;
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

    return undefined as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    const isCollection = path.includes('search') || path.includes('list') || path.includes('mine') || path.includes('saved') || path.includes('notifications');
    if (isCollection) return [] as unknown as T;
    return null as unknown as T;
  }
}

export const postJson = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const putJson = (body: unknown): RequestInit => ({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const patchJson = (body: unknown): RequestInit => ({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export function errorMessage(error: unknown): string {
  if (error instanceof Error && !(error instanceof ApiError) && error.message) return error.message;
  if (error instanceof ApiError) {
    if (error.code === 'not-connected') return 'FashionHub’s backend is offline. Offline-cached data loaded if available.';
    if (error.code === 'unauthorized') return error.message || 'Please sign in to continue.';
    if (error.code === 'forbidden') return error.message || 'Your account role does not have access to this page.';
    if (error.code === 'not-found') return error.message || 'This API route or record is not available yet. Check the backend endpoint and resource ID.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
