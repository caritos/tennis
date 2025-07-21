import React from 'react';
import { render } from '@testing-library/react-native';
import { ClubCard } from '../../components/ClubCard';
import { Club } from '../../lib/supabase';

describe('ClubCard UI Updates', () => {
  const mockClub: Club = {
    id: 'test-club-1',
    name: 'Test Tennis Club',
    description: 'A test club',
    location: 'San Francisco, CA',
    lat: 37.7749,
    lng: -122.4194,
    creator_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    memberCount: 25,
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Join Button Display', () => {
    it('should display Join button for non-joined clubs', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
          isJoined={false}
        />
      );

      expect(getByText('Join')).toBeTruthy();
    });

    it('should NOT display Join button for joined clubs', () => {
      const { queryByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
          isJoined={true}
        />
      );

      expect(queryByText('Join')).toBeNull();
    });

    it('should display both distance AND Join button when both are applicable', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
          distance={2.5}
          isJoined={false}
        />
      );

      expect(getByText('2.5 mi')).toBeTruthy();
      expect(getByText('Join')).toBeTruthy();
    });
  });

  describe('Tennis Emoji Display', () => {
    it('should always display tennis emoji', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
        />
      );

      expect(getByText('🎾')).toBeTruthy();
    });
  });

  describe('Activity Indicators', () => {
    it('should show new invitations for joined clubs', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
          isJoined={true}
        />
      );

      expect(getByText('🔴 2 new invitations')).toBeTruthy();
    });

    it('should show active community for non-joined clubs', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
          isJoined={false}
        />
      );

      expect(getByText('• Active community')).toBeTruthy();
    });
  });

  describe('Distance Display', () => {
    it('should format distance in miles when >= 1 mile', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
          distance={2.5}
        />
      );

      expect(getByText('2.5 mi')).toBeTruthy();
    });

    it('should format distance in meters when < 1 mile', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
          distance={0.5}
        />
      );

      expect(getByText('500 m')).toBeTruthy();
    });
  });

  describe('Layout Structure', () => {
    it('should render club name with tennis emoji in first row', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
        />
      );

      const tennisEmoji = getByText('🎾');
      const clubName = getByText('Test Tennis Club');
      
      // Both should exist
      expect(tennisEmoji).toBeTruthy();
      expect(clubName).toBeTruthy();
    });

    it('should render member count in second row', () => {
      const { getByText } = render(
        <ClubCard 
          club={mockClub} 
          onPress={mockOnPress}
        />
      );

      expect(getByText('25 members')).toBeTruthy();
    });
  });
});