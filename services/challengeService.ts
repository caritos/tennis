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
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
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