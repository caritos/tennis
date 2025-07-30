import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/database/database';
import { 
  BadgeData, 
  ClubBadgeData, 
  BadgeType, 
  BadgeUrgency, 
  BadgeStorage, 
  BADGE_RULES,
  getHighestUrgency,
  getBadgeColor
} from '@/types/badges';

const BADGE_STORAGE_KEY = 'club_badges_v1';
const CALCULATION_COOLDOWN_MS = 30000; // 30 seconds between calculations

export class BadgeService {
  private db: Database;
  private lastCalculation: number = 0;
  private calculationPromise: Promise<BadgeStorage> | null = null;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Get total badge count across all clubs for tab badge
   */
  async getTotalBadgeCount(userId: string): Promise<number> {
    try {
      const storage = await this.getBadgeStorage(userId);
      return storage.totalBadgeCount;
    } catch (error) {
      console.error('Failed to get total badge count:', error);
      return 0;
    }
  }

  /**
   * Get badge data for a specific club
   */
  async getClubBadgeData(userId: string, clubId: string): Promise<ClubBadgeData | null> {
    try {
      const storage = await this.getBadgeStorage(userId);
      return storage.clubBadges[clubId] || null;
    } catch (error) {
      console.error('Failed to get club badge data:', error);
      return null;
    }
  }

  /**
   * Get all club badge data
   */
  async getAllClubBadges(userId: string): Promise<Record<string, ClubBadgeData>> {
    try {
      const storage = await this.getBadgeStorage(userId);
      return storage.clubBadges;
    } catch (error) {
      console.error('Failed to get all club badges:', error);
      return {};
    }
  }

  /**
   * Force recalculation of all badges
   */
  async refreshBadges(userId: string): Promise<BadgeStorage> {
    this.lastCalculation = 0; // Reset cooldown
    this.calculationPromise = null; // Clear cached promise
    return this.getBadgeStorage(userId, true);
  }

  /**
   * Main method to get badge storage with intelligent caching
   */
  private async getBadgeStorage(userId: string, forceRefresh: boolean = false): Promise<BadgeStorage> {
    const now = Date.now();
    
    // Use cooldown to prevent excessive calculations
    if (!forceRefresh && (now - this.lastCalculation) < CALCULATION_COOLDOWN_MS) {
      if (this.calculationPromise) {
        return this.calculationPromise;
      }
      
      // Try to return cached data
      const cached = await this.loadCachedBadges();
      if (cached && (now - new Date(cached.lastCalculated).getTime()) < CALCULATION_COOLDOWN_MS) {
        return cached;
      }
    }

    // Create new calculation promise if none exists
    if (!this.calculationPromise || forceRefresh) {
      this.calculationPromise = this.calculateAndStoreBadges(userId);
    }

    const result = await this.calculationPromise;
    this.lastCalculation = now;
    return result;
  }

  /**
   * Calculate and store badge data
   */
  private async calculateAndStoreBadges(userId: string): Promise<BadgeStorage> {
    try {
      const clubBadges: Record<string, ClubBadgeData> = {};
      let totalBadgeCount = 0;

      // Get user's clubs
      const userClubs = await this.getUserClubs(userId);
      
      // Calculate badges for each club
      for (const clubId of userClubs) {
        const clubBadgeData = await this.calculateClubBadges(userId, clubId);
        if (clubBadgeData.totalCount > 0) {
          clubBadges[clubId] = clubBadgeData;
          totalBadgeCount += clubBadgeData.totalCount;
        }
      }

      const storage: BadgeStorage = {
        totalBadgeCount,
        clubBadges,
        lastCalculated: new Date().toISOString(),
        version: 1
      };

      // Store in AsyncStorage
      await AsyncStorage.setItem(BADGE_STORAGE_KEY + '_' + userId, JSON.stringify(storage));
      
      return storage;
    } catch (error) {
      console.error('Failed to calculate badges:', error);
      throw error;
    }
  }

  /**
   * Calculate badges for a specific club
   */
  private async calculateClubBadges(userId: string, clubId: string): Promise<ClubBadgeData> {
    const badges: { [key in BadgeType]?: BadgeData } = {};
    let totalCount = 0;
    const urgencies: BadgeUrgency[] = [];

    // Calculate each badge type
    for (const [badgeType, rule] of Object.entries(BADGE_RULES)) {
      const count = await this.calculateBadgeTypeCount(userId, clubId, badgeType as BadgeType);
      
      if (count > 0) {
        badges[badgeType as BadgeType] = {
          count,
          type: badgeType as BadgeType,
          urgency: rule.urgency,
          lastUpdated: new Date().toISOString()
        };
        totalCount += count;
        urgencies.push(rule.urgency);
      }
    }

    return {
      clubId,
      badges,
      totalCount,
      highestUrgency: getHighestUrgency(urgencies)
    };
  }

  /**
   * Calculate count for a specific badge type
   */
  private async calculateBadgeTypeCount(userId: string, clubId: string, badgeType: BadgeType): Promise<number> {
    const now = new Date();
    const rule = BADGE_RULES[badgeType];

    try {
      switch (badgeType) {
        case 'challenge_pending':
          return await this.countPendingChallenges(userId, clubId);
          
        case 'match_invitation':
          return await this.countMatchInvitations(userId, clubId);
          
        case 'looking_to_play':
          return await this.countLookingToPlayMatches(userId, clubId);
          
        case 'unrecorded_match':
          return await this.countUnrecordedMatches(userId, clubId);
          
        case 'club_admin':
          return await this.countClubAdminNotifications(userId, clubId);
          
        case 'ranking_update':
          return await this.countRankingUpdates(userId, clubId);
          
        case 'new_member':
          return await this.countNewMembers(userId, clubId);
          
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Failed to calculate ${badgeType} for club ${clubId}:`, error);
      return 0;
    }
  }

  // Badge counting methods for each type
  private async countPendingChallenges(userId: string, clubId: string): Promise<number> {
    const result = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? 
       AND type = 'challenge' 
       AND is_read = 0 
       AND (expires_at IS NULL OR expires_at > datetime('now'))
       AND json_extract(action_data, '$.clubId') = ?`,
      [userId, clubId]
    ) as { count: number };
    
    return result.count;
  }

  private async countMatchInvitations(userId: string, clubId: string): Promise<number> {
    const result = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? 
       AND type = 'match_invitation' 
       AND is_read = 0 
       AND (expires_at IS NULL OR expires_at > datetime('now'))
       AND json_extract(action_data, '$.clubId') = ?`,
      [userId, clubId]
    ) as { count: number };
    
    return result.count;
  }

  private async countLookingToPlayMatches(userId: string, clubId: string): Promise<number> {
    // This would query a looking_to_play table when implemented
    // For now, return 0
    return 0;
  }

  private async countUnrecordedMatches(userId: string, clubId: string): Promise<number> {
    // Calculate matches older than 48 hours without scores
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    // This would query matches table when implemented
    // For now, return 0
    return 0;
  }

  private async countClubAdminNotifications(userId: string, clubId: string): Promise<number> {
    const result = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? 
       AND type = 'club_activity' 
       AND is_read = 0 
       AND json_extract(action_data, '$.clubId') = ?`,
      [userId, clubId]
    ) as { count: number };
    
    return result.count;
  }

  private async countRankingUpdates(userId: string, clubId: string): Promise<number> {
    const result = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? 
       AND type = 'ranking_update' 
       AND is_read = 0 
       AND json_extract(action_data, '$.clubId') = ?`,
      [userId, clubId]
    ) as { count: number };
    
    return result.count;
  }

  private async countNewMembers(userId: string, clubId: string): Promise<number> {
    // Count new member notifications from the last 24 hours
    const result = await this.db.getFirstAsync(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? 
       AND type = 'club_activity' 
       AND is_read = 0 
       AND json_extract(action_data, '$.type') = 'new_member'
       AND json_extract(action_data, '$.clubId') = ?
       AND created_at > datetime('now', '-24 hours')`,
      [userId, clubId]
    ) as { count: number };
    
    return result.count;
  }

  /**
   * Get user's club IDs
   */
  private async getUserClubs(userId: string): Promise<string[]> {
    try {
      // This would query club_members table when implemented
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get user clubs:', error);
      return [];
    }
  }

  /**
   * Load cached badge data from AsyncStorage
   */
  private async loadCachedBadges(): Promise<BadgeStorage | null> {
    try {
      // Note: This should include userId in the key for proper user isolation
      const cached = await AsyncStorage.getItem(BADGE_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Failed to load cached badges:', error);
      return null;
    }
  }

  /**
   * Clear all badge cache
   */
  async clearBadgeCache(userId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(BADGE_STORAGE_KEY + '_' + userId);
      this.lastCalculation = 0;
      this.calculationPromise = null;
    } catch (error) {
      console.error('Failed to clear badge cache:', error);
    }
  }
}