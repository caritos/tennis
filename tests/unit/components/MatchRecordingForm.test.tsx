import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MatchRecordingForm } from '../../../components/MatchRecordingForm';
import { recordMatch } from '../../../services/matchService';

// Mock dependencies
jest.mock('../../../services/matchService');
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
    })),
  },
}));

const mockRecordMatch = recordMatch as jest.MockedFunction<typeof recordMatch>;

describe('MatchRecordingForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  
  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    clubId: 'test-club-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render basic match recording form', () => {
      const { getByText, getByTestId } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Should render form title
      expect(getByText('Record Match')).toBeTruthy();
      
      // Should render match type selection
      expect(getByText('Match Type')).toBeTruthy();
      expect(getByTestId('singles-radio')).toBeTruthy();
      expect(getByTestId('doubles-radio')).toBeTruthy();
      
      // Should render opponent selection
      expect(getByText('Opponent')).toBeTruthy();
      expect(getByTestId('opponent-selector')).toBeTruthy();
      
      // Should render date picker
      expect(getByText('Match Date')).toBeTruthy();
      expect(getByTestId('date-picker')).toBeTruthy();
      
      // Should render action buttons
      expect(getByTestId('save-match-button')).toBeTruthy();
      expect(getByTestId('cancel-button')).toBeTruthy();
    });

    it('should render score input section', () => {
      const { getByText, getByTestId } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Should render score section
      expect(getByText('Match Score')).toBeTruthy();
      expect(getByTestId('add-set-button')).toBeTruthy();
    });

    it('should start with Singles selected by default', () => {
      const { getByTestId } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      const singlesRadio = getByTestId('singles-radio');
      const doublesRadio = getByTestId('doubles-radio');
      
      expect(singlesRadio.props.accessibilityState?.checked).toBe(true);
      expect(doublesRadio.props.accessibilityState?.checked).toBe(false);
    });
  });

  describe('Match Type Selection', () => {
    it('should switch to doubles when doubles radio is selected', () => {
      const { getByTestId } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      const doublesRadio = getByTestId('doubles-radio');
      fireEvent.press(doublesRadio);

      expect(doublesRadio.props.accessibilityState?.checked).toBe(true);
      expect(getByTestId('singles-radio').props.accessibilityState?.checked).toBe(false);
    });
  });

  describe('Score Input', () => {
    it('should allow adding a set', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      const addSetButton = getByTestId('add-set-button');
      fireEvent.press(addSetButton);

      // Should show set 1 inputs
      expect(getByText('Set 1')).toBeTruthy();
      expect(getByTestId('set-1-player-score')).toBeTruthy();
      expect(getByTestId('set-1-opponent-score')).toBeTruthy();
    });

    it('should validate tennis scores', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Add a set
      fireEvent.press(getByTestId('add-set-button'));

      // Enter invalid score (both players can't win 7-6)
      const playerScore = getByTestId('set-1-player-score');
      const opponentScore = getByTestId('set-1-opponent-score');
      
      fireEvent.changeText(playerScore, '8');
      fireEvent.changeText(opponentScore, '6');

      // Should show validation error
      expect(getByText('Invalid tennis score')).toBeTruthy();
    });

    it('should show tiebreak input for 7-6 sets', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Add a set
      fireEvent.press(getByTestId('add-set-button'));

      // Enter 7-6 score
      const playerScore = getByTestId('set-1-player-score');
      const opponentScore = getByTestId('set-1-opponent-score');
      
      fireEvent.changeText(playerScore, '7');
      fireEvent.changeText(opponentScore, '6');

      // Should show tiebreak inputs
      expect(getByText('Tiebreak')).toBeTruthy();
      expect(getByTestId('set-1-tiebreak-player')).toBeTruthy();
      expect(getByTestId('set-1-tiebreak-opponent')).toBeTruthy();
    });

    it('should validate tiebreak scores', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Add a set and enter 7-6
      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-1-player-score'), '7');
      fireEvent.changeText(getByTestId('set-1-opponent-score'), '6');

      // Enter invalid tiebreak (must win by 2, minimum 7)
      fireEvent.changeText(getByTestId('set-1-tiebreak-player'), '6');
      fireEvent.changeText(getByTestId('set-1-tiebreak-opponent'), '4');

      // Should show validation error
      expect(getByText('Invalid tiebreak score')).toBeTruthy();
    });
  });

  describe('Player Selection', () => {
    it('should show player selection dropdown when opponent selector is pressed', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      const opponentSelector = getByTestId('opponent-selector');
      fireEvent.press(opponentSelector);

      // Should show dropdown with mock players
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Jane Smith')).toBeTruthy();
      expect(getByText('Add Unregistered Opponent')).toBeTruthy();
    });

    it('should select a player from dropdown', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      const opponentSelector = getByTestId('opponent-selector');
      fireEvent.press(opponentSelector);

      // Select a player
      const player = getByText('John Doe');
      fireEvent.press(player);

      // Should update the selector text
      expect(getByText('John Doe')).toBeTruthy();
    });

    it('should show unregistered opponent form when selected', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      const opponentSelector = getByTestId('opponent-selector');
      fireEvent.press(opponentSelector);

      // Select unregistered opponent option
      const unregisteredOption = getByText('Add Unregistered Opponent');
      fireEvent.press(unregisteredOption);

      // Should show name input field
      expect(getByTestId('unregistered-opponent-name')).toBeTruthy();
      expect(getByText('Opponent Name')).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with correct match data', async () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Add opponent
      const opponentSelector = getByTestId('opponent-selector');
      fireEvent.press(opponentSelector);
      
      // Select a player from dropdown
      const player = getByText('John Doe');
      fireEvent.press(player);
      
      // Add a set score
      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-1-player-score'), '6');
      fireEvent.changeText(getByTestId('set-1-opponent-score'), '4');

      // Add another set to complete match
      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-2-player-score'), '6');
      fireEvent.changeText(getByTestId('set-2-opponent-score'), '3');

      // Submit form
      fireEvent.press(getByTestId('save-match-button'));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            match_type: 'singles',
            scores: '6-4,6-3',
            club_id: 'test-club-123',
          })
        );
      });
    });

    it('should call onCancel when cancel button is pressed', () => {
      const { getByTestId } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      fireEvent.press(getByTestId('cancel-button'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation', () => {
    it('should require opponent selection', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Try to submit without opponent
      fireEvent.press(getByTestId('save-match-button'));

      expect(getByText('Please select an opponent')).toBeTruthy();
    });

    it('should require at least one complete set', () => {
      const { getByTestId, getByText } = render(
        <MatchRecordingForm {...defaultProps} />
      );

      // Select opponent but no scores
      const opponentSelector = getByTestId('opponent-selector');
      fireEvent.press(opponentSelector);

      // Try to submit
      fireEvent.press(getByTestId('save-match-button'));

      expect(getByText('Please add at least one set score')).toBeTruthy();
    });
  });

  describe('Service Integration', () => {
    it('should call recordMatch service when form is submitted with valid data', async () => {
      mockRecordMatch.mockResolvedValueOnce({
        id: 'match-123',
        club_id: 'test-club-123',
        player1_id: 'current-user-id',
        player2_id: 'player-1',
        scores: '6-4,6-3',
        match_type: 'singles',
        date: '2025-07-26',
        created_at: '2025-07-26T10:00:00Z'
      } as any);

      const integrationOnSave = async (matchData: any) => {
        const savedMatch = await recordMatch(matchData);
        mockOnSave(savedMatch);
      };

      const { getByTestId, getByText } = render(
        <MatchRecordingForm 
          onSave={integrationOnSave}
          onCancel={mockOnCancel}
          clubId="test-club-123"
        />
      );

      // Fill out complete form
      const opponentSelector = getByTestId('opponent-selector');
      fireEvent.press(opponentSelector);
      fireEvent.press(getByText('John Doe'));

      // Add sets
      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-1-player-score'), '6');
      fireEvent.changeText(getByTestId('set-1-opponent-score'), '4');

      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-2-player-score'), '6');
      fireEvent.changeText(getByTestId('set-2-opponent-score'), '3');

      // Submit
      fireEvent.press(getByTestId('save-match-button'));

      await waitFor(() => {
        expect(mockRecordMatch).toHaveBeenCalledWith({
          club_id: 'test-club-123',
          player1_id: 'current-user-id',
          player2_id: 'player-1',
          opponent2_name: null,
          scores: '6-4,6-3',
          match_type: 'singles',
          date: expect.any(String),
        });
        expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
          id: 'match-123',
          scores: '6-4,6-3'
        }));
      });
    });

    it('should handle match recording with tiebreak scores', async () => {
      mockRecordMatch.mockResolvedValueOnce({
        id: 'match-456',
        scores: '7-6(7-3),6-4',
      } as any);

      const integrationOnSave = async (matchData: any) => {
        const savedMatch = await recordMatch(matchData);
        mockOnSave(savedMatch);
      };

      const { getByTestId, getByText } = render(
        <MatchRecordingForm 
          onSave={integrationOnSave}
          onCancel={mockOnCancel}
          clubId="test-club-123"
        />
      );

      // Select opponent
      fireEvent.press(getByTestId('opponent-selector'));
      fireEvent.press(getByText('Jane Smith'));

      // Add tiebreak set
      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-1-player-score'), '7');
      fireEvent.changeText(getByTestId('set-1-opponent-score'), '6');
      fireEvent.changeText(getByTestId('set-1-tiebreak-player'), '7');
      fireEvent.changeText(getByTestId('set-1-tiebreak-opponent'), '3');

      // Add regular set
      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-2-player-score'), '6');
      fireEvent.changeText(getByTestId('set-2-opponent-score'), '4');

      // Submit
      fireEvent.press(getByTestId('save-match-button'));

      await waitFor(() => {
        expect(mockRecordMatch).toHaveBeenCalledWith(
          expect.objectContaining({
            scores: '7-6(7-3),6-4'
          })
        );
      });
    });

    it('should handle unregistered opponent match recording', async () => {
      mockRecordMatch.mockResolvedValueOnce({
        id: 'match-789',
        opponent2_name: 'New Player',
      } as any);

      const integrationOnSave = async (matchData: any) => {
        const savedMatch = await recordMatch(matchData);
        mockOnSave(savedMatch);
      };

      const { getByTestId, getByText } = render(
        <MatchRecordingForm 
          onSave={integrationOnSave}
          onCancel={mockOnCancel}
          clubId="test-club-123"
        />
      );

      // Select unregistered opponent
      fireEvent.press(getByTestId('opponent-selector'));
      fireEvent.press(getByText('Add Unregistered Opponent'));
      fireEvent.changeText(getByTestId('unregistered-opponent-name'), 'New Player');

      // Add set
      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-1-player-score'), '6');
      fireEvent.changeText(getByTestId('set-1-opponent-score'), '4');

      fireEvent.press(getByTestId('add-set-button'));
      fireEvent.changeText(getByTestId('set-2-player-score'), '6');
      fireEvent.changeText(getByTestId('set-2-opponent-score'), '2');

      // Submit
      fireEvent.press(getByTestId('save-match-button'));

      await waitFor(() => {
        expect(mockRecordMatch).toHaveBeenCalledWith(
          expect.objectContaining({
            player2_id: null,
            opponent2_name: 'New Player',
            scores: '6-4,6-2'
          })
        );
      });
    });
  });
});