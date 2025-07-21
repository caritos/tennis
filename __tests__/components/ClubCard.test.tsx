import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ClubCard } from '../../components/ClubCard';

// Mock the ThemedText and ThemedView components
jest.mock('../../components/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock('../../components/ThemedView', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

describe('ClubCard', () => {
  const mockClub = {
    id: 'club-123',
    name: 'Tennis Club Downtown',
    location: 'New York, NY',
    lat: 40.7128,
    lng: -74.0060,
    description: 'Premier tennis club in downtown area',
    memberCount: 25,
    creator_id: 'user-456',
    created_at: '2024-01-15T10:00:00Z',
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render club information correctly', () => {
    const { getByText } = render(
      <ClubCard club={mockClub} onPress={mockOnPress} />
    );

    expect(getByText('Tennis Club Downtown')).toBeTruthy();
    expect(getByText('📍 New York, NY')).toBeTruthy();
    expect(getByText('Premier tennis club in downtown area')).toBeTruthy();
    expect(getByText('👥 25 members')).toBeTruthy();
  });

  it('should handle club with no description', () => {
    const clubWithoutDescription = {
      ...mockClub,
      description: undefined,
    };

    const { getByText, queryByText } = render(
      <ClubCard club={clubWithoutDescription} onPress={mockOnPress} />
    );

    expect(getByText('Tennis Club Downtown')).toBeTruthy();
    expect(getByText('📍 New York, NY')).toBeTruthy();
    expect(queryByText('Premier tennis club in downtown area')).toBeNull();
    expect(getByText('👥 25 members')).toBeTruthy();
  });

  it('should handle singular member count', () => {
    const clubWithOneMember = {
      ...mockClub,
      memberCount: 1,
    };

    const { getByText } = render(
      <ClubCard club={clubWithOneMember} onPress={mockOnPress} />
    );

    expect(getByText('👥 1 member')).toBeTruthy();
  });

  it('should handle zero members', () => {
    const clubWithZeroMembers = {
      ...mockClub,
      memberCount: 0,
    };

    const { getByText } = render(
      <ClubCard club={clubWithZeroMembers} onPress={mockOnPress} />
    );

    expect(getByText('👥 0 members')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const { getByRole } = render(
      <ClubCard club={mockClub} onPress={mockOnPress} />
    );

    const cardButton = getByRole('button');
    fireEvent.press(cardButton);

    expect(mockOnPress).toHaveBeenCalledWith(mockClub);
  });

  it('should display distance when provided', () => {
    const { getByText } = render(
      <ClubCard club={mockClub} onPress={mockOnPress} distance={2.5} />
    );

    expect(getByText('2.5 km away')).toBeTruthy();
  });

  it('should display joined indicator when user is member', () => {
    const { getByText } = render(
      <ClubCard club={mockClub} onPress={mockOnPress} isJoined={true} />
    );

    expect(getByText('✓ Joined')).toBeTruthy();
  });

  it('should show join button when user is not member', () => {
    const { getByText } = render(
      <ClubCard club={mockClub} onPress={mockOnPress} isJoined={false} />
    );

    expect(getByText('Join')).toBeTruthy();
  });

  it('should handle very long club names', () => {
    const clubWithLongName = {
      ...mockClub,
      name: 'This is a very long tennis club name that should be handled gracefully by the UI component',
    };

    const { getByText } = render(
      <ClubCard club={clubWithLongName} onPress={mockOnPress} />
    );

    expect(getByText('This is a very long tennis club name that should be handled gracefully by the UI component')).toBeTruthy();
  });

  it('should handle very long descriptions', () => {
    const clubWithLongDescription = {
      ...mockClub,
      description: 'This is a very long description that goes on and on about all the wonderful features and amenities that this tennis club offers to its members including courts, lessons, tournaments, and social events',
    };

    const { getByText } = render(
      <ClubCard club={clubWithLongDescription} onPress={mockOnPress} />
    );

    expect(getByText('This is a very long description that goes on and on about all the wonderful features and amenities that this tennis club offers to its members including courts, lessons, tournaments, and social events')).toBeTruthy();
  });

  it('should render accessibility props correctly', () => {
    const { getByRole } = render(
      <ClubCard club={mockClub} onPress={mockOnPress} />
    );

    const cardButton = getByRole('button');
    expect(cardButton.props.accessibilityLabel).toBe(`Tennis Club Downtown, New York, NY, 25 members`);
  });

  it('should handle missing optional props gracefully', () => {
    const { getByText, queryByText } = render(
      <ClubCard club={mockClub} onPress={mockOnPress} />
    );

    expect(getByText('Tennis Club Downtown')).toBeTruthy();
    expect(queryByText('km away')).toBeNull();
    expect(queryByText('✓ Joined')).toBeNull();
    expect(queryByText('Join')).toBeNull();
  });
});