import { supabase } from '@/lib/supabase';
import { generateUUID } from '../utils/uuid';

export interface Challenge {
  id: string;
  club_id: string;
  challenger_id: string;
  challenged_id: string;
  match_type: 'singles' | 'doubles';
  proposed_date?: string;
  proposed_time?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'completed';
  expires_at?: string;
  contacts_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChallengeWithUsers extends Challenge {
  challenger_name: string;
  challenger_phone?: string;
  challenged_name: string;
  challenged_phone?: string;
}

export interface ChallengeCounter {
  id: string;
  challenge_id: string;
  counter_by: string;
  match_type: 'singles' | 'doubles';
  proposed_date?: string;
  proposed_time?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface ChallengeCounterWithUser extends ChallengeCounter {
  counter_by_name: string;
}

export interface CreateChallengeData {
  club_id: string;
  challenger_id: string;
  challenged_id: string;
  match_type: 'singles' | 'doubles';
  proposed_date?: string;
  proposed_time?: string;
  message?: string;
  expires_at?: string;
}

export interface CreateCounterChallengeData {
  challenge_id: string;
  counter_by: string;
  match_type: 'singles' | 'doubles';
  proposed_date?: string;
  proposed_time?: string;
  message?: string;
}

class ChallengeService {
  private static instance: ChallengeService | null = null;

  public static getInstance(): ChallengeService {
    if (!ChallengeService.instance) {
      ChallengeService.instance = new ChallengeService();
    }
    return ChallengeService.instance;
  }

  /**
   * Create a new challenge
   */
  public async createChallenge(challengeData: CreateChallengeData): Promise<string> {
    // Generate unique challenge ID
    const challengeId = generateUUID();
    
    // Set expiration to 7 days from now if not provided
    const expiresAt = challengeData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // Get challenger name for potential notifications
      const { data: challenger, error: challengerError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', challengeData.challenger_id)
        .single();

      if (challengerError || !challenger) {
        console.error('❌ Challenger not found:', challengerError);
        throw new Error('Challenger not found');
      }

      // Insert challenge into Supabase
      const challenge: Challenge = {
        id: challengeId,
        club_id: challengeData.club_id,
        challenger_id: challengeData.challenger_id,
        challenged_id: challengeData.challenged_id,
        match_type: challengeData.match_type,
        proposed_date: challengeData.proposed_date,
        proposed_time: challengeData.proposed_time,
        message: challengeData.message,
        status: 'pending',
        expires_at: expiresAt,
        contacts_shared: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('challenges')
        .insert(challenge)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create challenge:', error);
        throw new Error('Failed to create challenge');
      }

      // Send notification to the challenged user
      try {
        const notificationService = (await import('./NotificationService')).default;
        await notificationService.createChallengeNotification(
          challengeData.challenged_id,
          challenger.full_name,
          challengeId,
          challengeData.match_type,
          challengeData.message
        );
        console.log('✅ Challenge notification sent to challenged user');
      } catch (notificationError) {
        console.error('❌ Failed to send challenge notification:', notificationError);
        // Don't fail the challenge creation if notification fails
      }

      console.log('✅ Challenge created:', challengeId);
      return challengeId;
    } catch (error) {
      console.error('❌ Failed to create challenge:', error);
      throw new Error('Failed to create challenge');
    }
  }

  /**
   * Get all challenges for a club
   */
  public async getClubChallenges(clubId: string): Promise<ChallengeWithUsers[]> {
    try {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(full_name, phone),
          challenged:users!challenges_challenged_id_fkey(full_name, phone)
        `)
        .eq('club_id', clubId)
        .neq('status', 'expired')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get club challenges:', error);
        return [];
      }

      // Map joined data to expected format
      return (challenges || []).map((challenge: any) => ({
        ...challenge,
        challenger_name: challenge.challenger?.full_name,
        challenger_phone: challenge.challenger?.phone,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
      }));
    } catch (error) {
      console.error('❌ Failed to get club challenges:', error);
      return [];
    }
  }

  /**
   * Get challenges sent by a user
   */
  public async getUserSentChallenges(userId: string): Promise<ChallengeWithUsers[]> {
    try {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(full_name, phone),
          challenged:users!challenges_challenged_id_fkey(full_name, phone)
        `)
        .eq('challenger_id', userId)
        .neq('status', 'expired')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get user sent challenges:', error);
        return [];
      }

      // Map joined data to expected format
      return (challenges || []).map((challenge: any) => ({
        ...challenge,
        challenger_name: challenge.challenger?.full_name,
        challenger_phone: challenge.challenger?.phone,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
      }));
    } catch (error) {
      console.error('❌ Failed to get user sent challenges:', error);
      return [];
    }
  }

  /**
   * Get challenges received by a user
   */
  public async getUserReceivedChallenges(userId: string): Promise<ChallengeWithUsers[]> {
    try {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(full_name, phone),
          challenged:users!challenges_challenged_id_fkey(full_name, phone)
        `)
        .eq('challenged_id', userId)
        .neq('status', 'expired')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get user received challenges:', error);
        return [];
      }

      // Map joined data to expected format
      return (challenges || []).map((challenge: any) => ({
        ...challenge,
        challenger_name: challenge.challenger?.full_name,
        challenger_phone: challenge.challenger?.phone,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
      }));
    } catch (error) {
      console.error('❌ Failed to get user received challenges:', error);
      return [];
    }
  }

  /**
   * Get a specific challenge with user details
   */
  public async getChallenge(challengeId: string): Promise<ChallengeWithUsers | null> {
    try {
      const { data: challenge, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(full_name, phone),
          challenged:users!challenges_challenged_id_fkey(full_name, phone)
        `)
        .eq('id', challengeId)
        .single();

      if (error) {
        console.error('❌ Failed to get challenge:', error);
        return null;
      }

      // Map joined data to expected format
      return {
        ...challenge,
        challenger_name: challenge.challenger?.full_name,
        challenger_phone: challenge.challenger?.phone,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
      };
    } catch (error) {
      console.error('❌ Failed to get challenge:', error);
      return null;
    }
  }

  /**
   * Accept a challenge
   */
  public async acceptChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      console.log('🔍 ACCEPT CHALLENGE DEBUG - Starting acceptance');
      console.log('🔍 Challenge ID:', challengeId);
      console.log('🔍 User ID (should be challenged):', userId);
      
      // Get challenge details with full user information
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          challenger_id,
          challenged_id,
          match_type,
          status,
          challenger:users!challenges_challenger_id_fkey(full_name, phone),
          challenged:users!challenges_challenged_id_fkey(full_name, phone)
        `)
        .eq('id', challengeId)
        .eq('challenged_id', userId)
        .single();

      console.log('🔍 Challenge query result:', JSON.stringify(challenge, null, 2));
      console.log('🔍 Challenge query error:', challengeError);

      if (challengeError || !challenge) {
        console.error('❌ Challenge not found or not authorized:', challengeError);
        throw new Error('Challenge not found or not authorized');
      }

      console.log('🔍 Challenge details before update:');
      console.log('🔍 - Challenger ID:', challenge.challenger_id);
      console.log('🔍 - Challenged ID:', challenge.challenged_id);
      console.log('🔍 - Current status:', challenge.status);
      console.log('🔍 - Match type:', challenge.match_type);

      // Update challenge status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'accepted',
          contacts_shared: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId)
        .eq('challenged_id', userId);

      if (updateError) {
        console.error('❌ Failed to accept challenge:', updateError);
        throw new Error('Failed to accept challenge');
      }

      console.log('✅ Challenge status updated to accepted, contacts_shared set to true');
      console.log('🔍 About to send contact sharing notifications');
      console.log('🔍 Challenge data being passed to notifications:', JSON.stringify({
        challenger_id: challenge.challenger_id,
        challenged_id: challenge.challenged_id,
        match_type: challenge.match_type,
        challenger_name: challenge.challenger?.full_name,
        challenged_name: challenge.challenged?.full_name
      }, null, 2));

      // Small delay to ensure challenge update is committed to database
      console.log('🔍 Waiting 100ms for database commit...');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send contact sharing notifications to both players
      await this.sendContactSharingNotifications(challengeId, challenge);

      console.log('✅ Challenge accepted:', challengeId);
    } catch (error) {
      console.error('❌ Failed to accept challenge:', error);
      throw error;
    }
  }

  /**
   * Decline a challenge
   */
  public async declineChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      // Get challenge details to verify authorization
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          challenger_id, 
          match_type,
          challenged:users!challenges_challenged_id_fkey(full_name)
        `)
        .eq('id', challengeId)
        .eq('challenged_id', userId)
        .single();

      if (challengeError || !challenge) {
        console.error('❌ Challenge not found or not authorized:', challengeError);
        throw new Error('Challenge not found or not authorized');
      }

      // Update challenge status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId)
        .eq('challenged_id', userId);

      if (updateError) {
        console.error('❌ Failed to decline challenge:', updateError);
        throw new Error('Failed to decline challenge');
      }

      console.log('✅ Challenge declined:', challengeId);
    } catch (error) {
      console.error('❌ Failed to decline challenge:', error);
      throw error;
    }
  }

  /**
   * Create a counter-challenge
   */
  public async createCounterChallenge(counterData: CreateCounterChallengeData): Promise<string> {
    const counterId = generateUUID();
    
    try {
      // Insert counter-challenge
      const counter: ChallengeCounter = {
        id: counterId,
        challenge_id: counterData.challenge_id,
        counter_by: counterData.counter_by,
        match_type: counterData.match_type,
        proposed_date: counterData.proposed_date,
        proposed_time: counterData.proposed_time,
        message: counterData.message,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('challenge_counters')
        .insert(counter);

      if (insertError) {
        console.error('❌ Failed to create counter-challenge:', insertError);
        throw new Error('Failed to create counter-challenge');
      }

      // Update original challenge status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          status: 'countered',
          updated_at: new Date().toISOString()
        })
        .eq('id', counterData.challenge_id);

      if (updateError) {
        console.error('❌ Failed to update challenge status:', updateError);
        throw new Error('Failed to update challenge status');
      }

      console.log('✅ Counter-challenge created:', counterId);
      return counterId;
    } catch (error) {
      console.error('❌ Failed to create counter-challenge:', error);
      throw error;
    }
  }

  /**
   * Get counter-challenges for a challenge
   */
  public async getChallengeCounters(challengeId: string): Promise<ChallengeCounterWithUser[]> {
    try {
      const { data: counters, error } = await supabase
        .from('challenge_counters')
        .select(`
          *,
          counter_by_user:users!challenge_counters_counter_by_fkey(full_name)
        `)
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to get challenge counters:', error);
        return [];
      }

      // Map joined data to expected format
      return (counters || []).map((counter: any) => ({
        ...counter,
        counter_by_name: counter.counter_by_user?.full_name,
      }));
    } catch (error) {
      console.error('❌ Failed to get challenge counters:', error);
      return [];
    }
  }

  /**
   * Accept a counter-challenge
   */
  public async acceptCounterChallenge(counterId: string, challengeId: string): Promise<void> {
    try {
      // Update counter status
      const { error: counterError } = await supabase
        .from('challenge_counters')
        .update({
          status: 'accepted'
        })
        .eq('id', counterId);

      if (counterError) {
        console.error('❌ Failed to accept counter-challenge:', counterError);
        throw new Error('Failed to accept counter-challenge');
      }

      // Update main challenge status and mark contacts as shared
      const { error: challengeError } = await supabase
        .from('challenges')
        .update({
          status: 'accepted',
          contacts_shared: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (challengeError) {
        console.error('❌ Failed to update challenge status:', challengeError);
        throw new Error('Failed to update challenge status');
      }

      console.log('✅ Counter-challenge accepted:', counterId);
    } catch (error) {
      console.error('❌ Failed to accept counter-challenge:', error);
      throw error;
    }
  }

  /**
   * Expire old challenges
   */
  public async expireOldChallenges(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'expired',
          updated_at: now
        })
        .lt('expires_at', now)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Failed to expire old challenges:', error);
      } else {
        console.log('✅ Expired old challenges');
      }
    } catch (error) {
      console.error('❌ Failed to expire old challenges:', error);
    }
  }

  /**
   * Send contact sharing notifications to all players after challenge acceptance
   */
  private async sendContactSharingNotifications(challengeId: string, challenge: any): Promise<void> {
    try {
      console.log('📝 sendContactSharingNotifications called for challenge:', challengeId);
      console.log('📝 Challenge data:', JSON.stringify(challenge, null, 2));
      
      if (challenge.match_type === 'singles') {
        console.log('📝 Processing as singles game');
        // Handle singles game - share contact info between 2 players
        await this.sendSinglesContactNotifications(challengeId, challenge);
      } else {
        console.log('📝 Processing as doubles game');
        // Handle doubles game - share contact info for all 4 players
        await this.sendDoublesContactNotifications(challengeId, challenge);
      }

      console.log('✅ Contact sharing notifications sent for challenge:', challengeId);
    } catch (error) {
      console.error('❌ Failed to send contact sharing notifications:', error);
      console.error('❌ Error details:', error);
      throw error; // Re-throw to see if this is being caught elsewhere
    }
  }

  /**
   * Send contact notifications for singles games (2 players)
   * Uses PostgreSQL function to bypass RLS issues
   */
  private async sendSinglesContactNotifications(challengeId: string, challenge: any): Promise<void> {
    try {
      console.log('📝 Creating contact sharing notifications using PostgreSQL function');
      console.log('📝 Challenge ID:', challengeId);
      console.log('📝 Challenge details:', {
        challenger_id: challenge.challenger_id,
        challenged_id: challenge.challenged_id,
        match_type: challenge.match_type
      });

      // Get current user to determine who is the initiator (the one accepting the challenge)
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        console.error('❌ Failed to get current user:', authError);
        throw new Error('Authentication required');
      }

      console.log('📝 Current user (accepter):', currentUser.id);

      // Call the PostgreSQL function to create notifications with elevated privileges
      const { data, error } = await supabase.rpc('create_challenge_notifications', {
        p_challenge_id: challengeId,
        p_notification_type: 'challenge_accepted',
        p_initiator_user_id: currentUser.id
      });

      if (error) {
        console.error('❌ Failed to create notifications via function:', error);
        throw new Error(`Failed to create notifications: ${error.message}`);
      }

      console.log('✅ Challenge notifications created successfully:', data);
      
      if (data?.success) {
        console.log(`✅ Created ${data.notifications_created} notifications`);
        console.log('✅ Challenger notification ID:', data.challenger_notification_id);
        console.log('✅ Challenged notification ID:', data.challenged_notification_id);
      } else {
        console.error('❌ Function returned error:', data?.error);
        throw new Error(data?.error || 'Unknown error from notification function');
      }

    } catch (error) {
      console.error('❌ Failed to create singles contact notifications:', error);
      throw error;
    }
  }

  /**
   * Send contact notifications for doubles games (4 players)
   * Only shares contacts when all 4 players have accepted their challenges
   */
  private async sendDoublesContactNotifications(challengeId: string, challenge: any): Promise<void> {
    // Find all related doubles challenges from the same challenger created around the same time
    // This helps us identify the full doubles group
    const challengeCreatedAt = new Date(challenge.created_at);
    const timeWindow = 10000; // 10 seconds window
    const startTime = new Date(challengeCreatedAt.getTime() - timeWindow).toISOString();
    const endTime = new Date(challengeCreatedAt.getTime() + timeWindow).toISOString();

    const { data: relatedChallenges, error } = await supabase
      .from('challenges')
      .select(`
        id,
        challenger_id,
        challenged_id,
        status,
        challenger:users!challenges_challenger_id_fkey(full_name, phone),
        challenged:users!challenges_challenged_id_fkey(full_name, phone)
      `)
      .eq('challenger_id', challenge.challenger_id)
      .eq('match_type', 'doubles')
      .eq('club_id', challenge.club_id)
      .gte('created_at', startTime)
      .lte('created_at', endTime);

    if (error || !relatedChallenges) {
      console.error('❌ Failed to find related doubles challenges:', error);
      console.log('📝 Doubles contact sharing skipped - could not find related challenges');
      return;
    }

    // Check if all challenges in the doubles group have been accepted
    const acceptedChallenges = relatedChallenges.filter(c => c.status === 'accepted');
    const totalChallenges = relatedChallenges.length;
    
    console.log(`📊 Doubles status check: ${acceptedChallenges.length}/${totalChallenges} challenges accepted`);
    
    // For doubles, we need 3 challenges to be accepted (challenger + 3 challenged players = 4 total)
    if (acceptedChallenges.length < 3) {
      console.log('⏳ Not all players have accepted yet. Contact info will be shared when all 4 players join.');
      return;
    }

    // All players have accepted - now share contacts for all 4 players
    console.log('🎉 All 4 players have joined! Sharing contact information...');

    // Collect all unique players (challenger + all challenged players)
    const allPlayers = new Map();
    
    // Add challenger (same across all related challenges)
    const challengerData = relatedChallenges[0]?.challenger;
    const challenger = Array.isArray(challengerData) ? challengerData[0] : challengerData;
    if (challenger) {
      allPlayers.set(challenge.challenger_id, {
        id: challenge.challenger_id,
        name: challenger.full_name,
        phone: challenger.phone,
      });
    }

    // Add all challenged players
    for (const relatedChallenge of relatedChallenges) {
      const challengedData = relatedChallenge.challenged;
      const challenged = Array.isArray(challengedData) ? challengedData[0] : challengedData;
      if (challenged) {
        allPlayers.set(relatedChallenge.challenged_id, {
          id: relatedChallenge.challenged_id,
          name: challenged.full_name,
          phone: challenged.phone,
        });
      }
    }

    const playersArray = Array.from(allPlayers.values());
    
    // Ensure we have exactly 4 players before sharing contacts
    if (playersArray.length !== 4) {
      console.log(`⚠️ Expected 4 players but found ${playersArray.length}. Skipping contact sharing.`);
      return;
    }
    
    // Format all contact info for sharing
    const formatContactInfo = (name: string, phone?: string) => {
      if (!phone) return `${name} (no phone number provided)`;
      return `${name}: ${phone}`;
    };

    try {
      // Send notification to each player with contact info of all other players
      for (const player of playersArray) {
        const otherPlayers = playersArray.filter(p => p.id !== player.id);
        const contactsList = otherPlayers.map(p => 
          formatContactInfo(p.name, p.phone)
        ).join('\n');

        const isChallenger = player.id === challenge.challenger_id;
        const title = '🎾 Doubles Game Complete - All 4 Players Ready!';
        
        const message = isChallenger
          ? `Your doubles challenge is complete! All 4 players have joined. Here are everyone's contacts:\n${contactsList}`
          : `The doubles game is complete! All 4 players have joined. Here are everyone's contacts:\n${contactsList}`;

        await supabase.from('notifications').insert({
          id: (await import('../utils/uuid')).generateUUID(),
          user_id: player.id,
          type: 'challenge',
          title,
          message,
          is_read: false,
          action_type: 'view_match',
          action_data: JSON.stringify({ challengeId }),
          related_id: challengeId,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('❌ Failed to create doubles contact notifications:', error);
      throw error;
    }

    console.log(`✅ Doubles contact notifications sent to all ${playersArray.length} players - game is ready!`);
  }


  /**
   * Get a challenge by ID in format needed for match recording screen
   */
  public async getChallengeById(challengeId: string): Promise<{
    id: string;
    match_type: 'singles' | 'doubles';
    proposed_date: string;
    club_id: string;
    club_name?: string;
    challenger: { id: string; full_name: string; phone?: string };
    challenged: { id: string; full_name: string; phone?: string };
    status: string;
  } | null> {
    try {
      const { data: challenge, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:users!challenges_challenger_id_fkey(full_name, phone),
          challenged:users!challenges_challenged_id_fkey(full_name, phone),
          club:clubs!challenges_club_id_fkey(name)
        `)
        .eq('id', challengeId)
        .single();

      if (error || !challenge) {
        console.error('❌ Failed to get challenge by ID:', error);
        return null;
      }

      return {
        id: challenge.id,
        match_type: challenge.match_type,
        proposed_date: challenge.proposed_date,
        club_id: challenge.club_id,
        club_name: challenge.club?.name,
        challenger: {
          id: challenge.challenger_id,
          full_name: challenge.challenger?.full_name || 'Unknown Player',
          phone: challenge.challenger?.phone
        },
        challenged: {
          id: challenge.challenged_id,
          full_name: challenge.challenged?.full_name || 'Unknown Player',
          phone: challenge.challenged?.phone
        },
        status: challenge.status
      };
    } catch (error) {
      console.error('❌ Failed to get challenge by ID:', error);
      return null;
    }
  }

  /**
   * Complete a challenge by linking it to a match record
   */
  public async completeChallenge(challengeId: string, matchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          status: 'completed',
          match_id: matchId,
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (error) {
        console.error('❌ Failed to complete challenge:', error);
        throw new Error('Failed to complete challenge');
      }

      console.log('✅ Challenge completed and linked to match:', challengeId, matchId);
    } catch (error) {
      console.error('❌ Failed to complete challenge:', error);
      throw error;
    }
  }

  /**
   * Get contact information after challenge acceptance
   */
  public async getContactInfo(challengeId: string): Promise<{
    challenger: { name: string; phone?: string };
    challenged: { name: string; phone?: string };
  } | null> {
    const challenge = await this.getChallenge(challengeId);
    
    if (!challenge || challenge.status !== 'accepted' || !challenge.contacts_shared) {
      return null;
    }

    return {
      challenger: {
        name: challenge.challenger_name,
        phone: challenge.challenger_phone,
      },
      challenged: {
        name: challenge.challenged_name,
        phone: challenge.challenged_phone,
      },
    };
  }
}

export const challengeService = ChallengeService.getInstance();