import React from 'react';
import { render } from '@testing-library/react-native';
import ClubScreen from '../app/(tabs)/index';

// Mock dependencies to prevent async issues
jest.mock('../hooks/useLocation', () => ({
  useLocation: () => ({
    location: { latitude: 37.7749, longitude: -122.4194 },
    requestLocationPermission: jest.fn(),
    error: null,
    loading: false,
  }),
}));

jest.mock('../services/clubService', () => ({
  __esModule: true,
  default: {
    getNearbyClubs: jest.fn(() => Promise.resolve([])),
    calculateDistance: jest.fn(() => 1.0),
  },
}));

jest.mock('../utils/seedData', () => ({
  seedSampleClubs: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe('Club Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should NOT display "Clubs" header (removed in UI update)', () => {
    const { queryByText } = render(<ClubScreen />);
    expect(queryByText('Clubs')).toBeNull();
  });

  it('should display "My Clubs" section', () => {
    const { getByText } = render(<ClubScreen />);
    expect(getByText(/My Clubs/)).toBeTruthy();
  });

  it('should display "Discover Clubs Near You" section', () => {
    const { getByText } = render(<ClubScreen />);
    expect(getByText('Discover Clubs Near You')).toBeTruthy();
  });

  it('should show placeholder message when no clubs are joined', () => {
    const { getByText } = render(<ClubScreen />);
    expect(getByText('No clubs joined yet')).toBeTruthy();
    expect(getByText('Join a club to start playing!')).toBeTruthy();
  });

  it('should display Create Club button at bottom', () => {
    const { getByText } = render(<ClubScreen />);
    expect(getByText('Create Club')).toBeTruthy();
  });
});