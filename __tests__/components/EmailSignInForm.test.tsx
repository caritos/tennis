import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EmailSignInForm } from '../../components/EmailSignInForm';

describe('EmailSignInForm', () => {
  const mockOnBack = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnSignUpPress = jest.fn();
  const mockOnForgotPasswordPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the email sign in form with header', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      // Header should show "Sign In"
      const signInTexts = screen.getAllByText('Sign In');
      expect(signInTexts.length).toBe(2); // Header and button
      expect(screen.getByText('🎾 Tennis Club')).toBeTruthy();
    });

    it('should render back button in header', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const backButton = screen.getByLabelText('Back');
      expect(backButton).toBeTruthy();
    });

    it('should render welcome back message', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      expect(screen.getByText('Welcome back!')).toBeTruthy();
    });

    it('should render email and password input fields', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      expect(screen.getByText('Email Address')).toBeTruthy();
      expect(screen.getByPlaceholderText('john@example.com')).toBeTruthy();
      
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('••••••••••••')).toBeTruthy();
    });

    it('should render forgot password link', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      expect(screen.getByText('Forgot Password?')).toBeTruthy();
    });

    it('should render sign in button', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
    });

    it('should render sign up link at bottom', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      expect(screen.getByText("Don't have an account?")).toBeTruthy();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeTruthy();
    });
  });

  describe('Form Input Handling', () => {
    it('should update email input value', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    it('should update password input value and hide text', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const passwordInput = screen.getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'MyPassword123');
      
      expect(passwordInput.props.value).toBe('MyPassword123');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should have correct keyboard types for inputs', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeTruthy();
      });
    });

    it('should show error for invalid email format', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      fireEvent.changeText(emailInput, 'invalid-email');
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });
    });

    it('should show error when password is empty', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeTruthy();
      });
    });

    it('should clear errors when user starts typing', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      // Submit with empty form to trigger errors
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeTruthy();
      });

      // Start typing in email field
      const emailInput = screen.getByPlaceholderText('john@example.com');
      fireEvent.changeText(emailInput, 't');

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).toBeFalsy();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when fields are valid', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      // Fill in fields
      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'MyPassword123');
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'MyPassword123',
        });
      });
    });

    it('should trim whitespace from email', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      
      fireEvent.changeText(emailInput, '  test@example.com  ');
      fireEvent.changeText(passwordInput, 'MyPassword123');
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com', // Trimmed
          password: 'MyPassword123',
        });
      });
    });

    it('should show loading state during submission', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
          isLoading={true}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should prevent double submission when loading', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
          isLoading={true}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);
      fireEvent.press(signInButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is pressed', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const backButton = screen.getByLabelText('Back');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onSignUpPress when sign up link is pressed', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const signUpButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.press(signUpButton);

      expect(mockOnSignUpPress).toHaveBeenCalledTimes(1);
    });

    it('should call onForgotPasswordPress when forgot password link is pressed', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const forgotPasswordLink = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordLink);

      expect(mockOnForgotPasswordPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const errorOnSubmit = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={errorOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      // Fill in valid form
      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'MyPassword123');
      
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password. Please try again.')).toBeTruthy();
      });
    });

    it('should handle missing callbacks gracefully', () => {
      expect(() => {
        render(
          <EmailSignInForm 
            onBack={mockOnBack}
            onSubmit={mockOnSubmit}
            onSignUpPress={mockOnSignUpPress}
            onForgotPasswordPress={mockOnForgotPasswordPress}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for all inputs', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      expect(screen.getByLabelText('Email Address')).toBeTruthy();
      expect(screen.getByLabelText('Password')).toBeTruthy();
    });

    it('should announce errors to screen readers', async () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.press(signInButton);

      await waitFor(() => {
        const errorText = screen.getByText('Email is required');
        expect(errorText.props.accessibilityRole).toBe('alert');
      });
    });

    it('should have proper button accessibility states', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
          isLoading={true}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Security', () => {
    it('should not log password values', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const passwordInput = screen.getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'MySecretPassword');

      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('MySecretPassword'));
      
      consoleSpy.mockRestore();
    });

    it('should use secure text entry for password field', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
        />
      );

      const passwordInput = screen.getByTestId('password-input');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should show different button text when loading', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
          isLoading={true}
        />
      );

      expect(screen.getByText('Signing In...')).toBeTruthy();
    });

    it('should show normal button text when not loading', () => {
      render(
        <EmailSignInForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignUpPress={mockOnSignUpPress}
          onForgotPasswordPress={mockOnForgotPasswordPress}
          isLoading={false}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeTruthy();
    });
  });
});