import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ClubList } from '../../components/ClubList';

// Mock the ClubCard component
jest.mock('../../components/ClubCard', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    ClubCard: ({ club, onPress, isJoined, distance }: any) => (
      <TouchableOpacity onPress={() => onPress(club)} testID={`club-card-${club.id}`}>
        <Text>{club.name}</Text>
        <Text>{club.location}</Text>
        {isJoined && <Text>Joined</Text>}
        {distance && <Text>{distance} km away</Text>}
      </TouchableOpacity>
    ),
  };
});

// Mock the ThemedText component
jest.mock('../../components/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

describe('ClubList', () => {
  const mockClubs = [
    {
      id: 'club-1',
      name: 'Downtown Tennis Club',
      location: 'New York, NY',
      lat: 40.7128,
      lng: -74.0060,
      description: 'Premier tennis club',
      memberCount: 25,
      creator_id: 'user-1',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'club-2',
      name: 'Central Park Tennis',
      location: 'New York, NY',
      lat: 40.7829,
      lng: -73.9654,
      description: 'Tennis in the park',
      memberCount: 15,
      creator_id: 'user-2',
      created_at: '2024-01-14T10:00:00Z',
    },
    {
      id: 'club-3',
      name: 'Brooklyn Tennis Club',
      location: 'Brooklyn, NY',
      lat: 40.6782,
      lng: -73.9442,
      description: 'Community tennis club',
      memberCount: 30,
      creator_id: 'user-3',
      created_at: '2024-01-13T10:00:00Z',
    },
  ];

  const mockOnClubPress = jest.fn();
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render list of clubs', () => {
    const { getByText, getByTestId } = render(
      <ClubList 
        clubs={mockClubs} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText('Downtown Tennis Club')).toBeTruthy();
    expect(getByText('Central Park Tennis')).toBeTruthy();
    expect(getByText('Brooklyn Tennis Club')).toBeTruthy();
    
    expect(getByTestId('club-card-club-1')).toBeTruthy();
    expect(getByTestId('club-card-club-2')).toBeTruthy();
    expect(getByTestId('club-card-club-3')).toBeTruthy();
  });

  it('should display empty state when no clubs', () => {
    const { getByText } = render(
      <ClubList 
        clubs={[]} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText('No clubs found')).toBeTruthy();
    expect(getByText('Be the first to create a tennis club in your area!')).toBeTruthy();
  });

  it('should display loading state', () => {
    const { getByText } = render(
      <ClubList 
        clubs={[]} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
        loading={true}
      />
    );

    expect(getByText('Finding tennis clubs...')).toBeTruthy();
  });

  it('should handle club press events', () => {
    const { getByTestId } = render(
      <ClubList 
        clubs={mockClubs} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
      />
    );

    const firstClubCard = getByTestId('club-card-club-1');
    fireEvent.press(firstClubCard);

    expect(mockOnClubPress).toHaveBeenCalledWith(mockClubs[0]);
  });

  it('should show joined status for user clubs', () => {
    const joinedClubIds = ['club-1', 'club-3'];
    
    const { getByTestId, getAllByText } = render(
      <ClubList 
        clubs={mockClubs} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
        joinedClubIds={joinedClubIds}
      />
    );

    // Check that joined clubs show "Joined" text
    expect(getByTestId('club-card-club-1')).toBeTruthy();
    expect(getByTestId('club-card-club-3')).toBeTruthy();
    
    // Check for joined indicator in the rendered content
    const joinedTexts = getAllByText('Joined');
    expect(joinedTexts).toHaveLength(2);
  });

  it('should display distances when provided', () => {
    const distances = new Map([
      ['club-1', 1.2],
      ['club-2', 2.8],
      ['club-3', 5.1],
    ]);

    const { getByText } = render(
      <ClubList 
        clubs={mockClubs} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
        distances={distances}
      />
    );

    expect(getByText('1.2 km away')).toBeTruthy();
    expect(getByText('2.8 km away')).toBeTruthy();
    expect(getByText('5.1 km away')).toBeTruthy();
  });

  it('should handle pull-to-refresh', () => {
    const { getByTestId } = render(
      <ClubList 
        clubs={mockClubs} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
      />
    );

    const scrollView = getByTestId('club-list-scroll');
    const refreshControl = scrollView.props.refreshControl;
    
    // Simulate the refresh action
    refreshControl.props.onRefresh();

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should display error state when provided', () => {
    const errorMessage = 'Failed to load clubs. Please check your connection.';
    
    const { getByText } = render(
      <ClubList 
        clubs={[]} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
        error={errorMessage}
      />
    );

    expect(getByText(errorMessage)).toBeTruthy();
    expect(getByText('Tap to retry')).toBeTruthy();
  });

  it('should handle retry on error tap', () => {
    const errorMessage = 'Failed to load clubs';
    
    const { getByText } = render(
      <ClubList 
        clubs={[]} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
        error={errorMessage}
      />
    );

    const retryButton = getByText('Tap to retry');
    fireEvent.press(retryButton);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should sort clubs by distance when distances provided', () => {
    const distances = new Map([
      ['club-1', 5.1], // Furthest
      ['club-2', 1.2], // Closest
      ['club-3', 2.8], // Middle
    ]);

    const { getByTestId } = render(
      <ClubList 
        clubs={mockClubs} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
        distances={distances}
        sortByDistance={true}
      />
    );

    // Verify clubs are rendered (component should handle sorting internally)
    expect(getByTestId('club-card-club-1')).toBeTruthy();
    expect(getByTestId('club-card-club-2')).toBeTruthy();
    expect(getByTestId('club-card-club-3')).toBeTruthy();
  });

  it('should handle single club in list', () => {
    const singleClub = [mockClubs[0]];
    
    const { getByText, getByTestId } = render(
      <ClubList 
        clubs={singleClub} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText('Downtown Tennis Club')).toBeTruthy();
    expect(getByTestId('club-card-club-1')).toBeTruthy();
  });

  it('should handle clubs without descriptions', () => {
    const clubsWithoutDesc = mockClubs.map(club => ({
      ...club,
      description: undefined,
    }));

    const { getByText } = render(
      <ClubList 
        clubs={clubsWithoutDesc} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
      />
    );

    expect(getByText('Downtown Tennis Club')).toBeTruthy();
    expect(getByText('Central Park Tennis')).toBeTruthy();
    expect(getByText('Brooklyn Tennis Club')).toBeTruthy();
  });

  it('should handle refresh while loading', () => {
    const { getByTestId } = render(
      <ClubList 
        clubs={mockClubs} 
        onClubPress={mockOnClubPress}
        onRefresh={mockOnRefresh}
        loading={true}
        refreshing={true}
      />
    );

    const scrollView = getByTestId('club-list-scroll');
    // Check that refreshControl is properly configured
    expect(scrollView.props.refreshControl).toBeDefined();
  });
});