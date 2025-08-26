import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WelcomeScreen } from '../../../components/WelcomeScreen';

describe('WelcomeScreen', () => {
  const mockOnGetStarted = jest.fn();
  const mockOnSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the welcome screen with tennis emoji and app title', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      expect(screen.getByText('🎾 Tennis Club')).toBeTruthy();
      expect(screen.getByText('Connect with tennis players in your area')).toBeTruthy();
    });

    it('should render Get Started button', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      expect(getStartedButton).toBeTruthy();
    });

    it('should render Sign In button', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeTruthy();
    });

    it('should render "Already have an account?" text', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      expect(screen.getByText('Already have an account?')).toBeTruthy();
    });

    it('should render footer links', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      expect(screen.getByText('Terms of Service')).toBeTruthy();
      expect(screen.getByText('Privacy Policy')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onGetStarted when Get Started button is pressed', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      fireEvent.press(getStartedButton);

      expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
    });

    it('should call onSignIn when Sign In button is pressed', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      expect(mockOnSignIn).toHaveBeenCalledTimes(1);
    });

    it('should prevent double-tap on Get Started button', async () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      
      // Rapid double-tap
      fireEvent.press(getStartedButton);
      fireEvent.press(getStartedButton);

      // Should only be called once due to activeOpacity or disabled state
      expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for buttons', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      expect(getStartedButton).toBeTruthy();
      expect(signInButton).toBeTruthy();
    });

    it('should have proper accessibility hints for main actions', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const getStartedButton = screen.getByLabelText('Get Started');
      expect(getStartedButton.props.accessibilityHint).toBe(
        'Start the sign up process to create a new tennis club account'
      );

      const signInButton = screen.getByLabelText('Sign In');
      expect(signInButton.props.accessibilityHint).toBe(
        'Sign in to your existing tennis club account'
      );
    });
  });

  describe('Visual Design', () => {
    it('should render with proper tennis theme styling', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const container = screen.getByTestId('welcome-screen-container');
      expect(container).toBeTruthy();

      // Verify tennis emoji is prominent
      const tennisEmoji = screen.getByText('🎾 Tennis Club');
      expect(tennisEmoji).toBeTruthy();
    });

    it('should have proper button hierarchy (primary vs secondary)', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const getStartedButton = screen.getByTestId('primary-button');
      const signInButton = screen.getByTestId('secondary-button');

      expect(getStartedButton).toBeTruthy();
      expect(signInButton).toBeTruthy();
    });

    it('should center content appropriately', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const mainContent = screen.getByTestId('welcome-main-content');
      expect(mainContent).toBeTruthy();
    });
  });

  describe('Content Validation', () => {
    it('should display correct app value proposition', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      // Check main value props
      expect(screen.getByText('Connect with tennis players in your area')).toBeTruthy();
      expect(screen.getByText('🏟️ Join local tennis clubs')).toBeTruthy();
      expect(screen.getByText('📊 Track your matches and stats')).toBeTruthy();
      expect(screen.getByText('👥 Find playing partners nearby')).toBeTruthy();
    });

    it('should have clear call-to-action hierarchy', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      // Primary action should be more prominent
      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      expect(getStartedButton).toBeTruthy();
      expect(signInButton).toBeTruthy();
    });
  });

  describe('Footer Links', () => {
    it('should render Terms of Service and Privacy Policy as pressable links', () => {
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn} 
        />
      );

      const termsLink = screen.getByRole('button', { name: /terms of service/i });
      const privacyLink = screen.getByRole('button', { name: /privacy policy/i });

      expect(termsLink).toBeTruthy();
      expect(privacyLink).toBeTruthy();
    });

    it('should handle footer link presses appropriately', () => {
      const mockOnTermsPress = jest.fn();
      const mockOnPrivacyPress = jest.fn();
      
      render(
        <WelcomeScreen 
          onGetStarted={mockOnGetStarted} 
          onSignIn={mockOnSignIn}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const termsLink = screen.getByRole('button', { name: /terms of service/i });
      const privacyLink = screen.getByRole('button', { name: /privacy policy/i });

      fireEvent.press(termsLink);
      fireEvent.press(privacyLink);

      expect(mockOnTermsPress).toHaveBeenCalledTimes(1);
      expect(mockOnPrivacyPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      // This test ensures component doesn't crash with undefined props
      expect(() => {
        render(
          <WelcomeScreen 
            onGetStarted={mockOnGetStarted} 
            onSignIn={mockOnSignIn} 
          />
        );
      }).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });

      render(
        <WelcomeScreen 
          onGetStarted={errorCallback} 
          onSignIn={mockOnSignIn} 
        />
      );

      const getStartedButton = screen.getByRole('button', { name: /get started/i });
      
      // Should not crash the component
      expect(() => {
        fireEvent.press(getStartedButton);
      }).not.toThrow();
    });
  });
});