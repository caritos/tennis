import { ClubService, calculateDistance } from '../../services/clubService';
import { initializeDatabase } from '../../database/database';

// Mock dependencies
jest.mock('../../database/database');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
  Club: {},
}));

describe('ClubService - Updated Methods', () => {
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

  describe('getNearbyClubs', () => {
    const mockClubs = [
      {
        id: 'club-1',
        name: 'Golden Gate Park Tennis Club',
        description: 'SF tennis club',
        location: 'San Francisco, CA',
        lat: 37.7694,
        lng: -122.4862,
        creator_id: 'user-1',
      },
      {
        id: 'club-2',
        name: 'Marina District Tennis',
        description: 'Marina tennis club',
        location: 'San Francisco, CA',
        lat: 37.8044,
        lng: -122.4324,
        creator_id: 'user-2',
      },
      {
        id: 'club-3',
        name: 'Palo Alto Tennis Club',
        description: 'South Bay tennis club',
        location: 'Palo Alto, CA',
        lat: 37.4419,
        lng: -122.1430,
        creator_id: 'user-3',
      },
      {
        id: 'club-4',
        name: 'Far Away Club',
        description: 'Very distant club',
        location: 'New York, NY',
        lat: 40.7128,
        lng: -74.0060,
        creator_id: 'user-4',
      },
    ];

    it('should return nearby clubs within radius', async () => {
      mockDb.getAllAsync.mockResolvedValue(mockClubs);

      // User location in SF
      const userLat = 37.7749;
      const userLng = -122.4194;
      const radius = 50; // 50km

      const result = await clubService.getNearbyClubs(userLat, userLng, radius);

      // Should exclude the NY club (too far)
      expect(result).toHaveLength(3);
      const resultIds = result.map(club => club.id);
      expect(resultIds).toContain('club-1');
      expect(resultIds).toContain('club-2');
      expect(resultIds).toContain('club-3');
      expect(resultIds).not.toContain('club-4'); // NY club should be excluded
    });

    it('should calculate distances correctly', async () => {
      mockDb.getAllAsync.mockResolvedValue(mockClubs.slice(0, 2)); // Only SF clubs

      const userLat = 37.7749; // SF downtown
      const userLng = -122.4194;

      const result = await clubService.getNearbyClubs(userLat, userLng, 50);

      expect(result).toHaveLength(2);
      // Should have distance properties
      result.forEach(club => {
        expect(club.distance).toBeDefined();
        expect(typeof club.distance).toBe('number');
        expect(club.distance).toBeGreaterThan(0);
        expect(club.distance).toBeLessThan(50);
      });
    });

    it('should sort clubs by distance', async () => {
      mockDb.getAllAsync.mockResolvedValue(mockClubs.slice(0, 3));

      // User location closer to Golden Gate Park
      const userLat = 37.7694;
      const userLng = -122.4862;

      const result = await clubService.getNearbyClubs(userLat, userLng, 100);

      // First club should be closest (Golden Gate Park)
      expect(result[0].id).toBe('club-1');
      expect(result[0].distance).toBeLessThan(result[1].distance);
    });

    it('should handle clubs without coordinates', async () => {
      const clubsWithMissingCoords = [
        ...mockClubs.slice(0, 2),
        {
          id: 'club-no-coords',
          name: 'No Coordinates Club',
          description: 'Missing lat/lng',
          location: 'Unknown',
          lat: null,
          lng: null,
          creator_id: 'user-5',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(clubsWithMissingCoords);

      const result = await clubService.getNearbyClubs(37.7749, -122.4194, 50);

      // Should exclude club without coordinates
      expect(result).toHaveLength(2);
      expect(result.map(club => club.id)).not.toContain('club-no-coords');
    });

    it('should handle empty database', async () => {
      mockDb.getAllAsync.mockResolvedValue([]);

      const result = await clubService.getNearbyClubs(37.7749, -122.4194, 50);

      expect(result).toEqual([]);
    });

    it('should handle null database result', async () => {
      mockDb.getAllAsync.mockResolvedValue(null);

      const result = await clubService.getNearbyClubs(37.7749, -122.4194, 50);

      expect(result).toEqual([]);
    });

    it('should add memberCount property to clubs', async () => {
      mockDb.getAllAsync.mockResolvedValue(mockClubs.slice(0, 1));

      const result = await clubService.getNearbyClubs(37.7749, -122.4194, 50);

      expect(result[0]).toHaveProperty('memberCount');
      expect(result[0].memberCount).toBe(0); // TODO: implement actual count
    });

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockDb.getAllAsync.mockRejectedValue(new Error('Database error'));

      const result = await clubService.getNearbyClubs(37.7749, -122.4194, 50);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get nearby clubs:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should respect radius parameter', async () => {
      mockDb.getAllAsync.mockResolvedValue(mockClubs);

      const userLat = 37.7749;
      const userLng = -122.4194;

      // Small radius should return fewer clubs
      const smallRadiusResult = await clubService.getNearbyClubs(userLat, userLng, 10);
      const largeRadiusResult = await clubService.getNearbyClubs(userLat, userLng, 100);

      expect(smallRadiusResult.length).toBeLessThanOrEqual(largeRadiusResult.length);
    });

    it('should validate coordinate types', async () => {
      const clubsWithInvalidCoords = [
        {
          id: 'club-invalid',
          name: 'Invalid Coordinates Club',
          lat: 'not-a-number',
          lng: '122.4862',
          creator_id: 'user-1',
        },
      ];

      mockDb.getAllAsync.mockResolvedValue(clubsWithInvalidCoords);

      const result = await clubService.getNearbyClubs(37.7749, -122.4194, 50);

      // Should exclude club with invalid coordinates
      expect(result).toEqual([]);
    });

    it('should log debugging information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockDb.getAllAsync.mockResolvedValue(mockClubs.slice(0, 2));

      await clubService.getNearbyClubs(37.7749, -122.4194, 50);

      expect(consoleSpy).toHaveBeenCalledWith('Getting nearby clubs for location:', 37.7749, -122.4194);
      expect(consoleSpy).toHaveBeenCalledWith('Found clubs in database:', 2);
      expect(consoleSpy).toHaveBeenCalledWith('Clubs with distance calculated:', 2);

      consoleSpy.mockRestore();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between SF locations correctly', () => {
      // Golden Gate Park to Downtown SF
      const lat1 = 37.7694; // Golden Gate Park
      const lng1 = -122.4862;
      const lat2 = 37.7749; // Downtown SF
      const lng2 = -122.4194;

      const distance = clubService.calculateDistance(lat1, lng1, lat2, lng2);

      // Should be approximately 5-6 km
      expect(distance).toBeGreaterThan(4);
      expect(distance).toBeLessThan(8);
      expect(distance).toEqual(expect.any(Number));
    });

    it('should calculate long distance correctly', () => {
      // SF to NY
      const sfLat = 37.7749;
      const sfLng = -122.4194;
      const nyLat = 40.7128;
      const nyLng = -74.0060;

      const distance = clubService.calculateDistance(sfLat, sfLng, nyLat, nyLng);

      // Should be approximately 4,000+ km
      expect(distance).toBeGreaterThan(4000);
      expect(distance).toBeLessThan(5000);
    });

    it('should return 0 for identical coordinates', () => {
      const lat = 37.7749;
      const lng = -122.4194;

      const distance = clubService.calculateDistance(lat, lng, lat, lng);

      expect(distance).toBe(0);
    });

    it('should round distance to 1 decimal place', () => {
      const distance = clubService.calculateDistance(37.7749, -122.4194, 37.7750, -122.4195);

      // Should be a small distance rounded to 1 decimal
      expect(distance.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
    });

    it('should handle edge cases with extreme coordinates', () => {
      // North pole to South pole
      const distance = clubService.calculateDistance(90, 0, -90, 0);

      // Should be approximately half the Earth's circumference (20,000+ km)
      expect(distance).toBeGreaterThan(19000);
      expect(distance).toBeLessThan(21000);
    });

    it('should be symmetric', () => {
      const lat1 = 37.7749;
      const lng1 = -122.4194;
      const lat2 = 40.7128;
      const lng2 = -74.0060;

      const distance1 = clubService.calculateDistance(lat1, lng1, lat2, lng2);
      const distance2 = clubService.calculateDistance(lat2, lng2, lat1, lng1);

      expect(distance1).toBe(distance2);
    });

    it('should handle 180th meridian crossing', () => {
      // Points across the international date line
      const distance = clubService.calculateDistance(35.6762, 179.8, 35.6762, -179.8);

      // Should calculate the shorter path across the meridian
      expect(distance).toBeLessThan(100); // Much less than going the long way
    });
  });
});