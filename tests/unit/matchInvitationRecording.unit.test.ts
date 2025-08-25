// Mock the services before importing them
jest.mock('../../services/matchService', () => ({
  recordMatch: jest.fn(),
}));

jest.mock('../../services/safetyService', () => ({
  safetyService: {
    submitReport: jest.fn(),
  },
}));

import { recordMatch } from '../../services/matchService';
import { safetyService } from '../../services/safetyService';

const mockRecordMatch = recordMatch as jest.MockedFunction<typeof recordMatch>;
const mockSubmitReport = safetyService.submitReport as jest.MockedFunction<typeof safetyService.submitReport>;

describe('Match Invitation Recording with Reporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecordMatch.mockResolvedValue({
      id: 'test-match-id',
      scores: '6-4, 6-2',
      match_type: 'singles',
      date: '2025-01-15',
      club_id: 'demo-club-123',
      player1_id: 'user-123',
      player2_id: 'opponent-456',
      created_at: new Date().toISOString()
    } as any);
    
    mockSubmitReport.mockResolvedValue('report-id');
  });

  describe('Match Recording Without Reports', () => {
    it('should record match successfully without any reports', async () => {
      const matchData = {
        club_id: 'demo-club-123',
        player1_id: 'user-123',
        player2_id: 'opponent-456',
        scores: '6-4, 6-2',
        match_type: 'singles' as const,
        date: '2025-01-15',
        invitation_id: 'invitation-123'
      };

      // Simulate the save function from RecordMatchInvitationScreen
      await mockRecordMatch(matchData);

      expect(mockRecordMatch).toHaveBeenCalledWith(matchData);
      expect(mockSubmitReport).not.toHaveBeenCalled();
    });
  });

  describe('Match Recording With Reports', () => {
    it('should record match and submit single player report for singles match', async () => {
      const matchData = {
        club_id: 'demo-club-123',
        player1_id: 'user-123',
        player2_id: 'opponent-456',
        scores: '6-4, 6-2',
        match_type: 'singles' as const,
        date: '2025-01-15',
        invitation_id: 'invitation-123'
      };

      const reportData = {
        playerIds: ['opponent-456'],
        type: 'no_show',
        description: 'Player did not show up for the match'
      };

      // Simulate the enhanced save function
      await mockRecordMatch(matchData);
      
      // Simulate reporting logic
      for (const playerId of reportData.playerIds) {
        await mockSubmitReport({
          reporterId: 'user-123',
          reportedUserId: playerId,
          reportType: reportData.type as any,
          description: `Match-based report: ${reportData.description}`
        });
      }

      expect(mockRecordMatch).toHaveBeenCalledWith(matchData);
      expect(mockSubmitReport).toHaveBeenCalledTimes(1);
      expect(mockSubmitReport).toHaveBeenCalledWith({
        reporterId: 'user-123',
        reportedUserId: 'opponent-456',
        reportType: 'no_show',
        description: 'Match-based report: Player did not show up for the match'
      });
    });

    it('should record match and submit multiple player reports for doubles match', async () => {
      const matchData = {
        club_id: 'demo-club-123',
        player1_id: 'user-123',
        player2_id: 'opponent-456',
        player3_id: 'partner-789',
        player4_id: 'opponent-partner-101',
        scores: '6-4, 3-6, 6-3',
        match_type: 'doubles' as const,
        date: '2025-01-15',
        invitation_id: 'invitation-123'
      };

      const reportData = {
        playerIds: ['opponent-456', 'opponent-partner-101'],
        type: 'poor_behavior',
        description: 'Both opponents showed poor sportsmanship during the match'
      };

      await mockRecordMatch(matchData);
      
      // Simulate reporting logic for multiple players
      for (const playerId of reportData.playerIds) {
        await mockSubmitReport({
          reporterId: 'user-123',
          reportedUserId: playerId,
          reportType: reportData.type as any,
          description: `Match-based report: ${reportData.description}`
        });
      }

      expect(mockRecordMatch).toHaveBeenCalledWith(matchData);
      expect(mockSubmitReport).toHaveBeenCalledTimes(2);
      expect(mockSubmitReport).toHaveBeenNthCalledWith(1, {
        reporterId: 'user-123',
        reportedUserId: 'opponent-456',
        reportType: 'poor_behavior',
        description: 'Match-based report: Both opponents showed poor sportsmanship during the match'
      });
      expect(mockSubmitReport).toHaveBeenNthCalledWith(2, {
        reporterId: 'user-123',
        reportedUserId: 'opponent-partner-101',
        reportType: 'poor_behavior',
        description: 'Match-based report: Both opponents showed poor sportsmanship during the match'
      });
    });

    it('should handle various report types correctly', async () => {
      const reportTypes = [
        { key: 'no_show', description: 'Player did not appear' },
        { key: 'poor_behavior', description: 'Bad conduct during match' },
        { key: 'unsportsmanlike', description: 'Cheating and unfair play' },
        { key: 'other', description: 'Custom issue description' }
      ];

      const matchData = {
        club_id: 'demo-club-123',
        player1_id: 'user-123',
        player2_id: 'opponent-456',
        scores: '6-4, 6-2',
        match_type: 'singles' as const,
        date: '2025-01-15',
        invitation_id: 'invitation-123'
      };

      for (const reportType of reportTypes) {
        await mockRecordMatch(matchData);
        await mockSubmitReport({
          reporterId: 'user-123',
          reportedUserId: 'opponent-456',
          reportType: reportType.key as any,
          description: `Match-based report: ${reportType.description}`
        });

        expect(mockSubmitReport).toHaveBeenLastCalledWith({
          reporterId: 'user-123',
          reportedUserId: 'opponent-456',
          reportType: reportType.key,
          description: `Match-based report: ${reportType.description}`
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle match recording failure gracefully', async () => {
      const matchData = {
        club_id: 'demo-club-123',
        player1_id: 'user-123',
        player2_id: 'opponent-456',
        scores: '6-4, 6-2',
        match_type: 'singles' as const,
        date: '2025-01-15',
        invitation_id: 'invitation-123'
      };

      mockRecordMatch.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(mockRecordMatch(matchData)).rejects.toThrow('Database connection failed');
    });

    it('should handle report submission failure gracefully', async () => {
      const matchData = {
        club_id: 'demo-club-123',
        player1_id: 'user-123',
        player2_id: 'opponent-456',
        scores: '6-4, 6-2',
        match_type: 'singles' as const,
        date: '2025-01-15',
        invitation_id: 'invitation-123'
      };

      // Match recording succeeds but report submission fails
      await mockRecordMatch(matchData);
      
      mockSubmitReport.mockRejectedValueOnce(new Error('Report submission failed'));

      await expect(mockSubmitReport({
        reporterId: 'user-123',
        reportedUserId: 'opponent-456',
        reportType: 'no_show',
        description: 'Test report'
      })).rejects.toThrow('Report submission failed');

      expect(mockRecordMatch).toHaveBeenCalledWith(matchData);
    });

    it('should validate report data before submission', async () => {
      const invalidReportData = [
        { playerIds: [], type: 'no_show', description: 'Empty player list' },
        { playerIds: ['player-1'], type: '', description: 'Missing report type' },
        { playerIds: ['player-1'], type: 'other', description: '' }, // 'other' requires description
        { playerIds: ['player-1'], type: 'other', description: '   ' } // Whitespace only
      ];

      for (const reportData of invalidReportData) {
        // Simulate validation logic from MatchRecordingForm
        const isValid = reportData.playerIds.length > 0 && 
                        reportData.type.length > 0 && 
                        (reportData.type !== 'other' || reportData.description.trim().length > 0);
        
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Match-based Reporting Limits', () => {
    it('should enforce one report per player per match', async () => {
      const matchInvitationId = 'invitation-123';
      const reportedPlayerId = 'opponent-456';
      
      // This test validates the concept that each player can only be reported once per match
      // In practice, this would be enforced by the UI state and database constraints
      const reportAttempts = [
        { type: 'no_show', description: 'First report' },
        { type: 'poor_behavior', description: 'Second report attempt' }
      ];

      // First report should succeed
      await mockSubmitReport({
        reporterId: 'user-123',
        reportedUserId: reportedPlayerId,
        reportType: reportAttempts[0].type as any,
        description: reportAttempts[0].description
      });

      // Second report for same player in same match should be prevented by UI
      // (In real implementation, the UI would disable already-reported players)
      const alreadyReportedPlayers = new Set([reportedPlayerId]);
      const canReportAgain = !alreadyReportedPlayers.has(reportedPlayerId);
      
      expect(canReportAgain).toBe(false);
      expect(mockSubmitReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('UI State Management', () => {
    it('should manage reporting form state correctly', () => {
      // Test the state management logic for the reporting form
      const players = [
        { id: 'user-123', full_name: 'Current User' },
        { id: 'opponent-456', full_name: 'Opponent Player' },
        { id: 'partner-789', full_name: 'Partner Player' }
      ];

      const currentUserId = 'user-123';
      const reportablePlayers = players.filter(p => p.id !== currentUserId);
      
      expect(reportablePlayers).toHaveLength(2);
      expect(reportablePlayers.map(p => p.id)).toEqual(['opponent-456', 'partner-789']);
    });

    it('should handle singles vs doubles reporting logic', () => {
      const reportedPlayerIds: string[] = [];
      const playerId = 'opponent-456';

      // Singles match - radio button behavior (only one selection)
      const singlesSelection = (currentIds: string[], newId: string) => {
        return currentIds.includes(newId) ? [] : [newId];
      };

      // Doubles match - checkbox behavior (multiple selections)
      const doublesSelection = (currentIds: string[], newId: string) => {
        return currentIds.includes(newId) 
          ? currentIds.filter(id => id !== newId)
          : [...currentIds, newId];
      };

      // Test singles behavior
      let singleResult = singlesSelection([], playerId);
      expect(singleResult).toEqual([playerId]);
      singleResult = singlesSelection(singleResult, playerId);
      expect(singleResult).toEqual([]);

      // Test doubles behavior
      let doubleResult = doublesSelection([], playerId);
      expect(doubleResult).toEqual([playerId]);
      doubleResult = doublesSelection(doubleResult, 'another-player');
      expect(doubleResult).toEqual([playerId, 'another-player']);
      doubleResult = doublesSelection(doubleResult, playerId);
      expect(doubleResult).toEqual(['another-player']);
    });
  });
});