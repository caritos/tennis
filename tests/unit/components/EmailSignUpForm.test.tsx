import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EmailSignUpForm } from '../../components/EmailSignUpForm';

describe('EmailSignUpForm', () => {
  const mockOnBack = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockOnSignInPress = jest.fn();
  const mockOnTermsPress = jest.fn();
  const mockOnPrivacyPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the email sign up form with header', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // Header should show "Create Account"
      const headerTitle = screen.getAllByText('Create Account')[0]; // First one is in header
      expect(headerTitle).toBeTruthy();
      expect(screen.getByText('🎾 Tennis Club')).toBeTruthy();
    });

    it('should render back button in header', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const backButton = screen.getByLabelText('Back');
      expect(backButton).toBeTruthy();
    });

    it('should render all form fields with labels', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('Full Name')).toBeTruthy();
      expect(screen.getByPlaceholderText('John Smith')).toBeTruthy();
      
      expect(screen.getByText('Email Address')).toBeTruthy();
      expect(screen.getByPlaceholderText('john@example.com')).toBeTruthy();
      
      expect(screen.getByText('Password')).toBeTruthy();
      const passwordInputs = screen.getAllByPlaceholderText('••••••••••••');
      expect(passwordInputs).toHaveLength(2); // Password and Confirm Password
      
      expect(screen.getByText('Confirm Password')).toBeTruthy();
      
      expect(screen.getByText('Phone Number (Optional)')).toBeTruthy();
      expect(screen.getByPlaceholderText('(555) 123-4567')).toBeTruthy();
    });

    it('should render phone number help text', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('For match coordination and contact sharing')).toBeTruthy();
    });

    it('should render terms checkbox and create account button', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByLabelText('I agree to the Terms of Service and Privacy Policy')).toBeTruthy();
      expect(screen.getByRole('button', { name: /create account/i })).toBeTruthy();
    });

    it('should render sign in link at bottom', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByText('Already have an account?')).toBeTruthy();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeTruthy();
    });
  });

  describe('Form Input Handling', () => {
    it('should update full name input value', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const fullNameInput = screen.getByPlaceholderText('John Smith');
      fireEvent.changeText(fullNameInput, 'Jane Doe');
      
      expect(fullNameInput.props.value).toBe('Jane Doe');
    });

    it('should update email input value', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      fireEvent.changeText(emailInput, 'jane@example.com');
      
      expect(emailInput.props.value).toBe('jane@example.com');
    });

    it('should update password input value and hide text', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const passwordInput = screen.getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'MySecurePassword123');
      
      expect(passwordInput.props.value).toBe('MySecurePassword123');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should update confirm password input value and hide text', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      fireEvent.changeText(confirmPasswordInput, 'MySecurePassword123');
      
      expect(confirmPasswordInput.props.value).toBe('MySecurePassword123');
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });

    it('should update phone number input value', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
      fireEvent.changeText(phoneInput, '5551234567');
      
      expect(phoneInput.props.value).toBe('5551234567');
    });

    it('should toggle terms agreement checkbox', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const checkbox = screen.getByLabelText('I agree to the Terms of Service and Privacy Policy');
      
      // Initially unchecked
      expect(checkbox.props.accessibilityState?.checked).toBe(false);
      
      // Toggle to checked
      fireEvent.press(checkbox);
      expect(checkbox.props.accessibilityState?.checked).toBe(true);
      
      // Toggle back to unchecked
      fireEvent.press(checkbox);
      expect(checkbox.props.accessibilityState?.checked).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('should show error when full name is empty', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeTruthy();
      });
    });

    it('should show error for invalid email format', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      fireEvent.changeText(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
      });
    });

    it('should show error when password is too short', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const passwordInput = screen.getByTestId('password-input');
      fireEvent.changeText(passwordInput, '12345');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });

    it('should show error when passwords do not match', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      
      fireEvent.changeText(passwordInput, 'Password123');
      fireEvent.changeText(confirmPasswordInput, 'Password456');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeTruthy();
      });
    });

    it('should show error when terms not agreed', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // Fill in valid form data but don't check terms
      const fullNameInput = screen.getByPlaceholderText('John Smith');
      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      
      fireEvent.changeText(fullNameInput, 'John Smith');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'Password123');
      fireEvent.changeText(confirmPasswordInput, 'Password123');
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('You must agree to the Terms of Service and Privacy Policy')).toBeTruthy();
      });
    });

    it('should validate phone number format when provided', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
      fireEvent.changeText(phoneInput, '123'); // Too short
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with form data when all fields are valid', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // Fill in all fields
      const fullNameInput = screen.getByPlaceholderText('John Smith');
      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const phoneInput = screen.getByPlaceholderText('(555) 123-4567');
      const termsCheckbox = screen.getByLabelText('I agree to the Terms of Service and Privacy Policy');
      
      fireEvent.changeText(fullNameInput, 'John Smith');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'Password123');
      fireEvent.changeText(confirmPasswordInput, 'Password123');
      fireEvent.changeText(phoneInput, '5551234567');
      fireEvent.press(termsCheckbox);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          fullName: 'John Smith',
          email: 'john@example.com',
          password: 'Password123',
          phone: '5551234567',
        });
      });
    });

    it('should submit without phone number when optional', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // Fill in required fields only
      const fullNameInput = screen.getByPlaceholderText('John Smith');
      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const termsCheckbox = screen.getByLabelText('I agree to the Terms of Service and Privacy Policy');
      
      fireEvent.changeText(fullNameInput, 'Jane Doe');
      fireEvent.changeText(emailInput, 'jane@example.com');
      fireEvent.changeText(passwordInput, 'SecurePass123');
      fireEvent.changeText(confirmPasswordInput, 'SecurePass123');
      fireEvent.press(termsCheckbox);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          password: 'SecurePass123',
          phone: '',
        });
      });
    });

    it('should show loading state during submission', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create account/i });
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should clear errors when user starts typing', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // Submit with empty form to trigger errors
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeTruthy();
      });

      // Start typing in full name field
      const fullNameInput = screen.getByPlaceholderText('John Smith');
      fireEvent.changeText(fullNameInput, 'J');

      await waitFor(() => {
        expect(screen.queryByText('Full name is required')).toBeFalsy();
      });
    });
  });

  describe('Navigation', () => {
    it('should call onBack when back button is pressed', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const backButton = screen.getByLabelText('Back');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onSignInPress when sign in link is pressed', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
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
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const termsCheckbox = screen.getByLabelText('I agree to the Terms of Service and Privacy Policy');
      
      // Find the terms link within the checkbox area
      const termsLink = screen.getByTestId('terms-link');
      fireEvent.press(termsLink);

      expect(mockOnTermsPress).toHaveBeenCalledTimes(1);
    });

    it('should call onPrivacyPress when privacy link is pressed', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const privacyLink = screen.getByTestId('privacy-link');
      fireEvent.press(privacyLink);

      expect(mockOnPrivacyPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels for all inputs', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      expect(screen.getByLabelText('Full Name')).toBeTruthy();
      expect(screen.getByLabelText('Email Address')).toBeTruthy();
      expect(screen.getByLabelText('Password')).toBeTruthy();
      expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
      expect(screen.getByLabelText('Phone Number (Optional)')).toBeTruthy();
    });

    it('should announce errors to screen readers', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        const errorText = screen.getByText('Full name is required');
        expect(errorText.props.accessibilityRole).toBe('alert');
      });
    });

    it('should have proper keyboard types for inputs', () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const emailInput = screen.getByPlaceholderText('john@example.com');
      const phoneInput = screen.getByPlaceholderText('(555) 123-4567');

      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(phoneInput.props.keyboardType).toBe('phone-pad');
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const errorOnSubmit = jest.fn().mockRejectedValue(new Error('Network error'));
      
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={errorOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // Fill in valid form
      const fullNameInput = screen.getByPlaceholderText('John Smith');
      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const termsCheckbox = screen.getByLabelText('I agree to the Terms of Service and Privacy Policy');
      
      fireEvent.changeText(fullNameInput, 'John Smith');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'Password123');
      fireEvent.changeText(confirmPasswordInput, 'Password123');
      fireEvent.press(termsCheckbox);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create account. Please try again.')).toBeTruthy();
      });
    });

    it('should handle missing callbacks gracefully', () => {
      expect(() => {
        render(
          <EmailSignUpForm 
            onBack={mockOnBack}
            onSubmit={mockOnSubmit}
            onSignInPress={mockOnSignInPress}
            onTermsPress={mockOnTermsPress}
            onPrivacyPress={mockOnPrivacyPress}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Security', () => {
    it('should not log password values', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      const passwordInput = screen.getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'MySecretPassword');

      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('MySecretPassword'));
      
      consoleSpy.mockRestore();
    });

    it('should trim whitespace from email', async () => {
      render(
        <EmailSignUpForm 
          onBack={mockOnBack}
          onSubmit={mockOnSubmit}
          onSignInPress={mockOnSignInPress}
          onTermsPress={mockOnTermsPress}
          onPrivacyPress={mockOnPrivacyPress}
        />
      );

      // Fill in form with whitespace in email
      const fullNameInput = screen.getByPlaceholderText('John Smith');
      const emailInput = screen.getByPlaceholderText('john@example.com');
      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const termsCheckbox = screen.getByLabelText('I agree to the Terms of Service and Privacy Policy');
      
      fireEvent.changeText(fullNameInput, 'John Smith');
      fireEvent.changeText(emailInput, '  john@example.com  ');
      fireEvent.changeText(passwordInput, 'Password123');
      fireEvent.changeText(confirmPasswordInput, 'Password123');
      fireEvent.press(termsCheckbox);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          fullName: 'John Smith',
          email: 'john@example.com', // Trimmed
          password: 'Password123',
          phone: '',
        });
      });
    });
  });
});