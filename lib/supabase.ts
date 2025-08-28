import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from './config';
import { Database } from '../types/supabase';

// Re-export commonly used types for convenience
export type User = Database['public']['Tables']['users']['Row'];
export type Club = Database['public']['Tables']['clubs']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type Challenge = Database['public']['Tables']['challenges']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type ClubMembership = Database['public']['Tables']['club_members']['Row'];

// Create Supabase client with environment-specific configuration and generated types
export const supabase = createClient<Database>(config.supabase.url, config.supabase.anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
    fetch: async (url, options = {}) => {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Don't log abort errors - they happen when components unmount
        if ((error as Error)?.name === 'AbortError' || (error as Error)?.message === 'Aborted') {
          throw error;
        }
        
        // Don't log network errors to reduce noise
        if ((error as Error)?.message?.includes('Network request failed')) {
          throw error;
        }
        
        console.error('Supabase fetch error:', error);
        throw error;
      }
    },
  },
});