import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PlayerCard } from '../../../components/PlayerCard';

const mockPlayer = {
  id: 'player-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  stats: {
    wins: 15,
    losses: 8,
    winRate: 0.652,
    eloRating: 1250,
    rankingScore: 65.2,
  },
  lastActiveAt: '2024-01-15T10:30:00Z',
  isLookingToPlay: true,
  availability: 'Available today',
};

describe('PlayerCard', () => {
  it('renders player information correctly', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('15 wins, 8 losses')).toBeTruthy();
    expect(screen.getByText('65.2% win rate')).toBeTruthy();
    expect(screen.getByText('ELO: 1250')).toBeTruthy();
  });

  it('shows looking to play indicator when player is available', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('🎾 Looking to play')).toBeTruthy();
    expect(screen.getByText('Available today')).toBeTruthy();
  });

  it('hides looking to play indicator when player is not available', () => {
    const unavailablePlayer = { ...mockPlayer, isLookingToPlay: false };
    
    render(<PlayerCard player={unavailablePlayer} />);
    
    expect(screen.queryByText('🎾 Looking to play')).toBeFalsy();
    expect(screen.queryByText('Available today')).toBeFalsy();
  });

  it('handles missing stats gracefully', () => {
    const playerWithoutStats = {
      ...mockPlayer,
      stats: undefined,
    };
    
    render(<PlayerCard player={playerWithoutStats} />);
    
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('No matches played yet')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const mockOnPress = jest.fn();
    
    render(<PlayerCard player={mockPlayer} onPress={mockOnPress} />);
    
    fireEvent.press(screen.getByTestId('player-card'));
    
    expect(mockOnPress).toHaveBeenCalledWith(mockPlayer);
  });

  it('calls onChallengePress when challenge button is pressed', () => {
    const mockOnChallengePress = jest.fn();
    
    render(<PlayerCard player={mockPlayer} onChallengePress={mockOnChallengePress} />);
    
    fireEvent.press(screen.getByText('Challenge'));
    
    expect(mockOnChallengePress).toHaveBeenCalledWith(mockPlayer);
  });

  it('shows last active time', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    expect(screen.getByText(/Last active:/)).toBeTruthy();
  });

  it('handles very recent activity', () => {
    const recentPlayer = {
      ...mockPlayer,
      lastActiveAt: new Date().toISOString(),
    };
    
    render(<PlayerCard player={recentPlayer} />);
    
    expect(screen.getByText(/Active now/)).toBeTruthy();
  });

  it('formats win rate correctly', () => {
    const playerWithDifferentStats = {
      ...mockPlayer,
      stats: {
        wins: 10,
        losses: 5,
        winRate: 0.667,
        eloRating: 1300,
        rankingScore: 66.7,
      },
    };
    
    render(<PlayerCard player={playerWithDifferentStats} />);
    
    expect(screen.getByText('66.7% win rate')).toBeTruthy();
  });

  it('shows ELO rating with proper formatting', () => {
    const highRatedPlayer = {
      ...mockPlayer,
      stats: {
        ...mockPlayer.stats,
        eloRating: 1850,
      },
    };
    
    render(<PlayerCard player={highRatedPlayer} />);
    
    expect(screen.getByText('ELO: 1850')).toBeTruthy();
  });

  it('applies correct styling for different ELO ratings', () => {
    const beginnerPlayer = {
      ...mockPlayer,
      stats: {
        ...mockPlayer.stats,
        eloRating: 800,
      },
    };
    
    const { getByTestId } = render(<PlayerCard player={beginnerPlayer} />);
    
    const eloText = getByTestId('elo-rating');
    expect(eloText.props.style).toContain({ color: '#666' }); // Beginner color
  });

  it('shows compact layout when compact prop is true', () => {
    render(<PlayerCard player={mockPlayer} compact />);
    
    // In compact mode, some details might be hidden
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.queryByText('Available today')).toBeFalsy();
  });

  it('shows contact sharing indicators when enabled', () => {
    render(<PlayerCard player={mockPlayer} showContactSharing />);
    
    expect(screen.getByText('Share Contact')).toBeTruthy();
  });

  it('handles long names gracefully', () => {
    const playerWithLongName = {
      ...mockPlayer,
      name: 'This Is A Very Long Player Name That Should Be Truncated',
    };
    
    const { getByTestId } = render(<PlayerCard player={playerWithLongName} />);
    
    const nameText = getByTestId('player-name');
    expect(nameText.props.numberOfLines).toBe(1);
  });

  it('shows player ranking when available', () => {
    const rankedPlayer = {
      ...mockPlayer,
      clubRanking: 3,
    };
    
    render(<PlayerCard player={rankedPlayer} />);
    
    expect(screen.getByText('#3')).toBeTruthy();
  });

  it('handles missing phone number', () => {
    const playerWithoutPhone = {
      ...mockPlayer,
      phone: null,
    };
    
    render(<PlayerCard player={playerWithoutPhone} />);
    
    expect(screen.getByText('John Doe')).toBeTruthy();
    // Should still render without errors
  });

  it('shows disabled state when player is not selectable', () => {
    render(<PlayerCard player={mockPlayer} disabled />);
    
    const card = screen.getByTestId('player-card');
    expect(card.props.style).toContain({ opacity: 0.5 });
  });

  it('applies custom styling when provided', () => {
    const customStyle = { backgroundColor: '#f0f0f0' };
    
    const { getByTestId } = render(
      <PlayerCard player={mockPlayer} style={customStyle} />
    );
    
    const card = getByTestId('player-card');
    expect(card.props.style).toContainEqual(customStyle);
  });

  it('shows match count when available', () => {
    const playerWithMatches = {
      ...mockPlayer,
      stats: {
        ...mockPlayer.stats,
        totalMatches: 23,
      },
    };
    
    render(<PlayerCard player={playerWithMatches} />);
    
    expect(screen.getByText('23 matches played')).toBeTruthy();
  });

  it('handles zero wins and losses', () => {
    const newPlayer = {
      ...mockPlayer,
      stats: {
        wins: 0,
        losses: 0,
        winRate: 0,
        eloRating: 1000,
        rankingScore: 0,
      },
    };
    
    render(<PlayerCard player={newPlayer} />);
    
    expect(screen.getByText('No matches played yet')).toBeTruthy();
  });

  it('shows loading state when data is being fetched', () => {
    render(<PlayerCard player={mockPlayer} loading />);
    
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('handles accessibility correctly', () => {
    const { getByTestId } = render(<PlayerCard player={mockPlayer} />);
    
    const card = getByTestId('player-card');
    expect(card.props.accessible).toBe(true);
    expect(card.props.accessibilityLabel).toContain('John Doe');
    expect(card.props.accessibilityRole).toBe('button');
  });

  it('shows recent match indicator when player played recently', () => {
    const recentMatchPlayer = {
      ...mockPlayer,
      lastMatchAt: new Date().toISOString(),
    };
    
    render(<PlayerCard player={recentMatchPlayer} />);
    
    expect(screen.getByText('🔥 Active player')).toBeTruthy();
  });
});