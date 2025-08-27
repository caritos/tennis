import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { pushNotificationService } from './pushNotificationService';

interface RealtimeSubscription {
  channel: RealtimeChannel;
  cleanup: () => void;
}

class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private userId: string | null = null;

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (this.userId === userId) return; // Already initialized for this user
    
    console.log('🔗 Initializing realtime service for user:', userId);
    
    // Clean up existing subscriptions
    this.cleanup();
    this.userId = userId;

    try {
      // Subscribe to user-specific notifications
      await this.subscribeToUserNotifications(userId);
      
      // Subscribe to user's club activities
      await this.subscribeToUserClubActivities(userId);
      
      console.log('✅ Realtime service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize realtime service:', error);
    }
  }

  private async subscribeToUserNotifications(userId: string): Promise<void> {
    const channelName = `user_notifications:${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload);
          this.handleNotificationInsert(payload.new as any);
        }
      )
      .subscribe((status) => {
        console.log(`📡 User notifications subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, {
      channel,
      cleanup: () => supabase.removeChannel(channel),
    });
  }

  private async subscribeToUserClubActivities(userId: string): Promise<void> {
    // First, get user's clubs to subscribe to their activities
    try {
      const { data: userClubs, error } = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Failed to get user clubs for realtime:', error);
        return;
      }

      if (!userClubs || userClubs.length === 0) {
        console.log('ℹ️ User has no clubs to subscribe to');
        return;
      }

      // Subscribe to challenges for user's clubs
      await this.subscribeToChallenges(userId, userClubs.map(c => c.club_id));
      
      // Subscribe to match invitations for user's clubs
      await this.subscribeToMatchInvitations(userId, userClubs.map(c => c.club_id));
      
      // Subscribe to match results for user's clubs
      await this.subscribeToMatchResults(userId, userClubs.map(c => c.club_id));

    } catch (error) {
      console.error('❌ Failed to subscribe to club activities:', error);
    }
  }

  private async subscribeToChallenges(userId: string, clubIds: string[]): Promise<void> {
    const channelName = `user_challenges:${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `challenged_id=eq.${userId}`,
        },
        (payload) => {
          console.log('⚔️ New challenge received:', payload);
          this.handleChallengeInsert(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'challenges',
          filter: `challenger_id=eq.${userId}`,
        },
        (payload) => {
          console.log('⚔️ Challenge status updated:', payload);
          this.handleChallengeUpdate(payload.new as any);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Challenges subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, {
      channel,
      cleanup: () => supabase.removeChannel(channel),
    });
  }

  private async subscribeToMatchInvitations(userId: string, clubIds: string[]): Promise<void> {
    const channelName = `user_match_invitations:${userId}`;
    
    // Subscribe to new match invitations in user's clubs
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_invitations',
          filter: `club_id=in.(${clubIds.join(',')})`,
        },
        (payload) => {
          const invitation = payload.new as any;
          // Don't notify about your own invitations
          if (invitation.creator_id !== userId) {
            console.log('🎾 New match invitation:', payload);
            this.handleMatchInvitationInsert(invitation);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invitation_responses',
        },
        (payload) => {
          console.log('🎾 New match invitation response:', payload);
          this.handleInvitationResponseInsert(payload.new as any);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Match invitations subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, {
      channel,
      cleanup: () => supabase.removeChannel(channel),
    });
  }

  private async subscribeToMatchResults(userId: string, clubIds: string[]): Promise<void> {
    const channelName = `user_match_results:${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `club_id=in.(${clubIds.join(',')})`,
        },
        (payload) => {
          const match = payload.new as any;
          // Only notify if user was involved in the match
          if (this.isUserInMatch(userId, match)) {
            console.log('🏆 New match result:', payload);
            this.handleMatchResultInsert(match);
          }
        }
      )
      .subscribe((status) => {
        console.log(`📡 Match results subscription status: ${status}`);
      });

    this.subscriptions.set(channelName, {
      channel,
      cleanup: () => supabase.removeChannel(channel),
    });
  }

  private handleNotificationInsert(notification: any): void {
    // Send push notification for new database notifications
    pushNotificationService.sendLocalNotification({
      type: notification.type,
      title: notification.title,
      body: notification.message || notification.title,
      data: {
        notificationId: notification.id,
        type: notification.type,
        actionType: notification.action_type,
        actionData: notification.action_data,
        relatedId: notification.related_id,
      },
    });
  }

  private handleChallengeInsert(challenge: any): void {
    pushNotificationService.sendLocalNotification({
      type: 'challenge',
      title: 'New Challenge!',
      body: `You've been challenged to a ${challenge.match_type} match`,
      data: {
        challengeId: challenge.id,
        challengerId: challenge.challenger_id,
        challengedId: challenge.challenged_id,
        clubId: challenge.club_id,
        matchType: challenge.match_type,
      },
    });
  }

  private handleChallengeUpdate(challenge: any): void {
    if (challenge.status === 'accepted') {
      pushNotificationService.sendLocalNotification({
        type: 'challenge',
        title: 'Challenge Accepted!',
        body: 'Your challenge was accepted. Contact details have been shared.',
        data: {
          challengeId: challenge.id,
          status: challenge.status,
        },
      });
    } else if (challenge.status === 'declined') {
      pushNotificationService.sendLocalNotification({
        type: 'challenge',
        title: 'Challenge Declined',
        body: 'Your challenge was declined. Try challenging someone else!',
        data: {
          challengeId: challenge.id,
          status: challenge.status,
        },
      });
    }
  }

  private handleMatchInvitationInsert(invitation: any): void {
    pushNotificationService.sendLocalNotification({
      type: 'match_invitation',
      title: 'Looking to Play!',
      body: `Someone is looking for a ${invitation.match_type} partner`,
      data: {
        invitationId: invitation.id,
        clubId: invitation.club_id,
        matchType: invitation.match_type,
        date: invitation.date,
        userId: this.userId, // Current user responding to invitation
      },
    });
  }

  private handleInvitationResponseInsert(response: any): void {
    // This would need to check if the response is for the current user's invitation
    pushNotificationService.sendLocalNotification({
      type: 'match_invitation',
      title: 'Match Response!',
      body: 'Someone is interested in your match invitation',
      data: {
        responseId: response.id,
        invitationId: response.invitation_id,
        userId: response.user_id,
      },
    });
  }

  private handleMatchResultInsert(match: any): void {
    pushNotificationService.sendLocalNotification({
      type: 'match_result',
      title: 'Match Recorded!',
      body: 'A match you played has been recorded',
      data: {
        matchId: match.id,
        clubId: match.club_id,
        date: match.date,
      },
    });
  }

  private isUserInMatch(userId: string, match: any): boolean {
    return match.player1_id === userId ||
           match.player2_id === userId ||
           match.player3_id === userId ||
           match.player4_id === userId;
  }

  cleanup(): void {
    console.log('🧹 Cleaning up realtime subscriptions');
    
    for (const [channelName, subscription] of this.subscriptions) {
      try {
        subscription.cleanup();
        console.log(`✅ Cleaned up subscription: ${channelName}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup subscription ${channelName}:`, error);
      }
    }
    
    this.subscriptions.clear();
    this.userId = null;
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export const realtimeService = RealtimeService.getInstance();