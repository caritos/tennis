// Simple UI validation tests for the updated Club Tab
import React from 'react';
import { render } from '@testing-library/react-native';
import ClubScreen from '../../app/(tabs)/index';

// Mock dependencies to prevent async complexity
jest.mock('../../hooks/useLocation', () => ({
  useLocation: () => ({
    location: { latitude: 37.7749, longitude: -122.4194 },
    requestLocationPermission: jest.fn(),
    error: null,
    loading: false,
  }),
}));

jest.mock('../../services/clubService', () => ({
  __esModule: true,
  default: {
    getNearbyClubs: jest.fn(() => Promise.resolve([])),
    calculateDistance: jest.fn(() => 1.0),
  },
}));

jest.mock('../../utils/seedData', () => ({
  seedSampleClubs: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe('ClubScreen UI Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header Removal', () => {
    it('should NOT render Clubs header title', () => {
      const { queryByText } = render(<ClubScreen />);
      expect(queryByText('Clubs')).toBeNull();
    });

    it('should NOT render profile icon', () => {
      const { queryByTestId } = render(<ClubScreen />);
      expect(queryByTestId('profile-icon')).toBeNull();
    });
  });

  describe('Quick Actions Removal', () => {
    it('should NOT render Quick Actions section', () => {
      const { queryByText } = render(<ClubScreen />);
      expect(queryByText('Quick Actions')).toBeNull();
    });

    it('should NOT render Record Match button', () => {
      const { queryByText } = render(<ClubScreen />);
      expect(queryByText('+ Record Match')).toBeNull();
    });

    it('should NOT render Looking to Play button', () => {
      const { queryByText } = render(<ClubScreen />);
      expect(queryByText('+ Looking to Play')).toBeNull();
    });
  });

  describe('Section Organization', () => {
    it('should render My Clubs section', () => {
      const { getByText } = render(<ClubScreen />);
      expect(getByText(/My Clubs/)).toBeTruthy();
    });

    it('should render Discover Clubs Near You section', () => {
      const { getByText } = render(<ClubScreen />);
      expect(getByText('Discover Clubs Near You')).toBeTruthy();
    });

    it('should show placeholder when no clubs joined', () => {
      const { getByText } = render(<ClubScreen />);
      expect(getByText('No clubs joined yet')).toBeTruthy();
      expect(getByText('Join a club to start playing!')).toBeTruthy();
    });

    it('should render Create Club button', () => {
      const { getByText } = render(<ClubScreen />);
      expect(getByText('Create Club')).toBeTruthy();
    });
  });
});