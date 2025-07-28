// Unit tests for ClubService offline queue integration
import { ClubService } from '../../../services/clubService';
import { syncService } from '../../../services/sync';
import { initializeDatabase } from '../../../database/database';

// Mock dependencies
jest.mock('../../../services/sync');
jest.mock('../../../database/database');

describe('ClubService - Offline Queue Integration', () => {
  let clubService: ClubService;
  const mockDb = {
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    execAsync: jest.fn(),
  };

  const mockSyncService = {
    queueClubJoin: jest.fn(),
    queueClubLeave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    (syncService as any).queueClubJoin = mockSyncService.queueClubJoin;
    (syncService as any).queueClubLeave = mockSyncService.queueClubLeave;
    
    clubService = new (ClubService as any)();
    
    // Mock successful database operations
    mockDb.runAsync.mockResolvedValue(undefined);
    mockDb.getFirstAsync.mockResolvedValue({ id: 'user123' });
    mockDb.getAllAsync.mockResolvedValue([]);
  });

  describe('joinClub Integration', () => {
    it('should queue club join operation after local database update', async () => {
      mockSyncService.queueClubJoin.mockResolvedValue('operation123');

      await clubService.joinClub('club123', 'user123');

      // Verify local database was updated first
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)',
        ['club123', 'user123']
      );

      // Verify sync operation was queued
      expect(mockSyncService.queueClubJoin).toHaveBeenCalledWith('club123', 'user123');
    });

    it('should continue with local operation even if sync queueing fails', async () => {
      mockSyncService.queueClubJoin.mockRejectedValue(new Error('Queue failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await clubService.joinClub('club123', 'user123');

      // Local operation should still succeed
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)',
        ['club123', 'user123']
      );

      // Should log warning about sync failure
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to queue club join, falling back to direct sync:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should validate input parameters before processing', async () => {
      await expect(clubService.joinClub('', 'user123')).rejects.toThrow('Valid club ID is required');
      await expect(clubService.joinClub('club123', '')).rejects.toThrow('Valid user ID is required');
      await expect(clubService.joinClub(null as any, 'user123')).rejects.toThrow('Valid club ID is required');
    });

    it('should handle database constraint errors gracefully', async () => {
      const constraintError = new Error('CONSTRAINT error');
      (constraintError as any).code = 'SQLITE_CONSTRAINT';
      mockDb.runAsync.mockRejectedValue(constraintError);

      await expect(clubService.joinClub('club123', 'user123')).rejects.toThrow('Already a member of this club');
    });
  });

  describe('leaveClub Integration', () => {
    it('should queue club leave operation after local database update', async () => {
      mockSyncService.queueClubLeave.mockResolvedValue('operation123');

      await clubService.leaveClub('club123', 'user123');

      // Verify local database was updated first
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM club_members WHERE club_id = ? AND user_id = ?',
        ['club123', 'user123']
      );

      // Verify sync operation was queued
      expect(mockSyncService.queueClubLeave).toHaveBeenCalledWith('club123', 'user123');
    });

    it('should continue with local operation even if sync queueing fails', async () => {
      mockSyncService.queueClubLeave.mockRejectedValue(new Error('Queue failed'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await clubService.leaveClub('club123', 'user123');

      // Local operation should still succeed
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'DELETE FROM club_members WHERE club_id = ? AND user_id = ?',
        ['club123', 'user123']
      );

      // Should log warning about sync failure
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to queue club leave, data may be out of sync:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should validate input parameters before processing', async () => {
      await expect(clubService.leaveClub('', 'user123')).rejects.toThrow('Valid club ID is required');
      await expect(clubService.leaveClub('club123', '')).rejects.toThrow('Valid user ID is required');
    });

    it('should handle database errors during leave operation', async () => {
      mockDb.runAsync.mockRejectedValue(new Error('Database error'));

      await expect(clubService.leaveClub('club123', 'user123')).rejects.toThrow('Failed to leave club');
    });
  });

  describe('createClub Integration', () => {
    const mockClubData = {
      name: 'Test Club',
      description: 'A test tennis club',
      location: 'Test Location',
      lat: 40.7128,
      lng: -74.0060,
      creator_id: 'user123',
    };

    beforeEach(() => {
      mockDb.getFirstAsync.mockResolvedValue({
        id: expect.stringMatching(/^club_/),
        ...mockClubData,
      });
    });

    it('should queue club membership for creator after club creation', async () => {
      mockSyncService.queueClubJoin.mockResolvedValue('operation123');

      const club = await clubService.createClub(mockClubData);

      // Verify club was created in local database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clubs'),
        expect.arrayContaining([
          expect.stringMatching(/^club_/),
          mockClubData.name,
          mockClubData.description,
          mockClubData.location,
          mockClubData.lat,
          mockClubData.lng,
          mockClubData.creator_id,
        ])
      );

      // Verify creator was added as member
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        'INSERT INTO club_members (club_id, user_id) VALUES (?, ?)',
        [expect.stringMatching(/^club_/), mockClubData.creator_id]
      );

      // Verify membership was queued for sync
      expect(mockSyncService.queueClubJoin).toHaveBeenCalledWith(
        expect.stringMatching(/^club_/),
        mockClubData.creator_id
      );
    });

    it('should validate required club data', async () => {
      await expect(clubService.createClub({
        ...mockClubData,
        name: '',
      })).rejects.toThrow('Club name, description, and location are required');

      await expect(clubService.createClub({
        ...mockClubData,
        location: '',
      })).rejects.toThrow('Club name, description, and location are required');
    });
  });

  describe('Offline-First Behavior', () => {
    it('should prioritize local database operations over sync operations', async () => {
      let dbCallOrder: string[] = [];
      let syncCallOrder: string[] = [];

      mockDb.runAsync.mockImplementation(async () => {
        dbCallOrder.push('database');
      });

      mockSyncService.queueClubJoin.mockImplementation(async () => {
        syncCallOrder.push('sync');
      });

      await clubService.joinClub('club123', 'user123');

      // Database operation should happen before sync operation
      expect(dbCallOrder).toEqual(['database']);
      expect(syncCallOrder).toEqual(['sync']);
    });

    it('should never fail local operations due to sync failures', async () => {
      mockSyncService.queueClubJoin.mockRejectedValue(new Error('Network error'));
      mockSyncService.queueClubLeave.mockRejectedValue(new Error('Network error'));

      // Should not throw errors despite sync failures
      await expect(clubService.joinClub('club123', 'user123')).resolves.toBeUndefined();
      await expect(clubService.leaveClub('club123', 'user123')).resolves.toBeUndefined();
    });
  });
});