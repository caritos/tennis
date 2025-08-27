/**
 * Test Data Factories
 * Provides consistent test data generation following the Factory pattern
 */

import { Match, Club, User } from '@/lib/supabase';

// Counter for generating unique IDs
let idCounter = 1;
const generateId = () => `test-id-${idCounter++}`;

// Reset counter for predictable tests
export const resetIdCounter = () => {
  idCounter = 1;
};

/**
 * Match Factory
 */
export interface MatchFactoryOptions {
  id?: string;
  club_id?: string;
  player1_id?: string;
  player2_id?: string;
  opponent2_name?: string;
  partner3_name?: string;
  partner4_name?: string;
  scores?: string;
  match_type?: 'singles' | 'doubles';
  date?: string;
  notes?: string | null;
  created_at?: string;
}

export const createMatch = (options: MatchFactoryOptions = {}): Match => {
  const baseDate = '2024-01-15';
  return {
    id: options.id || generateId(),
    club_id: options.club_id || 'club-1',
    player1_id: options.player1_id || 'player-1',
    player2_id: options.player2_id || 'player-2',
    opponent2_name: options.opponent2_name || 'Test Opponent',
    partner3_name: options.partner3_name || null,
    partner4_name: options.partner4_name || null,
    scores: options.scores || '6-4,6-3',
    match_type: options.match_type || 'singles',
    date: options.date || baseDate,
    notes: options.notes !== undefined ? options.notes : null,
    created_at: options.created_at || `${baseDate}T10:00:00Z`,
  };
};

/**
 * Create multiple matches with different scenarios
 */
export const createMatchScenarios = {
  singles: (playerId: string = 'player-1') => createMatch({
    player1_id: playerId,
    match_type: 'singles',
    scores: '6-4,6-3',
    opponent2_name: 'John Doe',
  }),

  doubles: (playerId: string = 'player-1') => createMatch({
    player1_id: playerId,
    match_type: 'doubles',
    scores: '7-6(7-5),4-6,6-4',
    opponent2_name: 'Jane Smith',
    partner3_name: 'Partner A',
    partner4_name: 'Partner B',
  }),

  withNotes: (playerId: string = 'player-1') => createMatch({
    player1_id: playerId,
    notes: 'Great match! Lots of fun.',
    scores: '6-2,6-1',
  }),

  tiebreak: (playerId: string = 'player-1') => createMatch({
    player1_id: playerId,
    scores: '7-6(7-3),6-4',
    opponent2_name: 'Tiebreak Opponent',
  }),

  longMatch: (playerId: string = 'player-1') => createMatch({
    player1_id: playerId,
    scores: '6-4,4-6,7-6(10-8)',
    opponent2_name: 'Endurance Player',
  }),

  asPlayer2: (playerId: string = 'player-1') => createMatch({
    player1_id: 'other-player',
    player2_id: playerId,
    opponent2_name: 'Other Player',
  }),
};

/**
 * Club Factory
 */
export interface ClubFactoryOptions {
  id?: string;
  name?: string;
  description?: string;
  location?: string;
  member_count?: number;
  latitude?: number;
  longitude?: number;
  creator_id?: string;
  created_at?: string;
}

export const createClub = (options: ClubFactoryOptions = {}): Club => ({
  id: options.id || generateId(),
  name: options.name || 'Test Tennis Club',
  description: options.description || 'A great club for testing',
  location: options.location || 'Test City, TC',
  lat: options.latitude || 40.7128,
  lng: options.longitude || -74.0060,
  creator_id: 'test-creator-id',
  created_at: options.created_at || '2024-01-01T00:00:00Z',
  memberCount: options.member_count !== undefined ? options.member_count : 25,
});

/**
 * Create multiple clubs with different scenarios
 */
export const createClubScenarios = {
  smallClub: () => createClub({
    name: 'Small Tennis Club',
    member_count: 5,
    description: 'Intimate club setting',
  }),

  largeClub: () => createClub({
    name: 'Metropolitan Tennis Center',
    member_count: 150,
    description: 'Large club with many courts',
  }),

  newClub: () => createClub({
    name: 'New Tennis Club',
    member_count: 1,
    created_at: new Date().toISOString(),
  }),

  nearbyClub: () => createClub({
    name: 'Nearby Club',
    location: 'Close City, CC',
    latitude: 40.7580,
    longitude: -73.9855,
  }),

  distantClub: () => createClub({
    name: 'Distant Club',
    location: 'Far City, FC',
    latitude: 34.0522,
    longitude: -118.2437,
  }),
};

/**
 * User Factory
 */
export interface UserFactoryOptions {
  id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role?: 'player' | 'admin';
  created_at?: string;
}

export const createUser = (options: UserFactoryOptions = {}): User => ({
  id: options.id || generateId(),
  email: options.email || 'test@example.com',
  full_name: options.full_name || 'Test User',
  phone: options.phone || '+1234567890',
  role: 'player',
  created_at: options.created_at || '2024-01-01T00:00:00Z',
});

/**
 * Create multiple users with different scenarios
 */
export const createUserScenarios = {
  regularUser: () => createUser({
    full_name: 'Regular Player',
    email: 'regular@example.com',
  }),

  newUser: () => createUser({
    full_name: 'New Player',
    email: 'new@example.com',
    created_at: new Date().toISOString(),
  }),

  experiencedUser: () => createUser({
    full_name: 'Experienced Player',
    email: 'experienced@example.com',
    created_at: '2020-01-01T00:00:00Z',
  }),
};

/**
 * Complex scenario builders
 */
export const createTestScenario = {
  /**
   * Create a complete match history for a player
   */
  playerMatchHistory: (playerId: string, matchCount: number = 5) => {
    const matches: Match[] = [];
    const scenarios = [
      createMatchScenarios.singles,
      createMatchScenarios.doubles,
      createMatchScenarios.withNotes,
      createMatchScenarios.tiebreak,
      createMatchScenarios.longMatch,
    ];

    for (let i = 0; i < matchCount; i++) {
      const scenario = scenarios[i % scenarios.length];
      const date = new Date(2024, 0, 15 - i); // Recent to older
      const match = scenario(playerId);
      matches.push({
        ...match,
        date: date.toISOString().split('T')[0],
        created_at: date.toISOString(),
      });
    }

    return matches;
  },

  /**
   * Create a club with members and their match history
   */
  clubWithActivity: (memberCount: number = 10, matchesPerMember: number = 3) => {
    const club = createClub({ member_count: memberCount });
    const members: User[] = [];
    const matches: Match[] = [];

    for (let i = 0; i < memberCount; i++) {
      const member = createUser({
        full_name: `Member ${i + 1}`,
        email: `member${i + 1}@club.com`,
      });
      members.push(member);
    }
    
    // Create matches between members
    for (let i = 0; i < memberCount; i++) {
      const member = members[i];
      for (let j = 0; j < matchesPerMember; j++) {
        const randomOpponentIndex = Math.floor(Math.random() * members.length);
        const opponent = members[randomOpponentIndex];
        if (opponent && opponent.id !== member.id) {
          matches.push(createMatch({
            club_id: club.id,
            player1_id: member.id,
            player2_id: opponent.id,
            opponent2_name: opponent.full_name,
          }));
        }
      }
    }

    return { club, members, matches };
  },
};

/**
 * Test data validation helpers
 */
export const validateTestData = {
  match: (match: Match): boolean => {
    return !!(
      match.id &&
      match.club_id &&
      match.player1_id &&
      match.player2_id &&
      match.scores &&
      match.match_type &&
      match.date
    );
  },

  club: (club: Club): boolean => {
    return !!(
      club.id &&
      club.name &&
      club.location &&
      club.creator_id &&
      typeof club.lat === 'number' &&
      typeof club.lng === 'number'
    );
  },

  user: (user: User): boolean => {
    return !!(
      user.id &&
      user.email &&
      user.full_name
    );
  },
};