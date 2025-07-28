import { renderHook, waitFor } from '@testing-library/react-native';
import { usePlayerStats } from '@/hooks/usePlayerStats';

// Mock the match service
jest.mock('@/services/matchService', () => ({
  getMatchStats: jest.fn(),
}));

// Mock navigation focus effect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

import { getMatchStats } from '@/services/matchService';

const mockGetMatchStats = getMatchStats as jest.MockedFunction<typeof getMatchStats>;

const mockPlayerStats = {
  totalMatches: 10,
  wins: 7,
  losses: 3,
  winPercentage: 70,
  singlesRecord: { wins: 4, losses: 2, winPercentage: 66.67 },
  doublesRecord: { wins: 3, losses: 1, winPercentage: 75 },
  setsWon: 15,
  setsLost: 8,
  gamesWon: 120,
  gamesLost: 95,
};

describe('usePlayerStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial loading state', () => {
    mockGetMatchStats.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { result } = renderHook(() => usePlayerStats('player1'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('loads stats successfully', async () => {
    mockGetMatchStats.mockResolvedValue(mockPlayerStats);
    
    const { result } = renderHook(() => usePlayerStats('player1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.stats).toEqual(mockPlayerStats);
    expect(result.current.error).toBe(null);
    expect(mockGetMatchStats).toHaveBeenCalledWith('player1', undefined);
  });

  it('loads stats with club filter', async () => {
    mockGetMatchStats.mockResolvedValue(mockPlayerStats);
    
    const { result } = renderHook(() => usePlayerStats('player1', 'club123'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.stats).toEqual(mockPlayerStats);
    expect(mockGetMatchStats).toHaveBeenCalledWith('player1', 'club123');
  });

  it('handles error state', async () => {
    const errorMessage = 'Failed to load stats';
    mockGetMatchStats.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => usePlayerStats('player1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles null playerId', async () => {
    const { result } = renderHook(() => usePlayerStats(null));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(null);
    expect(mockGetMatchStats).not.toHaveBeenCalled();
  });

  it('refreshes stats when requested', async () => {
    mockGetMatchStats.mockResolvedValue(mockPlayerStats);
    
    const { result } = renderHook(() => usePlayerStats('player1'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    // Clear previous calls
    mockGetMatchStats.mockClear();
    
    // Refresh stats
    await result.current.refreshStats();
    
    expect(mockGetMatchStats).toHaveBeenCalledWith('player1', undefined);
  });

  it('reloads when playerId changes', async () => {
    mockGetMatchStats.mockResolvedValue(mockPlayerStats);
    
    const { result, rerender } = renderHook(
      ({ playerId }) => usePlayerStats(playerId),
      { initialProps: { playerId: 'player1' } }
    );
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(mockGetMatchStats).toHaveBeenCalledWith('player1', undefined);
    
    // Change playerId
    mockGetMatchStats.mockClear();
    rerender({ playerId: 'player2' });
    
    await waitFor(() => {
      expect(mockGetMatchStats).toHaveBeenCalledWith('player2', undefined);
    });
  });
});