import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncUserToLocalDatabase = async (user: User) => {
    try {
      console.log('AuthContext: Starting user sync for:', user.id, user.email);
      const db = await initializeDatabase();
      
      // Try to get user profile from Supabase first
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      console.log('AuthContext: Supabase profile lookup result:', userProfile ? 'found' : 'not found', profileError?.message);
      
      let userData;
      if (userProfile && !profileError) {
        // Use Supabase profile data
        userData = {
          id: userProfile.id,
          full_name: userProfile.full_name,
          email: userProfile.email,
          phone: userProfile.phone,
          role: userProfile.role || 'player'
        };
        console.log('AuthContext: Using Supabase profile data:', userData);
      } else {
        // Fallback to auth metadata  
        userData = {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tennis Player',
          email: user.email || '',
          phone: user.user_metadata?.phone || null,
          role: 'player'
        };
        console.log('AuthContext: Using auth metadata fallback:', userData);
      }
      
      // Always use INSERT OR REPLACE to handle any conflicts gracefully
      await db.runAsync(
        `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [userData.id, userData.full_name, userData.email, userData.phone, userData.role]
      );
      console.log('AuthContext: User synced/updated in local database successfully:', user.id);
      
      // Verify the user was inserted
      const insertedUser = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [user.id]);
      console.log('AuthContext: Verification - user exists in database:', insertedUser ? 'YES' : 'NO');
    } catch (error) {
      console.error('AuthContext: Failed to sync user to local database:', error);
      // Don't throw - this shouldn't block the auth flow
    }
  };

  useEffect(() => {
    // Get initial session
    console.log('AuthContext: Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session ? `Found user: ${session.user?.id}` : 'None');
      // For development: accept any signed-in user regardless of email confirmation
      setSession(session);
      
      // Sync user to local database if session exists
      if (session?.user) {
        console.log('AuthContext: Syncing user to local database:', session.user.id);
        syncUserToLocalDatabase(session.user);
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? `Session exists for user: ${session.user?.id}` : 'No session');
      setSession(session);
      
      // Sync user to local database when they sign in
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log('AuthContext: Syncing user after auth change:', session.user.id);
        syncUserToLocalDatabase(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    console.log('AuthContext: Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthContext: Sign out error:', error);
    } else {
      console.log('AuthContext: Sign out successful');
    }
  };

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth must be used within an AuthProvider');
    // Return a default context to prevent crashes during development
    return {
      session: null,
      user: null,
      isLoading: true,
      signOut: async () => {},
    };
  }
  return context;
}