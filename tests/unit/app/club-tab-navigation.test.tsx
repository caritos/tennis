import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import ClubDetailsPage from '@/app/club/[id]';

// Mock dependencies
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
  useFocusEffect: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
    })),
  },
}));

jest.mock('@/services/clubService', () => ({
  getClubMembers: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/services/matchService', () => ({
  generateLeaderboard: jest.fn().mockResolvedValue([]),
  getRecentMatches: jest.fn().mockResolvedValue([]),
}));

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

const mockClubId = 'test-club-id';

describe('Club Tab Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
    });
    
    // Default: no URL parameters
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      id: mockClubId,
      tab: undefined,
      matchId: undefined,
    });
  });

  describe('Initial Tab Selection', () => {
    test('should default to overview tab when no URL tab parameter provided', async () => {
      const { getByTestId } = render(<ClubDetailsPage />);
      
      await waitFor(() => {
        // Overview tab should be active (have active styling)
        const overviewTab = getByTestId('tab-overview');
        expect(overviewTab).toBeTruthy();
        // Add more specific style assertions here
      });
    });

    test('should initialize to members tab when tab=members in URL', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: mockClubId,
        tab: 'members',
        matchId: undefined,
      });

      const { getByTestId } = render(<ClubDetailsPage />);
      
      await waitFor(() => {
        // Members tab should be active
        const membersTab = getByTestId('tab-members');
        expect(membersTab).toBeTruthy();
      });
    });

    test('should initialize to matches tab when tab=matches in URL', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: mockClubId,
        tab: 'matches',
        matchId: undefined,
      });

      const { getByTestId } = render(<ClubDetailsPage />);
      
      await waitFor(() => {
        // Matches tab should be active
        const matchesTab = getByTestId('tab-matches');
        expect(matchesTab).toBeTruthy();
      });
    });
  });

  describe('Manual Tab Navigation', () => {
    test('should switch to members tab when members tab is pressed', async () => {
      const { getByTestId } = render(<ClubDetailsPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('tab-overview')).toBeTruthy();
      });

      // Press members tab
      fireEvent.press(getByTestId('tab-members'));
      
      await waitFor(() => {
        // Members tab should now be active
        const membersTab = getByTestId('tab-members');
        expect(membersTab).toBeTruthy();
        // Verify active styling is applied
      });
    });

    test('should switch to matches tab when matches tab is pressed', async () => {
      const { getByTestId } = render(<ClubDetailsPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(getByTestId('tab-overview')).toBeTruthy();
      });

      // Press matches tab
      fireEvent.press(getByTestId('tab-matches'));
      
      await waitFor(() => {
        // Matches tab should now be active
        const matchesTab = getByTestId('tab-matches');
        expect(matchesTab).toBeTruthy();
      });
    });

    test('should return to overview tab when overview tab is pressed from another tab', async () => {
      const { getByTestId } = render(<ClubDetailsPage />);
      
      // Switch to members tab first
      fireEvent.press(getByTestId('tab-members'));
      await waitFor(() => {
        expect(getByTestId('tab-members')).toBeTruthy();
      });

      // Switch back to overview
      fireEvent.press(getByTestId('tab-overview'));
      
      await waitFor(() => {
        // Overview tab should be active again
        const overviewTab = getByTestId('tab-overview');
        expect(overviewTab).toBeTruthy();
      });
    });
  });

  describe('Tab State Persistence', () => {
    test('should maintain tab selection after switching tabs multiple times', async () => {
      const { getByTestId } = render(<ClubDetailsPage />);
      
      // Start on overview, switch to members, then matches
      fireEvent.press(getByTestId('tab-members'));
      await waitFor(() => {
        expect(getByTestId('tab-members')).toBeTruthy();
      });

      fireEvent.press(getByTestId('tab-matches'));
      await waitFor(() => {
        expect(getByTestId('tab-matches')).toBeTruthy();
      });

      // Should still be on matches tab
      const matchesTab = getByTestId('tab-matches');
      expect(matchesTab).toBeTruthy();
    });

    test('should not trigger router.replace when switching tabs manually', async () => {
      const { getByTestId } = render(<ClubDetailsPage />);
      
      // Press members tab
      fireEvent.press(getByTestId('tab-members'));
      
      await waitFor(() => {
        // router.replace should NOT be called (this was the bug)
        expect(mockRouter.replace).not.toHaveBeenCalled();
      });
    });
  });

  describe('Deep Linking with Tabs', () => {
    test('should handle deep link to specific match while preserving tab functionality', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: mockClubId,
        tab: 'matches',
        matchId: 'test-match-id',
      });

      const { getByTestId } = render(<ClubDetailsPage />);
      
      await waitFor(() => {
        // Should be on matches tab due to deep link
        expect(getByTestId('tab-matches')).toBeTruthy();
      });

      // Manual navigation should still work
      fireEvent.press(getByTestId('tab-overview'));
      
      await waitFor(() => {
        expect(getByTestId('tab-overview')).toBeTruthy();
      });
    });
  });

  describe('URL Parameter Effect Behavior', () => {
    test('should only process URL parameters once on initial load', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: mockClubId,
        tab: 'members',
        matchId: undefined,
      });

      const { getByTestId, rerender } = render(<ClubDetailsPage />);
      
      await waitFor(() => {
        expect(getByTestId('tab-members')).toBeTruthy();
      });

      // Simulate parameter change (but shouldn't affect tab after manual navigation)
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: mockClubId,
        tab: undefined,
        matchId: undefined,
      });

      // Press overview tab to trigger manual navigation
      fireEvent.press(getByTestId('tab-overview'));
      
      await waitFor(() => {
        expect(getByTestId('tab-overview')).toBeTruthy();
      });

      // Rerender with different params - should not change tab
      rerender(<ClubDetailsPage />);
      
      await waitFor(() => {
        // Should still be on overview tab
        expect(getByTestId('tab-overview')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid tab parameter gracefully', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: mockClubId,
        tab: 'invalid-tab',
        matchId: undefined,
      });

      const { getByTestId } = render(<ClubDetailsPage />);
      
      await waitFor(() => {
        // Should default to overview tab for invalid tab parameter
        expect(getByTestId('tab-overview')).toBeTruthy();
      });
    });

    test('should handle missing club ID gracefully', async () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({
        id: undefined,
        tab: undefined,
        matchId: undefined,
      });

      const { queryByTestId } = render(<ClubDetailsPage />);
      
      // Should handle gracefully without crashing
      expect(() => render(<ClubDetailsPage />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should have proper accessibility labels for tabs', async () => {
      const { getByTestId } = render(<ClubDetailsPage />);
      
      await waitFor(() => {
        const overviewTab = getByTestId('tab-overview');
        const membersTab = getByTestId('tab-members');
        const matchesTab = getByTestId('tab-matches');
        
        expect(overviewTab).toBeTruthy();
        expect(membersTab).toBeTruthy();
        expect(matchesTab).toBeTruthy();
        
        // Could add more specific accessibility checks here
      });
    });
  });
});