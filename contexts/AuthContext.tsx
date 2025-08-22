import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';
import { syncService } from '@/services/sync';
import { pushNotificationService } from '@/services/pushNotificationService';
import { realtimeService } from '@/services/realtimeService';

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

  const syncUserToLocalDatabase = async (user: User): Promise<boolean> => {
    try {
      console.log('AuthContext: Starting user sync for:', user.id, user.email);
      const db = await initializeDatabase();
      
      // First, check if user already exists in local database
      const existingUser = await db.getFirstAsync('SELECT id FROM users WHERE id = ?', [user.id]);
      if (existingUser) {
        console.log('AuthContext: User already exists in local database:', user.id);
        return true;
      }
      
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
          phone: user.user_metadata?.phone || null, // Temporary fallback for existing users
          role: 'player'
        };
        console.log('AuthContext: Using auth metadata fallback:', userData);
      }
      
      // Temporarily disable foreign key constraints for user insertion to avoid registration issues
      await db.execAsync('PRAGMA foreign_keys = OFF;');
      
      try {
        // Always use INSERT OR REPLACE to handle any conflicts gracefully
        // Include default values for new profile fields to avoid constraint issues
        await db.runAsync(
          `INSERT OR REPLACE INTO users (
            id, full_name, email, phone, role, 
            contact_preference, skill_level, playing_style,
            profile_visibility, match_history_visibility, allow_challenges,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            userData.id, 
            userData.full_name, 
            userData.email, 
            userData.phone, 
            userData.role,
            'whatsapp', // default contact_preference
            null, // skill_level (nullable)
            null, // playing_style (nullable)
            'public', // default profile_visibility
            'public', // default match_history_visibility
            'everyone', // default allow_challenges
          ]
        );
        console.log('AuthContext: User synced/updated in local database successfully:', user.id);
      } finally {
        // Re-enable foreign key constraints
        await db.execAsync('PRAGMA foreign_keys = ON;');
      }
      
      // Verify the user was inserted
      const insertedUser = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [user.id]);
      const success = !!insertedUser;
      console.log('AuthContext: Verification - user exists in database:', success ? 'YES' : 'NO');
      return success;
    } catch (error) {
      console.error('AuthContext: Failed to sync user to local database:', error);
      
      // If it's a foreign key constraint error, provide more helpful info
      if (error instanceof Error && error.message.includes('FOREIGN KEY constraint failed')) {
        console.error('AuthContext: This is a foreign key constraint error. Check database schema and relationships.');
        console.error('AuthContext: User data that failed to insert:', JSON.stringify({ id: user.id, email: user.email }));
      }
      
      return false;
    }
  };

  useEffect(() => {
    // Initialize sync service and get initial session
    const initialize = async () => {
      try {
        // Initialize sync service
        await syncService.initialize();
        console.log('AuthContext: Sync service initialized');
        
        // Trigger startup sync to sync any pending operations from previous sessions
        if (syncService.isOnline()) {
          console.log('AuthContext: Triggering startup sync...');
          try {
            await syncService.sync();
            console.log('AuthContext: Startup sync completed successfully');
          } catch (error) {
            console.warn('AuthContext: Startup sync failed, will retry later:', error);
          }
        } else {
          console.log('AuthContext: Device offline, startup sync will happen when connection is restored');
        }
        
        // Get initial session with error handling for network failures
        console.log('AuthContext: Checking for existing session...');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            // Handle network errors gracefully
            if (error.message?.includes('Network request failed')) {
              console.log('AuthContext: Network unavailable, proceeding without session');
              setSession(null);
            } else {
              console.error('AuthContext: Error getting session:', error);
            }
          } else {
            console.log('AuthContext: Initial session:', session ? `Found user: ${session.user?.id}` : 'None');
            // For development: accept any signed-in user regardless of email confirmation
            setSession(session);
            
            // Sync user to local database if session exists
            if (session?.user) {
              console.log('AuthContext: Syncing user to local database:', session.user.id);
              const syncSuccess = await syncUserToLocalDatabase(session.user);
              if (!syncSuccess) {
                console.warn('AuthContext: Initial user sync failed, but continuing with auth flow');
              }
              
              // Initialize push notifications for the user
              await pushNotificationService.initialize(session.user.id);
              
              // Initialize realtime subscriptions for the user
              await realtimeService.initialize(session.user.id);
            }
          }
        } catch (authError) {
          // Catch any unhandled auth errors
          console.log('AuthContext: Auth check failed, proceeding without session:', authError.message);
          setSession(null);
        }
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state changed:', event, session ? `Session exists for user: ${session.user?.id}` : 'No session');
      setSession(session);
      
      // Sync user to local database when they sign in
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log('AuthContext: Syncing user after auth change:', session.user.id);
        syncUserToLocalDatabase(session.user).then(success => {
          if (!success) {
            console.warn('AuthContext: User sync failed after auth change');
          }
        });
        
        // Initialize push notifications when user signs in
        pushNotificationService.initialize(session.user.id);
        
        // Initialize realtime subscriptions when user signs in
        realtimeService.initialize(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Add app state change listener for sync on app lifecycle events
  useEffect(() => {
    let appStateSubscription: any;
    
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      console.log('AuthContext: App state changed to:', nextAppState);
      
      if (nextAppState === 'active') {
        // App came to foreground - trigger sync to get latest data
        if (syncService.isOnline()) {
          console.log('AuthContext: App became active, triggering foreground sync...');
          try {
            await syncService.sync();
            console.log('AuthContext: Foreground sync completed successfully');
          } catch (error) {
            console.warn('AuthContext: Foreground sync failed:', error);
          }
        }
      } else if (nextAppState === 'background') {
        // App went to background - trigger sync to push any pending changes
        if (syncService.isOnline()) {
          console.log('AuthContext: App went to background, triggering background sync...');
          try {
            await syncService.sync();
            console.log('AuthContext: Background sync completed successfully');
          } catch (error) {
            console.warn('AuthContext: Background sync failed:', error);
          }
        }
      }
    };

    // Subscribe to app state changes
    appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup function
    return () => {
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, []);

  const signOut = async () => {
    console.log('AuthContext: Signing out...');
    
    // Trigger final sync before signing out to push any pending changes
    if (syncService.isOnline()) {
      console.log('AuthContext: Triggering final sync before sign out...');
      try {
        await syncService.sync();
        console.log('AuthContext: Final sync completed successfully');
      } catch (error) {
        console.warn('AuthContext: Final sync failed:', error);
      }
    }
    
    // Clean up realtime subscriptions
    realtimeService.cleanup();
    
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