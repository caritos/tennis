import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PlayerStatsDisplay } from '@/components/PlayerStatsDisplay';
import { PlayerStats } from '@/services/matchService';

const mockStats: PlayerStats = {
  totalMatches: 15,
  wins: 10,
  losses: 5,
  winPercentage: 66.67,
  singlesRecord: {
    wins: 6,
    losses: 3,
    winPercentage: 66.67,
  },
  doublesRecord: {
    wins: 4,
    losses: 2,
    winPercentage: 66.67,
  },
  setsWon: 22,
  setsLost: 13,
  gamesWon: 156,
  gamesLost: 128,
};

const emptyStats: PlayerStats = {
  totalMatches: 0,
  wins: 0,
  losses: 0,
  winPercentage: 0,
  singlesRecord: { wins: 0, losses: 0, winPercentage: 0 },
  doublesRecord: { wins: 0, losses: 0, winPercentage: 0 },
  setsWon: 0,
  setsLost: 0,
  gamesWon: 0,
  gamesLost: 0,
};

describe('PlayerStatsDisplay', () => {
  it('renders loading state correctly', () => {
    render(<PlayerStatsDisplay stats={emptyStats} loading={true} />);
    
    expect(screen.getByText('Loading stats...')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Failed to load statistics';
    render(<PlayerStatsDisplay stats={emptyStats} error={errorMessage} />);
    
    expect(screen.getByText('Unable to load stats')).toBeTruthy();
    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('renders placeholder when no matches played', () => {
    render(<PlayerStatsDisplay stats={emptyStats} />);
    
    expect(screen.getByText('No matches played yet')).toBeTruthy();
    expect(screen.getByText('Record your first match!')).toBeTruthy();
  });

  it('renders comprehensive statistics correctly', () => {
    render(<PlayerStatsDisplay stats={mockStats} />);
    
    // Check overall stats
    expect(screen.getByText('15')).toBeTruthy(); // Total matches
    expect(screen.getByText('66.67%')).toBeTruthy(); // Win rate
    expect(screen.getByText('10-5')).toBeTruthy(); // W-L record
    
    // Check singles/doubles breakdown
    expect(screen.getByText('6-3')).toBeTruthy(); // Singles record
    expect(screen.getByText('4-2')).toBeTruthy(); // Doubles record
    
    // Check detailed stats
    expect(screen.getByText('22/35')).toBeTruthy(); // Sets won/total
    expect(screen.getByText('156/284')).toBeTruthy(); // Games won/total
  });

  it('calculates and displays percentages correctly', () => {
    render(<PlayerStatsDisplay stats={mockStats} />);
    
    // Sets percentage: 22/(22+13) = 62.86% -> 63%
    expect(screen.getByText('(63%)')).toBeTruthy();
    
    // Games percentage: 156/(156+128) = 54.93% -> 55%
    expect(screen.getByText('(55%)')).toBeTruthy();
  });

  it('handles edge cases with zero denominators', () => {
    const edgeStats: PlayerStats = {
      ...mockStats,
      setsWon: 0,
      setsLost: 0,
      gamesWon: 0,
      gamesLost: 0,
    };
    
    render(<PlayerStatsDisplay stats={edgeStats} />);
    
    expect(screen.getAllByText('0/0')).toHaveLength(2); // Both sets and games show 0/0
  });

  it('displays match type breakdown with correct records', () => {
    render(<PlayerStatsDisplay stats={mockStats} />);
    
    expect(screen.getByText('Singles')).toBeTruthy();
    expect(screen.getByText('Doubles')).toBeTruthy();
    expect(screen.getByText('6-3')).toBeTruthy(); // Singles record
    expect(screen.getByText('4-2')).toBeTruthy(); // Doubles record
  });

  it('shows section titles correctly', () => {
    render(<PlayerStatsDisplay stats={mockStats} />);
    
    expect(screen.getByText('Match Breakdown')).toBeTruthy();
    expect(screen.getByText('Detailed Stats')).toBeTruthy();
  });
});