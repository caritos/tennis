import * as SQLite from 'expo-sqlite';
import { initializeDatabase, createTables } from '../database/database';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

describe('Database Initialization', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      closeAsync: jest.fn(),
    };
    
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    jest.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('should open database and create tables', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      const result = await initializeDatabase();

      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('tennis.db');
      expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
      expect(result).toBe(mockDb);
    });

    it('should handle database initialization errors', async () => {
      mockDb.execAsync.mockRejectedValue(new Error('Database error'));

      await expect(initializeDatabase()).rejects.toThrow('Database error');
    });
  });

  describe('createTables', () => {
    it('should create all required tables', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await createTables(mockDb);

      // Should create users table
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS users')
      );

      // Should create clubs table
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS clubs')
      );

      // Should create matches table
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS matches')
      );

      // Should create club_members table
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS club_members')
      );
    });

    it('should handle table creation errors', async () => {
      mockDb.execAsync.mockRejectedValue(new Error('Table creation failed'));

      await expect(createTables(mockDb)).rejects.toThrow('Table creation failed');
    });
  });

  // dropTables functionality is now inlined in initializeDatabase for development

  describe('Database Schema', () => {
    it('should create users table with correct columns', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await createTables(mockDb);

      const usersTableCall = mockDb.execAsync.mock.calls.find((call: any) =>
        call[0].includes('CREATE TABLE IF NOT EXISTS users')
      );

      expect(usersTableCall[0]).toContain('id TEXT PRIMARY KEY');
      expect(usersTableCall[0]).toContain('full_name TEXT NOT NULL');
      expect(usersTableCall[0]).toContain('email TEXT UNIQUE NOT NULL');
      expect(usersTableCall[0]).toContain('phone TEXT');
      expect(usersTableCall[0]).toContain('role TEXT DEFAULT \'player\'');
      expect(usersTableCall[0]).toContain('created_at TEXT DEFAULT CURRENT_TIMESTAMP');
    });

    it('should create clubs table with correct columns', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await createTables(mockDb);

      const clubsTableCall = mockDb.execAsync.mock.calls.find((call: any) =>
        call[0].includes('CREATE TABLE IF NOT EXISTS clubs')
      );

      expect(clubsTableCall[0]).toContain('id TEXT PRIMARY KEY');
      expect(clubsTableCall[0]).toContain('name TEXT NOT NULL');
      expect(clubsTableCall[0]).toContain('description TEXT');
      expect(clubsTableCall[0]).toContain('location TEXT NOT NULL');
      expect(clubsTableCall[0]).toContain('lat REAL');
      expect(clubsTableCall[0]).toContain('lng REAL');
      expect(clubsTableCall[0]).toContain('creator_id TEXT NOT NULL');
      expect(clubsTableCall[0]).toContain('created_at TEXT DEFAULT CURRENT_TIMESTAMP');
    });

    it('should create matches table with correct columns', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await createTables(mockDb);

      const matchesTableCall = mockDb.execAsync.mock.calls.find((call: any) =>
        call[0].includes('CREATE TABLE IF NOT EXISTS matches')
      );

      expect(matchesTableCall[0]).toContain('id TEXT PRIMARY KEY');
      expect(matchesTableCall[0]).toContain('club_id TEXT NOT NULL');
      expect(matchesTableCall[0]).toContain('player1_id TEXT NOT NULL');
      expect(matchesTableCall[0]).toContain('player2_id TEXT');
      expect(matchesTableCall[0]).toContain('opponent2_name TEXT');
      expect(matchesTableCall[0]).toContain('scores TEXT NOT NULL');
      expect(matchesTableCall[0]).toContain('match_type TEXT NOT NULL');
      expect(matchesTableCall[0]).toContain('date TEXT NOT NULL');
      expect(matchesTableCall[0]).toContain('notes TEXT');
      expect(matchesTableCall[0]).toContain('created_at TEXT DEFAULT CURRENT_TIMESTAMP');
    });

    it('should create club_members table with correct columns', async () => {
      mockDb.execAsync.mockResolvedValue(undefined);

      await createTables(mockDb);

      const clubMembersTableCall = mockDb.execAsync.mock.calls.find((call: any) =>
        call[0].includes('CREATE TABLE IF NOT EXISTS club_members')
      );

      expect(clubMembersTableCall[0]).toContain('club_id TEXT NOT NULL');
      expect(clubMembersTableCall[0]).toContain('user_id TEXT NOT NULL');
      expect(clubMembersTableCall[0]).toContain('joined_at TEXT DEFAULT CURRENT_TIMESTAMP');
      expect(clubMembersTableCall[0]).toContain('PRIMARY KEY (club_id, user_id)');
    });
  });
});