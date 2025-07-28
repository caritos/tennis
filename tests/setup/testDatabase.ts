/**
 * Test Database Utilities
 * Provides database isolation and setup for tests
 */

import * as SQLite from 'expo-sqlite';
import { seedDatabase } from '@/utils/seedData';

// Mock SQLite for testing environment
const mockDatabase = {
  data: new Map<string, any[]>(),
  
  // Mock execute function
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  
  // Helper methods for test manipulation
  reset: function() {
    this.data.clear();
    jest.clearAllMocks();
  },
  
  setData: function(table: string, rows: any[]) {
    this.data.set(table, rows);
  },
  
  getData: function(table: string) {
    return this.data.get(table) || [];
  },
};

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDatabase)),
}));

/**
 * Test Database Manager
 * Handles database state for tests
 */
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private db: any = mockDatabase;

  private constructor() {}

  public static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  /**
   * Reset database to clean state
   */
  async reset(): Promise<void> {
    this.db.reset();
    this.setupMockResponses();
  }

  /**
   * Seed database with test data
   */
  async seed(): Promise<void> {
    // Mock the seed data operation
    this.db.data.set('clubs', [
      {
        id: 'club-1',
        name: 'Test Club 1',
        description: 'First test club',
        location: 'Test City, TC',
        member_count: 10,
        latitude: 40.7128,
        longitude: -74.0060,
      },
      {
        id: 'club-2',
        name: 'Test Club 2', 
        description: 'Second test club',
        location: 'Another City, AC',
        member_count: 15,
        latitude: 40.7580,
        longitude: -73.9855,
      },
    ]);

    this.db.data.set('users', [
      {
        id: 'user-1',
        full_name: 'Test User 1',
        email: 'user1@test.com',
        phone: '+1234567890',
      },
      {
        id: 'user-2',
        full_name: 'Test User 2',
        email: 'user2@test.com', 
        phone: '+1234567891',
      },
    ]);

    this.db.data.set('matches', []);
    this.db.data.set('club_members', [
      { club_id: 'club-1', user_id: 'user-1', role: 'member' },
      { club_id: 'club-1', user_id: 'user-2', role: 'member' },
    ]);
  }

  /**
   * Insert test data into specific table
   */
  async insertData(table: string, data: any[]): Promise<void> {
    const existing = this.db.data.get(table) || [];
    this.db.data.set(table, [...existing, ...data]);
  }

  /**
   * Get test data from specific table
   */
  getData(table: string): any[] {
    return this.db.data.get(table) || [];
  }

  /**
   * Setup mock database responses for common queries
   */
  private setupMockResponses(): void {
    // Mock getAllAsync to return data from our mock store
    this.db.getAllAsync.mockImplementation((query: string, params?: any[]) => {
      // Simple query parsing for test purposes
      if (query.includes('FROM clubs')) {
        return Promise.resolve(this.getData('clubs'));
      }
      if (query.includes('FROM users')) {
        return Promise.resolve(this.getData('users'));
      }
      if (query.includes('FROM matches')) {
        return Promise.resolve(this.getData('matches'));
      }
      if (query.includes('FROM club_members')) {
        return Promise.resolve(this.getData('club_members'));
      }
      return Promise.resolve([]);
    });

    // Mock getFirstAsync for single row queries
    this.db.getFirstAsync.mockImplementation((query: string, params?: any[]) => {
      const results = this.db.getAllAsync(query, params);
      return results.then((rows: any[]) => rows[0] || null);
    });

    // Mock runAsync for INSERT/UPDATE/DELETE operations
    this.db.runAsync.mockImplementation((query: string, params?: any[]) => {
      if (query.includes('INSERT INTO')) {
        // Extract table name and simulate insert
        const tableMatch = query.match(/INSERT INTO (\w+)/);
        if (tableMatch) {
          const table = tableMatch[1];
          // For tests, we'll just return success
          return Promise.resolve({ changes: 1, lastInsertRowId: Date.now() });
        }
      }
      return Promise.resolve({ changes: 1 });
    });

    // Mock execAsync for schema operations
    this.db.execAsync.mockImplementation((queries: string[]) => {
      return Promise.resolve();
    });
  }

  /**
   * Get the mock database instance for direct manipulation in tests
   */
  getMockDatabase(): any {
    return this.db;
  }
}

/**
 * Test database hooks for jest setup/teardown
 */
export const setupTestDatabase = async (): Promise<TestDatabaseManager> => {
  const dbManager = TestDatabaseManager.getInstance();
  await dbManager.reset();
  await dbManager.seed();
  return dbManager;
};

export const teardownTestDatabase = async (): Promise<void> => {
  const dbManager = TestDatabaseManager.getInstance();
  await dbManager.reset();
};

/**
 * Test database utilities for specific scenarios
 */
export const testDbUtils = {
  /**
   * Create a fresh database for each test
   */
  createFreshDatabase: async () => {
    const dbManager = TestDatabaseManager.getInstance();
    await dbManager.reset();
    return dbManager;
  },

  /**
   * Setup database with specific test scenario
   */
  setupScenario: async (scenario: 'empty' | 'basic' | 'full') => {
    const dbManager = TestDatabaseManager.getInstance();
    await dbManager.reset();

    switch (scenario) {
      case 'empty':
        // Database with just schema, no data
        break;
      case 'basic':
        // Database with minimal test data
        await dbManager.seed();
        break;
      case 'full':
        // Database with comprehensive test data
        await dbManager.seed();
        await dbManager.insertData('matches', [
          {
            id: 'match-1',
            club_id: 'club-1',
            player1_id: 'user-1',
            player2_id: 'user-2',
            opponent2_name: 'Test User 2',
            scores: '6-4,6-3',
            match_type: 'singles',
            date: '2024-01-15',
            notes: 'Test match',
            created_at: '2024-01-15T10:00:00Z',
          },
        ]);
        break;
    }

    return dbManager;
  },

  /**
   * Verify database state in tests
   */
  verifyData: {
    hasClubs: (expectedCount?: number) => {
      const dbManager = TestDatabaseManager.getInstance();
      const clubs = dbManager.getData('clubs');
      return expectedCount ? clubs.length === expectedCount : clubs.length > 0;
    },

    hasUsers: (expectedCount?: number) => {
      const dbManager = TestDatabaseManager.getInstance();
      const users = dbManager.getData('users');
      return expectedCount ? users.length === expectedCount : users.length > 0;
    },

    hasMatches: (expectedCount?: number) => {
      const dbManager = TestDatabaseManager.getInstance();
      const matches = dbManager.getData('matches');
      return expectedCount ? matches.length === expectedCount : matches.length > 0;
    },
  },
};