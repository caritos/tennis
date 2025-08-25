/**
 * Match Invitation Contact Sharing Unit Test
 * 
 * Tests the contact sharing notification functionality added to MatchInvitationService
 */

import { MatchInvitationService } from '@/services/matchInvitationService';

// Mock external dependencies
jest.mock('@/lib/supabase');
jest.mock('@/utils/uuid');

const { supabase } = require('@/lib/supabase');
const { generateUUID } = require('@/utils/uuid');

describe('Match Invitation Contact Sharing Unit Tests', () => {
  let service: MatchInvitationService;
  let mockNotificationInserts: any[];
  let mockFromChain: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationInserts = [];
    
    service = MatchInvitationService.getInstance();

    // Mock UUID generation
    generateUUID
      .mockReturnValueOnce('creator-notification-uuid')
      .mockReturnValueOnce('participant-notification-uuid')
      .mockReturnValueOnce('player-1-notification-uuid')
      .mockReturnValueOnce('player-2-notification-uuid')
      .mockReturnValueOnce('player-3-notification-uuid')
      .mockReturnValueOnce('player-4-notification-uuid');

    // Create mock chain that captures notification inserts
    mockFromChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockImplementation((data) => {
        mockNotificationInserts.push(data);
        return Promise.resolve({ error: null, data });
      }),
      update: jest.fn().mockResolvedValue({ error: null }),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    supabase.from.mockReturnValue(mockFromChain);
  });

  describe('Singles Contact Sharing', () => {
    test('should create contact sharing notifications for both players in singles match', async () => {
      const invitation = {
        id: 'invite-123',
        creator_id: 'creator-456',
        match_type: 'singles',
        date: '2024-01-20',
        status: 'active'
      };

      const players = [
        {
          id: 'creator-456',
          full_name: 'Alice Creator',
          phone: '+1234567890'
        },
        {
          id: 'participant-789',
          full_name: 'Bob Participant',
          phone: '+1987654321'
        }
      ];

      const confirmedPlayerIds = ['creator-456', 'participant-789'];

      // Mock user details fetch
      mockFromChain.select.mockResolvedValueOnce({
        data: players,
        error: null
      });

      // Access private method using bracket notation for testing
      await (service as any).sendContactSharingNotifications(
        'invite-123',
        invitation,
        confirmedPlayerIds
      );

      // Verify that 2 notifications were created
      expect(mockNotificationInserts).toHaveLength(2);

      // Check creator notification
      const creatorNotification = mockNotificationInserts.find(
        notif => notif.user_id === 'creator-456'
      );
      expect(creatorNotification).toMatchObject({
        id: 'creator-notification-uuid',
        user_id: 'creator-456',
        type: 'match_invitation',
        title: '🎾 Match Confirmed - Contact Info Shared',
        is_read: false,
        action_type: 'view_match',
        related_id: 'invite-123'
      });
      expect(creatorNotification.message).toContain('Bob Participant joined your singles match');
      expect(creatorNotification.message).toContain('+1987654321');

      // Check participant notification  
      const participantNotification = mockNotificationInserts.find(
        notif => notif.user_id === 'participant-789'
      );
      expect(participantNotification).toMatchObject({
        id: 'participant-notification-uuid',
        user_id: 'participant-789', 
        type: 'match_invitation',
        title: '🎾 Match Confirmed - Contact Info Shared',
        is_read: false,
        action_type: 'view_match',
        related_id: 'invite-123'
      });
      expect(participantNotification.message).toContain('You joined Alice Creator\'s singles match');
      expect(participantNotification.message).toContain('+1234567890');
    });

    test('should handle missing phone numbers with fallback text', async () => {
      const invitation = {
        id: 'invite-no-phone',
        creator_id: 'creator-no-phone',
        match_type: 'singles',
        status: 'active'
      };

      const players = [
        {
          id: 'creator-no-phone',
          full_name: 'Alice NoPhone',
          phone: null
        },
        {
          id: 'participant-no-phone',
          full_name: 'Bob NoPhone',
          phone: undefined
        }
      ];

      mockFromChain.select.mockResolvedValueOnce({
        data: players,
        error: null
      });

      await (service as any).sendContactSharingNotifications(
        'invite-no-phone',
        invitation,
        ['creator-no-phone', 'participant-no-phone']
      );

      expect(mockNotificationInserts).toHaveLength(2);

      const creatorNotification = mockNotificationInserts.find(
        notif => notif.user_id === 'creator-no-phone'
      );
      expect(creatorNotification.message).toContain('Bob NoPhone (no phone number provided)');

      const participantNotification = mockNotificationInserts.find(
        notif => notif.user_id === 'participant-no-phone'
      );
      expect(participantNotification.message).toContain('Alice NoPhone (no phone number provided)');
    });

    test('should handle error when wrong number of players for singles', async () => {
      const invitation = {
        id: 'invite-wrong-count',
        creator_id: 'creator-123',
        match_type: 'singles'
      };

      // Mock wrong number of players (should be 2 for singles)
      mockFromChain.select.mockResolvedValueOnce({
        data: [{ id: 'player-1', full_name: 'Player One', phone: '111' }], // Only 1 player
        error: null
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await (service as any).sendContactSharingNotifications(
        'invite-wrong-count',
        invitation,
        ['creator-123']
      );

      // Should log error and not create notifications
      expect(consoleSpy).toHaveBeenCalledWith('❌ Singles match requires exactly 2 players, got:', 1);
      expect(mockNotificationInserts).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Doubles Contact Sharing', () => {
    test('should create contact sharing notifications for all 4 players in doubles match', async () => {
      const invitation = {
        id: 'doubles-invite-123',
        creator_id: 'creator-A',
        match_type: 'doubles',
        status: 'active'
      };

      const players = [
        { id: 'creator-A', full_name: 'Alice', phone: '+1111111111' },
        { id: 'player-B', full_name: 'Bob', phone: '+2222222222' },
        { id: 'player-C', full_name: 'Charlie', phone: '+3333333333' },
        { id: 'player-D', full_name: 'Diana', phone: '+4444444444' }
      ];

      mockFromChain.select.mockResolvedValueOnce({
        data: players,
        error: null
      });

      await (service as any).sendContactSharingNotifications(
        'doubles-invite-123',
        invitation,
        ['creator-A', 'player-B', 'player-C', 'player-D']
      );

      // Verify all 4 players got notifications
      expect(mockNotificationInserts).toHaveLength(4);

      players.forEach(player => {
        const notification = mockNotificationInserts.find(
          notif => notif.user_id === player.id
        );
        expect(notification).toBeDefined();
        expect(notification.type).toBe('match_invitation');
        expect(notification.title).toBe('🎾 Doubles Match Confirmed - Contact Info Shared');
        expect(notification.related_id).toBe('doubles-invite-123');

        // Verify notification contains contact info for the other 3 players
        const otherPlayers = players.filter(p => p.id !== player.id);
        otherPlayers.forEach(otherPlayer => {
          expect(notification.message).toContain(otherPlayer.full_name);
          expect(notification.message).toContain(otherPlayer.phone);
        });

        // Verify notification does NOT contain the player's own info
        expect(notification.message).not.toContain(player.full_name);
        expect(notification.message).not.toContain(player.phone);
      });
    });

    test('should handle error when wrong number of players for doubles', async () => {
      const invitation = {
        id: 'doubles-wrong-count',
        creator_id: 'creator-123',
        match_type: 'doubles'
      };

      // Mock wrong number of players (should be 4 for doubles)
      mockFromChain.select.mockResolvedValueOnce({
        data: [
          { id: 'player-1', full_name: 'Player One', phone: '111' },
          { id: 'player-2', full_name: 'Player Two', phone: '222' }
        ], // Only 2 players
        error: null
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await (service as any).sendContactSharingNotifications(
        'doubles-wrong-count',
        invitation,
        ['creator-123', 'player-2']
      );

      // Should log error and not create notifications
      expect(consoleSpy).toHaveBeenCalledWith('❌ Doubles match requires exactly 4 players, got:', 2);
      expect(mockNotificationInserts).toHaveLength(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors when fetching user details', async () => {
      const invitation = {
        id: 'invite-db-error',
        creator_id: 'creator-error',
        match_type: 'singles'
      };

      // Mock database error
      mockFromChain.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await (service as any).sendContactSharingNotifications(
        'invite-db-error',
        invitation,
        ['creator-error', 'participant-error']
      );

      // Should log error and not create notifications
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to get player details:', { message: 'Database connection failed' });
      expect(mockNotificationInserts).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    test('should handle notification insertion failures gracefully', async () => {
      const invitation = {
        id: 'invite-insert-fail',
        creator_id: 'creator-fail',
        match_type: 'singles'
      };

      const players = [
        { id: 'creator-fail', full_name: 'Creator', phone: '111' },
        { id: 'participant-fail', full_name: 'Participant', phone: '222' }
      ];

      mockFromChain.select.mockResolvedValueOnce({
        data: players,
        error: null
      });

      // Mock notification insertion failure
      mockFromChain.insert.mockResolvedValue({
        error: { message: 'Failed to insert notification' }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await (service as any).sendContactSharingNotifications(
        'invite-insert-fail',
        invitation,
        ['creator-fail', 'participant-fail']
      );

      // Should log errors but not throw
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to insert creator notification:', { message: 'Failed to insert notification' });
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to insert participant notification:', { message: 'Failed to insert notification' });

      consoleSpy.mockRestore();
    });

    test('should handle general exceptions gracefully', async () => {
      const invitation = {
        id: 'invite-exception',
        creator_id: 'creator-exception',
        match_type: 'singles'
      };

      // Mock exception during user details fetch
      mockFromChain.select.mockRejectedValueOnce(new Error('Unexpected error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Should not throw exception
      await expect(
        (service as any).sendContactSharingNotifications(
          'invite-exception',
          invitation,
          ['creator-exception', 'participant-exception']
        )
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to send contact sharing notifications:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

});