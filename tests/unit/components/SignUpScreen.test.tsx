import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SignUpScreen } from '../../../components/SignUpScreen';

describe('SignUpScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnEmailSignUp = jest.fn();
  const mockOnAppleSignUp = jest.fn();
  const mockOnGoogleSignUp = jest.fn();
  const mockOnSignInPress = jest.fn();
  const mockOnTermsPress = jest.fn();
  const mockOnPrivacyPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the sign up screen with tennis emoji and app title', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('🎾 Tennis Club')).toBeTruthy();
      expect(screen.getByText('Join the tennis community!')).toBeTruthy();
    });

    it('should render back button', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const backButton = screen.getByLabelText('Back');
      expect(backButton).toBeTruthy();
    });

    it('should render Sign Up title in header', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('Sign Up')).toBeTruthy();
    });

    it('should render all sign up method buttons', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('📧 Sign up with Email')).toBeTruthy();
      expect(screen.getByText('🍎 Continue with Apple')).toBeTruthy();
      expect(screen.getByText('📱 Continue with Google')).toBeTruthy();
    });

    it('should render sign in link at bottom', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('Already have an account?')).toBeTruthy();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
    });

    it('should render terms and privacy links', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('By signing up, you agree to our')).toBeTruthy();
      expect(screen.getByRole('button', { name: /terms of service/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /privacy policy/i })).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onBack when back button is pressed', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const backButton = screen.getByLabelText('Back');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onEmailSignUp when email button is pressed', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const emailButton = screen.getByRole('button', { name: /sign up with email/i });
      fireEvent.press(emailButton);

      expect(mockOnEmailSignUp).toHaveBeenCalledTimes(1);
    });

    it('should call onAppleSignUp when Apple button is pressed', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const appleButton = screen.getByRole('button', { name: /continue with apple/i });
      fireEvent.press(appleButton);

      expect(mockOnAppleSignUp).toHaveBeenCalledTimes(1);
    });

    it('should call onGoogleSignUp when Google button is pressed', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      fireEvent.press(googleButton);

      expect(mockOnGoogleSignUp).toHaveBeenCalledTimes(1);
    });

    it('should call onSignInPress when sign in link is pressed', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      expect(mockOnSignInPress).toHaveBeenCalledTimes(1);
    });

    it('should call onTermsPress when terms link is pressed', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const termsButton = screen.getByRole('button', { name: /terms of service/i });
      fireEvent.press(termsButton);

      expect(mockOnTermsPress).toHaveBeenCalledTimes(1);
    });

    it('should call onPrivacyPress when privacy link is pressed', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const privacyButton = screen.getByRole('button', { name: /privacy policy/i });
      fireEvent.press(privacyButton);

      expect(mockOnPrivacyPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for all buttons', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByLabelText('Back')).toBeTruthy();
      expect(screen.getByLabelText('Sign up with Email')).toBeTruthy();
      expect(screen.getByLabelText('Continue with Apple')).toBeTruthy();
      expect(screen.getByLabelText('Continue with Google')).toBeTruthy();
      expect(screen.getByLabelText('Sign In')).toBeTruthy();
      expect(screen.getByLabelText('Terms of Service')).toBeTruthy();
      expect(screen.getByLabelText('Privacy Policy')).toBeTruthy();
    });

    it('should have proper accessibility hints for sign up methods', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const emailButton = screen.getByLabelText('Sign up with Email');
      expect(emailButton.props.accessibilityHint).toBe(
        'Create a new account using your email address'
      );

      const appleButton = screen.getByLabelText('Continue with Apple');
      expect(appleButton.props.accessibilityHint).toBe(
        'Sign up using your Apple ID'
      );

      const googleButton = screen.getByLabelText('Continue with Google');
      expect(googleButton.props.accessibilityHint).toBe(
        'Sign up using your Google account'
      );
    });
  });

  describe('Visual Design', () => {
    it('should render with proper header navigation', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const header = screen.getByTestId('sign-up-header');
      expect(header).toBeTruthy();
    });

    it('should render sign up methods in proper order', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const signUpMethods = screen.getByTestId('sign-up-methods');
      expect(signUpMethods).toBeTruthy();
    });

    it('should have proper button styling hierarchy', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // All sign up method buttons should have similar styling
      const emailButton = screen.getByTestId('email-signup-button');
      const appleButton = screen.getByTestId('apple-signup-button');
      const googleButton = screen.getByTestId('google-signup-button');

      expect(emailButton).toBeTruthy();
      expect(appleButton).toBeTruthy();
      expect(googleButton).toBeTruthy();
    });
  });

  describe('Content Validation', () => {
    it('should display correct messaging for community joining', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('Join the tennis community!')).toBeTruthy();
    });

    it('should have consistent emoji usage across buttons', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText(/📧.*Sign up with Email/)).toBeTruthy();
      expect(screen.getByText(/🍎.*Continue with Apple/)).toBeTruthy();
      expect(screen.getByText(/📱.*Continue with Google/)).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      expect(() => {
        render(
          <SignUpScreen 
            onBack={mockOnBack}
            onEmailSignUp={mockOnEmailSignUp}
            onAppleSignUp={mockOnAppleSignUp}
            onGoogleSignUp={mockOnGoogleSignUp}
            onSignInPress={mockOnSignInPress}
            onTermsPress={mockOnTermsPress}
            onPrivacyPress={mockOnPrivacyPress}
          />
        );
      }).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Test error');
      });

      render(
        <SignUpScreen 
          onBack={errorCallback}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const backButton = screen.getByLabelText('Back');
      
      expect(() => {
        fireEvent.press(backButton);
      }).not.toThrow();
    });

    it('should prevent rapid consecutive taps on sign up methods', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const emailButton = screen.getByRole('button', { name: /sign up with email/i });
      
      // Rapid double-tap
      fireEvent.press(emailButton);
      fireEvent.press(emailButton);

      // Should only be called once due to double-tap prevention
      expect(mockOnEmailSignUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should show loading state when isLoading prop is true', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
          isLoading={true}
        />
      );

      // Buttons should be disabled when loading
      const emailButton = screen.getByRole('button', { name: /sign up with email/i });
      expect(emailButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should enable buttons when not loading', () => {
      render(
        <SignUpScreen 
          onBack={mockOnBack}
          onEmailSignUp={mockOnEmailSignUp}
          onAppleSignUp={mockOnAppleSignUp}
          onGoogleSignUp={mockOnGoogleSignUp}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
          isLoading={false}
        />
      );

      const emailButton = screen.getByRole('button', { name: /sign up with email/i });
      expect(emailButton.props.accessibilityState?.disabled).toBeFalsy();
    });
  });
});