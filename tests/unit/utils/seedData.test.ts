import { seedSampleClubs } from '../../utils/seedData';
import { initializeDatabase } from '../../database/database';

// Mock the database
jest.mock('../../database/database');

describe('seedData', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
    };

    (initializeDatabase as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('seedSampleClubs', () => {
    it('should initialize database and check existing clubs', async () => {
      // Mock empty database
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      expect(initializeDatabase).toHaveBeenCalled();
      expect(mockDb.getAllAsync).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM clubs');
    });

    it('should disable and re-enable foreign key constraints', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      // Should disable foreign keys
      expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF');
      // Should re-enable foreign keys
      expect(mockDb.runAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
    });

    it('should clear existing data before seeding', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 5 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM clubs');
      expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM users');
    });

    it('should insert sample users before clubs', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      // Should insert users with correct structure
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO users'),
        expect.arrayContaining(['sample_user_1', 'Alice Johnson', 'alice@example.com'])
      );
    });

    it('should insert San Francisco Bay Area clubs', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      // Should insert SF clubs with correct coordinates
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO clubs'),
        expect.arrayContaining([
          'club_sample_1',
          'Golden Gate Park Tennis Club',
          'Beautiful tennis courts with Golden Gate Park views',
          'San Francisco, CA',
          37.7694,
          -122.4862,
          'sample_user_1'
        ])
      );
    });

    it('should seed exactly 5 users and 5 clubs', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      // Count user insertions (5 users)
      const userInsertions = mockDb.runAsync.mock.calls.filter((call: any) => 
        call[0].includes('INSERT OR REPLACE INTO users')
      );
      expect(userInsertions).toHaveLength(5);

      // Count club insertions (5 clubs)
      const clubInsertions = mockDb.runAsync.mock.calls.filter((call: any) => 
        call[0].includes('INSERT OR REPLACE INTO clubs')
      );
      expect(clubInsertions).toHaveLength(5);
    });

    it('should verify final club count after seeding', async () => {
      mockDb.getAllAsync
        .mockResolvedValueOnce([{ count: 0 }]) // Initial count
        .mockResolvedValueOnce([{ count: 5 }]); // Final count
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      // Should query the final count
      expect(mockDb.getAllAsync).toHaveBeenCalledTimes(2);
      expect(mockDb.getAllAsync).toHaveBeenLastCalledWith('SELECT COUNT(*) as count FROM clubs');
    });

    it('should handle database errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockDb.getAllAsync.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(seedSampleClubs()).resolves.toBeUndefined();
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to seed clubs:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should insert clubs with valid SF Bay Area coordinates', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      const clubInsertions = mockDb.runAsync.mock.calls.filter((call: any) => 
        call[0].includes('INSERT OR REPLACE INTO clubs')
      );

      // Verify all clubs have SF Bay Area coordinates (lat ~37, lng ~-122)
      clubInsertions.forEach((insertion: any) => {
        const [, params] = insertion;
        const lat = params[4];
        const lng = params[5];
        
        expect(lat).toBeGreaterThan(37.4); // South Bay
        expect(lat).toBeLessThan(37.9);    // North Bay
        expect(lng).toBeGreaterThan(-122.6); // West
        expect(lng).toBeLessThan(-122.1);    // East
      });
    });

    it('should create realistic tennis club data', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      const clubInsertions = mockDb.runAsync.mock.calls.filter((call: any) => 
        call[0].includes('INSERT OR REPLACE INTO clubs')
      );

      const expectedClubs = [
        'Golden Gate Park Tennis Club',
        'Marina District Tennis',
        'Mission Bay Tennis Center',
        'Palo Alto Tennis Club',
        'Berkeley Hills Tennis'
      ];

      // Verify all expected clubs are inserted
      expectedClubs.forEach(clubName => {
        const clubInsertion = clubInsertions.find((insertion: any) => 
          insertion[1][1] === clubName
        );
        expect(clubInsertion).toBeDefined();
      });
    });

    it('should use INSERT OR REPLACE to handle duplicate keys', async () => {
      mockDb.getAllAsync.mockResolvedValue([{ count: 0 }]);
      mockDb.runAsync.mockResolvedValue({});

      await seedSampleClubs();

      // All insertions should use INSERT OR REPLACE
      const insertions = mockDb.runAsync.mock.calls.filter((call: any) => 
        call[0].includes('INSERT')
      );

      insertions.forEach((insertion: any) => {
        expect(insertion[0]).toContain('INSERT OR REPLACE');
      });
    });
  });
});