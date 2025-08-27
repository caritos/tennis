import React from 'react';
import { render } from '@testing-library/react-native';
import { DoublesMatchParticipants } from '../DoublesMatchParticipants';

describe('DoublesMatchParticipants', () => {
  const mockResponses = [
    {
      id: '1',
      invitation_id: 'inv1',
      user_id: 'user1',
      user_name: 'Player One',
      status: 'confirmed' as const,
      created_at: '2024-01-01',
      user_elo_rating: 1450,
      user_games_played: 10,
    },
  ];

  describe('ELO Rating Display', () => {
    it('should display creator ELO rating and tier for singles', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1520}
          creatorGamesPlayed={15}
          responses={[]}
          matchType="singles"
          isMatched={false}
        />
      );

      // Should show ELO rating and tier
      expect(getByText(/1520/)).toBeTruthy();
      expect(getByText(/Advanced/)).toBeTruthy(); // 1520 is in Advanced tier
    });

    it('should display provisional status for players with less than 5 games', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="New Player"
          creatorEloRating={1200}
          creatorGamesPlayed={3}
          responses={[]}
          matchType="singles"
          isMatched={false}
        />
      );

      expect(getByText(/Provisional/)).toBeTruthy();
    });

    it('should display "New Player" for users without ELO rating', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="Brand New"
          creatorEloRating={undefined}
          creatorGamesPlayed={0}
          responses={[]}
          matchType="singles"
          isMatched={false}
        />
      );

      expect(getByText(/1200/)).toBeTruthy(); // Default rating
      expect(getByText(/New Player/)).toBeTruthy();
      expect(getByText(/\(New\)/)).toBeTruthy();
    });

    it('should display ELO ratings for all players in doubles', () => {
      const doublesResponses = [
        ...mockResponses,
        {
          id: '2',
          invitation_id: 'inv1',
          user_id: 'user2',
          user_name: 'Player Two',
          status: 'confirmed' as const,
          created_at: '2024-01-01',
          user_elo_rating: 1650,
          user_games_played: 20,
        },
        {
          id: '3',
          invitation_id: 'inv1',
          user_id: 'user3',
          user_name: 'Player Three',
          status: 'confirmed' as const,
          created_at: '2024-01-01',
          user_elo_rating: 1380,
          user_games_played: 8,
        },
      ];

      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="Organizer"
          creatorEloRating={1420}
          creatorGamesPlayed={12}
          responses={doublesResponses}
          matchType="doubles"
          isMatched={true}
        />
      );

      // Check all ELO ratings are displayed
      expect(getByText(/1420/)).toBeTruthy(); // Creator
      expect(getByText(/1450/)).toBeTruthy(); // Player One
      expect(getByText(/1650/)).toBeTruthy(); // Player Two
      expect(getByText(/1380/)).toBeTruthy(); // Player Three

      // Check tiers
      expect(getByText(/Elite/)).toBeTruthy(); // 1650
      expect(getByText(/Advanced/)).toBeTruthy(); // 1420, 1450
      expect(getByText(/Intermediate/)).toBeTruthy(); // 1380
    });

    it('should display opponent ELO rating in singles when matched', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="John Smith"
          creatorEloRating={1520}
          creatorGamesPlayed={15}
          responses={mockResponses}
          matchType="singles"
          isMatched={true}
        />
      );

      // Should show both players' ratings
      expect(getByText(/1520/)).toBeTruthy(); // Creator
      expect(getByText(/1450/)).toBeTruthy(); // Opponent
    });
  });

  describe('iOS HIG Compliance', () => {
    it('should have minimum touch targets of 44pt', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="Test User"
          creatorEloRating={1300}
          creatorGamesPlayed={10}
          responses={[]}
          matchType="singles"
          isMatched={false}
          onJoinMatch={() => {}}
          currentUserId="user123"
        />
      );

      const joinButton = getByText('+ Join Match');
      const buttonStyles = joinButton.parent?.props.style;
      
      // Check minimum height for touch targets
      expect(buttonStyles).toEqual(
        expect.objectContaining({
          minHeight: 44, // iOS HIG minimum
        })
      );
    });

    it('should use iOS HIG compliant font sizes', () => {
      const { getByText } = render(
        <DoublesMatchParticipants
          creatorName="Test User"
          creatorEloRating={1300}
          creatorGamesPlayed={10}
          responses={[]}
          matchType="singles"
          isMatched={false}
        />
      );

      // Font sizes should follow iOS HIG
      // Body text: 15pt, Headlines: 17pt, Captions: 13pt
      const nameElement = getByText('Test User');
      expect(nameElement.props.style).toEqual(
        expect.objectContaining({
          fontSize: 15, // Body text
        })
      );
    });

    it('should use iOS HIG standard corner radius', () => {
      const { getByTestId } = render(
        <DoublesMatchParticipants
          creatorName="Test User"
          creatorEloRating={1300}
          creatorGamesPlayed={10}
          responses={[]}
          matchType="singles"
          isMatched={false}
          testID="participants"
        />
      );

      // Player slots should have 12pt corner radius
      const container = getByTestId('participants');
      const playerSlotStyles = container.findByType('View').props.style;
      
      expect(playerSlotStyles).toEqual(
        expect.objectContaining({
          borderRadius: 12, // iOS HIG standard
        })
      );
    });
  });
});