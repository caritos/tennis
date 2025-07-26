import { createClub, joinClub, getClubsByLocation, ClubService } from '../services/clubService';
import { initializeDatabase } from '../database/database';
import { supabase } from '../lib/supabase';

// Mock dependencies
jest.mock('../database/database');
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('Club Service', () => {
  let mockDb: any;
  let clubService: ClubService;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };

    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    
    clubService = new ClubService();
    jest.clearAllMocks();
  });

  describe('createClub', () => {
    it('should create a club locally and sync to Supabase', async () => {
      const clubData = {
        name: 'SF Tennis Club',
        description: 'A great tennis club in San Francisco',
        location: 'San Francisco, CA',
        lat: 37.7749,
        lng: -122.4194,
        creator_id: 'user-123',
      };

      const mockSupabaseInsert = jest.fn().mockResolvedValue({
        data: { id: 'club-456', ...clubData },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockSupabaseInsert,
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'club-456', ...clubData },
            error: null,
          }),
        }),
      });

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ id: 'club-456', ...clubData });

      const result = await clubService.createClub(clubData);

      // Should insert into local database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO clubs'),
        expect.arrayContaining([
          expect.any(String), // id
          clubData.name,
          clubData.description,
          clubData.location,
          clubData.lat,
          clubData.lng,
          clubData.creator_id,
        ])
      );

      // Should sync to Supabase
      expect(supabase.from).toHaveBeenCalledWith('clubs');
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining(clubData)
      );

      expect(result).toEqual(expect.objectContaining(clubData));
    });

    it('should handle Supabase sync errors gracefully', async () => {
      const clubData = {
        name: 'SF Tennis Club',
        description: 'A great tennis club',
        location: 'San Francisco, CA',
        creator_id: 'user-123',
      };

      const mockSupabaseInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network error' },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockSupabaseInsert,
      });

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ id: 'club-456', ...clubData });

      const result = await clubService.createClub(clubData);

      // Should still create locally
      expect(mockDb.runAsync).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining(clubData));
    });

    it('should auto-join creator to the club', async () => {
      const clubData = {
        name: 'SF Tennis Club',
        location: 'San Francisco, CA',
        creator_id: 'user-123',
      };

      mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 1 });
      mockDb.getFirstAsync.mockResolvedValue({ id: 'club-456', ...clubData });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      });

      await clubService.createClub(clubData);

      // Should insert into club_members table
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO club_members'),
        expect.arrayContaining(['club-456', 'user-123'])
      );
    });

    it('should require name and location', async () => {
      const invalidClubData = {
        name: '',
        location: '',
        creator_id: 'user-123',
      };

      await expect(clubService.createClub(invalidClubData)).rejects.toThrow(
        'Club name and location are required'
      );
    });
  });

  describe('joinClub', () => {
    it('should add user to club members locally and sync to Supabase', async () => {
      const clubId = 'club-456';
      const userId = 'user-789';

      const mockSupabaseInsert = jest.fn().mockResolvedValue({
        data: { club_id: clubId, user_id: userId },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockSupabaseInsert,
      });

      mockDb.runAsync.mockResolvedValue({ changes: 1 });

      await clubService.joinClub(clubId, userId);

      // Should insert into local database
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO club_members'),
        [clubId, userId]
      );

      // Should sync to Supabase
      expect(supabase.from).toHaveBeenCalledWith('club_members');
      expect(mockSupabaseInsert).toHaveBeenCalledWith({
        club_id: clubId,
        user_id: userId,
      });
    });

    it('should handle duplicate membership gracefully', async () => {
      const clubId = 'club-456';
      const userId = 'user-789';

      mockDb.runAsync.mockRejectedValue({ code: 'SQLITE_CONSTRAINT' });

      await expect(clubService.joinClub(clubId, userId)).rejects.toThrow(
        'Already a member of this club'
      );
    });
  });

  describe('getClubsByLocation', () => {
    it('should return clubs within specified radius', async () => {
      const userLat = 37.7749;
      const userLng = -122.4194;
      const radiusKm = 10;

      const mockClubs = [
        {
          id: 'club-1',
          name: 'Club 1',
          location: 'San Francisco',
          lat: 37.7849,
          lng: -122.4094,
          distance: 1.2,
        },
        {
          id: 'club-2',
          name: 'Club 2',
          location: 'San Francisco',
          lat: 37.7649,
          lng: -122.4294,
          distance: 2.1,
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockClubs);

      const result = await clubService.getClubsByLocation(userLat, userLng, radiusKm);

      expect(mockDb.getAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT *'),
        expect.arrayContaining([userLat, userLng, userLat, radiusKm])
      );

      expect(result).toEqual(mockClubs);
    });

    it('should sort clubs by distance', async () => {
      const userLat = 37.7749;
      const userLng = -122.4194;
      const radiusKm = 10;

      const mockClubs = [
        { id: 'club-1', name: 'Club 1', distance: 2.1 },
        { id: 'club-2', name: 'Club 2', distance: 1.2 },
      ];

      mockDb.getAllAsync.mockResolvedValue(mockClubs);

      const result = await clubService.getClubsByLocation(userLat, userLng, radiusKm);

      // Should be sorted by distance (closest first)
      expect(result[0].distance).toBeLessThan(result[1].distance);
    });

    it('should handle empty results', async () => {
      const userLat = 37.7749;
      const userLng = -122.4194;
      const radiusKm = 1;

      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await clubService.getClubsByLocation(userLat, userLng, radiusKm);

      expect(result).toEqual([]);
    });
  });
});