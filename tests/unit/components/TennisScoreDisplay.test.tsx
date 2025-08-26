import React from 'react';
import { render } from '@testing-library/react-native';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';

// Mock dependencies
jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('TennisScoreDisplay', () => {
  const defaultProps = {
    player1Name: 'Player 1',
    player2Name: 'Player 2',
    scores: '6-4,7-5',
    matchType: 'singles' as const,
    winner: 1 as const,
    isCompleted: true,
  };

  describe('Issue #97: Space-efficient date display', () => {
    it('should display club name and date in a single compact header', () => {
      const { getByText } = render(
        <TennisScoreDisplay
          {...defaultProps}
          clubName="Tennis Club"
          matchDate="2024-03-15"
        />
      );

      // Should display both club name and date in a single line with separator
      const headerText = getByText(/Tennis Club • /);
      expect(headerText).toBeTruthy();
    });

    it('should display only club name when no date is provided', () => {
      const { getByText, queryByText } = render(
        <TennisScoreDisplay
          {...defaultProps}
          clubName="Tennis Club"
        />
      );

      // Should display only club name
      expect(getByText('Tennis Club')).toBeTruthy();
      // Should not have separator
      expect(queryByText(/•/)).toBeNull();
    });

    it('should display only date when no club name is provided', () => {
      const { getByText, queryByText } = render(
        <TennisScoreDisplay
          {...defaultProps}
          matchDate="2024-03-15"
        />
      );

      // Should display only date
      expect(getByText('03/15/24')).toBeTruthy();
      // Should not have separator
      expect(queryByText(/•/)).toBeNull();
    });

    it('should not render header section when neither club name nor date is provided', () => {
      const { container } = render(
        <TennisScoreDisplay
          {...defaultProps}
        />
      );

      // Check that no header with the clubHeader style is rendered
      const headers = container.findAll(
        (node) => node.props?.style && 
        Array.isArray(node.props.style) && 
        node.props.style.some((s: any) => s?.borderBottomWidth === 1)
      );
      
      // The only border should be from the main container
      expect(headers.length).toBeLessThanOrEqual(1);
    });

    it('should format date correctly in MM/DD/YY format', () => {
      const testCases = [
        { input: '2024-01-01', expected: '01/01/24' },
        { input: '2024-12-31', expected: '12/31/24' },
        { input: '2023-06-15', expected: '06/15/23' },
      ];

      testCases.forEach(({ input, expected }) => {
        const { getByText } = render(
          <TennisScoreDisplay
            {...defaultProps}
            matchDate={input}
          />
        );
        expect(getByText(expected)).toBeTruthy();
      });
    });

    it('should use compact padding for the header', () => {
      const { container } = render(
        <TennisScoreDisplay
          {...defaultProps}
          clubName="Tennis Club"
          matchDate="2024-03-15"
        />
      );

      // Find the header element by its style
      const header = container.findAll(
        (node) => node.props?.style && 
        Array.isArray(node.props.style) && 
        node.props.style.some((s: any) => s?.paddingVertical === 6)
      );

      // Should have compact vertical padding
      expect(header.length).toBeGreaterThan(0);
    });

    it('should center the header text', () => {
      const { container } = render(
        <TennisScoreDisplay
          {...defaultProps}
          clubName="Tennis Club"
          matchDate="2024-03-15"
        />
      );

      // Find the header element by its style
      const header = container.findAll(
        (node) => node.props?.style && 
        Array.isArray(node.props.style) && 
        node.props.style.some((s: any) => s?.justifyContent === 'center')
      );

      // Header should be centered
      expect(header.length).toBeGreaterThan(0);
    });
  });

  describe('Score display functionality', () => {
    it('should render player names correctly', () => {
      const { getByText } = render(
        <TennisScoreDisplay {...defaultProps} />
      );

      expect(getByText('Player 1')).toBeTruthy();
      expect(getByText('Player 2')).toBeTruthy();
    });

    it('should render set scores correctly', () => {
      const { getByText } = render(
        <TennisScoreDisplay
          {...defaultProps}
          scores="6-4,7-5"
        />
      );

      // Player 1 scores
      expect(getByText('6')).toBeTruthy();
      expect(getByText('7')).toBeTruthy();
      
      // Player 2 scores
      expect(getByText('4')).toBeTruthy();
      expect(getByText('5')).toBeTruthy();
    });

    it('should handle tiebreak scores', () => {
      const { getByText } = render(
        <TennisScoreDisplay
          {...defaultProps}
          scores="6-4,7-6(7-5)"
        />
      );

      // Regular scores
      expect(getByText('6')).toBeTruthy();
      expect(getByText('4')).toBeTruthy();
      
      // Tiebreak notation should appear
      expect(getByText('7')).toBeTruthy();
    });

    it('should display winner checkmark for correct player', () => {
      const { container } = render(
        <TennisScoreDisplay
          {...defaultProps}
          winner={1}
        />
      );

      // Find checkmark icons
      const checkmarks = container.findAll(
        (node) => node.props?.name === 'checkmark'
      );

      expect(checkmarks.length).toBe(1);
    });
  });
});