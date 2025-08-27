import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  fullName?: string;
  phone?: string;
}

/**
 * AuthService - Direct Supabase integration without local SQLite
 */
export class AuthService {

  async signUp(userData: CreateUserData): Promise<{ user: User | null; error: string | null }> {
    console.log('🔐 Creating user directly in Supabase...');
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            phone: userData.phone || null,
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup failed:', authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create user account' };
      }

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          phone: userData.phone || null,
          role: 'player',
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        // Auth user was created but profile failed - this is still a partial success
        // The user can complete their profile later
        console.warn('⚠️ User authenticated but profile creation failed - user can complete profile later');
      } else {
        console.log('✅ User profile created successfully');
      }

      console.log('✅ User signup completed:', authData.user.email);
      return { user: authData.user, error: null };

    } catch (error) {
      console.error('❌ Signup failed:', error);
      return { user: null, error: 'An unexpected error occurred during signup' };
    }
  }

  async signIn(credentials: SignInData): Promise<{ user: User | null; error: string | null }> {
    console.log('🔐 Signing in user:', credentials.email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error('❌ Signin failed:', error);
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: 'Failed to sign in' };
      }

      // Check if user profile exists, create if missing
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('🔄 Creating missing user profile...');
        const { error: createProfileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || credentials.email,
            full_name: data.user.user_metadata?.full_name || 'Tennis Player',
            phone: data.user.user_metadata?.phone || null,
            role: 'player',
            created_at: new Date().toISOString()
          });

        if (createProfileError) {
          console.error('❌ Failed to create missing profile:', createProfileError);
        } else {
          console.log('✅ Missing profile created');
        }
      } else if (profileError) {
        console.error('❌ Profile check failed:', profileError);
      }

      console.log('✅ User signin completed:', data.user.email);
      return { user: data.user, error: null };

    } catch (error) {
      console.error('❌ Signin failed:', error);
      return { user: null, error: 'An unexpected error occurred during signin' };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    console.log('🚪 Signing out user...');

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Signout failed:', error);
        return { error: error.message };
      }

      console.log('✅ User signed out successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ Signout failed:', error);
      return { error: 'An unexpected error occurred during signout' };
    }
  }

  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Get session failed:', error);
        return null;
      }

      return session;

    } catch (error) {
      console.error('❌ Get session failed:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updates: UpdateProfileData): Promise<{ error: string | null }> {
    console.log('📝 Updating user profile:', userId);

    try {
      const updateData: any = {};
      
      if (updates.fullName) updateData.full_name = updates.fullName;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      
      // Update in users table
      const { error: profileError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Profile update failed:', profileError);
        return { error: profileError.message };
      }

      // Update auth metadata
      if (updates.fullName) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: updates.fullName }
        });

        if (authError) {
          console.warn('⚠️ Auth metadata update failed:', authError);
          // Don't fail the entire operation for metadata update
        }
      }

      console.log('✅ Profile updated successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return { error: 'An unexpected error occurred during profile update' };
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Get user profile failed:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ Get user profile failed:', error);
      return null;
    }
  }

  async searchUsers(query: string, clubId?: string): Promise<any[]> {
    try {
      let queryBuilder = supabase
        .from('users')
        .select('id, full_name, email')
        .ilike('full_name', `%${query}%`)
        .limit(20);

      if (clubId) {
        // Filter by club members if clubId provided
        queryBuilder = supabase
          .from('users')
          .select(`
            id, full_name, email,
            club_members!inner (club_id)
          `)
          .eq('club_members.club_id', clubId)
          .ilike('full_name', `%${query}%`)
          .limit(20);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        console.error('❌ User search failed:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ User search failed:', error);
      return [];
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Export service functions
export const signUp = (userData: CreateUserData) => authService.signUp(userData);
export const signIn = (credentials: SignInData) => authService.signIn(credentials);
export const signOut = () => authService.signOut();
export const getCurrentSession = () => authService.getCurrentSession();
export const updateProfile = (userId: string, updates: UpdateProfileData) => 
  authService.updateProfile(userId, updates);
export const getUserProfile = (userId: string) => authService.getUserProfile(userId);
export const searchUsers = (query: string, clubId?: string) => authService.searchUsers(query, clubId);

export default authService;