/**
 * Enhanced Unit tests for ClubCard component
 * Tests the improved distance formatting and member count display
 */

import React from 'react';
import { render } from '../../../jest.setup';
import { ClubCard } from '../../../components/ClubCard';
import { Club } from '../../../lib/supabase';

// Mock the themed components
jest.mock('../../../components/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock('../../../components/ThemedView', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

const mockClub: Club = {
  id: 'test-club-1',
  name: 'Test Tennis Club',
  description: 'A test club',
  location: 'San Francisco',
  lat: 37.7749,
  lng: -122.4194,
  creator_id: 'user-1',
  created_at: '2023-01-01T00:00:00Z',
  memberCount: 5,
};

describe('ClubCard Enhanced Features', () => {
  const mockOnPress = jest.fn();
  const mockOnJoin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Distance Formatting', () => {
    test('should display "Nearby" for very close distances', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          distance={0.05} // 50 meters
          isJoined={false}
        />
      );

      expect(getByText('Nearby')).toBeTruthy();
    });

    test('should display meters for distances under 1km', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          distance={0.5} // 500 meters
          isJoined={false}
        />
      );

      expect(getByText('500m')).toBeTruthy();
    });

    test('should display kilometers with decimal for distances under 10km', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          distance={2.3} // 2.3 km
          isJoined={false}
        />
      );

      expect(getByText('2.3km')).toBeTruthy();
    });

    test('should display rounded kilometers for distances under 100km', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          distance={45.7} // 45.7 km -> 46 km
          isJoined={false}
        />
      );

      expect(getByText('46km')).toBeTruthy();
    });

    test('should display approximate range for far distances', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          distance={234} // 234 km -> 230km+
          isJoined={false}
        />
      );

      expect(getByText('230km+')).toBeTruthy();
    });

    test('should display "Far" for very distant clubs', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          distance={600} // 600 km
          isJoined={false}
        />
      );

      expect(getByText('Far')).toBeTruthy();
    });

    test('should not display distance when not provided', () => {
      const { queryByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      // Should not have any distance text
      expect(queryByText(/km/)).toBeFalsy();
      expect(queryByText(/m$/)).toBeFalsy();
      expect(queryByText('Nearby')).toBeFalsy();
      expect(queryByText('Far')).toBeFalsy();
    });
  });

  describe('Member Count Formatting', () => {
    test('should display "New club" for zero members', () => {
      const clubWithNoMembers = { ...mockClub, memberCount: 0 };
      const { getByText } = render(
        <ClubCard
          club={clubWithNoMembers}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('New club')).toBeTruthy();
    });

    test('should display "1 member" for single member', () => {
      const clubWithOneMember = { ...mockClub, memberCount: 1 };
      const { getByText } = render(
        <ClubCard
          club={clubWithOneMember}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('1 member')).toBeTruthy();
    });

    test('should display exact count for small member numbers', () => {
      const clubWithMembers = { ...mockClub, memberCount: 23 };
      const { getByText } = render(
        <ClubCard
          club={clubWithMembers}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('23 members')).toBeTruthy();
    });

    test('should display approximate count for medium member numbers', () => {
      const clubWithManyMembers = { ...mockClub, memberCount: 156 };
      const { getByText } = render(
        <ClubCard
          club={clubWithManyMembers}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('160+ members')).toBeTruthy();
    });

    test('should display approximate count for large member numbers', () => {
      const clubWithManyMembers = { ...mockClub, memberCount: 1234 };
      const { getByText } = render(
        <ClubCard
          club={clubWithManyMembers}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('1200+ members')).toBeTruthy();
    });

    test('should handle undefined member count', () => {
      const clubWithUndefinedMembers = { ...mockClub, memberCount: undefined };
      const { getByText } = render(
        <ClubCard
          club={clubWithUndefinedMembers}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('New club')).toBeTruthy();
    });
  });

  describe('Activity Indicators', () => {
    test('should show member activity for joined clubs', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={true}
        />
      );

      expect(getByText('• Member since recently')).toBeTruthy();
    });

    test('should show community activity for unjoined clubs', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('• Active community')).toBeTruthy();
    });
  });

  describe('Join Button Behavior', () => {
    test('should show join button for unjoined clubs', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByText('Join')).toBeTruthy();
    });

    test('should not show join button for joined clubs', () => {
      const { queryByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={true}
        />
      );

      expect(queryByText('Join')).toBeFalsy();
    });

    test('should not show join button when no onJoin provided', () => {
      const { queryByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          isJoined={false}
        />
      );

      expect(queryByText('Join')).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility label with distance', () => {
      const { getByLabelText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          distance={2.5}
          isJoined={false}
        />
      );

      expect(getByLabelText('Test Tennis Club, 5 members, 2.5km away')).toBeTruthy();
    });

    test('should have proper accessibility label without distance', () => {
      const { getByLabelText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      expect(getByLabelText('Test Tennis Club, 5 members')).toBeTruthy();
    });

    test('should have proper accessibility for join button', () => {
      const { getByLabelText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      const joinButton = getByLabelText('Join Test Tennis Club');
      expect(joinButton).toBeTruthy();
    });
  });

  describe('Interaction Handling', () => {
    test('should call onPress when card is pressed', () => {
      const { getByLabelText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      const card = getByLabelText('Test Tennis Club, 5 members');
      card.props.onPress();

      expect(mockOnPress).toHaveBeenCalledWith(mockClub);
    });

    test('should call onJoin when join button is pressed', () => {
      const { getByText } = render(
        <ClubCard
          club={mockClub}
          onPress={mockOnPress}
          onJoin={mockOnJoin}
          isJoined={false}
        />
      );

      const joinButton = getByText('Join');
      joinButton.parent.props.onPress();

      expect(mockOnJoin).toHaveBeenCalledWith(mockClub);
    });
  });
});