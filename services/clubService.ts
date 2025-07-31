import { initializeDatabase } from '../database/database';
import { supabase, Club } from '../lib/supabase';
import { syncService } from './sync';

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

  // Helper method to ensure user exists in local database
  private async ensureUserExists(userId: string, userEmail?: string, userFullName?: string): Promise<void> {
    const db = await this.getDatabase();
    
    const userExists = await db.getFirstAsync(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userExists) {
      console.log('ClubService: User not found in local database, creating user:', userId);
      
      // Create the user in local database with basic information
      try {
        await db.runAsync(
          `INSERT INTO users (id, email, full_name, created_at, updated_at) VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
          [userId, userEmail || '', userFullName || '']
        );
        console.log('ClubService: Successfully created user in local database:', userId);
      } catch (error) {
        console.error('ClubService: Failed to create user in local database:', error);
        throw new Error('Failed to initialize user account. Please try again.');
      }
    }
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

      // Queue club creation for sync using offline queue
      try {
        // Create club creation operation (need to add this to sync strategies)
        console.log('Queueing club creation for sync:', clubId);
        // Note: Club creation sync strategy would need to be added to handle this case
        // For now, keep the direct sync as fallback
        this.syncClubToSupabase(club).catch(error => {
          console.warn('Failed to sync club to Supabase:', error);
        });
      } catch (error) {
        console.warn('Failed to queue club creation:', error);
        // Fallback to direct sync
        this.syncClubToSupabase(club).catch(error => {
          console.warn('Failed to sync club to Supabase:', error);
        });
      }

      // Queue club membership using offline queue
      try {
        await syncService.queueClubJoin(clubId, clubData.creator_id);
        console.log('Successfully queued club membership for sync:', clubId, clubData.creator_id);
      } catch (error) {
        console.warn('Failed to queue club membership, falling back to direct sync:', error);
        this.syncClubMemberToSupabase(clubId, clubData.creator_id).catch(error => {
          console.warn('Failed to sync club membership to Supabase:', error);
        });
      }

      return club;
    } catch (error) {
      console.error('Failed to create club:', error);
      throw error;
    }
  }

  async leaveClub(clubId: string, userId: string): Promise<void> {
    // Input validation
    if (!clubId || typeof clubId !== 'string' || clubId.trim() === '') {
      throw new Error('Valid club ID is required');
    }
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('Valid user ID is required');
    }

    console.log(`leaveClub: Attempting to leave club ${clubId} for user ${userId}`);
    const db = await this.getDatabase();

    try {
      // Remove from local database first (offline-first)
      await db.runAsync(
        `DELETE FROM club_members WHERE club_id = ? AND user_id = ?`,
        [clubId, userId]
      );

      console.log('leaveClub: Successfully left club locally');

      // Queue club leave using offline queue
      try {
        await syncService.queueClubLeave(clubId, userId);
        console.log('Successfully queued club leave for sync:', clubId, userId);
      } catch (error) {
        console.warn('Failed to queue club leave, data may be out of sync:', error);
      }
    } catch (error) {
      console.error('leaveClub: Database error:', error);
      throw new Error('Failed to leave club');
    }
  }

  async joinClub(clubId: string, userId: string, userEmail?: string, userFullName?: string): Promise<void> {
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
      // Ensure user exists in local database
      await this.ensureUserExists(userId, userEmail, userFullName);

      // Check if club exists
      const clubExists = await db.getFirstAsync(
        'SELECT id FROM clubs WHERE id = ?',
        [clubId]
      );
      
      if (!clubExists) {
        console.error('joinClub: Club not found in local database:', clubId);
        
        // Debug: List all clubs in database
        const allClubs = await db.getAllAsync('SELECT id, name FROM clubs');
        console.log('joinClub: All clubs in database:', allClubs);
        
        throw new Error('Club not found in local database.');
      }

      // Insert into local database first (offline-first)
      console.log('joinClub: Inserting membership into local database');
      await db.runAsync(
        `INSERT INTO club_members (club_id, user_id) VALUES (?, ?)`,
        [clubId, userId]
      );

      console.log('joinClub: Successfully joined club locally');

      // Queue club membership using offline queue
      try {
        await syncService.queueClubJoin(clubId, userId);
        console.log('Successfully queued club join for sync:', clubId, userId);
      } catch (error) {
        console.warn('Failed to queue club join, falling back to direct sync:', error);
        this.syncClubMemberToSupabase(clubId, userId).catch(error => {
          console.warn('Failed to sync club membership to Supabase:', error);
        });
      }
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
           SELECT club_id, COUNT(DISTINCT user_id) as memberCount 
           FROM club_members 
           GROUP BY club_id
         ) member_counts ON c.id = member_counts.club_id
         WHERE cm.user_id = ?
         ORDER BY cm.joined_at DESC`,
        [userId]
      );

      console.log('getUserClubs: User clubs with counts:', clubs);
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
      // Validate input parameters
      if (!this.isValidCoordinate(userLat, userLng)) {
        console.warn('getNearbyClubs: Invalid coordinates provided:', userLat, userLng);
        throw new Error('Invalid location coordinates provided');
      }

      if (radiusKm <= 0 || radiusKm > 10000) {
        console.warn('getNearbyClubs: Invalid radius:', radiusKm);
        radiusKm = 25; // Default to 25km
      }

      console.log('getNearbyClubs: Starting with location:', userLat, userLng, 'radius:', radiusKm);
      const db = await this.getDatabase();
      
      // Get all clubs with member counts
      // Note: SQLite requires all non-aggregated columns in GROUP BY
      const clubs = await db.getAllAsync(`
        SELECT c.id, c.name, c.description, c.location, c.lat, c.lng, c.creator_id, c.created_at,
               COUNT(DISTINCT cm.user_id) as memberCount
        FROM clubs c 
        LEFT JOIN club_members cm ON c.id = cm.club_id 
        GROUP BY c.id, c.name, c.description, c.location, c.lat, c.lng, c.creator_id, c.created_at
      `);
      console.log('getNearbyClubs: Found clubs in database:', clubs?.length || 0);
      
      if (!clubs || clubs.length === 0) {
        console.log('getNearbyClubs: No clubs found in database');
        return [];
      }

      // Calculate distances and filter with improved error handling
      const clubsWithDistance = [];
      let invalidCoordinatesCount = 0;

      for (const club of clubs) {
        try {
          // Validate club coordinates
          if (!this.isValidCoordinate(club.lat, club.lng)) {
            console.warn('getNearbyClubs: Club has invalid coordinates:', club.id, club.name, club.lat, club.lng);
            invalidCoordinatesCount++;
            continue;
          }
          
          const distance = this.calculateDistance(userLat, userLng, club.lat, club.lng);
          
          // Only include clubs within radius
          if (distance <= radiusKm) {
            const clubWithDistance = {
              ...club,
              distance,
              memberCount: club.memberCount || 0,
            };
            clubsWithDistance.push(clubWithDistance);
          }
        } catch (error) {
          console.warn('getNearbyClubs: Error processing club:', club.id, error);
          continue;
        }
      }

      // Log statistics
      if (invalidCoordinatesCount > 0) {
        console.warn(`getNearbyClubs: Skipped ${invalidCoordinatesCount} clubs with invalid coordinates`);
      }

      // Sort by distance (closest first)
      clubsWithDistance.sort((a, b) => a.distance - b.distance);

      console.log('getNearbyClubs: Returning', clubsWithDistance.length, 'clubs within', radiusKm, 'km radius');
      return clubsWithDistance;
    } catch (error) {
      console.error('getNearbyClubs: Failed with error:', error);
      
      // If it's a validation error, throw it so the UI can show appropriate message
      if (error instanceof Error && error.message.includes('Invalid location coordinates')) {
        throw error;
      }
      
      // For other errors, return empty array to prevent UI crash
      return [];
    }
  }

  /**
   * Validates if the provided coordinates are valid
   */
  private isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' && 
      typeof lng === 'number' && 
      !isNaN(lat) && 
      !isNaN(lng) && 
      lat >= -90 && 
      lat <= 90 && 
      lng >= -180 && 
      lng <= 180
    );
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
export const joinClub = (clubId: string, userId: string, userEmail?: string, userFullName?: string) => clubService.joinClub(clubId, userId, userEmail, userFullName);
export const leaveClub = (clubId: string, userId: string) => clubService.leaveClub(clubId, userId);
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