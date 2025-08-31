import React from 'react';
import { render } from '@testing-library/react-native';
import { DoublesMatchParticipants } from '@/components/DoublesMatchParticipants';

describe('Targeted Player Display - GitHub Issue #138', () => {
  const mockResponses = [];

  describe('Singles Match Invitations', () => {
    it('should display "Waiting for [playerName] to respond" for targeted singles invitation', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-789']}
          targetedPlayerNames={['Sarah Johnson']}
        />
      );

      // Should show the specific player name instead of generic message
      expect(getByText('Waiting for Sarah Johnson to respond')).toBeTruthy();
    });

    it('should display "Looking for 1 player" for open singles invitation', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={undefined}
          targetedPlayerNames={undefined}
        />
      );

      // Should show generic message for open invitations
      expect(getByText('Looking for 1 player')).toBeTruthy();
    });

    it('should display "Waiting for 1 player" when there are pending responses', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={[{ 
            id: '1', 
            invitation_id: 'inv-1',
            user_id: 'user-999',
            status: 'pending' as const,
            created_at: new Date().toISOString()
          }]}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={undefined}
          targetedPlayerNames={undefined}
        />
      );

      expect(getByText('Waiting for 1 player')).toBeTruthy();
    });
  });

  describe('Doubles Match Invitations', () => {
    it('should display "Waiting for [multiple players] to respond" for targeted doubles invitation', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="doubles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-789', 'player-101', 'player-102']}
          targetedPlayerNames={['Sarah Johnson', 'Mike Wilson', 'Emma Davis']}
        />
      );

      // Should show all targeted player names
      expect(getByText('Waiting for Sarah Johnson, Mike Wilson, Emma Davis to respond')).toBeTruthy();
    });

    it('should display "Looking for 3 players" for open doubles invitation', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="doubles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={undefined}
          targetedPlayerNames={undefined}
        />
      );

      // Should show generic message for open invitations
      expect(getByText('Looking for 3 players')).toBeTruthy();
    });

    it('should update message when some targeted players have responded', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={[{
            id: 'resp-1',
            invitation_id: 'inv-1',
            user_id: 'player-789',
            user_name: 'Sarah Johnson',
            full_name: 'Sarah Johnson',
            status: 'confirmed' as const,
            created_at: new Date().toISOString()
          }]}
          matchType="doubles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-789', 'player-101', 'player-102']}
          targetedPlayerNames={['Sarah Johnson', 'Mike Wilson', 'Emma Davis']}
        />
      );

      // Should only show remaining players who haven't responded
      expect(getByText('Waiting for Mike Wilson, Emma Davis to respond')).toBeTruthy();
    });

    it('should display "Looking for 2 players" when 1 player has joined but invitation is open', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={[{
            id: 'resp-1',
            invitation_id: 'inv-1',
            user_id: 'player-789',
            user_name: 'Sarah Johnson',
            full_name: 'Sarah Johnson',
            status: 'confirmed' as const,
            created_at: new Date().toISOString()
          }]}
          matchType="doubles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={undefined}
          targetedPlayerNames={undefined}
        />
      );

      expect(getByText('Looking for 2 players')).toBeTruthy();
    });
  });

  describe('Quick Match System', () => {
    it('should display specific player name for quick match in singles', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-789']}
          targetedPlayerNames={['Alex Thompson']}
        />
      );

      // Quick matches should show the suggested player name
      expect(getByText('Waiting for Alex Thompson to respond')).toBeTruthy();
    });

    it('should display multiple suggested players for quick match', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-1', 'player-2', 'player-3']}
          targetedPlayerNames={['Alice Cooper', 'Bob Dylan', 'Charlie Parker']}
        />
      );

      // Should show first suggested player (quick match typically targets top suggestion)
      expect(getByText('Waiting for Alice Cooper to respond')).toBeTruthy();
    });

    it('should prioritize skill-matched players in quick match display', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1450} // Intermediate player
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['similar-skill-player']}
          targetedPlayerNames={['Sarah Wilson']} // Similar skill level player
        />
      );

      // Quick match should show the skill-matched player name
      expect(getByText('Waiting for Sarah Wilson to respond')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty targeted player names array gracefully', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-789']}
          targetedPlayerNames={[]} // Empty names array
        />
      );

      // Should fall back to generic message
      expect(getByText('Looking for 1 player')).toBeTruthy();
    });

    it('should handle null targeted fields gracefully', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={null as any}
          targetedPlayerNames={null as any}
        />
      );

      // Should show generic message when fields are null
      expect(getByText('Looking for 1 player')).toBeTruthy();
    });

    it('should handle mismatched arrays (more IDs than names)', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="doubles"
          isMatched={false}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-1', 'player-2', 'player-3']}
          targetedPlayerNames={['Alice', 'Bob']} // Missing one name
        />
      );

      // Should still show available names
      expect(getByText('Waiting for Alice, Bob to respond')).toBeTruthy();
    });
  });

  describe('User Experience', () => {
    it('should show Join Match button for non-targeted users', () => {
      const mockOnJoin = jest.fn();
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          onJoinMatch={mockOnJoin}
          currentUserId="user-123"
          creatorId="creator-456"
          targetedPlayers={['player-789']} // Different player targeted
          targetedPlayerNames={['Someone Else']}
        />
      );

      // Non-targeted users can still join if the match allows
      expect(getByText('+ Join Match')).toBeTruthy();
    });

    it('should not show Join Match button for the creator', () => {
      const mockOnJoin = jest.fn();
      const { queryByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1500}
          creatorGamesPlayed={10}
          responses={mockResponses}
          matchType="singles"
          isMatched={false}
          onJoinMatch={mockOnJoin}
          currentUserId="creator-456" // Same as creator
          creatorId="creator-456"
          targetedPlayers={['player-789']}
          targetedPlayerNames={['Sarah Johnson']}
        />
      );

      // Creator shouldn't see join button
      expect(queryByText('+ Join Match')).toBeNull();
    });
  });
});