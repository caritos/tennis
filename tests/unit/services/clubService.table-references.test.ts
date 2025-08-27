/**
 * Club Service Table References Test
 * 
 * This test ensures that the clubService uses the correct database table names.
 * It was created to prevent regressions after fixing the club_memberships -> club_members table name issue.
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Mock supabase to capture table references
const mockFromSpy = jest.fn();
const mockSelectSpy = jest.fn().mockReturnThis();
const mockInsertSpy = jest.fn().mockReturnThis();
const mockDeleteSpy = jest.fn().mockReturnThis();
const mockEqSpy = jest.fn().mockReturnThis();
const mockNeqSpy = jest.fn().mockReturnThis();
const mockOrderSpy = jest.fn().mockResolvedValue({ data: [], error: null });
const mockSingleSpy = jest.fn().mockResolvedValue({ data: null, error: null });

const mockSupabase = {
  from: mockFromSpy,
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

// Mock the supabase import
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock uuid generation
jest.mock('@/utils/uuid', () => ({
  generateUUID: () => 'test-uuid',
}));

describe('ClubService Table References', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Chain the methods correctly
    mockFromSpy.mockReturnValue({
      select: mockSelectSpy,
      insert: mockInsertSpy,
      delete: mockDeleteSpy,
    });
    
    mockSelectSpy.mockReturnValue({
      eq: mockEqSpy,
      neq: mockNeqSpy,
    });
    
    mockInsertSpy.mockReturnValue({
      select: mockSelectSpy.mockReturnValue({
        single: mockSingleSpy,
      }),
    });
    
    mockDeleteSpy.mockReturnValue({
      eq: mockEqSpy,
    });
    
    mockEqSpy.mockReturnValue({
      eq: mockEqSpy,
      neq: mockNeqSpy,
      single: mockSingleSpy,
      order: mockOrderSpy,
    });

    mockNeqSpy.mockReturnValue({
      order: mockOrderSpy,
    });
  });

  describe('Static source code validation', () => {
    test('should use club_members table name in all operations', () => {
      // Read the actual source file
      const clubServicePath = path.join(process.cwd(), 'services', 'clubService.ts');
      const clubServiceSource = fs.readFileSync(clubServicePath, 'utf8');
      
      // Check that the file uses the correct table name
      expect(clubServiceSource).toContain("from('club_members')");
      expect(clubServiceSource).not.toContain("from('club_memberships')");
      
      // Count occurrences to ensure all references were updated
      const correctTableReferences = (clubServiceSource.match(/from\('club_members'\)/g) || []).length;
      const incorrectTableReferences = (clubServiceSource.match(/from\('club_memberships'\)/g) || []).length;
      
      expect(correctTableReferences).toBeGreaterThan(0);
      expect(incorrectTableReferences).toBe(0);
    });
  });

  describe('Database schema validation', () => {
    test('TypeScript types should reference club_members table', () => {
      // Read the generated types file
      const typesPath = path.join(process.cwd(), 'types', 'supabase.ts');
      const typesSource = fs.readFileSync(typesPath, 'utf8');
      
      // Verify the correct table exists in the types
      expect(typesSource).toContain('club_members:');
      expect(typesSource).not.toContain('club_memberships:');
    });
  });

  describe('Service method table reference verification', () => {
    const { ClubService } = require('@/services/clubService');
    const clubService = new ClubService();

    test('getUserClubs method calls correct table', async () => {
      const userId = 'test-user-id';
      
      try {
        await clubService.getUserClubs(userId);
      } catch (error) {
        // Ignore errors, we just want to check table name
      }

      expect(mockFromSpy).toHaveBeenCalledWith('club_members');
      expect(mockFromSpy).not.toHaveBeenCalledWith('club_memberships');
    });

    test('joinClub method calls correct table', async () => {
      const clubId = 'test-club-id';
      const userId = 'test-user-id';
      
      // Mock successful user check
      mockSingleSpy.mockResolvedValueOnce({ data: { id: userId }, error: null });
      
      try {
        await clubService.joinClub(clubId, userId);
      } catch (error) {
        // Ignore errors, we just want to check table name
      }

      expect(mockFromSpy).toHaveBeenCalledWith('club_members');
      expect(mockFromSpy).not.toHaveBeenCalledWith('club_memberships');
    });

    test('leaveClub method calls correct table', async () => {
      const clubId = 'test-club-id';
      const userId = 'test-user-id';
      
      try {
        await clubService.leaveClub(clubId, userId);
      } catch (error) {
        // Ignore errors, we just want to check table name
      }

      expect(mockFromSpy).toHaveBeenCalledWith('club_members');
      expect(mockFromSpy).not.toHaveBeenCalledWith('club_memberships');
    });

    test('isClubMember method calls correct table', async () => {
      const clubId = 'test-club-id';
      const userId = 'test-user-id';
      
      try {
        await clubService.isClubMember(clubId, userId);
      } catch (error) {
        // Ignore errors, we just want to check table name
      }

      expect(mockFromSpy).toHaveBeenCalledWith('club_members');
      expect(mockFromSpy).not.toHaveBeenCalledWith('club_memberships');
    });
  });
});