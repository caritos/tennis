import { initializeDatabase, Database } from '@/database/database';
import { syncService } from './sync';

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
    const db = await initializeDatabase();
    
    // Generate unique challenge ID
    const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set expiration to 7 days from now if not provided
    const expiresAt = challengeData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // Insert challenge into local database
      await db.runAsync(
        `INSERT INTO challenges (
          id, club_id, challenger_id, challenged_id, match_type,
          proposed_date, proposed_time, message, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          challengeId,
          challengeData.club_id,
          challengeData.challenger_id,
          challengeData.challenged_id,
          challengeData.match_type,
          challengeData.proposed_date || null,
          challengeData.proposed_time || null,
          challengeData.message || null,
          expiresAt,
        ]
      );

      // Queue for sync to Supabase
      await syncService.queueChallengeCreation(
        challengeData.challenger_id,
        challengeData.challenged_id,
        challengeData.club_id,
        {
          id: challengeId,
          match_type: challengeData.match_type,
          proposed_date: challengeData.proposed_date,
          proposed_time: challengeData.proposed_time,
          message: challengeData.message,
          expires_at: expiresAt,
        }
      );

      console.log('Challenge created locally and queued for sync:', challengeId);
      return challengeId;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      throw new Error('Failed to create challenge');
    }
  }

  /**
   * Get all challenges for a club
   */
  public async getClubChallenges(clubId: string): Promise<ChallengeWithUsers[]> {
    const db = await initializeDatabase();
    
    try {
      const challenges = await db.getAllAsync(
        `SELECT 
          c.*,
          challenger.full_name as challenger_name,
          challenger.phone as challenger_phone,
          challenger.contact_preference as challenger_contact_preference,
          challenged.full_name as challenged_name,
          challenged.phone as challenged_phone,
          challenged.contact_preference as challenged_contact_preference
        FROM challenges c
        JOIN users challenger ON c.challenger_id = challenger.id
        JOIN users challenged ON c.challenged_id = challenged.id
        WHERE c.club_id = ? AND c.status != 'expired'
        ORDER BY c.created_at DESC`,
        [clubId]
      );

      return challenges as ChallengeWithUsers[];
    } catch (error) {
      console.error('Failed to get club challenges:', error);
      throw new Error('Failed to load challenges');
    }
  }

  /**
   * Get challenges sent by a user
   */
  public async getUserSentChallenges(userId: string): Promise<ChallengeWithUsers[]> {
    const db = await initializeDatabase();
    
    try {
      const challenges = await db.getAllAsync(
        `SELECT 
          c.*,
          challenger.full_name as challenger_name,
          challenger.phone as challenger_phone,
          challenger.contact_preference as challenger_contact_preference,
          challenged.full_name as challenged_name,
          challenged.phone as challenged_phone,
          challenged.contact_preference as challenged_contact_preference
        FROM challenges c
        JOIN users challenger ON c.challenger_id = challenger.id
        JOIN users challenged ON c.challenged_id = challenged.id
        WHERE c.challenger_id = ? AND c.status != 'expired'
        ORDER BY c.created_at DESC`,
        [userId]
      );

      return challenges as ChallengeWithUsers[];
    } catch (error) {
      console.error('Failed to get user sent challenges:', error);
      throw new Error('Failed to load sent challenges');
    }
  }

  /**
   * Get challenges received by a user
   */
  public async getUserReceivedChallenges(userId: string): Promise<ChallengeWithUsers[]> {
    const db = await initializeDatabase();
    
    try {
      const challenges = await db.getAllAsync(
        `SELECT 
          c.*,
          challenger.full_name as challenger_name,
          challenger.phone as challenger_phone,
          challenger.contact_preference as challenger_contact_preference,
          challenged.full_name as challenged_name,
          challenged.phone as challenged_phone,
          challenged.contact_preference as challenged_contact_preference
        FROM challenges c
        JOIN users challenger ON c.challenger_id = challenger.id
        JOIN users challenged ON c.challenged_id = challenged.id
        WHERE c.challenged_id = ? AND c.status != 'expired'
        ORDER BY c.created_at DESC`,
        [userId]
      );

      return challenges as ChallengeWithUsers[];
    } catch (error) {
      console.error('Failed to get user received challenges:', error);
      throw new Error('Failed to load received challenges');
    }
  }

  /**
   * Get a specific challenge with user details
   */
  public async getChallenge(challengeId: string): Promise<ChallengeWithUsers | null> {
    const db = await initializeDatabase();
    
    try {
      const challenge = await db.getFirstAsync(
        `SELECT 
          c.*,
          challenger.full_name as challenger_name,
          challenger.phone as challenger_phone,
          challenger.contact_preference as challenger_contact_preference,
          challenged.full_name as challenged_name,
          challenged.phone as challenged_phone,
          challenged.contact_preference as challenged_contact_preference
        FROM challenges c
        JOIN users challenger ON c.challenger_id = challenger.id
        JOIN users challenged ON c.challenged_id = challenged.id
        WHERE c.id = ?`,
        [challengeId]
      );

      return challenge as ChallengeWithUsers | null;
    } catch (error) {
      console.error('Failed to get challenge:', error);
      throw new Error('Failed to load challenge');
    }
  }

  /**
   * Accept a challenge
   */
  public async acceptChallenge(challengeId: string, userId: string): Promise<void> {
    const db = await initializeDatabase();
    
    try {
      // Update challenge status locally
      await db.runAsync(
        'UPDATE challenges SET status = ?, contacts_shared = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND challenged_id = ?',
        ['accepted', challengeId, userId]
      );

      // Queue for sync to Supabase
      await syncService.queueChallengeResponse(challengeId, 'accepted');

      console.log('Challenge accepted locally and queued for sync:', challengeId);
    } catch (error) {
      console.error('Failed to accept challenge:', error);
      throw new Error('Failed to accept challenge');
    }
  }

  /**
   * Decline a challenge
   */
  public async declineChallenge(challengeId: string, userId: string): Promise<void> {
    const db = await initializeDatabase();
    
    try {
      // Update challenge status locally
      await db.runAsync(
        'UPDATE challenges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND challenged_id = ?',
        ['declined', challengeId, userId]
      );

      // Queue for sync to Supabase
      await syncService.queueChallengeResponse(challengeId, 'declined');

      console.log('Challenge declined locally and queued for sync:', challengeId);
    } catch (error) {
      console.error('Failed to decline challenge:', error);
      throw new Error('Failed to decline challenge');
    }
  }

  /**
   * Create a counter-challenge
   */
  public async createCounterChallenge(counterData: CreateCounterChallengeData): Promise<string> {
    const db = await initializeDatabase();
    
    const counterId = `counter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Start transaction
      await db.execAsync('BEGIN TRANSACTION');

      // Insert counter-challenge
      await db.runAsync(
        `INSERT INTO challenge_counters (
          id, challenge_id, counter_by, match_type,
          proposed_date, proposed_time, message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          counterId,
          counterData.challenge_id,
          counterData.counter_by,
          counterData.match_type,
          counterData.proposed_date || null,
          counterData.proposed_time || null,
          counterData.message || null,
        ]
      );

      // Update original challenge status
      await db.runAsync(
        'UPDATE challenges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['countered', counterData.challenge_id]
      );

      await db.execAsync('COMMIT');

      // Queue for sync to Supabase (this would need to be added to sync service)
      console.log('Counter-challenge created locally:', counterId);
      return counterId;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Failed to create counter-challenge:', error);
      throw new Error('Failed to create counter-challenge');
    }
  }

  /**
   * Get counter-challenges for a challenge
   */
  public async getChallengeCounters(challengeId: string): Promise<ChallengeCounterWithUser[]> {
    const db = await initializeDatabase();
    
    try {
      const counters = await db.getAllAsync(
        `SELECT 
          cc.*,
          u.full_name as counter_by_name
        FROM challenge_counters cc
        JOIN users u ON cc.counter_by = u.id
        WHERE cc.challenge_id = ?
        ORDER BY cc.created_at DESC`,
        [challengeId]
      );

      return counters as ChallengeCounterWithUser[];
    } catch (error) {
      console.error('Failed to get challenge counters:', error);
      throw new Error('Failed to load counter-challenges');
    }
  }

  /**
   * Accept a counter-challenge
   */
  public async acceptCounterChallenge(counterId: string, challengeId: string): Promise<void> {
    const db = await initializeDatabase();
    
    try {
      await db.execAsync('BEGIN TRANSACTION');

      // Update counter status
      await db.runAsync(
        'UPDATE challenge_counters SET status = ? WHERE id = ?',
        ['accepted', counterId]
      );

      // Update main challenge status and mark contacts as shared
      await db.runAsync(
        'UPDATE challenges SET status = ?, contacts_shared = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['accepted', challengeId]
      );

      await db.execAsync('COMMIT');
      console.log('Counter-challenge accepted locally:', counterId);
    } catch (error) {
      await db.execAsync('ROLLBACK');
      console.error('Failed to accept counter-challenge:', error);
      throw new Error('Failed to accept counter-challenge');
    }
  }

  /**
   * Expire old challenges
   */
  public async expireOldChallenges(): Promise<void> {
    const db = await initializeDatabase();
    
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE challenges SET status = ? WHERE expires_at < ? AND status = ?',
        ['expired', now, 'pending']
      );
    } catch (error) {
      console.error('Failed to expire old challenges:', error);
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