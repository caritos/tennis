import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
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
        // Profile doesn't exist yet - create it now
        console.log('👋 AuthContext: Profile not found, creating user profile in database');
        
        try {
          // Try to upsert the user profile
          const { data: upsertedProfile, error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: authUser.id,
              email: authUser.email || '',
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              phone: authUser.user_metadata?.phone || '',
              role: 'player',
              contact_preference: 'whatsapp',
              elo_rating: 1200,
              games_played: 0,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'email',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (upsertError) {
            console.error('❌ AuthContext: Failed to upsert user profile:', upsertError);
            throw upsertError;
          }

          if (upsertedProfile) {
            console.log('✅ AuthContext: User profile upserted successfully');
            
            // Create user profile from upserted data
            const userProfile: UserProfile = {
              ...upsertedProfile,
              user_metadata: {
                full_name: upsertedProfile.full_name,
                phone: upsertedProfile.phone
              }
            };
            setUser(userProfile);
            setIsFirstTimeUser(true);
            setIsOnboardingComplete(false);
          } else {
            console.error('❌ AuthContext: No profile returned from upsert');
            throw new Error('No profile returned from upsert');
          }
          
        } catch (createError) {
          console.error('❌ AuthContext: Exception creating user profile:', createError);
          // Fall back to temporary user object
          const tempUserProfile: UserProfile = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            phone: authUser.user_metadata?.phone || '',
            role: 'player',
            contact_preference: 'whatsapp',
            created_at: new Date().toISOString(),
            user_metadata: authUser.user_metadata
          };
          setUser(tempUserProfile);
          setIsFirstTimeUser(true);
          setIsOnboardingComplete(false);
        }
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
            phone: profile.phone
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
            phone: phone || '',
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
          phone: phone || '',
          role: 'player',
          contact_preference: 'whatsapp',
          elo_rating: 1200,
          games_played: 0,
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