import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: string;
  contact_preference: string;
  created_at: string;
  // Add auth metadata for backward compatibility
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isFirstTimeUser: boolean;
  isOnboardingComplete: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { fullName?: string; phone?: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('🔐 AuthContext: Getting initial session...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AuthContext: Session error:', error);
        } else if (session?.user) {
          console.log('✅ AuthContext: Found existing session for:', session.user.email);
          
          // Load full user profile
          await loadUserProfile(session.user);
        } else {
          console.log('📭 AuthContext: No existing session');
        }
      } catch (error) {
        console.error('❌ AuthContext: Failed to get session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 AuthContext: Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsFirstTimeUser(false);
        setIsOnboardingComplete(false);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist - first time user
        console.log('👋 AuthContext: First time user detected');
        setIsFirstTimeUser(true);
        setIsOnboardingComplete(false);
        setUser(null);
      } else if (error) {
        console.error('❌ AuthContext: Profile load failed:', error);
        setIsFirstTimeUser(false);
        setIsOnboardingComplete(false);
        setUser(null);
      } else {
        // Profile exists - create enhanced user object
        console.log('✅ AuthContext: User profile loaded');
        const userProfile: UserProfile = {
          ...profile,
          // Add auth metadata for backward compatibility
          user_metadata: {
            full_name: profile.full_name,
            phone: profile.phone || undefined
          }
        };
        setUser(userProfile);
        setIsFirstTimeUser(false);
        setIsOnboardingComplete(true);
      }
    } catch (error) {
      console.error('❌ AuthContext: Profile load failed:', error);
      setIsFirstTimeUser(false);
      setIsOnboardingComplete(false);
      setUser(null);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string): Promise<{ error: string | null }> => {
    console.log('📝 AuthContext: Signing up user:', email);
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || null,
          }
        }
      });

      if (authError) {
        console.error('❌ AuthContext: Signup failed:', authError);
        return { error: authError.message };
      }

      if (!authData.user) {
        return { error: 'Failed to create user account' };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          phone: phone || null,
          role: 'player',
          contact_preference: 'whatsapp',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ AuthContext: Profile creation failed:', profileError);
        return { error: 'Failed to create user profile' };
      }

      console.log('✅ AuthContext: User created successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ AuthContext: Signup failed:', error);
      return { error: 'An unexpected error occurred during signup' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    console.log('🔐 AuthContext: Signing in user:', email);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ AuthContext: Signin failed:', error);
        return { error: error.message };
      }

      console.log('✅ AuthContext: User signed in successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ AuthContext: Signin failed:', error);
      return { error: 'An unexpected error occurred during signin' };
    }
  };

  const signOut = async (): Promise<void> => {
    console.log('🚪 AuthContext: Signing out user...');

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ AuthContext: Signout failed:', error);
      } else {
        console.log('✅ AuthContext: User signed out successfully');
      }
    } catch (error) {
      console.error('❌ AuthContext: Signout failed:', error);
    }
  };

  const updateProfile = async (updates: { fullName?: string; phone?: string }): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'No user logged in' };
    }

    console.log('📝 AuthContext: Updating profile for:', user.id);

    try {
      const updateData: any = {};
      
      if (updates.fullName) updateData.full_name = updates.fullName;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      
      // Update in users table
      const { error: profileError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ AuthContext: Profile update failed:', profileError);
        return { error: profileError.message };
      }

      // Update auth metadata
      if (updates.fullName) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: updates.fullName }
        });

        if (authError) {
          console.warn('⚠️ AuthContext: Auth metadata update failed:', authError);
        }
      }

      console.log('✅ AuthContext: Profile updated successfully');
      
      // Reload user profile to get updated data
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      }
      
      return { error: null };

    } catch (error) {
      console.error('❌ AuthContext: Profile update failed:', error);
      return { error: 'An unexpected error occurred during profile update' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isFirstTimeUser,
    isOnboardingComplete,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}