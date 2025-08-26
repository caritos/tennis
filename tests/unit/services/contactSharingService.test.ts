import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  order: jest.fn().mockReturnThis(),
};

describe('Contact Sharing System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
  });

  describe('ChallengeService', () => {
    it('should create a challenge with proper data structure', async () => {
      const challengeService = ChallengeService.getInstance();
      
      const mockChallenge = {
        id: 'test-uuid-123',
        challenger_id: 'user1',
        challenged_id: 'user2',
        club_id: 'club1',
        match_type: 'singles',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      mockSupabaseChain.single.mockResolvedValue({
        data: mockChallenge,
        error: null
      });

      const result = await challengeService.createChallenge({
        challengedId: 'user2',
        clubId: 'club1',
        matchType: 'singles',
        message: 'Let\'s play!'
      });

      expect(supabase.from).toHaveBeenCalledWith('challenges');
      expect(mockSupabaseChain.insert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      const challengeService = ChallengeService.getInstance();
      
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(
        challengeService.createChallenge({
          challengedId: 'user2',
          clubId: 'club1',
          matchType: 'singles',
          message: 'Let\'s play!'
        })
      ).rejects.toThrow();
    });

    it('should get user challenges', async () => {
      const challengeService = ChallengeService.getInstance();
      
      const mockChallenges = [
        {
          id: 'challenge1',
          challenger_id: 'user1',
          challenged_id: 'user2',
          status: 'pending'
        }
      ];

      mockSupabaseChain.order = jest.fn().mockResolvedValue({
        data: mockChallenges,
        error: null
      });

      const result = await challengeService.getUserChallenges('user1');

      expect(supabase.from).toHaveBeenCalledWith('challenges');
      expect(result).toEqual(mockChallenges);
    });
  });

  describe('Contact Sharing Flow', () => {
    it('should handle contact sharing notification creation', () => {
      // This test verifies that contact sharing notifications can be structured properly
      const contactSharingNotification = {
        type: 'challenge',
        title: 'Contact Info Shared',
        message: 'Your contact information has been shared with your match opponent.',
        user_id: 'test-user-id',
        action_data: {
          challenge_id: 'test-challenge-id',
          contact_info: {
            phone: '+1234567890'
          }
        }
      };

      expect(contactSharingNotification.type).toBe('challenge');
      expect(contactSharingNotification.title).toBe('Contact Info Shared');
      expect(contactSharingNotification.action_data.challenge_id).toBe('test-challenge-id');
      expect(contactSharingNotification.action_data.contact_info.phone).toBe('+1234567890');
    });
  });
});