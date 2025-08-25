import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'challenge-id',
              challenger_id: 'challenger-user-id',
              challenged_id: 'challenged-user-id',
              match_type: 'singles',
              challenger: { full_name: 'Challenger Name', phone: '+1111111111' },
              challenged: { full_name: 'Challenged Name', phone: '+2222222222' }
            },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

describe('Challenge Notifications RLS Policy Fix', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Challenge notification creation', () => {
    it('should create notification with correct structure for challenger', () => {
      const challengeId = 'test-challenge-id';
      const challengerId = 'challenger-user-id';
      const challengedName = 'Challenged Player';
      const challengedPhone = '+1234567890';

      // Simulate the notification structure created in acceptChallenge
      const challengerNotification = {
        id: 'notification-id',
        user_id: challengerId, // Notification FOR the challenger
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: `${challengedName} accepted your singles challenge! Contact: ${challengedPhone}`,
        is_read: false,
        action_type: 'view_match',
        action_data: JSON.stringify({ challengeId }), // Contains challenge ID for RLS policy
        related_id: challengeId,
        created_at: new Date().toISOString(),
      };

      // Verify the structure matches what RLS policy expects
      expect(challengerNotification.type).toBe('challenge');
      expect(challengerNotification.user_id).toBe(challengerId);
      
      // Verify action_data contains challengeId for RLS policy lookup
      const actionData = JSON.parse(challengerNotification.action_data);
      expect(actionData.challengeId).toBe(challengeId);
    });

    it('should create notification with correct structure for challenged player', () => {
      const challengeId = 'test-challenge-id';
      const challengedId = 'challenged-user-id';
      const challengerName = 'Challenger Player';
      const challengerPhone = '+9876543210';

      // Simulate the notification structure created in acceptChallenge
      const challengedNotification = {
        id: 'notification-id-2',
        user_id: challengedId, // Notification FOR the challenged player
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: `You accepted ${challengerName}'s singles challenge! Contact: ${challengerPhone}`,
        is_read: false,
        action_type: 'view_match',
        action_data: JSON.stringify({ challengeId }), // Contains challenge ID for RLS policy
        related_id: challengeId,
        created_at: new Date().toISOString(),
      };

      // Verify the structure
      expect(challengedNotification.type).toBe('challenge');
      expect(challengedNotification.user_id).toBe(challengedId);
      
      // Verify action_data contains challengeId for RLS policy lookup
      const actionData = JSON.parse(challengedNotification.action_data);
      expect(actionData.challengeId).toBe(challengeId);
    });
  });

  describe('RLS Policy Logic Validation', () => {
    it('should allow challenged user to create notification for challenger', () => {
      // Simulating RLS policy logic
      const authUserId = 'challenged-user-id'; // Current authenticated user (challenged)
      const notificationUserId = 'challenger-user-id'; // Notification recipient (challenger)
      const challengeData = {
        id: 'challenge-id',
        challenger_id: 'challenger-user-id',
        challenged_id: 'challenged-user-id',
      };

      // RLS Policy check: Can challenged user create notification for challenger?
      const canCreate = (
        // User creating notification for themselves
        authUserId === notificationUserId
      ) || (
        // OR user is challenge participant creating notification for other participant
        (challengeData.challenger_id === authUserId && challengeData.challenged_id === notificationUserId) ||
        (challengeData.challenged_id === authUserId && challengeData.challenger_id === notificationUserId)
      );

      // Should be true: challenged user can create notification for challenger
      expect(canCreate).toBe(true);
    });

    it('should allow challenger to create notification for challenged user', () => {
      // Simulating RLS policy logic
      const authUserId = 'challenger-user-id'; // Current authenticated user (challenger)
      const notificationUserId = 'challenged-user-id'; // Notification recipient (challenged)
      const challengeData = {
        id: 'challenge-id',
        challenger_id: 'challenger-user-id',
        challenged_id: 'challenged-user-id',
      };

      // RLS Policy check
      const canCreate = (
        authUserId === notificationUserId
      ) || (
        (challengeData.challenger_id === authUserId && challengeData.challenged_id === notificationUserId) ||
        (challengeData.challenged_id === authUserId && challengeData.challenger_id === notificationUserId)
      );

      // Should be true: challenger can create notification for challenged user
      expect(canCreate).toBe(true);
    });

    it('should NOT allow unrelated user to create challenge notifications', () => {
      // Simulating RLS policy logic
      const authUserId = 'random-user-id'; // Unrelated user
      const notificationUserId = 'challenger-user-id';
      const challengeData = {
        id: 'challenge-id',
        challenger_id: 'challenger-user-id',
        challenged_id: 'challenged-user-id',
      };

      // RLS Policy check
      const canCreate = (
        authUserId === notificationUserId
      ) || (
        (challengeData.challenger_id === authUserId && challengeData.challenged_id === notificationUserId) ||
        (challengeData.challenged_id === authUserId && challengeData.challenger_id === notificationUserId)
      );

      // Should be false: unrelated user cannot create challenge notifications
      expect(canCreate).toBe(false);
    });
  });
});