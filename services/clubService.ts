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
    const db = await this.getDatabase();

    try {
      // Insert into local database first
      await db.runAsync(
        `INSERT INTO club_members (club_id, user_id) VALUES (?, ?)`,
        [clubId, userId]
      );

      // Sync to Supabase
      await this.syncClubMemberToSupabase(clubId, userId);
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT') {
        throw new Error('Already a member of this club');
      }
      console.error('Failed to join club:', error);
      throw error;
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
      
      // Get all clubs first, then calculate distances in JavaScript
      const clubs = await db.getAllAsync('SELECT * FROM clubs');
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
            memberCount: 0, // TODO: Calculate actual member count
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
export const getClubsByLocation = (userLat: number, userLng: number, radiusKm?: number) =>
  clubService.getClubsByLocation(userLat, userLng, radiusKm);
export const getNearbyClubs = (userLat: number, userLng: number, radiusKm?: number) =>
  clubService.getNearbyClubs(userLat, userLng, radiusKm);
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) =>
  clubService.calculateDistance(lat1, lon1, lat2, lon2);

export default clubService;