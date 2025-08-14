import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Database Types - Complete schema matching Supabase tables
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'player' | 'admin';
  contact_preference: 'whatsapp' | 'phone' | 'text';
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

export interface MatchInvitation {
  id: string;
  club_id: string;
  creator_id: string;
  match_type: 'singles' | 'doubles';
  date: string;
  time?: string;
  notes?: string;
  status: 'active' | 'matched' | 'cancelled';
  created_at: string;
  expires_at?: string;
}

export interface InvitationResponse {
  id: string;
  invitation_id: string;
  user_id: string;
  message?: string;
  status: 'interested' | 'confirmed' | 'declined';
  created_at: string;
}

export interface Challenge {
  id: string;
  club_id: string;
  challenger_id: string;
  challenged_id: string;
  match_type: 'singles' | 'doubles';
  proposed_date?: string;
  proposed_time?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
  expires_at?: string;
  contacts_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChallengeCounter {
  id: string;
  challenge_id: string;
  counter_by: string;
  match_type: 'singles' | 'doubles';
  proposed_date?: string;
  proposed_time?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
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
      match_invitations: {
        Row: MatchInvitation;
        Insert: Omit<MatchInvitation, 'id' | 'created_at'>;
        Update: Partial<Omit<MatchInvitation, 'id' | 'created_at'>>;
      };
      invitation_responses: {
        Row: InvitationResponse;
        Insert: Omit<InvitationResponse, 'id' | 'created_at'>;
        Update: Partial<Omit<InvitationResponse, 'id' | 'created_at'>>;
      };
      challenges: {
        Row: Challenge;
        Insert: Omit<Challenge, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Challenge, 'id' | 'created_at' | 'updated_at'>>;
      };
      challenge_counters: {
        Row: ChallengeCounter;
        Insert: Omit<ChallengeCounter, 'id' | 'created_at'>;
        Update: Partial<Omit<ChallengeCounter, 'id' | 'created_at'>>;
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
        // Don't log network errors to reduce noise
        if (error.message?.includes('Network request failed')) {
          throw error;
        }
        console.error('Supabase fetch error:', error);
        throw error;
      }
    },
  },
});