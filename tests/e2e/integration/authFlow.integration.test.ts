/**
 * Authentication Flow Integration Tests
 * 
 * Tests the core authentication functionality with proper mocking
 * - User registration with Supabase
 * - Sign in with email/password  
 * - Sign out functionality
 * - Session management
 * - Error handling scenarios
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthService } from '@/services/authService';

// Create comprehensive mock for Supabase
const mockSupabaseAuth = {
  signUp: jest.fn(),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  updateUser: jest.fn(),
};

const mockSupabaseFromResult = {
  insert: jest.fn().mockResolvedValue({ data: null, error: null }),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(), 
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  ilike: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
};

const mockSupabaseFrom = jest.fn(() => mockSupabaseFromResult);

// Mock the entire supabase import
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  },
}));

// Test data
const validUserData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
  fullName: 'Test User',
  phone: '+1234567890',
};

const validSignInData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
};

describe('Authentication Flow Integration Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration Flow', () => {
    it('should successfully register a new user with valid data', async () => {
      // Mock successful Supabase auth registration
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: validUserData.email,
          },
          session: null,
        },
        error: null,
      });

      // Execute registration
      const result = await authService.signUp(validUserData);

      // Verify the registration was successful
      expect(result.user).toBeDefined();
      expect(result.error).toBeNull();

      // Verify Supabase auth.signUp was called correctly
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: validUserData.email,
        password: validUserData.password,
        options: {
          data: {
            full_name: validUserData.fullName,
            phone: validUserData.phone || null,
          },
        },
      });

      // Verify profile creation was attempted
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
    });

    it('should handle registration with existing email', async () => {
      // Mock registration failure for existing email
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'User already registered',
        },
      });

      // Execute registration
      const result = await authService.signUp(validUserData);

      // Verify error handling
      expect(result.user).toBeNull();
      expect(result.error).toBe('User already registered');
      expect(mockSupabaseAuth.signUp).toHaveBeenCalled();
    });

    it('should handle network errors during registration', async () => {
      // Mock network error
      mockSupabaseAuth.signUp.mockRejectedValue(new Error('Network error'));

      // Execute registration
      const result = await authService.signUp(validUserData);

      // Verify error handling
      expect(result.user).toBeNull();
      expect(result.error).toBe('An unexpected error occurred during signup');
    });
  });

  describe('Sign In Flow', () => {
    it('should successfully sign in with valid credentials', async () => {
      // Mock successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: validSignInData.email,
          },
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
          },
        },
        error: null,
      });

      // Mock profile exists
      mockSupabaseFromResult.single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: validSignInData.email,
          full_name: 'Test User',
        },
        error: null,
      });

      // Execute sign in
      const result = await authService.signIn(validSignInData);

      // Verify successful sign in
      expect(result.user).toBeDefined();
      expect(result.error).toBeNull();

      // Verify Supabase was called correctly
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: validSignInData.email,
        password: validSignInData.password,
      });
    });

    it('should handle invalid credentials during sign in', async () => {
      // Mock sign in failure
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: 'Invalid login credentials',
        },
      });

      // Execute sign in
      const result = await authService.signIn({
        email: validSignInData.email,
        password: 'wrong-password',
      });

      // Verify error handling
      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid login credentials');
    });

    it('should create missing profile during sign in', async () => {
      // Mock successful sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: validSignInData.email,
            email: validSignInData.email,
            user_metadata: { full_name: 'Test User' },
          },
          session: { access_token: 'token' },
        },
        error: null,
      });

      // Mock profile doesn't exist (PGRST116 is "not found" error)
      mockSupabaseFromResult.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      // Execute sign in
      const result = await authService.signIn(validSignInData);

      // Verify successful sign in even with missing profile
      expect(result.user).toBeDefined();
      expect(result.error).toBeNull();

      // Verify profile creation was attempted
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
    });

    it('should handle network errors during sign in', async () => {
      // Mock network error
      mockSupabaseAuth.signInWithPassword.mockRejectedValue(new Error('Network error'));

      // Execute sign in
      const result = await authService.signIn(validSignInData);

      // Verify error handling
      expect(result.user).toBeNull();
      expect(result.error).toBe('An unexpected error occurred during signin');
    });
  });

  describe('Sign Out Flow', () => {
    it('should successfully sign out an authenticated user', async () => {
      // Mock successful sign out
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: null,
      });

      // Execute sign out
      const result = await authService.signOut();

      // Verify successful sign out
      expect(result.error).toBeNull();
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors gracefully', async () => {
      // Mock sign out error
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: {
          message: 'Failed to sign out',
        },
      });

      // Execute sign out
      const result = await authService.signOut();

      // Verify error handling
      expect(result.error).toBe('Failed to sign out');
    });

    it('should handle network errors during sign out', async () => {
      // Mock network error
      mockSupabaseAuth.signOut.mockRejectedValue(new Error('Network error'));

      // Execute sign out
      const result = await authService.signOut();

      // Verify error handling
      expect(result.error).toBe('An unexpected error occurred during signout');
    });
  });

  describe('Session Management', () => {
    it('should get current session when authenticated', async () => {
      // Mock authenticated session
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            user: {
              id: 'user-123',
              email: validUserData.email,
            },
          },
        },
        error: null,
      });

      // Get current session
      const session = await authService.getCurrentSession();

      // Verify session data
      expect(session).toBeDefined();
      expect(session?.access_token).toBe('access-token-123');
      expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
    });

    it('should return null when no session exists', async () => {
      // Mock no authenticated session
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // Get current session
      const session = await authService.getCurrentSession();

      // Verify no session
      expect(session).toBeNull();
    });

    it('should handle session errors', async () => {
      // Mock session error
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: {
          message: 'Session error',
        },
      });

      // Get current session
      const session = await authService.getCurrentSession();

      // Verify error handling
      expect(session).toBeNull();
    });
  });

  describe('Profile Management', () => {
    it('should update user profile', async () => {
      // Mock successful profile update
      mockSupabaseFromResult.update.mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock successful auth metadata update
      mockSupabaseAuth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Execute profile update
      const result = await authService.updateProfile('user-123', {
        fullName: 'Updated Name',
        phone: '+1234567890',
      });

      // Verify successful update
      expect(result.error).toBeNull();
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalled();
    });

    it('should get user profile', async () => {
      // Mock profile data
      const profileData = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
      };

      mockSupabaseFromResult.single.mockResolvedValue({
        data: profileData,
        error: null,
      });

      // Execute get profile
      const profile = await authService.getUserProfile('user-123');

      // Verify profile data
      expect(profile).toEqual(profileData);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
    });

    it('should search users', async () => {
      // Mock search results
      const searchResults = [
        { id: 'user-1', full_name: 'John Doe', email: 'john@example.com' },
        { id: 'user-2', full_name: 'Jane Doe', email: 'jane@example.com' },
      ];

      mockSupabaseFromResult.limit.mockResolvedValue({
        data: searchResults,
        error: null,
      });

      // Execute user search
      const results = await authService.searchUsers('Doe');

      // Verify search results
      expect(results).toEqual(searchResults);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('users');
    });
  });
});