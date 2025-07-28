import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Database Types
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'player' | 'admin';
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  creator_id: string;
  created_at: string;
  memberCount?: number;
  distance?: number;
}

export interface Match {
  id: string;
  club_id: string;
  player1_id: string;
  player2_id?: string;
  opponent2_name?: string;
  player3_id?: string;
  partner3_name?: string;
  player4_id?: string;
  partner4_name?: string;
  scores: string;
  match_type: 'singles' | 'doubles';
  date: string;
  notes?: string;
  created_at: string;
}

export interface ClubMember {
  club_id: string;
  user_id: string;
  joined_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      clubs: {
        Row: Club;
        Insert: Omit<Club, 'id' | 'created_at'>;
        Update: Partial<Omit<Club, 'id' | 'created_at'>>;
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at'>;
        Update: Partial<Omit<Match, 'id' | 'created_at'>>;
      };
      club_members: {
        Row: ClubMember;
        Insert: Omit<ClubMember, 'joined_at'>;
        Update: never;
      };
    };
  };
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing Supabase URL. Please set EXPO_PUBLIC_SUPABASE_URL in your environment variables.');
  }

  if (!anonKey) {
    throw new Error('Missing Supabase anon key. Please set EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
  }

  return { url, anonKey };
}

// Create Supabase client
const config = getSupabaseConfig();

export const supabase = createClient<Database>(config.url, config.anonKey, {
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
  },
});