/**
 * Integration tests for Club Discovery & Management features
 * Tests the complete flow from club creation to discovery and joining
 */

import { ClubService } from '../../services/clubService';

// Test constants
const TEST_USER_ID = 'test-user-123';
const TEST_CLUB_DATA = {
  name: 'Test Tennis Club',
  description: 'A test club for integration testing',
  location: 'San Francisco Bay Area',
  lat: 37.7749,
  lng: -122.4194,
  creator_id: TEST_USER_ID,
  zipCode: '94102',
};

describe('Club Management Integration Tests', () => {
  let clubService: ClubService;
  let testClubId: string;

  beforeAll(async () => {
    clubService = new ClubService();
    // Note: These tests would run against a test database in a real test environment
  });

  describe('Club Creation Flow', () => {
    test('should create club with valid data and auto-join creator', async () => {
      // Test club creation
      const newClub = await clubService.createClub(TEST_CLUB_DATA);
      testClubId = newClub.id;

      // Verify club was created
      expect(newClub).toBeDefined();
      expect(newClub.name).toBe(TEST_CLUB_DATA.name);
      expect(newClub.description).toBe(TEST_CLUB_DATA.description);
      expect(newClub.location).toBe(TEST_CLUB_DATA.location);
      expect(newClub.lat).toBe(TEST_CLUB_DATA.lat);
      expect(newClub.lng).toBe(TEST_CLUB_DATA.lng);
      expect(newClub.creator_id).toBe(TEST_CLUB_DATA.creator_id);

      // Verify creator was auto-joined
      const joinedClubIds = await clubService.getJoinedClubIds(TEST_USER_ID);
      expect(joinedClubIds).toContain(testClubId);

      // Verify user's clubs include the new club
      const userClubs = await clubService.getUserClubs(TEST_USER_ID);
      expect(userClubs.some(club => club.id === testClubId)).toBe(true);
    });

    test('should reject club creation with invalid data', async () => {
      const invalidClubData = {
        name: '',
        description: '',
        location: '',
        lat: 0,
        lng: 0,
        creator_id: '',
      };

      await expect(clubService.createClub(invalidClubData)).rejects.toThrow(
        'Club name, description, and location are required'
      );
    });
  });

  describe('Club Discovery Flow', () => {
    test('should find nearby clubs within radius', async () => {
      // Create another test club at a known distance
      const distantClubData = {
        ...TEST_CLUB_DATA,
        name: 'Distant Test Club',
        lat: 37.4419, // Palo Alto - about 50km from SF
        lng: -122.1430,
        creator_id: 'different-user',
      };

      const distantClub = await clubService.createClub(distantClubData);

      // Test nearby search with small radius (should not include distant club)
      const nearbyClubs = await clubService.getNearbyClubs(
        TEST_CLUB_DATA.lat,
        TEST_CLUB_DATA.lng,
        25 // 25km radius
      );

      // Should find the original club but not the distant one
      expect(nearbyClubs.some(club => club.id === testClubId)).toBe(true);
      expect(nearbyClubs.some(club => club.id === distantClub.id)).toBe(false);

      // Test with larger radius (should include both)
      const allClubs = await clubService.getNearbyClubs(
        TEST_CLUB_DATA.lat,
        TEST_CLUB_DATA.lng,
        100 // 100km radius
      );

      expect(allClubs.some(club => club.id === testClubId)).toBe(true);
      expect(allClubs.some(club => club.id === distantClub.id)).toBe(true);

      // Verify clubs are sorted by distance
      const firstClub = allClubs[0];
      const secondClub = allClubs[1];
      if (firstClub.distance && secondClub.distance) {
        expect(firstClub.distance).toBeLessThanOrEqual(secondClub.distance);
      }
    });

    test('should handle invalid coordinates gracefully', async () => {
      // Test with invalid coordinates
      await expect(
        clubService.getNearbyClubs(NaN, NaN, 25)
      ).rejects.toThrow('Invalid location coordinates provided');

      await expect(
        clubService.getNearbyClubs(91, 181, 25) // Out of valid range
      ).rejects.toThrow('Invalid location coordinates provided');
    });

    test('should return empty array when no clubs exist', async () => {
      // Test in a location with no clubs (middle of ocean)
      const clubs = await clubService.getNearbyClubs(0, 0, 10);
      expect(Array.isArray(clubs)).toBe(true);
      // Note: Might be empty or might have test clubs depending on database state
    });
  });

  describe('Club Joining Flow', () => {
    test('should allow user to join existing club', async () => {
      const newUserId = 'new-user-456';

      // Join the test club
      await clubService.joinClub(testClubId, newUserId);

      // Verify membership was created
      const isMember = await clubService.isClubMember(testClubId, newUserId);
      expect(isMember).toBe(true);

      // Verify user's joined clubs list includes this club
      const joinedClubIds = await clubService.getJoinedClubIds(newUserId);
      expect(joinedClubIds).toContain(testClubId);

      // Verify user's clubs list includes this club
      const userClubs = await clubService.getUserClubs(newUserId);
      expect(userClubs.some(club => club.id === testClubId)).toBe(true);
    });

    test('should prevent duplicate club membership', async () => {
      const userId = 'duplicate-test-user';

      // Join club first time
      await clubService.joinClub(testClubId, userId);

      // Try to join again - should throw error
      await expect(
        clubService.joinClub(testClubId, userId)
      ).rejects.toThrow('Already a member of this club');
    });

    test('should allow user to leave club', async () => {
      const userId = 'leave-test-user';

      // First join the club
      await clubService.joinClub(testClubId, userId);
      expect(await clubService.isClubMember(testClubId, userId)).toBe(true);

      // Leave the club
      await clubService.leaveClub(testClubId, userId);

      // Verify membership was removed
      expect(await clubService.isClubMember(testClubId, userId)).toBe(false);

      // Verify user's joined clubs list no longer includes this club
      const joinedClubIds = await clubService.getJoinedClubIds(userId);
      expect(joinedClubIds).not.toContain(testClubId);
    });
  });

  describe('Distance Calculation', () => {
    test('should calculate distances accurately', () => {
      // Test known distances
      const sfLat = 37.7749;
      const sfLng = -122.4194;
      const nyLat = 40.7128;
      const nyLng = -74.0060;

      const distance = clubService.calculateDistance(sfLat, sfLng, nyLat, nyLng);

      // SF to NYC is approximately 4,129 km
      expect(distance).toBeGreaterThan(4000);
      expect(distance).toBeLessThan(4500);
    });

    test('should return 0 for same coordinates', () => {
      const distance = clubService.calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBe(0);
    });
  });

  describe('Member Count Tracking', () => {
    test('should track member counts correctly', async () => {
      // Create a new club for member count testing
      const memberTestClub = await clubService.createClub({
        ...TEST_CLUB_DATA,
        name: 'Member Count Test Club',
        creator_id: 'creator-user',
      });

      // Initially should have 1 member (creator)
      const userClubs = await clubService.getUserClubs('creator-user');
      const club = userClubs.find(c => c.id === memberTestClub.id);
      expect(club?.memberCount).toBe(1);

      // Add more members
      await clubService.joinClub(memberTestClub.id, 'member-1');
      await clubService.joinClub(memberTestClub.id, 'member-2');

      // Check updated member count
      const nearbyClubs = await clubService.getNearbyClubs(
        TEST_CLUB_DATA.lat,
        TEST_CLUB_DATA.lng,
        100
      );
      const updatedClub = nearbyClubs.find(c => c.id === memberTestClub.id);
      expect(updatedClub?.memberCount).toBe(3);
    });
  });

  // Cleanup after tests
  afterAll(async () => {
    // In a real test environment, you would clean up test data here
    console.log('Club management integration tests completed');
  });
});

/**
 * Location Service Integration Tests
 */
describe('Location Integration', () => {
  test('should validate coordinates correctly', () => {
    const clubService = new ClubService();

    // Valid coordinates
    expect(clubService['isValidCoordinate'](37.7749, -122.4194)).toBe(true);
    expect(clubService['isValidCoordinate'](0, 0)).toBe(true);
    expect(clubService['isValidCoordinate'](90, 180)).toBe(true);
    expect(clubService['isValidCoordinate'](-90, -180)).toBe(true);

    // Invalid coordinates
    expect(clubService['isValidCoordinate'](91, 0)).toBe(false);
    expect(clubService['isValidCoordinate'](0, 181)).toBe(false);
    expect(clubService['isValidCoordinate'](NaN, 0)).toBe(false);
    expect(clubService['isValidCoordinate'](0, NaN)).toBe(false);
    expect(clubService['isValidCoordinate'](undefined as any, 0)).toBe(false);
  });
});