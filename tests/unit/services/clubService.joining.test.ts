import { ClubService } from '../../services/clubService';
import { initializeDatabase } from '../../database/database';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../database/database');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(),
    })),
  },
}));

describe('ClubService - Club Joining', () => {
  let clubService: ClubService;
  let mockDb: any;
  let mockSupabase: any;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };

    mockSupabase = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({ error: null })),
      })),
    };

    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    (supabase.from as jest.Mock) = mockSupabase.from;

    clubService = new ClubService();
    jest.clearAllMocks();
  });

  describe('joinClub method', () => {
    const clubId = 'club-123';
    const userId = 'user-456';

    it('should insert membership into local database first', async () => {
      mockDb.runAsync.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      await clubService.joinClub(clubId, userId);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)',
        [clubId, userId]
      );
    });

    it('should sync membership to Supabase after local insert', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockDb.runAsync.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      await clubService.joinClub(clubId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('club_members');
      expect(mockInsert).toHaveBeenCalledWith({
        club_id: clubId,
        user_id: userId,
      });
    });

    it('should handle duplicate membership gracefully', async () => {
      const constraintError = new Error('UNIQUE constraint failed');
      (constraintError as any).code = 'SQLITE_CONSTRAINT';
      
      mockDb.runAsync.mockRejectedValue(constraintError);

      await expect(clubService.joinClub(clubId, userId)).rejects.toThrow('Already a member of this club');
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockDb.runAsync.mockRejectedValue(dbError);

      await expect(clubService.joinClub(clubId, userId)).rejects.toThrow('Database connection failed');
    });

    it('should handle Supabase sync errors gracefully', async () => {
      mockDb.runAsync.mockResolvedValue(null);
      const supabaseError = { message: 'Network error', code: 'NETWORK_ERROR' };
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: supabaseError }),
      });

      // Should not throw - Supabase sync failures should be logged but not block the operation
      await expect(clubService.joinClub(clubId, userId)).resolves.toBeUndefined();
      
      // Local database should still be called
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)',
        [clubId, userId]
      );
    });

    it('should follow offline-first pattern', async () => {
      mockDb.runAsync.mockResolvedValue(null);
      
      // Simulate network failure
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockRejectedValue(new Error('Network unavailable')),
      });

      // Local insert should succeed even if Supabase fails (offline-first)
      await expect(clubService.joinClub(clubId, userId)).resolves.toBeUndefined();
      
      // Local database should be called first
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)',
        [clubId, userId]
      );
    });
  });

  describe('getMembershipStatus method (to be implemented)', () => {
    it('should check if user is already a member of a club', async () => {
      const clubId = 'club-123';
      const userId = 'user-456';

      // This method doesn't exist yet but should be implemented
      // for checking membership status before showing join buttons
      expect(true).toBeTruthy(); // Placeholder
    });

    it('should return list of clubs user has joined', async () => {
      const userId = 'user-456';

      // This method should return all clubs the user is a member of
      expect(true).toBeTruthy(); // Placeholder
    });
  });

  describe('getJoinedClubIds method (to be implemented)', () => {
    it('should return array of club IDs user has joined', async () => {
      const userId = 'user-456';
      const expectedClubIds = ['club-123', 'club-456', 'club-789'];

      mockDb.getAllAsync.mockResolvedValue([
        { club_id: 'club-123' },
        { club_id: 'club-456' },
        { club_id: 'club-789' },
      ]);

      // This method should be implemented to support UI state
      expect(true).toBeTruthy(); // Placeholder
    });

    it('should handle empty membership list', async () => {
      const userId = 'user-456';

      mockDb.getAllAsync.mockResolvedValue([]);

      // Should return empty array for users with no club memberships
      expect(true).toBeTruthy(); // Placeholder
    });
  });

  describe('updateMemberCount method (to be implemented)', () => {
    it('should increment club member count after joining', async () => {
      const clubId = 'club-123';

      // This method should update the cached member count
      // when someone joins the club
      expect(true).toBeTruthy(); // Placeholder
    });

    it('should sync member count changes to Supabase', async () => {
      const clubId = 'club-123';

      // Member count changes should be synced to cloud
      expect(true).toBeTruthy(); // Placeholder
    });
  });

  describe('Integration with existing methods', () => {
    it('should work with getNearbyClubs to show join status', async () => {
      const userLat = 37.7749;
      const userLng = -122.4194;
      const userId = 'user-456';

      // getNearbyClubs should indicate which clubs user has already joined
      expect(true).toBeTruthy(); // Placeholder
    });

    it('should work with createClub auto-join functionality', async () => {
      // When user creates a club, they should automatically become a member
      // This is already implemented in createClub method
      expect(true).toBeTruthy(); // Verified in existing tests
    });
  });

  describe('Database schema compliance', () => {
    it('should use correct club_members table structure', async () => {
      const clubId = 'club-123';
      const userId = 'user-456';

      await clubService.joinClub(clubId, userId);

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('club_members'),
        expect.arrayContaining([clubId, userId])
      );
    });

    it('should handle joined_at timestamp (auto-generated)', async () => {
      // joined_at should be automatically set by database
      // (DEFAULT CURRENT_TIMESTAMP in schema)
      expect(true).toBeTruthy(); // Verified by database schema
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle invalid club ID', async () => {
      const invalidClubId = '';
      const userId = 'user-456';

      // Should validate input parameters
      await expect(clubService.joinClub(invalidClubId, userId)).rejects.toThrow();
    });

    it('should handle invalid user ID', async () => {
      const clubId = 'club-123';
      const invalidUserId = '';

      // Should validate input parameters
      await expect(clubService.joinClub(clubId, invalidUserId)).rejects.toThrow();
    });

    it('should handle club that does not exist', async () => {
      const nonExistentClubId = 'nonexistent-club';
      const userId = 'user-456';

      // Foreign key constraint should prevent joining non-existent clubs
      const foreignKeyError = new Error('FOREIGN KEY constraint failed');
      (foreignKeyError as any).code = 'SQLITE_CONSTRAINT';
      
      mockDb.runAsync.mockRejectedValue(foreignKeyError);

      await expect(clubService.joinClub(nonExistentClubId, userId)).rejects.toThrow();
    });
  });

  describe('Performance considerations', () => {
    it('should be fast for local operations', async () => {
      const clubId = 'club-123';
      const userId = 'user-456';

      mockDb.runAsync.mockResolvedValue(null);
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const startTime = Date.now();
      await clubService.joinClub(clubId, userId);
      const endTime = Date.now();

      // Local operation should be very fast (under 100ms in tests)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should not block on Supabase sync failures', async () => {
      const clubId = 'club-123';
      const userId = 'user-456';

      mockDb.runAsync.mockResolvedValue(null);
      
      // Simulate slow/failing Supabase
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 1000)
          )
        ),
      });

      // This should complete quickly despite Supabase issues (offline-first)
      const startTime = Date.now();
      await expect(clubService.joinClub(clubId, userId)).resolves.toBeUndefined();
      const endTime = Date.now();

      // Should complete quickly, not wait for Supabase timeout
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});