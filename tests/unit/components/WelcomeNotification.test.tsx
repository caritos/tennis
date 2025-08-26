import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InlineNotificationBanner } from '@/components/InlineNotificationBanner';
import { router } from 'expo-router';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('Issue #99: Welcome notification with FAQ guidance', () => {
  const mockOnDismiss = jest.fn();
  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('InlineNotificationBanner with FAQ action', () => {
    it('should display welcome message with FAQ guidance text', () => {
      const { getByText } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Find tennis partners, record matches, and climb rankings in local clubs near you. Need help? Check out the FAQ section in your profile for guides and tips!"
          icon="🎾"
          variant="welcome"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      // Check title is displayed
      expect(getByText('Welcome to Play Serve!')).toBeTruthy();
      
      // Check description with FAQ guidance is displayed
      expect(getByText(/Need help\? Check out the FAQ section/)).toBeTruthy();
    });

    it('should display View FAQ action button when actionLabel and onAction are provided', () => {
      const { getByText, getByTestId } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Find tennis partners, record matches, and climb rankings in local clubs near you. Need help? Check out the FAQ section in your profile for guides and tips!"
          icon="🎾"
          variant="welcome"
          dismissible={true}
          onDismiss={mockOnDismiss}
          actionLabel="View FAQ"
          onAction={mockOnAction}
          testID="welcome-banner"
        />
      );

      // Check action button is displayed
      const actionButton = getByText('View FAQ');
      expect(actionButton).toBeTruthy();
    });

    it('should call onAction when View FAQ button is pressed', () => {
      const { getByText } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Find tennis partners, record matches, and climb rankings in local clubs near you. Need help? Check out the FAQ section in your profile for guides and tips!"
          icon="🎾"
          variant="welcome"
          dismissible={true}
          onDismiss={mockOnDismiss}
          actionLabel="View FAQ"
          onAction={mockOnAction}
        />
      );

      const actionButton = getByText('View FAQ');
      fireEvent.press(actionButton);

      expect(mockOnAction).toHaveBeenCalledTimes(1);
    });

    it('should not display action button when actionLabel is not provided', () => {
      const { queryByText } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Find tennis partners, record matches, and climb rankings in local clubs near you."
          icon="🎾"
          variant="welcome"
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      // Action button should not be displayed
      expect(queryByText('View FAQ')).toBeNull();
    });

    it('should be dismissible when dismissible prop is true', () => {
      const { getByTestId } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Find tennis partners, record matches, and climb rankings in local clubs near you. Need help? Check out the FAQ section in your profile for guides and tips!"
          icon="🎾"
          variant="welcome"
          dismissible={true}
          onDismiss={mockOnDismiss}
          testID="welcome-banner"
        />
      );

      const dismissButton = getByTestId('welcome-banner-dismiss');
      fireEvent.press(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should use welcome variant styling', () => {
      const { getByTestId } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Test description"
          icon="🎾"
          variant="welcome"
          testID="welcome-banner"
        />
      );

      const banner = getByTestId('welcome-banner');
      
      // Check that the banner exists with welcome variant
      expect(banner).toBeTruthy();
      expect(banner.props.style).toBeTruthy();
    });
  });

  describe('Integration with FAQ navigation', () => {
    it('should navigate to FAQ page when action is triggered in app context', () => {
      const mockRouter = router;
      
      // Simulate the actual implementation from index.tsx
      const handleFAQNavigation = () => {
        mockRouter.push('/faq');
      };

      const { getByText } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Find tennis partners, record matches, and climb rankings in local clubs near you. Need help? Check out the FAQ section in your profile for guides and tips!"
          icon="🎾"
          variant="welcome"
          dismissible={true}
          onDismiss={mockOnDismiss}
          actionLabel="View FAQ"
          onAction={handleFAQNavigation}
        />
      );

      const actionButton = getByText('View FAQ');
      fireEvent.press(actionButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/faq');
    });
  });

  describe('Welcome message content requirements', () => {
    it('should include all required information elements', () => {
      const { getByText } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Find tennis partners, record matches, and climb rankings in local clubs near you. Need help? Check out the FAQ section in your profile for guides and tips!"
          icon="🎾"
          variant="welcome"
        />
      );

      // Check all key information is present
      expect(getByText(/Find tennis partners/)).toBeTruthy();
      expect(getByText(/record matches/)).toBeTruthy();
      expect(getByText(/climb rankings/)).toBeTruthy();
      expect(getByText(/FAQ section/)).toBeTruthy();
      expect(getByText(/guides and tips/)).toBeTruthy();
    });

    it('should use tennis emoji as icon', () => {
      const { getByText } = render(
        <InlineNotificationBanner
          title="Welcome to Play Serve!"
          description="Test"
          icon="🎾"
          variant="welcome"
        />
      );

      // Tennis emoji should be displayed
      expect(getByText('🎾')).toBeTruthy();
    });
  });
});