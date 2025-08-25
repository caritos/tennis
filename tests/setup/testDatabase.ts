/**
 * Test Database Utilities
 * Provides database isolation and setup for tests using Supabase
 */

import { supabase } from '@/lib/supabase';
import { createClub, createUser, createMatch } from './testFactories';

// Mock Supabase for testing environment
const mockSupabaseDatabase = {
  data: new Map<string, any[]>(),
  
  reset: function() {
    this.data.clear();
  },
  
  setData: function(table: string, rows: any[]) {
    this.data.set(table, rows);
  },
  
  getData: function(table: string) {
    return this.data.get(table) || [];
  },
};

// Mock Supabase client for tests
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

/**
 * Test Database Manager
 * Handles Supabase database state for tests
 */
export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private db: any = mockSupabaseDatabase;

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
    this.setupSupabaseMocks();
  }

  /**
   * Seed database with test data
   */
  async seed(): Promise<void> {
    // Set up test clubs using factory
    const testClub1 = createClub({
      id: 'club-1',
      name: 'Test Club 1',
      description: 'First test club',
      location: 'Test City, TC',
      latitude: 40.7128,
      longitude: -74.0060,
    });
    
    const testClub2 = createClub({
      id: 'club-2',
      name: 'Test Club 2',
      description: 'Second test club',
      location: 'Another City, AC',
      latitude: 40.7580,
      longitude: -73.9855,
    });
    
    this.db.data.set('clubs', [testClub1, testClub2]);

    // Set up test users using factory
    const testUser1 = createUser({
      id: 'user-1',
      full_name: 'Test User 1',
      email: 'user1@test.com',
      phone: '+1234567890',
    });
    
    const testUser2 = createUser({
      id: 'user-2',
      full_name: 'Test User 2',
      email: 'user2@test.com',
      phone: '+1234567891',
    });
    
    this.db.data.set('users', [testUser1, testUser2]);

    this.db.data.set('matches', []);
    this.db.data.set('club_members', [
      { club_id: 'club-1', user_id: 'user-1', joined_at: '2024-01-01T00:00:00Z' },
      { club_id: 'club-1', user_id: 'user-2', joined_at: '2024-01-01T00:00:00Z' },
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
   * Setup mock Supabase responses for common queries
   */
  private setupSupabaseMocks(): void {
    const mockSupabase = jest.mocked(supabase);
    
    // Mock from() method to return chainable query builder
    const createMockQueryBuilder = (tableName: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        const data = this.getData(tableName);
        return Promise.resolve({ data: data[0] || null, error: null });
      }),
      then: jest.fn().mockImplementation((callback) => {
        const data = this.getData(tableName);
        return Promise.resolve(callback({ data, error: null }));
      }),
    });

    mockSupabase.from.mockImplementation((tableName: string) => 
      createMockQueryBuilder(tableName) as any
    );
  }

  /**
   * Get the mock Supabase database instance for direct manipulation in tests
   */
  getMockDatabase(): any {
    return this.db;
  }
  
  /**
   * Get the mocked Supabase client
   */
  getMockSupabase(): any {
    return jest.mocked(supabase);
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
        const testMatch = createMatch({
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
        });
        await dbManager.insertData('matches', [testMatch]);
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