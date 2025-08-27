import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../../../app/(tabs)/profile';
import ProfileTab from '../ProfileTab';
import ProfileSettings from '../ProfileSettings';
import { PlayerStatsDisplay } from '../../PlayerStatsDisplay';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    signOut: jest.fn(),
  }),
}));

jest.mock('../../../hooks/usePlayerStats', () => ({
  usePlayerStats: () => ({
    stats: null,
    loading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('Profile Screen - iOS HIG Compliance', () => {
  describe('Typography Standards', () => {
    it('should use iOS HIG compliant font sizes in main profile screen', () => {
      const { getByText } = render(<ProfileScreen />);
      
      const headerTitle = getByText('Test User');
      expect(headerTitle.props.style).toEqual(
        expect.objectContaining({
          fontSize: 34, // iOS HIG: Large Title
        })
      );
    });

    it('should use proper tab bar font sizes', () => {
      const { getByText } = render(<ProfileScreen />);
      
      const tabLabel = getByText('Profile');
      expect(tabLabel.props.style).toEqual(
        expect.objectContaining({
          fontSize: 10, // iOS HIG: Tab bar labels
        })
      );
    });
  });

  describe('Touch Target Requirements', () => {
    it('should have minimum 44pt touch targets for tab buttons', () => {
      const { getByText } = render(<ProfileScreen />);
      
      const profileTab = getByText('Profile').parent;
      expect(profileTab?.props.style).toEqual(
        expect.objectContaining({
          minHeight: 44, // iOS HIG: Minimum touch target
        })
      );
    });

    it('should have minimum touch targets in ProfileTab inputs', () => {
      const mockUser = { 
        id: 'test', 
        email: 'test@example.com', 
        user_metadata: { full_name: 'Test User' } 
      };
      const mockColors = { text: '#000', background: '#fff', tabIconDefault: '#666' };

      const { getByPlaceholderText } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      const nameInput = getByPlaceholderText('Enter your full name');
      expect(nameInput.props.style).toEqual(
        expect.objectContaining({
          minHeight: 44, // iOS HIG: Minimum touch target
        })
      );
    });

    it('should have minimum touch targets in ProfileSettings items', () => {
      const mockUser = { email: 'test@example.com' };
      const mockColors = { 
        text: '#000', 
        background: '#fff', 
        tabIconDefault: '#666', 
        tint: '#007AFF',
        icon: '#333'
      };

      const { getByText } = render(
        <ProfileSettings 
          user={mockUser} 
          colors={mockColors} 
          onSignOut={jest.fn()} 
        />
      );

      const faqItem = getByText('FAQ / Help').parent?.parent;
      expect(faqItem?.props.style).toEqual(
        expect.objectContaining({
          minHeight: 44, // iOS HIG: Minimum touch target
        })
      );
    });
  });

  describe('Visual Design Standards', () => {
    it('should use iOS HIG standard corner radius', () => {
      const mockUser = { 
        id: 'test', 
        email: 'test@example.com', 
        user_metadata: { full_name: 'Test User' } 
      };
      const mockColors = { text: '#000', background: '#fff', tabIconDefault: '#666' };

      const { getByPlaceholderText } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      const nameInput = getByPlaceholderText('Enter your full name');
      expect(nameInput.props.style).toEqual(
        expect.objectContaining({
          borderRadius: 12, // iOS HIG: Standard corner radius
        })
      );
    });

    it('should use proper iOS margins', () => {
      const { container } = render(<ProfileScreen />);
      
      // Check that sections use 16pt margins (iOS HIG standard)
      const sections = container.findAllByType('View');
      const headerSection = sections.find(view => 
        view.props.style?.paddingHorizontal === 16
      );
      
      expect(headerSection).toBeTruthy();
    });
  });

  describe('PlayerStatsDisplay iOS HIG Compliance', () => {
    it('should use iOS HIG typography for stats display', () => {
      const mockStats = {
        totalMatches: 10,
        wins: 7,
        losses: 3,
        winPercentage: 70,
        singlesRecord: { wins: 4, losses: 1, winPercentage: 80 },
        doublesRecord: { wins: 3, losses: 2, winPercentage: 60 },
        setsWon: 15,
        setsLost: 8,
        gamesWon: 120,
        gamesLost: 85,
      };

      const { getByText } = render(
        <PlayerStatsDisplay stats={mockStats} loading={false} error={null} />
      );

      // Check main stat values use Title 1 (28pt)
      const totalMatches = getByText('10');
      expect(totalMatches.props.style).toEqual(
        expect.objectContaining({
          fontSize: 28, // iOS HIG: Title 1
        })
      );

      // Check section titles use Headline (17pt)
      const matchBreakdown = getByText('Match Breakdown');
      expect(matchBreakdown.props.style).toEqual(
        expect.objectContaining({
          fontSize: 17, // iOS HIG: Headline
        })
      );
    });

    it('should handle error states with proper typography', () => {
      const { getByText } = render(
        <PlayerStatsDisplay 
          stats={{} as any} 
          loading={false} 
          error="Network error" 
        />
      );

      const errorText = getByText('Unable to load stats');
      expect(errorText.props.style).toEqual(
        expect.objectContaining({
          fontSize: 17, // iOS HIG: Headline for error states
          color: '#ff3b30', // iOS HIG: System red
        })
      );
    });

    it('should handle loading states with proper typography', () => {
      const { getByText } = render(
        <PlayerStatsDisplay 
          stats={{} as any} 
          loading={true} 
          error={null} 
        />
      );

      const loadingText = getByText('Loading stats...');
      expect(loadingText.props.style).toEqual(
        expect.objectContaining({
          fontSize: 15, // iOS HIG: Body text
        })
      );
    });
  });

  describe('Form Field Compliance', () => {
    it('should use iOS HIG form field styling', () => {
      const mockUser = { 
        id: 'test', 
        email: 'test@example.com', 
        user_metadata: { full_name: 'Test User' } 
      };
      const mockColors = { text: '#000', background: '#fff', tabIconDefault: '#666' };

      const { getByText } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Check field labels use proper iOS styling
      const fullNameLabel = getByText('Full Name');
      expect(fullNameLabel.props.style).toEqual(
        expect.objectContaining({
          fontSize: 13, // iOS HIG: Footnote for field labels
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        })
      );
    });

    it('should use iOS standard input text size', () => {
      const mockUser = { 
        id: 'test', 
        email: 'test@example.com', 
        user_metadata: { full_name: 'Test User' } 
      };
      const mockColors = { text: '#000', background: '#fff', tabIconDefault: '#666' };

      const { getByDisplayValue } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      const nameInput = getByDisplayValue('Test User');
      expect(nameInput.props.style).toEqual(
        expect.objectContaining({
          fontSize: 17, // iOS HIG: Text input size
        })
      );
    });
  });

  describe('Button Standards', () => {
    it('should use iOS standard button height and typography', () => {
      const mockUser = { 
        id: 'test', 
        email: 'test@example.com', 
        user_metadata: { full_name: 'Test User' } 
      };
      const mockColors = { 
        text: '#000', 
        background: '#fff', 
        tabIconDefault: '#666', 
        tint: '#007AFF',
        icon: '#333'
      };

      const { getByText } = render(
        <ProfileSettings 
          user={mockUser} 
          colors={mockColors} 
          onSignOut={jest.fn()} 
        />
      );

      const signOutButton = getByText('Sign Out').parent;
      expect(signOutButton?.props.style).toEqual(
        expect.objectContaining({
          minHeight: 50, // iOS HIG: Standard button height
          borderRadius: 12, // iOS HIG: Standard corner radius
        })
      );

      const signOutText = getByText('Sign Out');
      expect(signOutText.props.style).toEqual(
        expect.objectContaining({
          fontSize: 17, // iOS HIG: Button text size
        })
      );
    });
  });
});