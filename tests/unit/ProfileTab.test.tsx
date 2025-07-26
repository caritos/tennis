import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../app/(tabs)/profile';

// Mock dependencies
jest.mock('../services/clubService');
jest.mock('../contexts/AuthContext');
jest.mock('@react-navigation/native');

import clubService from '../services/clubService';
import { useAuth } from '../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

describe('Profile Tab', () => {
  const mockClubService = clubService as jest.Mocked<typeof clubService>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockUseFocusEffect = useFocusEffect as jest.MockedFunction<typeof useFocusEffect>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock auth context
    mockUseAuth.mockReturnValue({
      user: { 
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      },
      signOut: jest.fn(),
    } as any);

    // Mock focus effect to call callback immediately
    mockUseFocusEffect.mockImplementation((callback) => {
      callback();
    });

    // Default mock for getUserClubs
    mockClubService.getUserClubs = jest.fn().mockResolvedValue([]);
  });

  it('should display "Profile" header', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('should display user name from auth context', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('should display tennis stats section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Tennis Stats')).toBeTruthy();
  });

  it('should display match history section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Match History')).toBeTruthy();
  });

  it('should display club memberships section', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Club Memberships')).toBeTruthy();
  });

  it('should display settings section with sign out button', () => {
    render(<ProfileScreen />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Sign Out')).toBeTruthy();
  });

  it('should show placeholder when no stats available', () => {
    render(<ProfileScreen />);
    expect(screen.getAllByText('No matches played yet')).toHaveLength(2);
    expect(screen.getAllByText('Record your first match!')).toHaveLength(2);
  });

  it('should show placeholder when no club memberships', async () => {
    mockClubService.getUserClubs.mockResolvedValue([]);
    
    render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('No club memberships')).toBeTruthy();
      expect(screen.getByText('Join a club to start playing!')).toBeTruthy();
    });
  });

  it('should display club memberships when user has joined clubs', async () => {
    const mockClubs = [
      {
        id: '1',
        name: 'Golden Gate Tennis Club',
        location: 'San Francisco, CA',
        memberCount: 15,
        description: 'Great club',
        lat: 37.7749,
        lng: -122.4194,
        creator_id: 'user1',
        created_at: '2023-01-01',
      },
      {
        id: '2', 
        name: 'Marina Tennis Club',
        location: 'Marina District, CA',
        memberCount: 8,
        description: 'Another great club',
        lat: 37.8044,
        lng: -122.4324,
        creator_id: 'user2',
        created_at: '2023-01-02',
      }
    ];

    mockClubService.getUserClubs.mockResolvedValue(mockClubs);

    render(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText('Club Memberships (2)')).toBeTruthy();
      expect(screen.getByText('Golden Gate Tennis Club')).toBeTruthy();
      expect(screen.getByText('San Francisco, CA')).toBeTruthy();
      expect(screen.getByText('15 members')).toBeTruthy();
      expect(screen.getByText('Marina Tennis Club')).toBeTruthy();
      expect(screen.getByText('Marina District, CA')).toBeTruthy();
      expect(screen.getByText('8 members')).toBeTruthy();
    });
  });

  it('should show loading state while fetching clubs', () => {
    // Mock a delayed response
    mockClubService.getUserClubs.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<ProfileScreen />);
    expect(screen.getByText('Loading clubs...')).toBeTruthy();
  });

  it('should call clubService.getUserClubs with correct user ID', () => {
    render(<ProfileScreen />);
    
    expect(mockClubService.getUserClubs).toHaveBeenCalledWith(
      'test-user-id'
    );
  });

  it('should reload clubs when focus effect is triggered', () => {
    render(<ProfileScreen />);
    
    // useFocusEffect should be called with a callback
    expect(mockUseFocusEffect).toHaveBeenCalled();
    
    // getUserClubs should be called when component mounts and when focused
    expect(mockClubService.getUserClubs).toHaveBeenCalledTimes(2); // once for useEffect, once for useFocusEffect
  });

  it('should handle errors gracefully when loading clubs fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockClubService.getUserClubs.mockRejectedValue(new Error('Database error'));

    render(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText('No club memberships')).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load user clubs:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});