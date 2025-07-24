import { initializeDatabase } from '../database/database';
import { supabase, Club } from '../lib/supabase';

export interface CreateClubData {
  name: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  creator_id: string;
  zipCode?: string;
}

export interface ClubWithDistance extends Club {
  distance?: number;
  member_count?: number;
}

export class ClubService {
  private db: any = null;

  private async getDatabase() {
    if (!this.db) {
      this.db = await initializeDatabase();
    }
    return this.db;
  }

  async createClub(clubData: CreateClubData): Promise<Club> {
    if (!clubData.name || !clubData.location || !clubData.description) {
      throw new Error('Club name, description, and location are required');
    }

    const db = await this.getDatabase();
    const clubId = `club_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Insert into local SQLite database first (offline-first)
      await db.runAsync(
        `INSERT INTO clubs (id, name, description, location, lat, lng, creator_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          clubId,
          clubData.name,
          clubData.description,
          clubData.location,
          clubData.lat,
          clubData.lng,
          clubData.creator_id,
        ]
      );

      // Auto-join creator to the club
      await db.runAsync(
        `INSERT INTO club_members (club_id, user_id) VALUES (?, ?)`,
        [clubId, clubData.creator_id]
      );

      // Get the created club
      const club = await db.getFirstAsync(
        `SELECT * FROM clubs WHERE id = ?`,
        [clubId]
      );

      // Sync to Supabase in background (don't block on errors)
      this.syncClubToSupabase(club).catch(error => {
        console.warn('Failed to sync club to Supabase:', error);
      });

      this.syncClubMemberToSupabase(clubId, clubData.creator_id).catch(error => {
        console.warn('Failed to sync club membership to Supabase:', error);
      });

      return club;
    } catch (error) {
      console.error('Failed to create club:', error);
      throw error;
    }
  }

  async joinClub(clubId: string, userId: string): Promise<void> {
    // Input validation
    if (!clubId || typeof clubId !== 'string' || clubId.trim() === '') {
      console.error('joinClub: Invalid club ID:', clubId);
      throw new Error('Valid club ID is required');
    }
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.error('joinClub: Invalid user ID:', userId);
      throw new Error('Valid user ID is required');
    }

    console.log(`joinClub: Attempting to join club ${clubId} with user ${userId}`);
    const db = await this.getDatabase();

    try {
      // Check if user exists in users table first
      const userExists = await db.getFirstAsync(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );
      
      if (!userExists) {
        console.error('joinClub: User not found in local database:', userId);
        throw new Error('User not found in local database. Please try signing out and back in.');
      }

      // Check if club exists
      const clubExists = await db.getFirstAsync(
        'SELECT id FROM clubs WHERE id = ?',
        [clubId]
      );
      
      if (!clubExists) {
        console.error('joinClub: Club not found in local database:', clubId);
        throw new Error('Club not found in local database.');
      }

      // Insert into local database first (offline-first)
      console.log('joinClub: Inserting membership into local database');
      await db.runAsync(
        `INSERT INTO club_members (club_id, user_id) VALUES (?, ?)`,
        [clubId, userId]
      );

      console.log('joinClub: Successfully joined club locally');

      // Sync to Supabase in background (don't block on errors)
      this.syncClubMemberToSupabase(clubId, userId).catch(error => {
        console.warn('Failed to sync club membership to Supabase:', error);
      });
    } catch (error: any) {
      console.error('joinClub: Database error:', error);
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Already a member of this club');
      }
      throw error;
    }
  }

  async getJoinedClubIds(userId: string): Promise<string[]> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return [];
    }

    const db = await this.getDatabase();

    try {
      const memberships = await db.getAllAsync(
        `SELECT club_id FROM club_members WHERE user_id = ?`,
        [userId]
      );

      return memberships?.map((m: any) => m.club_id) || [];
    } catch (error) {
      console.error('Failed to get joined club IDs:', error);
      return [];
    }
  }

  async getUserClubs(userId: string): Promise<Club[]> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return [];
    }

    const db = await this.getDatabase();

    try {
      const clubs = await db.getAllAsync(
        `SELECT c.*, 
                COALESCE(member_counts.memberCount, 0) as memberCount
         FROM clubs c 
         INNER JOIN club_members cm ON c.id = cm.club_id 
         LEFT JOIN (
           SELECT club_id, COUNT(user_id) as memberCount 
           FROM club_members 
           GROUP BY club_id
         ) member_counts ON c.id = member_counts.club_id
         WHERE cm.user_id = ?
         ORDER BY cm.joined_at DESC`,
        [userId]
      );

      return clubs || [];
    } catch (error) {
      console.error('Failed to get user clubs:', error);
      return [];
    }
  }

  async isClubMember(clubId: string, userId: string): Promise<boolean> {
    if (!clubId || !userId) {
      return false;
    }

    const db = await this.getDatabase();

    try {
      const membership = await db.getFirstAsync(
        `SELECT 1 FROM club_members WHERE club_id = ? AND user_id = ?`,
        [clubId, userId]
      );

      return membership !== null;
    } catch (error) {
      console.error('Failed to check club membership:', error);
      return false;
    }
  }

  async getClubsByLocation(
    userLat: number,
    userLng: number,
    radiusKm: number = 25
  ): Promise<ClubWithDistance[]> {
    const db = await this.getDatabase();

    try {
      // Use Haversine formula to calculate distance
      const clubs = await db.getAllAsync(
        `SELECT *,
          (
            6371 * acos(
              cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + 
              sin(radians(?)) * sin(radians(lat))
            )
          ) AS distance
         FROM clubs 
         WHERE lat IS NOT NULL AND lng IS NOT NULL
         HAVING distance <= ?
         ORDER BY distance ASC`,
        [userLat, userLng, userLat, radiusKm]
      );

      return clubs || [];
    } catch (error) {
      console.error('Failed to get clubs by location:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  async getNearbyClubs(
    userLat: number,
    userLng: number,
    radiusKm: number = 25
  ): Promise<Club[]> {
    try {
      console.log('Getting nearby clubs for location:', userLat, userLng);
      const db = await this.getDatabase();
      
      // Get all clubs with member counts
      const clubs = await db.getAllAsync(`
        SELECT c.*, 
               COALESCE(COUNT(cm.user_id), 0) as memberCount
        FROM clubs c 
        LEFT JOIN club_members cm ON c.id = cm.club_id 
        GROUP BY c.id
      `);
      console.log('Found clubs in database:', clubs?.length || 0);
      
      if (!clubs || clubs.length === 0) {
        return [];
      }

      // Calculate distances and filter
      const clubsWithDistance = clubs
        .map((club: any) => {
          if (!club.lat || !club.lng || typeof club.lat !== 'number' || typeof club.lng !== 'number') {
            console.warn('Club missing valid coordinates:', club.id, club.lat, club.lng);
            return null;
          }
          
          const distance = this.calculateDistance(userLat, userLng, club.lat, club.lng);
          return {
            ...club,
            distance,
            memberCount: club.memberCount || 0, // Use existing memberCount from database
          };
        })
        .filter((club: any) => club !== null && club.distance <= radiusKm)
        .sort((a: any, b: any) => a.distance - b.distance);

      console.log('Clubs with distance calculated:', clubsWithDistance.length);
      return clubsWithDistance;
    } catch (error) {
      console.error('Failed to get nearby clubs:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async syncClubToSupabase(club: Club): Promise<void> {
    try {
      const { error } = await supabase.from('clubs').insert({
        id: club.id,
        name: club.name,
        description: club.description,
        location: club.location,
        lat: club.lat,
        lng: club.lng,
        creator_id: club.creator_id,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase sync failed:', error);
      throw error;
    }
  }

  private async syncClubMemberToSupabase(clubId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('club_members').insert({
        club_id: clubId,
        user_id: userId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Supabase club member sync failed:', error);
      throw error;
    }
  }
}

// Export singleton instance and individual functions for backward compatibility
const clubService = new ClubService();

export const createClub = (clubData: CreateClubData) => clubService.createClub(clubData);
export const joinClub = (clubId: string, userId: string) => clubService.joinClub(clubId, userId);
export const getJoinedClubIds = (userId: string) => clubService.getJoinedClubIds(userId);
export const getUserClubs = (userId: string) => clubService.getUserClubs(userId);
export const isClubMember = (clubId: string, userId: string) => clubService.isClubMember(clubId, userId);
export const getClubsByLocation = (userLat: number, userLng: number, radiusKm?: number) =>
  clubService.getClubsByLocation(userLat, userLng, radiusKm);
export const getNearbyClubs = (userLat: number, userLng: number, radiusKm?: number) =>
  clubService.getNearbyClubs(userLat, userLng, radiusKm);
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) =>
  clubService.calculateDistance(lat1, lon1, lat2, lon2);

export default clubService;