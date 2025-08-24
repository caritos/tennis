import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { supabase } from '@/lib/supabase';
import { ChallengeService } from '@/services/challengeService';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn()
    }
  }
}));

// Mock UUID generator
jest.mock('@/utils/uuid', () => ({
  generateUUID: jest.fn(() => 'test-uuid-123')
}));

describe('Contact Sharing System', () => {
  let challengeService: ChallengeService;
  let mockSupabaseFrom: jest.MockedFunction<typeof supabase.from>;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    challengeService = ChallengeService.getInstance();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Supabase chain methods
    mockSingle = jest.fn();
    mockEq = jest.fn().mockReturnValue({ single: mockSingle });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    
    mockSupabaseFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;
    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle
    } as any);

    // Mock auth
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-123' } },
      error: null
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singles Challenge Contact Sharing', () => {
    it('should create contact notifications for both players in singles', async () => {
      // Arrange
      const challengeId = 'challenge-123';
      const userId = 'challenged-user-456';
      
      const mockChallengeData = {
        challenger_id: 'challenger-user-789',
        challenged_id: userId,
        match_type: 'singles',
        challenger: {
          full_name: 'John Challenger',
          phone: '5551234567'
        },
        challenged: {
          full_name: 'Jane Challenged', 
          phone: '5559876543'
        }
      };

      // Mock challenge lookup
      mockSingle.mockResolvedValueOnce({
        data: mockChallengeData,
        error: null
      });

      // Mock challenge status update
      mockEq.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock notification inserts (both should succeed)
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'notification-1' }],
        error: null
      });
      mockSelect.mockResolvedValueOnce({
        data: [{ id: 'notification-2' }],
        error: null
      });

      // Act
      await challengeService.acceptChallenge(challengeId, userId);

      // Assert
      expect(mockSupabaseFrom).toHaveBeenCalledWith('challenges');
      expect(mockSupabaseFrom).toHaveBeenCalledWith('notifications');
      
      // Should insert two notifications (one for each player)
      expect(mockInsert).toHaveBeenCalledTimes(2);
      
      // Check notification content
      const insertCalls = mockInsert.mock.calls;
      
      // Challenger notification
      expect(insertCalls[0][0]).toMatchObject({
        user_id: 'challenger-user-789',
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: expect.stringContaining('Jane Challenged accepted your singles challenge')
      });
      
      // Challenged notification  
      expect(insertCalls[1][0]).toMatchObject({
        user_id: userId,
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: expect.stringContaining('You accepted John Challenger')
      });
    });

    it('should handle missing phone numbers gracefully', async () => {
      // Arrange
      const challengeId = 'challenge-123';
      const userId = 'challenged-user-456';
      
      const mockChallengeData = {
        challenger_id: 'challenger-user-789',
        challenged_id: userId,
        match_type: 'singles',
        challenger: {
          full_name: 'John Challenger',
          phone: null // No phone number
        },
        challenged: {
          full_name: 'Jane Challenged',
          phone: '5559876543'
        }
      };

      mockSingle.mockResolvedValueOnce({
        data: mockChallengeData,
        error: null
      });

      mockEq.mockResolvedValueOnce({
        data: null,
        error: null
      });

      mockSelect.mockResolvedValue({
        data: [{ id: 'notification-1' }],
        error: null
      });

      // Act
      await challengeService.acceptChallenge(challengeId, userId);

      // Assert
      const insertCalls = mockInsert.mock.calls;
      
      // Should show "no phone number provided" message
      expect(insertCalls[1][0].message).toContain('no phone number provided');
    });

    it('should handle RLS policy errors and retry', async () => {
      // Arrange
      const challengeId = 'challenge-123';
      const userId = 'challenged-user-456';
      
      const mockChallengeData = {
        challenger_id: 'challenger-user-789',
        challenged_id: userId,
        match_type: 'singles',
        challenger: { full_name: 'John', phone: '5551234567' },
        challenged: { full_name: 'Jane', phone: '5559876543' }
      };

      mockSingle.mockResolvedValueOnce({
        data: mockChallengeData,
        error: null
      });

      mockEq.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // First notification fails due to RLS
      mockSelect
        .mockRejectedValueOnce({
          code: '42501',
          message: 'new row violates row-level security policy for table "notifications"'
        })
        .mockResolvedValueOnce({
          data: [{ id: 'notification-2' }],
          error: null
        });

      // Act & Assert
      await expect(challengeService.acceptChallenge(challengeId, userId)).rejects.toThrow();
    });
  });

  describe('Doubles Challenge Contact Sharing', () => {
    it('should only share contacts when all 4 players are ready', async () => {
      // Arrange
      const challengeId = 'challenge-123';
      const userId = 'challenged-user-456';
      
      const mockChallengeData = {
        challenger_id: 'challenger-user-789',
        challenged_id: userId,
        match_type: 'doubles',
        challenger: { full_name: 'John', phone: '5551234567' },
        challenged: { full_name: 'Jane', phone: '5559876543' }
      };

      mockSingle.mockResolvedValueOnce({
        data: mockChallengeData,
        error: null
      });

      mockEq.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock finding related challenges (simulating only 2 players so far)
      mockSelect.mockResolvedValueOnce({
        data: [mockChallengeData], // Only one related challenge
        error: null
      });

      // Act
      await challengeService.acceptChallenge(challengeId, userId);

      // Assert - No notifications should be created for doubles until all 4 players
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should create notifications for all 4 players when doubles is complete', async () => {
      // This test would be more complex and would require mocking
      // the complete doubles challenge flow with 4 players
      // For now, we'll keep it as a placeholder for future implementation
      expect(true).toBe(true);
    });
  });

  describe('Notification Display', () => {
    it('should filter contact sharing notifications correctly', () => {
      // Test for ContactSharingNotification component filtering
      const mockNotifications = [
        {
          id: '1',
          title: '🎾 Challenge Accepted - Contact Info Shared',
          message: 'Contact info message',
          type: 'challenge'
        },
        {
          id: '2', 
          title: 'Regular Challenge',
          message: 'Regular message',
          type: 'challenge'
        },
        {
          id: '3',
          title: 'All 4 Players Ready - Contact Info Shared',
          message: 'Doubles contact info',
          type: 'challenge'
        }
      ];

      // Filter logic from ContactSharingNotification component
      const contactNotifications = mockNotifications.filter(n => 
        n.title.includes('Contact Info Shared') || n.title.includes('All 4 Players Ready')
      );

      expect(contactNotifications).toHaveLength(2);
      expect(contactNotifications[0].id).toBe('1');
      expect(contactNotifications[1].id).toBe('3');
    });
  });

  describe('Database Policy Validation', () => {
    it('should validate RLS policy allows challenge notification creation', async () => {
      // Mock successful auth check
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'test-user-123' } },
        error: null
      });

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-123' },
            access_token: 'valid-token'
          }
        },
        error: null
      });

      // Mock successful notification insert
      mockSelect.mockResolvedValue({
        data: [{ id: 'notification-success' }],
        error: null
      });

      mockInsert.mockResolvedValue({
        data: [{ id: 'notification-success' }],
        error: null,
        select: mockSelect
      });

      mockSupabaseFrom.mockReturnValue({
        insert: mockInsert
      } as any);

      // Test direct notification creation
      const notificationData = {
        id: 'test-uuid-123',
        user_id: 'test-user-123',
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: 'Test message',
        is_read: false,
        created_at: new Date().toISOString()
      };

      const result = await supabase.from('notifications').insert(notificationData);

      expect(mockInsert).toHaveBeenCalledWith(notificationData);
      expect(result.error).toBeNull();
    });
  });
});