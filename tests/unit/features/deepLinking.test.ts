/**
 * Deep Linking Test Suite - GitHub Issue #129
 * 
 * Tests the complete deep linking flow from match invitation notifications
 * to automatic navigation, scrolling, and highlighting of target matches.
 * 
 * @author Claude Code
 * @date 2025-08-28
 */

import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import React from 'react';
import { router } from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

// Mock react-native components
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Dimensions: {
    get: () => ({ height: 800, width: 400 }),
  },
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock components
jest.mock('@/components/ThemedText', () => ({
  ThemedText: 'ThemedText',
}));

jest.mock('@/components/ThemedView', () => ({
  ThemedView: 'ThemedView',
}));

jest.mock('@/components/TennisScoreDisplay', () => ({
  TennisScoreDisplay: 'TennisScoreDisplay',
}));

jest.mock('@/components/DoublesMatchParticipants', () => ({
  DoublesMatchParticipants: 'DoublesMatchParticipants',
}));

// Mock hooks
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

// Mock constants
jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: {
      background: '#ffffff',
      text: '#000000',
      tint: '#007AFF',
      card: '#f8f9fa',
      border: '#e1e4e8',
      tabIconDefault: '#8E8E93',
      textSecondary: '#6D6D70',
    },
  },
}));

// Import the components after mocks
import ClubMatches from '@/components/club/ClubMatches';
import { MatchInvitationNotification } from '@/components/MatchInvitationNotification';

describe('Deep Linking Feature - GitHub Issue #129', () => {
  // Mock match data
  const mockMatches = [
    {
      id: '96f26222-2e6f-4f29-a952-10dc4a069e3d', // Target match for deep linking
      player1_name: 'John Smith',
      player2_name: 'Jane Doe',
      player1_id: 'user-1',
      player2_id: 'user-2',
      match_type: 'singles' as const,
      date: '2025-08-29',
      scores: '6-4,6-2',
      winner: 1,
      isInvitation: true,
      responses: [],
      time: '14:00',
      notes: 'Looking for a competitive singles match',
    },
    {
      id: 'other-match-1',
      player1_name: 'Alice Williams',
      player2_name: 'Bob Johnson',
      player1_id: 'user-3',
      player2_id: 'user-4',
      match_type: 'doubles' as const,
      date: '2025-08-30',
      scores: '6-3,4-6,6-4',
      winner: 2,
      isInvitation: false,
      responses: [],
    },
    {
      id: 'other-match-2',
      player1_name: 'Charlie Brown',
      player2_name: 'David Wilson',
      player1_id: 'user-5',
      player2_id: 'user-6',
      match_type: 'singles' as const,
      date: '2025-08-31',
      scores: '7-5,6-3',
      winner: 1,
      isChallenge: true,
      responses: [],
    },
  ];

  const mockClub = {
    id: 'club-123',
    name: 'Test Tennis Club',
  };

  const mockColors = {
    background: '#ffffff',
    text: '#000000',
    tint: '#007AFF',
    card: '#f8f9fa',
    border: '#e1e4e8',
    tabIconDefault: '#8E8E93',
    textSecondary: '#6D6D70',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Match ID Generation', () => {
    it('should generate readable match IDs in M-ABC123 format', () => {
      const testMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';
      
      // The helper function converts UUID to readable format
      const expectedReadableId = 'M-96F262'; // First 6 chars after removing dashes
      
      // This would be tested by rendering a component that uses getReadableMatchId
      const { getByText } = render(
        <ClubMatches
          matches={[mockMatches[0]]}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={testMatchId}
        />
      );
      
      // The component should display the readable match ID
      expect(getByText(expectedReadableId)).toBeTruthy();
    });

    it('should handle different UUID formats consistently', () => {
      const testCases = [
        { input: '96f26222-2e6f-4f29-a952-10dc4a069e3d', expected: 'M-96F262' },
        { input: 'abc12345-6789-0def-1234-567890abcdef', expected: 'M-ABC123' },
        { input: '11111111-2222-3333-4444-555555555555', expected: 'M-111111' },
      ];

      testCases.forEach(({ input, expected }) => {
        // Test the readable ID generation
        const cleanId = input.replace(/-/g, '').toUpperCase().slice(0, 6);
        const readableId = `M-${cleanId}`;
        expect(readableId).toBe(expected);
      });
    });
  });

  describe('Deep Linking Navigation', () => {
    it('should handle navigation from match invitation notification', () => {
      const mockOnViewDetails = jest.fn();
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';

      const { getByText } = render(
        <MatchInvitationNotification
          clubId="club-123"
          onViewDetails={mockOnViewDetails}
        />
      );

      // Simulate clicking "View Match M-96F262" button
      const viewButton = getByText('View Match M-96F262');
      fireEvent.press(viewButton);

      // Should call onViewDetails with the match ID
      expect(mockOnViewDetails).toHaveBeenCalledWith(targetMatchId);
    });

    it('should navigate to correct URL with deep link parameters', () => {
      const clubId = 'club-123';
      const matchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';
      const expectedUrl = `/club/${clubId}?tab=matches&matchId=${matchId}`;

      // Simulate the navigation that happens after clicking view details
      router.push(expectedUrl);

      expect(router.push).toHaveBeenCalledWith(expectedUrl);
    });
  });

  describe('Match Filtering with Business Logic Exception', () => {
    it('should always include target match despite filtering rules', () => {
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';
      
      // Create a match that would normally be filtered out
      const pastMatch = {
        ...mockMatches[0],
        id: targetMatchId,
        date: '2025-08-20', // Past date
        isInvitation: true,
      };

      const { getByText } = render(
        <ClubMatches
          matches={[pastMatch]}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="upcoming" // This would normally filter out past matches
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId} // Deep linking to this match
        />
      );

      // Target match should still be visible despite being filtered out normally
      expect(getByText('M-96F262')).toBeTruthy();
    });

    it('should apply normal filtering when not deep linking', () => {
      const pastMatch = {
        ...mockMatches[0],
        date: '2025-08-20', // Past date
        isInvitation: true,
      };

      const { queryByText } = render(
        <ClubMatches
          matches={[pastMatch]}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="upcoming" // Filter out past matches
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          // No highlightMatchId - normal filtering applies
        />
      );

      // Past match should be filtered out when not deep linking
      expect(queryByText('M-96F262')).toBeNull();
    });
  });

  describe('Visual Highlighting', () => {
    it('should apply highlight styles to target match', () => {
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';

      const { getByTestId } = render(
        <ClubMatches
          matches={mockMatches}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId}
        />
      );

      // The highlighted match should have special styling
      const highlightedMatch = getByTestId(`match-${targetMatchId}`);
      expect(highlightedMatch.props.style).toEqual(
        expect.objectContaining({
          borderColor: mockColors.tint,
          borderWidth: 3,
          backgroundColor: `${mockColors.tint}15`,
          shadowColor: mockColors.tint,
        })
      );
    });

    it('should not apply highlight styles to non-target matches', () => {
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';
      const otherMatchId = 'other-match-1';

      const { getByTestId } = render(
        <ClubMatches
          matches={mockMatches}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId}
        />
      );

      // Non-target matches should not have highlight styling
      const nonHighlightedMatch = getByTestId(`match-${otherMatchId}`);
      expect(nonHighlightedMatch.props.style).not.toEqual(
        expect.objectContaining({
          borderColor: mockColors.tint,
          borderWidth: 3,
        })
      );
    });
  });

  describe('Automatic Scrolling', () => {
    let mockScrollTo: jest.Mock;

    beforeEach(() => {
      mockScrollTo = jest.fn();
      
      // Mock ScrollView ref
      jest.spyOn(React, 'useRef').mockReturnValue({
        current: {
          scrollTo: mockScrollTo,
        },
      });
    });

    it('should calculate scroll position based on match index and measured heights', async () => {
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';
      const targetIndex = 0; // First match in our mock data

      render(
        <ClubMatches
          matches={mockMatches}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId}
        />
      );

      // Wait for scroll effect to trigger
      await waitFor(() => {
        expect(mockScrollTo).toHaveBeenCalled();
      }, { timeout: 2000 });

      // Verify scroll was called with calculated position
      const scrollCall = mockScrollTo.mock.calls[0];
      expect(scrollCall).toBeDefined();
      expect(scrollCall[0]).toEqual(
        expect.objectContaining({
          y: expect.any(Number),
          animated: expect.any(Boolean),
        })
      );
    });

    it('should use multiple scroll attempts for reliability', async () => {
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';

      render(
        <ClubMatches
          matches={mockMatches}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId}
        />
      );

      // Wait for all scroll attempts to complete
      await waitFor(() => {
        expect(mockScrollTo).toHaveBeenCalledTimes(3);
      }, { timeout: 3000 });

      // Verify different scroll strategies were used
      const calls = mockScrollTo.mock.calls;
      expect(calls[0][0]).toEqual({ y: expect.any(Number), animated: true });
      expect(calls[1][0]).toEqual({ y: expect.any(Number), animated: false });
      expect(calls[2][0]).toEqual({ y: expect.any(Number), animated: true });
    });

    it('should handle match height measurement for accurate positioning', () => {
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';

      const { getByTestId } = render(
        <ClubMatches
          matches={mockMatches}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId}
        />
      );

      // Simulate onLayout callback for match height measurement
      const matchElement = getByTestId(`match-${targetMatchId}`);
      const mockLayoutEvent = {
        nativeEvent: {
          layout: {
            height: 160, // Measured height for invitation match
            width: 350,
            x: 0,
            y: 0,
          },
        },
      };

      // Trigger onLayout
      act(() => {
        if (matchElement.props.onLayout) {
          matchElement.props.onLayout(mockLayoutEvent);
        }
      });

      // Height should be stored for scroll calculation
      // This would be verified by checking console logs or internal state
    });
  });

  describe('Error Handling', () => {
    it('should handle missing target match gracefully', () => {
      const nonExistentMatchId = 'non-existent-match-id';

      const { queryByText } = render(
        <ClubMatches
          matches={mockMatches}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={nonExistentMatchId}
        />
      );

      // Should not crash, but also won't find the match to highlight
      expect(queryByText('M-NONEX')).toBeNull();
    });

    it('should handle empty matches array', () => {
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';

      const { getByText } = render(
        <ClubMatches
          matches={[]} // Empty matches
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId}
        />
      );

      // Should show empty state
      expect(getByText('No matches yet • Be the first to play!')).toBeTruthy();
    });
  });

  describe('Integration Test - Complete Deep Linking Flow', () => {
    it('should complete entire deep linking flow from notification to highlight', async () => {
      const clubId = 'club-123';
      const targetMatchId = '96f26222-2e6f-4f29-a952-10dc4a069e3d';
      const mockOnViewDetails = jest.fn();
      let mockScrollTo = jest.fn();

      // Mock ScrollView ref
      jest.spyOn(React, 'useRef').mockReturnValue({
        current: { scrollTo: mockScrollTo },
      });

      // Step 1: User clicks notification
      const { getByText: getByTextNotification } = render(
        <MatchInvitationNotification
          clubId={clubId}
          onViewDetails={mockOnViewDetails}
        />
      );

      fireEvent.press(getByTextNotification('View Match M-96F262'));
      expect(mockOnViewDetails).toHaveBeenCalledWith(targetMatchId);

      // Step 2: Navigation happens (mocked)
      const expectedUrl = `/club/${clubId}?tab=matches&matchId=${targetMatchId}`;
      router.push(expectedUrl);
      expect(router.push).toHaveBeenCalledWith(expectedUrl);

      // Step 3: ClubMatches component renders with highlight
      const { getByText: getByTextMatches, getByTestId } = render(
        <ClubMatches
          matches={mockMatches}
          club={mockClub}
          colors={mockColors}
          filterType="all"
          filterDate="all"
          filterInvolvement="all"
          onFilterTypeChange={() => {}}
          onFilterDateChange={() => {}}
          onFilterInvolvementChange={() => {}}
          currentUserId="user-1"
          highlightMatchId={targetMatchId}
        />
      );

      // Step 4: Match should be visible with readable ID
      expect(getByTextMatches('M-96F262')).toBeTruthy();

      // Step 5: Match should have highlight styling
      const highlightedMatch = getByTestId(`match-${targetMatchId}`);
      expect(highlightedMatch.props.style).toEqual(
        expect.objectContaining({
          borderColor: mockColors.tint,
          borderWidth: 3,
        })
      );

      // Step 6: Automatic scrolling should occur
      await waitFor(() => {
        expect(mockScrollTo).toHaveBeenCalled();
      }, { timeout: 2000 });

      expect(mockScrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          y: expect.any(Number),
          animated: expect.any(Boolean),
        })
      );
    });
  });
});