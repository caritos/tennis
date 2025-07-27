import { AuthService, signUp, signIn, signOut, getCurrentUser } from '../../services/authService';
import { initializeDatabase } from '../../database/database';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../database/database');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('Auth Service', () => {
  let mockDb: any;
  let authService: AuthService;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };

    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create new user account with email and password', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123',
        full_name: 'John Doe',
        phone: '+1234567890',
      };

      const mockSupabaseSignUp = jest.fn().mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: userData.email,
          },
        },
        error: null,
      });

      const mockSupabaseInsert = jest.fn().mockResolvedValue({
        data: { id: 'user-123', ...userData },
        error: null,
      });

      (supabase.auth.signUp as jest.Mock).mockImplementation(mockSupabaseSignUp);
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockSupabaseInsert,
      });

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: 'user-123',
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        role: 'player',
      });

      const result = await authService.signUp(userData);

      // Should call Supabase auth signup
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
      });

      // Should create user profile in local database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          'user-123',
          userData.full_name,
          userData.email,
          userData.phone,
          'player',
        ]
      );

      // Should sync to Supabase users table
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        id: 'user-123',
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        role: 'player',
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'user-123',
        email: userData.email,
        full_name: userData.full_name,
      }));
    });

    it('should handle signup errors from Supabase', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123',
        full_name: 'John Doe',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' },
      });

      await expect(authService.signUp(userData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should require full name', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123',
        full_name: '',
      };

      await expect(authService.signUp(userData)).rejects.toThrow(
        'Full name is required'
      );
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        full_name: 'John Doe',
      };

      await expect(authService.signUp(userData)).rejects.toThrow(
        'Invalid email format'
      );
    });

    it('should validate password strength', async () => {
      const userData = {
        email: 'john@example.com',
        password: '123', // Too short
        full_name: 'John Doe',
      };

      await expect(authService.signUp(userData)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });
  });

  describe('signIn', () => {
    it('should sign in user with email and password', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-123',
        email: credentials.email,
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'user-123',
        full_name: 'John Doe',
        email: credentials.email,
        role: 'player',
      });

      const result = await authService.signIn(credentials);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password,
      });

      expect(result).toEqual(expect.objectContaining({
        id: 'user-123',
        email: credentials.email,
      }));
    });

    it('should handle invalid credentials', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(authService.signIn(credentials)).rejects.toThrow(
        'Invalid login credentials'
      );
    });

    it('should handle user not found in local database', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123', email: credentials.email } },
        error: null,
      });

      mockDb.getFirstAsync.mockResolvedValue(null);

      await expect(authService.signIn(credentials)).rejects.toThrow(
        'User profile not found'
      );
    });
  });

  describe('signOut', () => {
    it('should sign out current user', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'john@example.com',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockDb.getFirstAsync.mockResolvedValue({
        id: 'user-123',
        full_name: 'John Doe',
        email: 'john@example.com',
        role: 'player',
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'john@example.com',
      }));
    });

    it('should return null when no user is authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should handle auth errors', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      });

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile information', async () => {
      const userId = 'user-123';
      const updateData = {
        full_name: 'John Smith',
        phone: '+1987654321',
      };

      const mockSupabaseUpdate = jest.fn().mockResolvedValue({
        data: { id: userId, ...updateData },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue(mockSupabaseUpdate()),
        }),
      });

      mockDb.runAsync.mockResolvedValue({ changes: 1 });
      mockDb.getFirstAsync.mockResolvedValue({
        id: userId,
        full_name: updateData.full_name,
        email: 'john@example.com',
        phone: updateData.phone,
        role: 'player',
      });

      const result = await authService.updateProfile(userId, updateData);

      // Should update local database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET'),
        expect.arrayContaining([updateData.full_name, updateData.phone, userId])
      );

      expect(result).toEqual(expect.objectContaining(updateData));
    });

    it('should handle profile update errors', async () => {
      const userId = 'user-123';
      const updateData = { full_name: 'John Smith' };

      mockDb.runAsync.mockRejectedValue(new Error('Database error'));

      await expect(authService.updateProfile(userId, updateData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getUserById', () => {
    it('should get user by ID from local database', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        full_name: 'John Doe',
        email: 'john@example.com',
        role: 'player',
      };

      mockDb.getFirstAsync.mockResolvedValue(mockUser);

      const result = await authService.getUserById(userId);

      expect(mockDb.getFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      const userId = 'non-existent';
      mockDb.getFirstAsync.mockResolvedValue(null);

      const result = await authService.getUserById(userId);

      expect(result).toBeNull();
    });
  });
});