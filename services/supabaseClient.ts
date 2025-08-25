/**
 * Enhanced Supabase client with automatic auth error handling
 */

import { supabase } from '@/lib/supabase';
import { AuthErrorHandler } from './authErrorHandler';

/**
 * Wrapper for Supabase queries with auth error handling
 */
export class SupabaseClient {
  /**
   * Execute a Supabase query with automatic auth error handling
   */
  static async query<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    options?: {
      retries?: number;
      fallback?: T;
      throwOnError?: boolean;
    }
  ): Promise<T | null> {
    const maxRetries = options?.retries || 2;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { data, error } = await queryFn();

        if (error) {
          lastError = error;
          
          // Check if it's an auth error
          if (AuthErrorHandler.isAuthError(error)) {
            console.log(`🔄 SupabaseClient: Auth error on attempt ${attempt + 1}, handling...`);
            await AuthErrorHandler.getInstance().handleAuthError(error);
            
            // If this was the last attempt and throwOnError is true, throw
            if (attempt === maxRetries - 1 && options?.throwOnError) {
              throw error;
            }
            
            // Otherwise, retry
            continue;
          } else {
            // Non-auth error
            if (options?.throwOnError) {
              throw error;
            }
            console.error('❌ SupabaseClient: Query error:', error);
            return options?.fallback || null;
          }
        }

        return data;
      } catch (error: any) {
        lastError = error;
        
        if (AuthErrorHandler.isAuthError(error)) {
          console.log(`🔄 SupabaseClient: Caught auth error on attempt ${attempt + 1}`);
          await AuthErrorHandler.getInstance().handleAuthError(error);
          
          if (attempt < maxRetries - 1) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
        
        if (options?.throwOnError) {
          throw error;
        }
      }
    }

    // All retries exhausted
    console.error('❌ SupabaseClient: All retries exhausted:', lastError);
    
    if (options?.throwOnError && lastError) {
      throw lastError;
    }
    
    return options?.fallback || null;
  }

  /**
   * Get current user with auth error handling
   */
  static async getCurrentUser() {
    return SupabaseClient.query(async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { data: user, error };
    });
  }

  /**
   * Get current session with auth error handling
   */
  static async getSession() {
    return SupabaseClient.query(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { data: session, error };
    });
  }

  /**
   * Refresh session with auth error handling
   */
  static async refreshSession() {
    return SupabaseClient.query(async () => {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      return { data: session, error };
    });
  }

  /**
   * Execute a database query with auth error handling
   */
  static async from<T>(table: string) {
    return {
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: () => SupabaseClient.query<T>(async () => {
            const result = await supabase
              .from(table)
              .select(columns)
              .eq(column, value)
              .single();
            return result as { data: T | null; error: any };
          }),
          execute: () => SupabaseClient.query<T[]>(async () => {
            const result = await supabase
              .from(table)
              .select(columns)
              .eq(column, value);
            return result as { data: T[] | null; error: any };
          })
        }),
        execute: () => SupabaseClient.query<T[]>(async () => {
          const result = await supabase
            .from(table)
            .select(columns);
          return result as { data: T[] | null; error: any };
        })
      }),
      
      insert: (data: Partial<T> | Partial<T>[]) => ({
        select: () => ({
          single: () => SupabaseClient.query<T>(async () => {
            const result = await supabase
              .from(table)
              .insert(data)
              .select()
              .single();
            return result as { data: T | null; error: any };
          }),
          execute: () => SupabaseClient.query<T[]>(async () => {
            const result = await supabase
              .from(table)
              .insert(data)
              .select();
            return result as { data: T[] | null; error: any };
          })
        }),
        execute: () => SupabaseClient.query<T>(async () => {
          const result = await supabase
            .from(table)
            .insert(data);
          return { data: result.data as T | null, error: result.error };
        })
      }),
      
      update: (data: Partial<T>) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => SupabaseClient.query<T>(async () => {
              const result = await supabase
                .from(table)
                .update(data)
                .eq(column, value)
                .select()
                .single();
              return result as { data: T | null; error: any };
            })
          }),
          execute: () => SupabaseClient.query(async () => {
            const result = await supabase
              .from(table)
              .update(data)
              .eq(column, value);
            return { data: result.data, error: result.error };
          })
        })
      }),
      
      delete: () => ({
        eq: (column: string, value: any) => ({
          execute: () => SupabaseClient.query(async () => {
            const result = await supabase
              .from(table)
              .delete()
              .eq(column, value);
            return { data: result.data, error: result.error };
          })
        })
      })
    };
  }
}

// Export convenience functions
export const safeSupabase = {
  auth: {
    getCurrentUser: SupabaseClient.getCurrentUser,
    getSession: SupabaseClient.getSession,
    refreshSession: SupabaseClient.refreshSession,
  },
  from: SupabaseClient.from,
  query: SupabaseClient.query,
};