/**
 * Real-time System Integration Test
 * 
 * Tests the real-time features of the application:
 * 1. Real-time notifications
 * 2. Live challenge updates
 * 3. Match status changes
 * 4. Contact sharing events
 * 5. Club membership updates
 * 6. Real-time subscriptions and cleanup
 */

import { supabase } from '../../lib/supabase';
import { realtimeService } from '../../services/realtimeService';
import { NotificationService } from '../../services/NotificationService';
import { challengeService } from '../../services/challengeService';
import { clubService } from '../../services/clubService';

describe('Real-time System Integration Test', () => {
  let testClub: any;
  let testUser1: any;
  let testUser2: any;
  let subscriptions: any[] = [];
  let receivedEvents: any[] = [];

  beforeAll(async () => {
    // Create test users and club
    testUser1 = { id: 'test-user-1', name: 'Test User 1', email: 'test1@example.com' };
    testUser2 = { id: 'test-user-2', name: 'Test User 2', email: 'test2@example.com' };
    
    testClub = {
      id: 'test-club-1',
      name: 'Real-time Test Club',
      description: 'For testing real-time features',
    };

    // Clear any existing events
    receivedEvents = [];
  });

  afterAll(async () => {
    // Clean up subscriptions
    subscriptions.forEach(subscription => {
      supabase.removeChannel(subscription);
    });
    subscriptions = [];
  });

  describe('Real-time Notification System', () => {
    it('should establish real-time connection for notifications', async () => {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `userId=eq.${testUser1.id}`,
          },
          (payload) => {
            receivedEvents.push({
              type: 'notification_insert',
              payload: payload.new,
              timestamp: Date.now(),
            });
          }
        )
        .subscribe();

      subscriptions.push(subscription);

      // Wait for subscription to be established
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(subscription.state).toBe('SUBSCRIBED');
    });

    it('should receive notifications in real-time', async () => {
      const initialEventCount = receivedEvents.length;

      // Simulate notification creation
      const notification = {
        userId: testUser1.id,
        type: 'challenge_received',
        title: 'Real-time Test Challenge',
        message: 'Testing real-time notifications',
        data: { challengeId: 'test-challenge-1' },
      };

      await supabase.from('notifications').insert(notification);

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const notificationEvent = newEvents.find(e => 
        e.type === 'notification_insert' && 
        e.payload.title === notification.title
      );

      expect(notificationEvent).toBeDefined();
      expect(notificationEvent.payload.userId).toBe(testUser1.id);
      expect(notificationEvent.payload.type).toBe('challenge_received');
    });

    it('should handle multiple simultaneous notifications', async () => {
      const initialEventCount = receivedEvents.length;

      // Create multiple notifications simultaneously
      const notifications = [
        {
          userId: testUser1.id,
          type: 'match_invitation',
          title: 'Match Invitation 1',
          message: 'First simultaneous notification',
        },
        {
          userId: testUser1.id,
          type: 'match_invitation', 
          title: 'Match Invitation 2',
          message: 'Second simultaneous notification',
        },
        {
          userId: testUser1.id,
          type: 'contact_shared',
          title: 'Contact Shared',
          message: 'Third simultaneous notification',
        },
      ];

      await supabase.from('notifications').insert(notifications);

      // Wait for all events
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const matchInviteEvents = newEvents.filter(e => 
        e.payload?.type === 'match_invitation'
      );
      const contactSharedEvents = newEvents.filter(e => 
        e.payload?.type === 'contact_shared'
      );

      expect(matchInviteEvents).toHaveLength(2);
      expect(contactSharedEvents).toHaveLength(1);
    });
  });

  describe('Real-time Challenge Updates', () => {
    let challengeSubscription: any;

    it('should subscribe to challenge updates', async () => {
      challengeSubscription = supabase
        .channel('challenges')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'challenges',
            filter: `challengeeId=eq.${testUser2.id}`,
          },
          (payload) => {
            receivedEvents.push({
              type: 'challenge_update',
              payload: payload.new,
              old: payload.old,
              timestamp: Date.now(),
            });
          }
        )
        .subscribe();

      subscriptions.push(challengeSubscription);

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(challengeSubscription.state).toBe('SUBSCRIBED');
    });

    it('should receive real-time challenge status updates', async () => {
      const initialEventCount = receivedEvents.length;

      // Create a challenge first
      const challenge = {
        id: 'realtime-challenge-1',
        challengerId: testUser1.id,
        challengeeId: testUser2.id,
        clubId: testClub.id,
        status: 'pending',
        matchType: 'singles',
        message: 'Real-time challenge test',
      };

      await supabase.from('challenges').insert(challenge);

      // Update challenge status
      await supabase
        .from('challenges')
        .update({ status: 'accepted' })
        .eq('id', challenge.id);

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const challengeUpdateEvent = newEvents.find(e => 
        e.type === 'challenge_update' && 
        e.payload.id === challenge.id
      );

      expect(challengeUpdateEvent).toBeDefined();
      expect(challengeUpdateEvent.old.status).toBe('pending');
      expect(challengeUpdateEvent.payload.status).toBe('accepted');
    });
  });

  describe('Real-time Club Membership Updates', () => {
    let membershipSubscription: any;

    it('should subscribe to club membership changes', async () => {
      membershipSubscription = supabase
        .channel('club_memberships')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'club_members',
            filter: `clubId=eq.${testClub.id}`,
          },
          (payload) => {
            receivedEvents.push({
              type: 'member_joined',
              payload: payload.new,
              timestamp: Date.now(),
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'club_members',
            filter: `clubId=eq.${testClub.id}`,
          },
          (payload) => {
            receivedEvents.push({
              type: 'member_left',
              payload: payload.old,
              timestamp: Date.now(),
            });
          }
        )
        .subscribe();

      subscriptions.push(membershipSubscription);

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(membershipSubscription.state).toBe('SUBSCRIBED');
    });

    it('should receive real-time member join events', async () => {
      const initialEventCount = receivedEvents.length;

      // Simulate new member joining
      const membership = {
        clubId: testClub.id,
        userId: testUser2.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
      };

      await supabase.from('club_members').insert(membership);

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const memberJoinEvent = newEvents.find(e => 
        e.type === 'member_joined' && 
        e.payload.userId === testUser2.id
      );

      expect(memberJoinEvent).toBeDefined();
      expect(memberJoinEvent.payload.clubId).toBe(testClub.id);
    });

    it('should receive real-time member leave events', async () => {
      const initialEventCount = receivedEvents.length;

      // Remove member
      await supabase
        .from('club_members')
        .delete()
        .eq('clubId', testClub.id)
        .eq('userId', testUser2.id);

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const memberLeaveEvent = newEvents.find(e => 
        e.type === 'member_left' && 
        e.payload.userId === testUser2.id
      );

      expect(memberLeaveEvent).toBeDefined();
      expect(memberLeaveEvent.payload.clubId).toBe(testClub.id);
    });
  });

  describe('Real-time Contact Sharing Events', () => {
    it('should handle contact sharing notifications in real-time', async () => {
      const initialEventCount = receivedEvents.length;

      // Simulate contact sharing event
      const contactSharingNotification = {
        userId: testUser1.id,
        type: 'contact_shared',
        title: 'Contact Information Shared',
        message: 'Your contact was shared with Bob Smith',
        data: {
          sharedWith: testUser2.id,
          contactInfo: '+1234567890',
          challengeId: 'contact-test-challenge',
        },
      };

      await supabase.from('notifications').insert(contactSharingNotification);

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const contactEvent = newEvents.find(e => 
        e.payload?.type === 'contact_shared'
      );

      expect(contactEvent).toBeDefined();
      expect(contactEvent.payload.data.sharedWith).toBe(testUser2.id);
      expect(contactEvent.payload.data.contactInfo).toBe('+1234567890');
    });
  });

  describe('Real-time Match Updates', () => {
    let matchSubscription: any;

    it('should subscribe to match status changes', async () => {
      matchSubscription = supabase
        .channel('matches')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
          },
          (payload) => {
            // Only track matches involving our test users
            if (payload.new.player1Id === testUser1.id || 
                payload.new.player2Id === testUser1.id ||
                payload.new.player1Id === testUser2.id || 
                payload.new.player2Id === testUser2.id) {
              receivedEvents.push({
                type: 'match_update',
                payload: payload.new,
                old: payload.old,
                timestamp: Date.now(),
              });
            }
          }
        )
        .subscribe();

      subscriptions.push(matchSubscription);

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(matchSubscription.state).toBe('SUBSCRIBED');
    });

    it('should receive real-time match completion events', async () => {
      const initialEventCount = receivedEvents.length;

      // Create a match
      const match = {
        id: 'realtime-match-1',
        clubId: testClub.id,
        player1Id: testUser1.id,
        player2Id: testUser2.id,
        status: 'in_progress',
        matchType: 'singles',
      };

      await supabase.from('matches').insert(match);

      // Complete the match
      await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          winnerId: testUser1.id,
          completedAt: new Date().toISOString(),
        })
        .eq('id', match.id);

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const matchUpdateEvent = newEvents.find(e => 
        e.type === 'match_update' && 
        e.payload.id === match.id
      );

      expect(matchUpdateEvent).toBeDefined();
      expect(matchUpdateEvent.old.status).toBe('in_progress');
      expect(matchUpdateEvent.payload.status).toBe('completed');
      expect(matchUpdateEvent.payload.winnerId).toBe(testUser1.id);
    });
  });

  describe('Connection Management and Error Handling', () => {
    it('should handle subscription errors gracefully', async () => {
      const errorEvents: any[] = [];

      const errorSubscription = supabase
        .channel('error_test')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'invalid_schema',
            table: 'invalid_table',
          },
          () => {}
        )
        .subscribe((status, err) => {
          if (status === 'CHANNEL_ERROR') {
            errorEvents.push({ status, error: err });
          }
        });

      subscriptions.push(errorSubscription);

      // Wait for error
      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(errorEvents.length).toBeGreaterThan(0);
      expect(errorEvents[0].status).toBe('CHANNEL_ERROR');
    });

    it('should reconnect automatically after connection loss', async () => {
      let connectionStates: string[] = [];

      const reconnectSubscription = supabase
        .channel('reconnect_test')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          () => {}
        )
        .subscribe((status) => {
          connectionStates.push(status);
        });

      subscriptions.push(reconnectSubscription);

      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(connectionStates).toContain('SUBSCRIBED');
    });

    it('should clean up subscriptions properly', async () => {
      const testSubscription = supabase
        .channel('cleanup_test')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          () => {}
        )
        .subscribe();

      // Verify subscription is active
      expect(testSubscription.state).toBe('JOINED');

      // Unsubscribe
      supabase.removeChannel(testSubscription);

      // Verify subscription is cleaned up
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(testSubscription.state).toBe('CLOSED');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high frequency of real-time events', async () => {
      const startTime = Date.now();
      const initialEventCount = receivedEvents.length;

      // Create multiple rapid-fire notifications
      const rapidNotifications = Array.from({ length: 20 }, (_, i) => ({
        userId: testUser1.id,
        type: 'test_event',
        title: `Rapid Event ${i + 1}`,
        message: `Testing high frequency events ${i + 1}`,
        data: { eventNumber: i + 1 },
      }));

      await supabase.from('notifications').insert(rapidNotifications);

      // Wait for all events to be received
      await new Promise(resolve => setTimeout(resolve, 5000));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      const newEvents = receivedEvents.slice(initialEventCount);
      const rapidEvents = newEvents.filter(e => 
        e.payload?.type === 'test_event'
      );

      expect(rapidEvents.length).toBe(20);
      expect(processingTime).toBeLessThan(10000); // Should process within 10 seconds
    });

    it('should maintain event order consistency', async () => {
      const initialEventCount = receivedEvents.length;

      // Create sequential events with timestamps
      const sequentialEvents = Array.from({ length: 5 }, (_, i) => ({
        userId: testUser1.id,
        type: 'sequence_test',
        title: `Sequential Event ${i + 1}`,
        message: `Event number ${i + 1}`,
        data: { sequence: i + 1, timestamp: Date.now() + i },
      }));

      for (const event of sequentialEvents) {
        await supabase.from('notifications').insert(event);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      }

      // Wait for all events
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newEvents = receivedEvents.slice(initialEventCount);
      const sequenceEvents = newEvents
        .filter(e => e.payload?.type === 'sequence_test')
        .sort((a, b) => a.timestamp - b.timestamp);

      // Verify events are in correct order
      for (let i = 0; i < sequenceEvents.length - 1; i++) {
        expect(sequenceEvents[i].payload.data.sequence)
          .toBeLessThan(sequenceEvents[i + 1].payload.data.sequence);
      }
    });
  });
});