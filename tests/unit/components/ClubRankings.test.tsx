import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { ClubRankings } from '../../../components/ClubRankings';
import * as matchService from '../../../services/matchService';

// Mock the match service
jest.mock('../../../services/matchService');
const mockGetClubLeaderboard = jest.mocked(matchService.getClubLeaderboard);

// Mock navigation
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
  },
}));

// Mock dependencies
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/constants/Colors', () => ({
  __esModule: true,
  default: {
    light: {
      background: '#ffffff',
      text: '#000000',
      tint: '#007AFF',
      tabIconDefault: '#8E8E93',
      tabIconSelected: '#007AFF',
    },
  },
}));

describe('ClubRankings', () => {
  const mockClubId = 'club-123';

  const mockRankings = [
    {
      playerId: 'player-1',
      playerName: 'Alice Johnson',
      stats: {
        totalMatches: 10,
        wins: 8,
        losses: 2,
        winPercentage: 80,
        singlesRecord: { wins: 5, losses: 1, winPercentage: 83.33 },
        doublesRecord: { wins: 3, losses: 1, winPercentage: 75 },
        setsWon: 18,
        setsLost: 6,
        gamesWon: 120,
        gamesLost: 80,
      },
      ranking: 1,
      points: 960,
      isProvisional: false,
    },
    {
      playerId: 'player-2',
      playerName: 'Bob Smith',
      stats: {
        totalMatches: 8,
        wins: 6,
        losses: 2,
        winPercentage: 75,
        singlesRecord: { wins: 4, losses: 1, winPercentage: 80 },
        doublesRecord: { wins: 2, losses: 1, winPercentage: 66.67 },
        setsWon: 14,
        setsLost: 8,
        gamesWon: 95,
        gamesLost: 70,
      },
      ranking: 2,
      points: 740,
      isProvisional: false,
    },
    {
      playerId: 'player-3',
      playerName: 'Charlie Brown',
      stats: {
        totalMatches: 3,
        wins: 2,
        losses: 1,
        winPercentage: 66.67,
        singlesRecord: { wins: 2, losses: 1, winPercentage: 66.67 },
        doublesRecord: { wins: 0, losses: 0, winPercentage: 0 },
        setsWon: 4,
        setsLost: 3,
        gamesWon: 45,
        gamesLost: 38,
      },
      ranking: 3,
      points: 210,
      isProvisional: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching rankings', () => {
      mockGetClubLeaderboard.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<ClubRankings clubId={mockClubId} />);
      
      expect(screen.getByRole('progressbar')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no rankings found', async () => {
      mockGetClubLeaderboard.mockResolvedValue([]);
      
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('No matches played yet')).toBeTruthy();
        expect(screen.getByText('Be the first to record a match!')).toBeTruthy();
      });
    });
  });

  describe('Error State', () => {
    it('shows error message when ranking loading fails', async () => {
      const errorMessage = 'Database error';
      mockGetClubLeaderboard.mockRejectedValue(new Error(errorMessage));
      
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load rankings')).toBeTruthy();
      });
    });
  });

  describe('Rankings Display', () => {
    beforeEach(() => {
      mockGetClubLeaderboard.mockResolvedValue(mockRankings);
    });

    it('displays player rankings with correct information', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeTruthy();
        expect(screen.getByText('Bob Smith')).toBeTruthy();
        expect(screen.getByText('Charlie Brown')).toBeTruthy();
      });
    });

    it('shows correct win-loss records', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('8-2')).toBeTruthy(); // Alice's record
        expect(screen.getByText('6-2')).toBeTruthy(); // Bob's record
        expect(screen.getByText('2-1')).toBeTruthy(); // Charlie's record
      });
    });

    it('displays win percentages correctly', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('80%')).toBeTruthy(); // Alice
        expect(screen.getByText('75%')).toBeTruthy(); // Bob
        expect(screen.getByText('67%')).toBeTruthy(); // Charlie (rounded)
      });
    });

    it('shows trophy icons for top 3 players', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('🏆')).toBeTruthy(); // 1st place
        expect(screen.getByText('🥈')).toBeTruthy(); // 2nd place
        expect(screen.getByText('🥉')).toBeTruthy(); // 3rd place
      });
    });

    it('shows provisional badge for players with <5 matches', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        const provisionalBadges = screen.getAllByText('P');
        expect(provisionalBadges).toHaveLength(1); // Only Charlie should have P badge
      });
    });

    it('does not show provisional badge for established players', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        // Alice and Bob should not have P badges
        expect(screen.getByText('Alice Johnson')).toBeTruthy();
        expect(screen.getByText('Bob Smith')).toBeTruthy();
        
        // Only one P badge should exist (for Charlie)
        const provisionalBadges = screen.getAllByText('P');
        expect(provisionalBadges).toHaveLength(1);
      });
    });
  });

  describe('Compact Mode', () => {
    beforeEach(() => {
      mockGetClubLeaderboard.mockResolvedValue(mockRankings);
    });

    it('shows only top 5 players in compact mode', async () => {
      const manyRankings = Array.from({ length: 10 }, (_, i) => ({
        ...mockRankings[0],
        playerId: `player-${i + 1}`,
        playerName: `Player ${i + 1}`,
        ranking: i + 1,
      }));
      
      mockGetClubLeaderboard.mockResolvedValue(manyRankings);
      
      render(<ClubRankings clubId={mockClubId} compact />);
      
      await waitFor(() => {
        // Should show players 1-5
        expect(screen.getByText('Player 1')).toBeTruthy();
        expect(screen.getByText('Player 5')).toBeTruthy();
        
        // Should not show players 6-10
        expect(screen.queryByText('Player 6')).toBeNull();
      });
    });

    it('shows View All link in compact mode when more than 5 players', async () => {
      const manyRankings = Array.from({ length: 8 }, (_, i) => ({
        ...mockRankings[0],
        playerId: `player-${i + 1}`,
        playerName: `Player ${i + 1}`,
        ranking: i + 1,
      }));
      
      mockGetClubLeaderboard.mockResolvedValue(manyRankings);
      
      render(<ClubRankings clubId={mockClubId} compact />);
      
      await waitFor(() => {
        expect(screen.getByText('View All →')).toBeTruthy();
      });
    });

    it('does not show View All link when 5 or fewer players', async () => {
      render(<ClubRankings clubId={mockClubId} compact />);
      
      await waitFor(() => {
        expect(screen.queryByText('View All →')).toBeNull();
      });
    });
  });

  describe('Full Mode', () => {
    it('shows all players in full mode', async () => {
      const manyRankings = Array.from({ length: 10 }, (_, i) => ({
        ...mockRankings[0],
        playerId: `player-${i + 1}`,
        playerName: `Player ${i + 1}`,
        ranking: i + 1,
      }));
      
      mockGetClubLeaderboard.mockResolvedValue(manyRankings);
      
      render(<ClubRankings clubId={mockClubId} compact={false} />);
      
      await waitFor(() => {
        // Should show all players
        expect(screen.getByText('Player 1')).toBeTruthy();
        expect(screen.getByText('Player 10')).toBeTruthy();
      });
    });

    it('does not show View All link in full mode', async () => {
      const manyRankings = Array.from({ length: 10 }, (_, i) => ({
        ...mockRankings[0],
        playerId: `player-${i + 1}`,
        playerName: `Player ${i + 1}`,
        ranking: i + 1,
      }));
      
      mockGetClubLeaderboard.mockResolvedValue(manyRankings);
      
      render(<ClubRankings clubId={mockClubId} compact={false} />);
      
      await waitFor(() => {
        expect(screen.queryByText('View All →')).toBeNull();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockGetClubLeaderboard.mockResolvedValue(mockRankings);
    });

    it('navigates to full rankings when View All is pressed', async () => {
      const manyRankings = Array.from({ length: 8 }, (_, i) => ({
        ...mockRankings[0],
        playerId: `player-${i + 1}`,
        playerName: `Player ${i + 1}`,
        ranking: i + 1,
      }));
      
      mockGetClubLeaderboard.mockResolvedValue(manyRankings);
      
      render(<ClubRankings clubId={mockClubId} compact />);
      
      await waitFor(() => {
        const viewAllButton = screen.getByText('View All →');
        fireEvent.press(viewAllButton);
        
        expect(mockPush).toHaveBeenCalledWith(`/club/${mockClubId}/rankings`);
      });
    });

    it('navigates to player profile when player row is pressed', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        const playerRow = screen.getByText('Alice Johnson');
        fireEvent.press(playerRow);
        
        expect(mockPush).toHaveBeenCalledWith('/profile/player-1');
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('refreshes rankings when pull to refresh is activated', async () => {
      mockGetClubLeaderboard.mockResolvedValue(mockRankings);
      
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(mockGetClubLeaderboard).toHaveBeenCalledTimes(1);
      });

      // Simulate pull to refresh
      const scrollView = screen.getByTestId('club-rankings-scroll');
      fireEvent(scrollView, 'refresh');
      
      await waitFor(() => {
        expect(mockGetClubLeaderboard).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Ranking Numbers', () => {
    beforeEach(() => {
      mockGetClubLeaderboard.mockResolvedValue(mockRankings);
    });

    it('shows trophy icons instead of numbers for top 3', async () => {
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        // Should show trophy icons, not ranking numbers
        expect(screen.getByText('🏆')).toBeTruthy();
        expect(screen.getByText('🥈')).toBeTruthy();
        expect(screen.getByText('🥉')).toBeTruthy();
        
        // Should not show ranking numbers for top 3
        expect(screen.queryByText('1')).toBeNull();
        expect(screen.queryByText('2')).toBeNull();
        expect(screen.queryByText('3')).toBeNull();
      });
    });

    it('shows ranking numbers for positions 4 and below', async () => {
      const manyRankings = Array.from({ length: 6 }, (_, i) => ({
        ...mockRankings[0],
        playerId: `player-${i + 1}`,
        playerName: `Player ${i + 1}`,
        ranking: i + 1,
        isProvisional: i >= 3, // Make players 4-6 provisional
      }));
      
      mockGetClubLeaderboard.mockResolvedValue(manyRankings);
      
      render(<ClubRankings clubId={mockClubId} />);
      
      await waitFor(() => {
        // Should show numbers for positions 4-6
        expect(screen.getByText('4')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
        expect(screen.getByText('6')).toBeTruthy();
      });
    });
  });
});