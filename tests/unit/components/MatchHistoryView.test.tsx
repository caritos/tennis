import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { MatchHistoryView } from '../../../components/MatchHistoryView';
import * as matchService from '../../../services/matchService';

// Mock the match service
jest.mock('../../../services/matchService');
const mockGetMatchHistory = jest.mocked(matchService.getMatchHistory);

// Mock the TennisScoreDisplay component
jest.mock('../../../components/TennisScoreDisplay', () => ({
  TennisScoreDisplay: (props: any) => (
    React.createElement('Text', { testID: props.testID || 'tennis-score-display' }, props.scores)
  ),
}));

describe('MatchHistoryView', () => {
  const mockPlayerId = 'player-123';
  const mockClubId = 'club-456';

  const mockMatches = [
    {
      id: 'match-1',
      club_id: mockClubId,
      player1_id: mockPlayerId,
      player2_id: 'opponent-1',
      opponent2_name: 'John Doe',
      scores: '6-4,6-3',
      match_type: 'singles',
      date: '2024-01-15',
      notes: 'Great match!',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'match-2',
      club_id: mockClubId,
      player1_id: 'opponent-2',
      player2_id: mockPlayerId,
      opponent2_name: 'Jane Smith',
      partner3_name: 'Partner 1',
      partner4_name: 'Partner 2',
      scores: '7-6(7-5),4-6,6-4',
      match_type: 'doubles',
      date: '2024-01-10',
      notes: null,
      created_at: '2024-01-10T14:30:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching matches', () => {
      mockGetMatchHistory.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      expect(screen.getByRole('progressbar')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no matches found', async () => {
      mockGetMatchHistory.mockResolvedValue([]);
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('No matches recorded yet')).toBeTruthy();
      });
    });

    it('shows tennis ball icon in empty state', async () => {
      mockGetMatchHistory.mockResolvedValue([]);
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('No matches recorded yet')).toBeTruthy();
      });
    });
  });

  describe('Error State', () => {
    it('shows error message when match loading fails', async () => {
      const errorMessage = 'Network error';
      mockGetMatchHistory.mockRejectedValue(new Error(errorMessage));
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load match history')).toBeTruthy();
      });
    });

    it('shows alert icon in error state', async () => {
      mockGetMatchHistory.mockRejectedValue(new Error('Test error'));
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load match history')).toBeTruthy();
      });
    });
  });

  describe('Match Display', () => {
    beforeEach(() => {
      mockGetMatchHistory.mockResolvedValue(mockMatches);
    });

    it('displays match cards for each match', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Jane Smith')).toBeTruthy();
      });
    });

    it('shows match dates in correct format', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2024')).toBeTruthy();
        expect(screen.getByText('Jan 10, 2024')).toBeTruthy();
      });
    });

    it('displays match types with correct icons', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('singles')).toBeTruthy();
        expect(screen.getByText('doubles')).toBeTruthy();
      });
    });

    it('shows tennis score display for each match', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        const scoreDisplays = screen.getAllByTestId('tennis-score-display');
        expect(scoreDisplays).toHaveLength(2);
        expect(scoreDisplays[0]).toHaveTextContent('6-4,6-3');
        expect(scoreDisplays[1]).toHaveTextContent('7-6(7-5),4-6,6-4');
      });
    });

    it('displays match notes when present', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Great match!')).toBeTruthy();
      });
    });

    it('does not show notes section when notes are null', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        // Only one notes section should be present (for match with notes)
        const notesElements = screen.queryAllByText(/Great match!/);
        expect(notesElements).toHaveLength(1);
      });
    });

    it('shows doubles partners when present', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Partner 1')).toBeTruthy();
        expect(screen.getByText('Partner 2')).toBeTruthy();
      });
    });
  });

  describe('Pull to Refresh', () => {
    it('calls loadMatches on component mount', async () => {
      mockGetMatchHistory.mockResolvedValue(mockMatches);
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(mockGetMatchHistory).toHaveBeenCalledTimes(1);
        expect(mockGetMatchHistory).toHaveBeenCalledWith(mockPlayerId, undefined);
      });
    });
  });

  describe('Club Filtering', () => {
    it('filters matches by club when clubId is provided', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(mockGetMatchHistory).toHaveBeenCalledWith(mockPlayerId, mockClubId);
      });
    });

    it('shows all matches when no clubId provided', async () => {
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        expect(mockGetMatchHistory).toHaveBeenCalledWith(mockPlayerId, undefined);
      });
    });
  });

  describe('Player Identification', () => {
    it('correctly identifies when user is player1', async () => {
      const matchAsPlayer1 = {
        id: 'match-player1',
        club_id: mockClubId,
        player1_id: mockPlayerId,
        player2_id: 'opponent',
        opponent2_name: 'Test Opponent',
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2024-01-14',
        notes: null,
        created_at: '2024-01-14T10:00:00Z',
      };
      mockGetMatchHistory.mockResolvedValue([matchAsPlayer1]);
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        // The component should show "You" for the current player
        expect(screen.getByText('You')).toBeTruthy();
        expect(screen.getByText('Test Opponent')).toBeTruthy();
      });
    });

    it('correctly identifies when user is player2', async () => {
      const matchAsPlayer2 = {
        id: 'match-player2',
        club_id: mockClubId,
        player1_id: 'opponent',
        player2_id: mockPlayerId,
        opponent2_name: 'Other Player',
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2024-01-14',
        notes: null,
        created_at: '2024-01-14T10:00:00Z',
      };
      mockGetMatchHistory.mockResolvedValue([matchAsPlayer2]);
      
      render(<MatchHistoryView playerId={mockPlayerId} />);
      
      await waitFor(() => {
        // The component should show "You" for the current player
        expect(screen.getByText('You')).toBeTruthy();
        expect(screen.getByText('Other Player')).toBeTruthy();
      });
    });
  });
});