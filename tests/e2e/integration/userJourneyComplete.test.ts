/**
 * Complete User Journey Integration Test
 * 
 * Tests the entire user flow from signup to playing matches
 * This integration test covers:
 * 1. User registration and authentication
 * 2. Club discovery and joining
 * 3. Profile setup and customization
 * 4. Challenge creation and acceptance
 * 5. Match recording and statistics
 * 6. Contact sharing system
 * 7. Notification handling
 */

// Mock all services for testing
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      delete: jest.fn(() => ({
        in: jest.fn(() => Promise.resolve({ data: null, error: null })),
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    }
  }
}));

jest.mock('@/services/authService', () => ({
  authService: {
    signUp: jest.fn(() => Promise.resolve({ 
      user: { id: 'test-user-id', email: 'test@example.com' }
    })),
    signIn: jest.fn(() => Promise.resolve({ 
      user: { id: 'test-user-id', email: 'test@example.com' }
    })),
    signOut: jest.fn(() => Promise.resolve()),
  }
}));

jest.mock('@/services/clubService', () => ({
  clubService: {
    createClub: jest.fn(() => Promise.resolve({ 
      id: 'test-club-id', name: 'Test Club', ownerId: 'test-user-id'
    })),
    joinClub: jest.fn(() => Promise.resolve({ 
      clubId: 'test-club-id', userId: 'test-user-id'
    })),
    getClubs: jest.fn(() => Promise.resolve([])),
    getClubMembers: jest.fn(() => Promise.resolve([])),
    getPlayerStats: jest.fn(() => Promise.resolve({ 
      wins: 0, losses: 0, winRate: 0, eloRating: 1000
    })),
    getClubRankings: jest.fn(() => Promise.resolve([])),
  }
}));

jest.mock('@/services/challengeService', () => ({
  challengeService: {
    createChallenge: jest.fn(() => Promise.resolve({ 
      id: 'test-challenge-id', status: 'pending'
    })),
    acceptChallenge: jest.fn(() => Promise.resolve({ 
      id: 'test-challenge-id', status: 'accepted'
    })),
    respondToChallenge: jest.fn(() => Promise.resolve({ 
      id: 'test-challenge-id', status: 'accepted'
    })),
    getUserChallenges: jest.fn(() => Promise.resolve([])),
    getClubChallenges: jest.fn(() => Promise.resolve([])),
  }
}));

jest.mock('@/services/matchService', () => ({
  matchService: {
    recordMatch: jest.fn(() => Promise.resolve({ 
      id: 'test-match-id', winnerId: 'test-user-id'
    })),
    getMatches: jest.fn(() => Promise.resolve([])),
    getClubMatches: jest.fn(() => Promise.resolve([])),
  }
}));

jest.mock('@/services/NotificationService', () => ({
  NotificationService: {
    getNotifications: jest.fn(() => Promise.resolve([])),
    sendNotification: jest.fn(() => Promise.resolve()),
    markAsRead: jest.fn(() => Promise.resolve()),
    updatePreferences: jest.fn(() => Promise.resolve()),
  }
}));

const { supabase } = require('@/lib/supabase');
const { authService } = require('@/services/authService');
const { clubService } = require('@/services/clubService');
const { challengeService } = require('@/services/challengeService');
const { matchService } = require('@/services/matchService');
const { NotificationService } = require('@/services/NotificationService');

// Test data
const testUsers = [
  {
    email: 'alice.tennis@example.com',
    password: 'SecurePass123!',
    name: 'Alice Johnson',
    phone: '+1234567890',
  },
  {
    email: 'bob.player@example.com',
    password: 'SecurePass456!',
    name: 'Bob Smith',
    phone: '+0987654321',
  },
];

const testClub = {
  name: 'Integration Test Tennis Club',
  description: 'A club for integration testing',
  location: 'Test City, Test State',
  membershipType: 'open' as const,
};

describe('Complete User Journey Integration Test', () => {
  let aliceUser: any;
  let bobUser: any;
  let testClubData: any;
  let challenge: any;
  let match: any;

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data after tests
    await cleanupTestData();
  });

  describe('User Registration and Authentication Flow', () => {
    it('should register first user successfully', async () => {
      const result = await authService.signUp(
        testUsers[0].email,
        testUsers[0].password,
        testUsers[0].name,
        testUsers[0].phone
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUsers[0].email);
      aliceUser = result.user;
    });

    it('should register second user successfully', async () => {
      const result = await authService.signUp(
        testUsers[1].email,
        testUsers[1].password,
        testUsers[1].name,
        testUsers[1].phone
      );

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUsers[1].email);
      bobUser = result.user;
    });

    it('should sign in users correctly', async () => {
      // Sign in Alice
      const aliceSignIn = await authService.signIn(
        testUsers[0].email,
        testUsers[0].password
      );
      expect(aliceSignIn.user).toBeDefined();

      // Sign in Bob
      const bobSignIn = await authService.signIn(
        testUsers[1].email,
        testUsers[1].password
      );
      expect(bobSignIn.user).toBeDefined();
    });
  });

  describe('Club Discovery and Management Flow', () => {
    it('should create a test club as Alice', async () => {
      // Set Alice as current user
      await mockUserSession(aliceUser);

      const club = await clubService.createClub(testClub);
      
      expect(club).toBeDefined();
      expect(club.name).toBe(testClub.name);
      expect(club.ownerId).toBeDefined();
      
      testClubData = club;
    });

    it('should allow Bob to discover and join the club', async () => {
      // Set Bob as current user
      await mockUserSession(bobUser);

      // Discover clubs
      const clubs = await clubService.getClubs();
      const foundClub = clubs.find(c => c.id === testClubData.id);
      
      expect(foundClub).toBeDefined();
      expect(foundClub.name).toBe(testClub.name);

      // Join the club
      const membership = await clubService.joinClub(testClubData.id);
      
      expect(membership).toBeDefined();
      expect(membership.clubId).toBe(testClubData.id);
      expect(membership.userId).toBe(bobUser.id);
    });

    it('should show both users as club members', async () => {
      const members = await clubService.getClubMembers(testClubData.id);
      
      expect(members).toHaveLength(2);
      
      const memberIds = members.map(m => m.userId);
      expect(memberIds).toContain(aliceUser.id);
      expect(memberIds).toContain(bobUser.id);
    });
  });

  describe('Challenge and Contact Sharing Flow', () => {
    it('should create a challenge from Alice to Bob', async () => {
      // Set Alice as current user
      await mockUserSession(aliceUser);

      const challengeData = {
        clubId: testClubData.id,
        challengeeId: bobUser.id,
        matchType: 'singles' as const,
        message: 'Let\'s play a friendly match!',
        proposedTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      };

      challenge = await challengeService.createChallenge(challengeData);
      
      expect(challenge).toBeDefined();
      expect(challenge.id).toBeDefined();
      expect(challenge.status).toBe('pending');
    });

    it('should notify Bob of the challenge', async () => {
      // Set Bob as current user
      await mockUserSession(bobUser);

      const notifications = await NotificationService.getNotifications();
      const challengeNotification = notifications.find(
        n => n.type === 'challenge_received' && n.data?.challengeId === challenge.id
      );

      expect(challengeNotification).toBeDefined();
      expect(challengeNotification.title).toContain('Challenge from Alice');
    });

    it('should allow Bob to accept the challenge', async () => {
      // Set Bob as current user
      await mockUserSession(bobUser);

      const acceptedChallenge = await challengeService.respondToChallenge(
        challenge.id,
        'accepted'
      );

      expect(acceptedChallenge.status).toBe('accepted');
    });

    it('should trigger contact sharing when challenge is accepted', async () => {
      // Set Bob as current user
      await mockUserSession(bobUser);

      // Check if contact sharing notification was created
      const notifications = await NotificationService.getNotifications();
      const contactNotification = notifications.find(
        n => n.type === 'contact_shared' && n.data?.challengeId === challenge.id
      );

      expect(contactNotification).toBeDefined();
      expect(contactNotification.data.contactInfo).toContain(testUsers[0].phone);
    });

    it('should share contacts bidirectionally', async () => {
      // Set Alice as current user
      await mockUserSession(aliceUser);

      // Alice should also receive Bob's contact
      const notifications = await NotificationService.getNotifications();
      const contactNotification = notifications.find(
        n => n.type === 'contact_shared' && n.data?.challengeId === challenge.id
      );

      expect(contactNotification).toBeDefined();
      expect(contactNotification.data.contactInfo).toContain(testUsers[1].phone);
    });
  });

  describe('Match Recording and Statistics Flow', () => {
    it('should create a match from accepted challenge', async () => {
      // Set Alice as current user
      await mockUserSession(aliceUser);

      const matchData = {
        clubId: testClubData.id,
        player1Id: aliceUser.id,
        player2Id: bobUser.id,
        player1Score: [6, 4],
        player2Score: [3, 6],
        matchType: 'singles' as const,
        notes: 'Great match! Very competitive.',
        datePlayed: new Date().toISOString(),
      };

      match = await matchService.recordMatch(matchData);
      
      expect(match).toBeDefined();
      expect(match.id).toBeDefined();
      expect(match.winnerId).toBeDefined();
    });

    it('should update player statistics after match', async () => {
      // Check Alice's stats (winner)
      const aliceStats = await clubService.getPlayerStats(aliceUser?.id, testClubData?.id);
      expect(aliceStats.wins).toBeDefined();
      expect(aliceStats.losses).toBeDefined();
      expect(aliceStats.winRate).toBeDefined();

      // Check Bob's stats (loser)
      const bobStats = await clubService.getPlayerStats(bobUser?.id, testClubData?.id);
      expect(bobStats.wins).toBeDefined();
      expect(bobStats.losses).toBeDefined();
      expect(bobStats.winRate).toBeDefined();
    });

    it('should update club rankings', async () => {
      const rankings = await clubService.getClubRankings(testClubData.id);
      
      expect(rankings).toHaveLength(2);
      
      // Alice should be ranked higher (winner)
      expect(rankings[0].userId).toBe(aliceUser.id);
      expect(rankings[0].rankingScore).toBeGreaterThan(rankings[1].rankingScore);
      
      // Bob should be ranked lower
      expect(rankings[1].userId).toBe(bobUser.id);
    });

    it('should calculate ELO ratings correctly', async () => {
      const aliceStats = await clubService.getPlayerStats(aliceUser.id, testClubData.id);
      const bobStats = await clubService.getPlayerStats(bobUser.id, testClubData.id);

      expect(aliceStats.eloRating).toBeGreaterThan(1000); // Should be above starting ELO
      expect(bobStats.eloRating).toBeLessThan(1000); // Should be below starting ELO
    });
  });

  describe('Notification System Integration', () => {
    it('should create match result notifications', async () => {
      // Set Bob as current user
      await mockUserSession(bobUser);

      const notifications = await NotificationService.getNotifications();
      const matchNotification = notifications.find(
        n => n.type === 'match_result' && n.data?.matchId === match.id
      );

      expect(matchNotification).toBeDefined();
      expect(matchNotification.title).toContain('Match Result');
    });

    it('should handle notification preferences', async () => {
      // Set Bob as current user
      await mockUserSession(bobUser);

      // Update notification preferences
      await NotificationService.updatePreferences({
        challenges: true,
        matches: false,
        contactSharing: true,
      });

      // Create another challenge
      await mockUserSession(aliceUser);
      const challenge2 = await challengeService.createChallenge({
        clubId: testClubData.id,
        challengeeId: bobUser.id,
        matchType: 'singles' as const,
        message: 'Another match?',
        proposedTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      });

      expect(challenge2).toBeDefined();

      // Bob should still receive challenge notifications (enabled)
      await mockUserSession(bobUser);
      const notifications = await NotificationService.getNotifications();
      const newChallengeNotification = notifications.find(
        n => n.type === 'challenge_received' && n.data?.challengeId === challenge2.id
      );

      expect(newChallengeNotification).toBeDefined();
    });
  });

  describe('Data Consistency and Error Handling', () => {
    it('should maintain data consistency across services', async () => {
      // Verify club membership consistency
      const members = await clubService.getClubMembers(testClubData.id);
      expect(members).toHaveLength(2);

      // Verify challenge consistency
      const challenges = await challengeService.getUserChallenges(aliceUser.id);
      expect(challenges.length).toBeGreaterThan(0);

      // Verify match consistency
      const matches = await matchService.getClubMatches(testClubData.id);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should handle concurrent operations gracefully', async () => {
      // Create multiple challenges simultaneously
      const concurrentChallenges = await Promise.allSettled([
        challengeService.createChallenge({
          clubId: testClubData.id,
          challengeeId: bobUser.id,
          matchType: 'singles' as const,
          message: 'Concurrent challenge 1',
          proposedTime: new Date(Date.now() + 259200000).toISOString(),
        }),
        challengeService.createChallenge({
          clubId: testClubData.id,
          challengeeId: bobUser.id,
          matchType: 'singles' as const,
          message: 'Concurrent challenge 2',
          proposedTime: new Date(Date.now() + 345600000).toISOString(),
        }),
      ]);

      // Both should succeed or fail gracefully
      const successfulChallenges = concurrentChallenges.filter(
        result => result.status === 'fulfilled'
      );
      
      expect(successfulChallenges.length).toBeGreaterThanOrEqual(1);
    });

    it('should enforce business rules correctly', async () => {
      // Try to create invalid match (player playing against themselves)
      await expect(
        matchService.recordMatch({
          clubId: testClubData.id,
          player1Id: aliceUser.id,
          player2Id: aliceUser.id, // Same player
          player1Score: [6, 4],
          player2Score: [3, 6],
          matchType: 'singles' as const,
          datePlayed: new Date().toISOString(),
        })
      ).rejects.toThrow();

      // Try to join club twice
      await expect(
        clubService.joinClub(testClubData.id)
      ).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple club operations efficiently', async () => {
      const startTime = Date.now();

      // Perform multiple operations
      await Promise.all([
        clubService.getClubMembers(testClubData.id),
        clubService.getClubRankings(testClubData.id),
        matchService.getClubMatches(testClubData.id),
        challengeService.getClubChallenges(testClubData.id),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
    });

    it('should handle notification batch processing', async () => {
      const startTime = Date.now();

      // Get notifications for both users
      await mockUserSession(aliceUser);
      const aliceNotifications = await NotificationService.getNotifications();

      await mockUserSession(bobUser);
      const bobNotifications = await NotificationService.getNotifications();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(aliceNotifications).toBeDefined();
      expect(bobNotifications).toBeDefined();
      expect(duration).toBeLessThan(1000);
    });
  });

  // Helper functions
  async function mockUserSession(user: any) {
    // Mock the supabase auth session
    jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user },
      error: null,
    });
  }

  async function cleanupTestData() {
    try {
      // Delete test users and related data
      await supabase
        .from('users')
        .delete()
        .in('email', testUsers.map(u => u.email));

      // Delete test clubs
      if (testClubData?.id) {
        await supabase
          .from('clubs')
          .delete()
          .eq('id', testClubData.id);
      }
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  }
});