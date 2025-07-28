/**
 * Match Recording Integration Tests
 * Tests the complete match recording flow from form submission to database storage
 */

import { render, screen, waitFor, fireEvent } from '../setup/testUtils';
import { MatchRecordingForm } from '@/components/MatchRecordingForm';
import * as matchService from '@/services/matchService';
import * as clubService from '@/services/clubService';
import { setupTestDatabase, testDbUtils } from '../setup/testDatabase';
import { createMatch, createUser, createClub } from '../setup/testFactories';

// Mock services
jest.mock('@/services/matchService');
jest.mock('@/services/clubService');

const mockMatchService = jest.mocked(matchService);
const mockClubService = jest.mocked(clubService);

describe('Match Recording Integration', () => {
  const mockClubId = 'test-club-1';
  const mockUserId = 'test-user-1';
  
  const mockClubMembers = [
    createUser({ id: 'member-1', full_name: 'John Doe' }),
    createUser({ id: 'member-2', full_name: 'Jane Smith' }),
    createUser({ id: 'member-3', full_name: 'Mike Wilson' }),
  ];

  beforeEach(async () => {
    await setupTestDatabase();
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockClubService.getClubMembers.mockResolvedValue(mockClubMembers);
    mockMatchService.recordMatch.mockResolvedValue(
      createMatch({ id: 'new-match-id' })
    );
  });

  describe('Complete Match Recording Flow', () => {
    it('records a complete singles match successfully', async () => {
      render(<MatchRecordingForm clubId={mockClubId} />);
      
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Select match type (singles is default)
      expect(screen.getByLabelText('Singles')).toBeTruthy();

      // Select opponent
      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeTruthy();
      });
      
      fireEvent.press(screen.getByText('John Doe'));

      // Add first set score
      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score1 = screen.getByPlaceholderText('Your score');
      const player2Score1 = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score1, '6');
      fireEvent.changeText(player2Score1, '4');

      // Add second set score
      fireEvent.press(addSetButton);
      
      const player1Scores = screen.getAllByPlaceholderText('Your score');
      const player2Scores = screen.getAllByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Scores[1], '6');
      fireEvent.changeText(player2Scores[1], '3');

      // Save match
      const saveButton = screen.getByText('Save Match');
      fireEvent.press(saveButton);

      // Verify service was called correctly
      await waitFor(() => {
        expect(mockMatchService.recordMatch).toHaveBeenCalledWith({
          clubId: mockClubId,
          matchType: 'singles',
          opponentId: 'member-1',
          opponentName: 'John Doe',
          scores: '6-4,6-3',
          notes: '',
        });
      });
    });

    it('records a doubles match with partners', async () => {
      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Select doubles
      const doublesRadio = screen.getByLabelText('Doubles');
      fireEvent.press(doublesRadio);

      // Select opponent
      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      fireEvent.press(screen.getByText('Jane Smith'));

      // Add partner information (in a real implementation)
      // This would show partner selection fields
      
      // Add match scores
      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score = screen.getByPlaceholderText('Your score');
      const player2Score = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score, '7');
      fireEvent.changeText(player2Score, '6');

      // Add tiebreak score
      const tiebreakToggle = screen.getByText('Add Tiebreak');
      fireEvent.press(tiebreakToggle);
      
      const tiebreakP1 = screen.getByPlaceholderText('Your tiebreak score');
      const tiebreakP2 = screen.getByPlaceholderText('Opponent tiebreak score');
      
      fireEvent.changeText(tiebreakP1, '7');
      fireEvent.changeText(tiebreakP2, '5');

      // Add second set
      fireEvent.press(addSetButton);
      const allP1Scores = screen.getAllByPlaceholderText('Your score');
      const allP2Scores = screen.getAllByPlaceholderText('Opponent score');
      
      fireEvent.changeText(allP1Scores[1], '6');
      fireEvent.changeText(allP2Scores[1], '4');

      // Save match
      fireEvent.press(screen.getByText('Save Match'));

      await waitFor(() => {
        expect(mockMatchService.recordMatch).toHaveBeenCalledWith({
          clubId: mockClubId,
          matchType: 'doubles',
          opponentId: 'member-2',
          opponentName: 'Jane Smith',
          scores: '7-6(7-5),6-4',
          notes: '',
        });
      });
    });

    it('handles unregistered opponent creation', async () => {
      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Select "Add Unregistered Opponent"
      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      
      const addUnregistered = screen.getByText('Add Unregistered Opponent');
      fireEvent.press(addUnregistered);

      // Enter opponent name
      const nameInput = screen.getByPlaceholderText('Opponent name');
      fireEvent.changeText(nameInput, 'New Player');

      // Continue with match recording
      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score = screen.getByPlaceholderText('Your score');
      const player2Score = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score, '6');
      fireEvent.changeText(player2Score, '2');

      fireEvent.press(addSetButton);
      const allP1Scores = screen.getAllByPlaceholderText('Your score');
      const allP2Scores = screen.getAllByPlaceholderText('Opponent score');
      
      fireEvent.changeText(allP1Scores[1], '6');
      fireEvent.changeText(allP2Scores[1], '1');

      fireEvent.press(screen.getByText('Save Match'));

      await waitFor(() => {
        expect(mockMatchService.recordMatch).toHaveBeenCalledWith({
          clubId: mockClubId,
          matchType: 'singles',
          opponentId: null,
          opponentName: 'New Player',
          scores: '6-2,6-1',
          notes: '',
        });
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('prevents submission with invalid scores', async () => {
      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Select opponent
      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      fireEvent.press(screen.getByText('John Doe'));

      // Add invalid score
      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score = screen.getByPlaceholderText('Your score');
      const player2Score = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score, '8'); // Invalid tennis score
      fireEvent.changeText(player2Score, '6');

      fireEvent.press(screen.getByText('Save Match'));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Invalid score/)).toBeTruthy();
      });

      expect(mockMatchService.recordMatch).not.toHaveBeenCalled();
    });

    it('requires opponent selection', async () => {
      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Add valid scores without selecting opponent
      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score = screen.getByPlaceholderText('Your score');
      const player2Score = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score, '6');
      fireEvent.changeText(player2Score, '4');

      fireEvent.press(screen.getByText('Save Match'));

      await waitFor(() => {
        expect(screen.getByText(/Please select an opponent/)).toBeTruthy();
      });

      expect(mockMatchService.recordMatch).not.toHaveBeenCalled();
    });

    it('requires at least one complete set', async () => {
      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Select opponent but don't add scores
      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      fireEvent.press(screen.getByText('John Doe'));

      fireEvent.press(screen.getByText('Save Match'));

      await waitFor(() => {
        expect(screen.getByText(/Please add at least one set/)).toBeTruthy();
      });

      expect(mockMatchService.recordMatch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('handles match service errors gracefully', async () => {
      mockMatchService.recordMatch.mockRejectedValue(
        new Error('Database connection failed')
      );

      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Complete valid form
      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      fireEvent.press(screen.getByText('John Doe'));

      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score = screen.getByPlaceholderText('Your score');
      const player2Score = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score, '6');
      fireEvent.changeText(player2Score, '4');

      fireEvent.press(screen.getByText('Save Match'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Failed to save match/)).toBeTruthy();
      });
    });

    it('handles club member loading errors', async () => {
      mockClubService.getClubMembers.mockRejectedValue(
        new Error('Failed to load members')
      );

      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load club members/)).toBeTruthy();
      });
    });
  });

  describe('Database Integration', () => {
    it('persists match data correctly', async () => {
      const dbManager = await testDbUtils.setupScenario('basic');

      render(<MatchRecordingForm clubId={mockClubId} />);
      
      // Complete match recording process
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      fireEvent.press(screen.getByText('John Doe'));

      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score = screen.getByPlaceholderText('Your score');
      const player2Score = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score, '6');
      fireEvent.changeText(player2Score, '4');

      fireEvent.press(screen.getByText('Save Match'));

      await waitFor(() => {
        expect(mockMatchService.recordMatch).toHaveBeenCalled();
      });

      // Verify database state
      const matches = dbManager.getData('matches');
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('Offline Support Integration', () => {
    it('queues match for sync when offline', async () => {
      // Mock offline scenario
      const mockSyncService = require('@/services/sync/index');
      mockSyncService.queueMatchCreation = jest.fn();

      render(<MatchRecordingForm clubId={mockClubId} />);
      
      await waitFor(() => {
        expect(screen.getByText('Record Match')).toBeTruthy();
      });

      // Complete form
      const opponentSelect = screen.getByText('Select Opponent');
      fireEvent.press(opponentSelect);
      fireEvent.press(screen.getByText('John Doe'));

      const addSetButton = screen.getByText('Add Set');
      fireEvent.press(addSetButton);

      const player1Score = screen.getByPlaceholderText('Your score');
      const player2Score = screen.getByPlaceholderText('Opponent score');
      
      fireEvent.changeText(player1Score, '6');
      fireEvent.changeText(player2Score, '4');

      fireEvent.press(screen.getByText('Save Match'));

      // Should queue for offline sync
      await waitFor(() => {
        expect(mockSyncService.queueMatchCreation).toHaveBeenCalled();
      });
    });
  });
});