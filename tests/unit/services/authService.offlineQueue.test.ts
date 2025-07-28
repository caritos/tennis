// Unit tests for AuthService offline queue integration
import { AuthService } from '../../../services/authService';
import { syncService } from '../../../services/sync';
import { initializeDatabase } from '../../../database/database';
import { supabase } from '../../../lib/supabase';

// Mock dependencies
jest.mock('../../../services/sync');
jest.mock('../../../database/database');
jest.mock('../../../lib/supabase');

describe('AuthService - Offline Queue Integration', () => {
  let authService: AuthService;
  const mockDb = {
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  };

  const mockSyncService = {
    queueProfileUpdate: jest.fn(),
  };

  const mockSupabase = {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    (syncService as any).queueProfileUpdate = mockSyncService.queueProfileUpdate;
    (supabase as any).auth = mockSupabase.auth;
    
    authService = new (AuthService as any)();
    
    // Mock successful database operations
    mockDb.runAsync.mockResolvedValue(undefined);
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'user123',
      full_name: 'Test User',
      email: 'test@example.com',
      phone: null,
      role: 'player'
    });
  });

  describe('signUp Integration', () => {
    const mockSignUpData = {
      email: 'test@example.com',
      password: 'password123',
      full_name: 'Test User',
      phone: '+1234567890',
    };

    beforeEach(() => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
    });

    it('should queue profile creation after user signup', async () => {
      mockSyncService.queueProfileUpdate.mockResolvedValue('operation123');

      await authService.signUp(mockSignUpData);

      // Verify local database was updated
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([
          'user123',
          'Test User',
          'test@example.com',
          '+1234567890',
          'player',
        ])
      );

      // Verify profile creation was queued for sync
      expect(mockSyncService.queueProfileUpdate).toHaveBeenCalledWith('user123', {
        full_name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        role: 'player',
      });
    });

    it('should fallback to direct sync if queue operation fails', async () => {
      mockSyncService.queueProfileUpdate.mockRejectedValue(new Error('Queue failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await authService.signUp(mockSignUpData);

      // Local database should still be updated
      expect(mockDb.runAsync).toHaveBeenCalled();

      // Should log warning about queue failure
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to queue user profile creation, falling back to direct sync:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should validate signup data', async () => {
      await expect(authService.signUp({
        ...mockSignUpData,
        full_name: '',
      })).rejects.toThrow('Full name is required');

      await expect(authService.signUp({
        ...mockSignUpData,
        email: 'invalid-email',
      })).rejects.toThrow('Invalid email format');

      await expect(authService.signUp({
        ...mockSignUpData,
        password: '12345',
      })).rejects.toThrow('Password must be at least 6 characters');
    });
  });

  describe('updateProfile Integration', () => {
    const mockUpdateData = {
      full_name: 'Updated Name',
      phone: '+0987654321',
    };

    it('should queue profile update after local database update', async () => {
      mockSyncService.queueProfileUpdate.mockResolvedValue('operation123');

      await authService.updateProfile('user123', mockUpdateData);

      // Verify local database was updated
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
        ['Updated Name', '+0987654321', 'user123']
      );

      // Verify profile update was queued for sync
      expect(mockSyncService.queueProfileUpdate).toHaveBeenCalledWith('user123', mockUpdateData);
    });

    it('should handle partial updates correctly', async () => {
      mockSyncService.queueProfileUpdate.mockResolvedValue('operation123');

      // Test updating only full_name
      await authService.updateProfile('user123', { full_name: 'New Name' });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE users SET full_name = ? WHERE id = ?',
        ['New Name', 'user123']
      );

      expect(mockSyncService.queueProfileUpdate).toHaveBeenCalledWith('user123', { full_name: 'New Name' });
    });

    it('should fallback to direct sync if queue operation fails', async () => {
      mockSyncService.queueProfileUpdate.mockRejectedValue(new Error('Queue failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await authService.updateProfile('user123', mockUpdateData);

      // Local database should still be updated
      expect(mockDb.runAsync).toHaveBeenCalled();

      // Should log warning about queue failure
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to queue profile update, falling back to direct sync:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should throw error if no fields are provided for update', async () => {
      await expect(authService.updateProfile('user123', {})).rejects.toThrow('No fields to update');
    });

    it('should trim whitespace from full_name updates', async () => {
      mockSyncService.queueProfileUpdate.mockResolvedValue('operation123');

      await authService.updateProfile('user123', { full_name: '  Trimmed Name  ' });

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'UPDATE users SET full_name = ? WHERE id = ?',
        ['Trimmed Name', 'user123']
      );

      expect(mockSyncService.queueProfileUpdate).toHaveBeenCalledWith('user123', { full_name: 'Trimmed Name' });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during profile update', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Database error'));

      await expect(authService.updateProfile('user123', { full_name: 'Test' })).rejects.toThrow('Update profile failed');
    });

    it('should handle authentication errors during signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      await expect(authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      })).rejects.toThrow('Email already exists');
    });
  });

  describe('Offline-First Behavior', () => {
    it('should prioritize local database operations over sync operations', async () => {
      let operationOrder: string[] = [];

      mockDb.runAsync.mockImplementation(async () => {
        operationOrder.push('database');
      });

      mockSyncService.queueProfileUpdate.mockImplementation(async () => {
        operationOrder.push('sync');
      });

      await authService.updateProfile('user123', { full_name: 'Test' });

      // Database operation should happen before sync operation
      expect(operationOrder).toEqual(['database', 'sync']);
    });

    it('should never fail local operations due to sync failures', async () => {
      mockSyncService.queueProfileUpdate.mockRejectedValue(new Error('Network error'));

      // Should not throw error despite sync failure
      await expect(authService.updateProfile('user123', { full_name: 'Test' })).resolves.toBeDefined();

      // Local database should still be updated
      expect(mockDb.runAsync).toHaveBeenCalled();
    });

    it('should continue with signup even if sync queueing fails', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      mockSyncService.queueProfileUpdate.mockRejectedValue(new Error('Queue failed'));

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
      });

      // Should return created user despite sync failure
      expect(result).toBeDefined();
      expect(result.id).toBe('user123');
    });
  });
});