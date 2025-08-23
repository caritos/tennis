import { supabase, Club } from '../lib/supabase';
import { generateUUID } from '../utils/uuid';

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

/**
 * ClubService - Direct Supabase integration without local SQLite
 */
export class ClubService {
  
  async createClub(clubData: CreateClubData): Promise<Club> {
    console.log('🏆 Creating club directly in Supabase...');
    
    // Validate input
    if (!clubData.name || !clubData.location || !clubData.description) {
      throw new Error('Club name, description, and location are required');
    }

    const clubId = generateUUID();
    
    const newClub = {
      id: clubId,
      name: clubData.name.trim(),
      description: clubData.description.trim(),
      location: clubData.location.trim(),
      lat: clubData.lat,
      lng: clubData.lng,
      creator_id: clubData.creator_id,
      created_at: new Date().toISOString()
    };

    try {
      // Create club in Supabase
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert(newClub)
        .select()
        .single();

      if (clubError) {
        console.error('❌ Failed to create club:', clubError);
        throw new Error(`Failed to create club: ${clubError.message}`);
      }

      console.log('✅ Club created successfully:', club.name);

      // Add creator as club member
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: clubData.creator_id,
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        console.error('⚠️ Failed to add creator as member:', memberError);
        // Don't throw here - club was created successfully
      } else {
        console.log('✅ Creator added as club member');
      }

      return club;

    } catch (error) {
      console.error('❌ Club creation failed:', error);
      throw error;
    }
  }

  async joinClub(clubId: string, userId: string): Promise<void> {
    console.log('🏃‍♂️ Joining club:', clubId);

    try {
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: userId,
          joined_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('Already a member of this club');
        }
        console.error('❌ Failed to join club:', error);
        throw new Error(`Failed to join club: ${error.message}`);
      }

      console.log('✅ Successfully joined club');

    } catch (error) {
      console.error('❌ Join club failed:', error);
      throw error;
    }
  }

  async leaveClub(clubId: string, userId: string): Promise<void> {
    console.log('🚶‍♂️ Leaving club:', clubId);

    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Failed to leave club:', error);
        throw new Error(`Failed to leave club: ${error.message}`);
      }

      console.log('✅ Successfully left club');

    } catch (error) {
      console.error('❌ Leave club failed:', error);
      throw error;
    }
  }

  async getUserClubs(userId: string): Promise<Club[]> {
    try {
      const { data: clubs, error } = await supabase
        .from('club_members')
        .select(`
          clubs (
            id,
            name,
            description,
            location,
            lat,
            lng,
            creator_id,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Failed to fetch user clubs:', error);
        throw new Error(`Failed to fetch clubs: ${error.message}`);
      }

      // Extract clubs from the join result
      return clubs?.map((item: any) => item.clubs).filter(Boolean) || [];

    } catch (error) {
      console.error('❌ Get user clubs failed:', error);
      throw error;
    }
  }

  async getClubsByLocation(userLat: number, userLng: number, radiusKm: number = 25): Promise<ClubWithDistance[]> {
    try {
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 getClubsByLocation - Current user:', user?.id, 'Auth error:', authError);
      
      // For now, get all clubs and calculate distance client-side
      // Later we can implement PostGIS for server-side distance calculations
      const { data: clubs, error } = await supabase
        .from('clubs')
        .select('*');

      console.log('🔍 getClubsByLocation - Fetched clubs:', clubs?.length || 0, 'Error:', error);
      
      if (error) {
        console.error('❌ Failed to fetch clubs by location:', error);
        throw new Error(`Failed to fetch clubs: ${error.message}`);
      }

      if (!clubs) return [];

      // Calculate distances and filter by radius
      console.log('🔍 getClubsByLocation - User location:', { userLat, userLng }, 'Radius:', radiusKm);
      
      const clubsWithDistance: ClubWithDistance[] = clubs
        .map(club => {
          const distance = this.calculateDistance(userLat, userLng, club.lat, club.lng);
          console.log('🔍 Club:', club.name, 'Location:', { lat: club.lat, lng: club.lng }, 'Distance:', distance.toFixed(2), 'km');
          return {
            ...club,
            distance
          };
        })
        .filter(club => {
          const isWithinRadius = club.distance! <= radiusKm;
          if (!isWithinRadius) {
            console.log('🚫 Club filtered out (too far):', club.name, 'Distance:', club.distance?.toFixed(2), 'km > Radius:', radiusKm);
          }
          return isWithinRadius;
        })
        .sort((a, b) => a.distance! - b.distance!);

      console.log('🔍 getClubsByLocation - Returning', clubsWithDistance.length, 'clubs within', radiusKm, 'km');
      return clubsWithDistance;

    } catch (error) {
      console.error('❌ Get clubs by location failed:', error);
      throw error;
    }
  }

  async isClubMember(clubId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Failed to check club membership:', error);
        return false;
      }

      return !!data;

    } catch (error) {
      console.error('❌ Check club membership failed:', error);
      return false;
    }
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

// Create singleton instance
const clubService = new ClubService();

// Export service functions
export const createClub = (clubData: CreateClubData) => clubService.createClub(clubData);
export const joinClub = (clubId: string, userId: string) => clubService.joinClub(clubId, userId);
export const leaveClub = (clubId: string, userId: string) => clubService.leaveClub(clubId, userId);
export const getUserClubs = (userId: string) => clubService.getUserClubs(userId);
export const getClubsByLocation = (userLat: number, userLng: number, radiusKm?: number) => 
  clubService.getClubsByLocation(userLat, userLng, radiusKm);
export const isClubMember = (clubId: string, userId: string) => clubService.isClubMember(clubId, userId);
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => 
  clubService.calculateDistance(lat1, lng1, lat2, lng2);

// Alias exports for backward compatibility
export const getNearbyClubs = (userLat: number, userLng: number, radiusKm?: number) => 
  clubService.getClubsByLocation(userLat, userLng, radiusKm);

export default clubService;