import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ChallengeFlowModal } from '../../../components/ChallengeFlowModal';
import { AuthContext } from '../../../contexts/AuthContext';
import { challengeService } from '../../../services/challengeService';

jest.mock('../../../services/challengeService', () => ({
  challengeService: {
    createChallenge: jest.fn(),
    getUserChallenges: jest.fn(),
  },
}));

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+1234567890',
};

const mockClub = {
  id: 'test-club-id',
  name: 'Test Tennis Club',
  description: 'Test club description',
};

const mockPlayers = [
  { id: 'player1', name: 'John Doe', email: 'john@example.com', phone: '+1111111111' },
  { id: 'player2', name: 'Jane Smith', email: 'jane@example.com', phone: '+2222222222' },
];

const renderWithAuth = (component: React.ReactElement) => {
  const authValue = {
    user: mockUser,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resendConfirmation: jest.fn(),
    resetPassword: jest.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      {component}
    </AuthContext.Provider>
  );
};

describe('ChallengeFlowModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    club: mockClub,
    players: mockPlayers,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when visible', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    expect(screen.getByText('Challenge Players')).toBeTruthy();
    expect(screen.getByText('Send a challenge to play tennis')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} visible={false} />);
    
    expect(screen.queryByText('Challenge Players')).toBeFalsy();
  });

  it('allows selecting match type', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    const singlesButton = screen.getByText('Singles');
    const doublesButton = screen.getByText('Doubles');
    
    expect(singlesButton).toBeTruthy();
    expect(doublesButton).toBeTruthy();
    
    fireEvent.press(doublesButton);
    // Verify doubles is selected (you might need to check styling or other indicators)
  });

  it('allows selecting players for singles match', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Select singles match type first
    fireEvent.press(screen.getByText('Singles'));
    
    // Should show player selection for opponent
    expect(screen.getByText('Select Opponent')).toBeTruthy();
    
    // Select a player
    fireEvent.press(screen.getByText('John Doe'));
    
    // Verify player is selected
    expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
  });

  it('allows selecting multiple players for doubles match', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Select doubles match type
    fireEvent.press(screen.getByText('Doubles'));
    
    // Should show player selection for partner and opponents
    expect(screen.getByText('Select Partner')).toBeTruthy();
    expect(screen.getByText('Select Opponents')).toBeTruthy();
  });

  it('allows entering custom message', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    const messageInput = screen.getByPlaceholderText('Add a message (optional)');
    
    fireEvent.changeText(messageInput, 'Let\'s play some tennis!');
    
    expect(screen.getByDisplayValue('Let\'s play some tennis!')).toBeTruthy();
  });

  it('allows selecting timing options', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    expect(screen.getByText('When would you like to play?')).toBeTruthy();
    
    // Should have timing options
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Tomorrow')).toBeTruthy();
    expect(screen.getByText('This Week')).toBeTruthy();
    expect(screen.getByText('Flexible')).toBeTruthy();
  });

  it('sends challenge when form is submitted', async () => {
    const mockCreateChallenge = challengeService.createChallenge as jest.Mock;
    mockCreateChallenge.mockResolvedValue({ id: 'new-challenge-id' });

    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Fill out the form
    fireEvent.press(screen.getByText('Singles'));
    fireEvent.press(screen.getByText('John Doe'));
    fireEvent.press(screen.getByText('Today'));
    
    // Submit the challenge
    fireEvent.press(screen.getByText('Send Challenge'));
    
    await waitFor(() => {
      expect(mockCreateChallenge).toHaveBeenCalledWith({
        clubId: mockClub.id,
        challengerId: mockUser.id,
        matchType: 'singles',
        opponent: mockPlayers[0],
        message: '',
        timing: 'today',
      });
    });
  });

  it('handles challenge creation error', async () => {
    const mockCreateChallenge = challengeService.createChallenge as jest.Mock;
    mockCreateChallenge.mockRejectedValue(new Error('Failed to create challenge'));

    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Fill out form and submit
    fireEvent.press(screen.getByText('Singles'));
    fireEvent.press(screen.getByText('John Doe'));
    fireEvent.press(screen.getByText('Send Challenge'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to send challenge')).toBeTruthy();
    });
  });

  it('closes modal when close button is pressed', () => {
    const mockOnClose = jest.fn();
    
    renderWithAuth(<ChallengeFlowModal {...defaultProps} onClose={mockOnClose} />);
    
    fireEvent.press(screen.getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates required fields before submission', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Try to submit without selecting opponent
    fireEvent.press(screen.getByText('Singles'));
    fireEvent.press(screen.getByText('Send Challenge'));
    
    expect(screen.getByText('Please select an opponent')).toBeTruthy();
  });

  it('disables send button when form is invalid', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    const sendButton = screen.getByText('Send Challenge');
    
    // Button should be disabled initially
    expect(sendButton.props.disabled).toBe(true);
    
    // Fill out required fields
    fireEvent.press(screen.getByText('Singles'));
    fireEvent.press(screen.getByText('John Doe'));
    
    // Button should now be enabled
    expect(sendButton.props.disabled).toBe(false);
  });

  it('shows loading state during challenge creation', async () => {
    const mockCreateChallenge = challengeService.createChallenge as jest.Mock;
    mockCreateChallenge.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Fill out and submit form
    fireEvent.press(screen.getByText('Singles'));
    fireEvent.press(screen.getByText('John Doe'));
    fireEvent.press(screen.getByText('Send Challenge'));
    
    expect(screen.getByText('Sending...')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.queryByText('Sending...')).toBeFalsy();
    });
  });

  it('handles doubles match player selection correctly', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    fireEvent.press(screen.getByText('Doubles'));
    
    // Should require partner and two opponents for doubles
    expect(screen.getByText('Select Partner')).toBeTruthy();
    expect(screen.getByText('Select Opponents (2)')).toBeTruthy();
    
    // Select partner
    const partnerDropdown = screen.getByTestId('partner-select');
    fireEvent.press(partnerDropdown);
    fireEvent.press(screen.getByText('John Doe'));
    
    // Select opponents
    const opponentsDropdown = screen.getByTestId('opponents-select');
    fireEvent.press(opponentsDropdown);
    fireEvent.press(screen.getByText('Jane Smith'));
  });

  it('prevents selecting the same player in multiple positions', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    fireEvent.press(screen.getByText('Doubles'));
    
    // Select John as partner
    const partnerDropdown = screen.getByTestId('partner-select');
    fireEvent.press(partnerDropdown);
    fireEvent.press(screen.getByText('John Doe'));
    
    // John should not be available in opponents list
    const opponentsDropdown = screen.getByTestId('opponents-select');
    fireEvent.press(opponentsDropdown);
    
    expect(screen.queryByText('John Doe')).toBeFalsy();
  });

  it('resets form when match type changes', () => {
    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Select singles and pick opponent
    fireEvent.press(screen.getByText('Singles'));
    fireEvent.press(screen.getByText('John Doe'));
    
    // Switch to doubles
    fireEvent.press(screen.getByText('Doubles'));
    
    // Previous selections should be cleared
    expect(screen.queryByDisplayValue('John Doe')).toBeFalsy();
  });

  it('formats challenge data correctly for API call', async () => {
    const mockCreateChallenge = challengeService.createChallenge as jest.Mock;
    mockCreateChallenge.mockResolvedValue({ id: 'challenge-id' });

    renderWithAuth(<ChallengeFlowModal {...defaultProps} />);
    
    // Create a doubles challenge
    fireEvent.press(screen.getByText('Doubles'));
    
    // Select players and options
    fireEvent.changeText(screen.getByPlaceholderText('Add a message (optional)'), 'Great game awaits!');
    fireEvent.press(screen.getByText('This Week'));
    
    // Submit
    fireEvent.press(screen.getByText('Send Challenge'));
    
    await waitFor(() => {
      expect(mockCreateChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          clubId: mockClub.id,
          challengerId: mockUser.id,
          matchType: 'doubles',
          message: 'Great game awaits!',
          timing: 'this-week',
        })
      );
    });
  });
});