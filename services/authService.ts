import { initializeDatabase } from '../database/database';
import { supabase, User } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'player' | 'admin';
  created_at: string;
}

export class AuthService {
  private db: any = null;

  private async getDatabase() {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  async signUp(userData: SignUpData): Promise<AuthUser> {
    // Validate input
    if (!userData.full_name || userData.full_name.trim() === '') {
      throw new Error('Full name is required');
    }

    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format');
    }

    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      // Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create account');
      }

      const userId = authData.user.id;
      const db = await this.getDatabase();

      // Create user profile in local database
      await db.runAsync(
        `INSERT INTO users (id, full_name, email, phone, role) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          userData.full_name.trim(),
          userData.email.toLowerCase(),
          userData.phone || null,
          'player',
        ]
      );

      // Sync to Supabase users table
      await this.syncUserToSupabase({
        id: userId,
        full_name: userData.full_name.trim(),
        email: userData.email.toLowerCase(),
        phone: userData.phone,
        role: 'player',
      });

      // Get the created user
      const user = await db.getFirstAsync(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      return user;
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }

  async signIn(credentials: SignInData): Promise<AuthUser> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error || !data.user) {
        throw new Error(error?.message || 'Sign in failed');
      }

      // Get user profile from local database
      const db = await this.getDatabase();
      const user = await db.getFirstAsync(
        `SELECT * FROM users WHERE id = ?`,
        [data.user.id]
      );

      if (!user) {
        throw new Error('User profile not found. Please contact support.');
      }

      return user;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return null;
      }

      // Get user profile from local database
      const db = await this.getDatabase();
      const user = await db.getFirstAsync(
        `SELECT * FROM users WHERE id = ?`,
        [data.user.id]
      );

      return user || null;
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  async updateProfile(userId: string, updateData: UpdateProfileData): Promise<AuthUser> {
    try {
      const db = await this.getDatabase();

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];

      if (updateData.full_name !== undefined) {
        updateFields.push('full_name = ?');
        updateValues.push(updateData.full_name.trim());
      }

      if (updateData.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(updateData.phone);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateValues.push(userId);

      // Update local database
      await db.runAsync(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Sync to Supabase (non-blocking)
      this.syncUserProfileToSupabase(userId, updateData).catch(error => {
        console.warn('Failed to sync profile update to Supabase:', error);
      });

      // Return updated user
      const user = await db.getFirstAsync(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      return user;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const db = await this.getDatabase();
      const user = await db.getFirstAsync(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      return user || null;
    } catch (error) {
      console.error('Get user by ID failed:', error);
      return null;
    }
  }

  async getUsersByIds(userIds: string[]): Promise<AuthUser[]> {
    if (userIds.length === 0) return [];

    try {
      const db = await this.getDatabase();
      const placeholders = userIds.map(() => '?').join(',');
      const users = await db.getAllAsync(
        `SELECT * FROM users WHERE id IN (${placeholders})`,
        userIds
      );

      return users || [];
    } catch (error) {
      console.error('Get users by IDs failed:', error);
      return [];
    }
  }

  async searchUsersByName(query: string, clubId?: string): Promise<AuthUser[]> {
    try {
      const db = await this.getDatabase();
      
      let sql = `
        SELECT DISTINCT u.* FROM users u
      `;
      const params = [`%${query.toLowerCase()}%`];

      if (clubId) {
        sql += `
          INNER JOIN club_members cm ON u.id = cm.user_id
          WHERE cm.club_id = ? AND LOWER(u.full_name) LIKE ?
        `;
        params.unshift(clubId);
      } else {
        sql += ` WHERE LOWER(u.full_name) LIKE ?`;
      }

      sql += ` ORDER BY u.full_name LIMIT 20`;

      const users = await db.getAllAsync(sql, params);
      return users || [];
    } catch (error) {
      console.error('Search users failed:', error);
      return [];
    }
  }

  private async syncUserToSupabase(user: Partial<User>): Promise<void> {
    try {
      const { error } = await supabase.from('users').insert(user);
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase user sync failed:', error);
      throw error;
    }
  }

  private async syncUserProfileToSupabase(userId: string, updateData: UpdateProfileData): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase profile update sync failed:', error);
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Auth state change listener setup
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await this.getUserById(session.user.id);
          callback(user);
        } else if (event === 'SIGNED_OUT') {
          callback(null);
        }
      }
    );

    // Return unsubscribe function
    return () => subscription.subscription.unsubscribe();
  }
}

// Export singleton instance and individual functions for backward compatibility
const authService = new AuthService();

export const signUp = (userData: SignUpData) => authService.signUp(userData);
export const signIn = (credentials: SignInData) => authService.signIn(credentials);
export const signOut = () => authService.signOut();
export const getCurrentUser = () => authService.getCurrentUser();
export const updateProfile = (userId: string, updateData: UpdateProfileData) => 
  authService.updateProfile(userId, updateData);
export const getUserById = (userId: string) => authService.getUserById(userId);
export const getUsersByIds = (userIds: string[]) => authService.getUsersByIds(userIds);
export const searchUsersByName = (query: string, clubId?: string) => 
  authService.searchUsersByName(query, clubId);

export default authService;