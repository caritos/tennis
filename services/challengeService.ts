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
  challenger_contact_preference: string;
  challenged_name: string;
  challenged_phone?: string;
  challenged_contact_preference: string;
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
          challenger:users!challenges_challenger_id_fkey(full_name, phone, contact_preference),
          challenged:users!challenges_challenged_id_fkey(full_name, phone, contact_preference)
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
        challenger_contact_preference: challenge.challenger?.contact_preference,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
        challenged_contact_preference: challenge.challenged?.contact_preference,
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
          challenger:users!challenges_challenger_id_fkey(full_name, phone, contact_preference),
          challenged:users!challenges_challenged_id_fkey(full_name, phone, contact_preference)
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
        challenger_contact_preference: challenge.challenger?.contact_preference,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
        challenged_contact_preference: challenge.challenged?.contact_preference,
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
          challenger:users!challenges_challenger_id_fkey(full_name, phone, contact_preference),
          challenged:users!challenges_challenged_id_fkey(full_name, phone, contact_preference)
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
        challenger_contact_preference: challenge.challenger?.contact_preference,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
        challenged_contact_preference: challenge.challenged?.contact_preference,
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
          challenger:users!challenges_challenger_id_fkey(full_name, phone, contact_preference),
          challenged:users!challenges_challenged_id_fkey(full_name, phone, contact_preference)
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
        challenger_contact_preference: challenge.challenger?.contact_preference,
        challenged_name: challenge.challenged?.full_name,
        challenged_phone: challenge.challenged?.phone,
        challenged_contact_preference: challenge.challenged?.contact_preference,
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
      // Get challenge details with full user information
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          challenger_id,
          challenged_id,
          match_type,
          challenger:users!challenges_challenger_id_fkey(full_name, phone),
          challenged:users!challenges_challenged_id_fkey(full_name, phone)
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
   */
  private async sendSinglesContactNotifications(challengeId: string, challenge: any): Promise<void> {
    const challengerName = challenge.challenger?.full_name || 'Tennis Player';
    const challengedName = challenge.challenged?.full_name || 'Tennis Player';
    const challengerPhone = challenge.challenger?.phone;
    const challengedPhone = challenge.challenged?.phone;

    const formatContactInfo = (name: string, phone?: string) => {
      if (!phone) return `${name} (no phone number provided)`;
      return `${name}: ${phone}`;
    };

    try {
      // Check authentication status first
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      console.log('📝 Current auth user:', currentUser?.id, 'Auth error:', authError);
      
      console.log('📝 Creating contact sharing notifications for singles game');
      console.log(`📝 Challenger: ${challengerName} (${challenge.challenger_id}), Phone: ${challengerPhone}`);
      console.log(`📝 Challenged: ${challengedName} (${challenge.challenged_id}), Phone: ${challengedPhone}`);

      // First, create notification for the current user (the one who accepted - challenged player)
      const challengedNotificationId = (await import('../utils/uuid')).generateUUID();
      const challengedNotification = {
        id: challengedNotificationId,
        user_id: challenge.challenged_id, // This should match currentUser.id
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: `You accepted ${challengerName}'s singles challenge! Contact: ${formatContactInfo(challengerName, challengerPhone)}`,
        is_read: false,
        action_type: 'view_match',
        action_data: JSON.stringify({ challengeId }),
        related_id: challengeId,
        created_at: new Date().toISOString(),
      };
      
      console.log('📝 Inserting challenged notification (for self):', JSON.stringify(challengedNotification, null, 2));
      const { error: challengedError, data: challengedData } = await supabase.from('notifications').insert(challengedNotification).select();
      if (challengedError) {
        console.error('❌ Failed to insert challenged notification:', challengedError);
        console.error('❌ Challenged notification error details:', JSON.stringify(challengedError, null, 2));
      } else {
        console.log('✅ Challenged notification inserted successfully:', challengedData);
      }

      // Then try to create notification for the challenger
      // Note: This might fail if RLS is strict, but we'll try anyway
      const challengerNotificationId = (await import('../utils/uuid')).generateUUID();
      const challengerNotification = {
        id: challengerNotificationId,
        user_id: challenge.challenger_id,
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: `${challengedName} accepted your singles challenge! Contact: ${formatContactInfo(challengedName, challengedPhone)}`,
        is_read: false,
        action_type: 'view_match',
        action_data: JSON.stringify({ challengeId }),
        related_id: challengeId,
        created_at: new Date().toISOString(),
      };
      
      console.log('📝 Inserting challenger notification:', JSON.stringify(challengerNotification, null, 2));
      const { error: challengerError, data: challengerData } = await supabase.from('notifications').insert(challengerNotification).select();
      if (challengerError) {
        console.error('❌ Failed to insert challenger notification:', challengerError);
        console.error('❌ Challenger notification error details:', JSON.stringify(challengerError, null, 2));
      } else {
        console.log('✅ Challenger notification inserted successfully:', challengerData);
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
    const challenger = relatedChallenges[0]?.challenger;
    if (challenger) {
      allPlayers.set(challenge.challenger_id, {
        id: challenge.challenger_id,
        name: challenger.full_name,
        phone: challenger.phone,
        contact_preference: challenger.contact_preference,
      });
    }

    // Add all challenged players
    for (const relatedChallenge of relatedChallenges) {
      const challenged = relatedChallenge.challenged;
      if (challenged) {
        allPlayers.set(relatedChallenge.challenged_id, {
          id: relatedChallenge.challenged_id,
          name: challenged.full_name,
          phone: challenged.phone,
          contact_preference: challenged.contact_preference,
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
    challenger: { name: string; phone?: string; contact_preference: string };
    challenged: { name: string; phone?: string; contact_preference: string };
  } | null> {
    const challenge = await this.getChallenge(challengeId);
    
    if (!challenge || challenge.status !== 'accepted' || !challenge.contacts_shared) {
      return null;
    }

    return {
      challenger: {
        name: challenge.challenger_name,
        phone: challenge.challenger_phone,
        contact_preference: challenge.challenger_contact_preference,
      },
      challenged: {
        name: challenge.challenged_name,
        phone: challenge.challenged_phone,
        contact_preference: challenge.challenged_contact_preference,
      },
    };
  }
}

export const challengeService = ChallengeService.getInstance();