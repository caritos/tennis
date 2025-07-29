import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import AppleSignInButton from '@/components/AppleSignInButton';

// Mock Platform.OS
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios', // Default to iOS for testing
  },
}));

// Mock expo-apple-authentication
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 'full_name',
    EMAIL: 'email',
  },
  AppleAuthenticationButton: jest.fn((props) => {
    const React = require('react');
    const { TouchableOpacity } = jest.requireActual('react-native');
    return React.createElement(TouchableOpacity, { 
      onPress: props.onPress,
      testID: 'apple-sign-in-button',
      ...props 
    });
  }),
  AppleAuthenticationButtonType: {
    SIGN_IN: 'sign_in',
  },
  AppleAuthenticationButtonStyle: {
    BLACK: 'black',
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
    },
    from: jest.fn(() => ({
      upsert: jest.fn(),
    })),
  },
}));

// Mock error handling utility
jest.mock('@/utils/errorHandling', () => ({
  getAuthErrorMessage: jest.fn((error) => error.message || 'Authentication failed'),
}));

describe('AppleSignInButton', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set Platform.OS to iOS by default
    (Platform as any).OS = 'ios';
    
    // Mock successful Apple authentication by default
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
      user: 'test-user-id',
      email: 'test@example.com',
      fullName: {
        givenName: 'John',
        familyName: 'Doe',
      },
      identityToken: 'test-identity-token',
      authorizationCode: 'test-auth-code',
      nonce: 'test-nonce',
    });
    
    // Mock successful Supabase authentication
    (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'supabase-user-id',
          email: 'test@example.com',
        },
        session: {
          access_token: 'test-access-token',
        },
      },
      error: null,
    });
    
    // Mock successful user profile update
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      upsert: mockUpsert,
    });
  });

  describe('Platform compatibility', () => {
    it('renders Apple Sign In button on iOS', () => {
      (Platform as any).OS = 'ios';
      
      const { getByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      // Should render the Apple button component
      expect(AppleAuthentication.AppleAuthenticationButton).toHaveBeenCalled();
    });

    it('does not render on non-iOS platforms', () => {
      (Platform as any).OS = 'android';
      
      const { queryByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      // Should not render anything on Android
      expect(AppleAuthentication.AppleAuthenticationButton).not.toHaveBeenCalled();
    });
  });

  describe('Apple Authentication availability', () => {
    it('handles unavailable Apple Authentication gracefully', async () => {
      (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(false);
      
      const { getByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      // Simulate button press
      const button = getByTestId('apple-sign-in-button') || { props: { onPress: jest.fn() } };
      await button.props.onPress();
      
      expect(mockOnError).toHaveBeenCalledWith('Apple Sign In is not available on this device');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Successful authentication flow', () => {
    it('completes full authentication flow successfully', async () => {
      const { getByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      // Get the button and simulate press
      const button = getByTestId('apple-sign-in-button') || { props: { onPress: jest.fn() } };
      await button.props.onPress();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(AppleAuthentication.isAvailableAsync).toHaveBeenCalled();
      expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      expect(supabase.auth.signInWithIdToken).toHaveBeenCalledWith({
        provider: 'apple',
        token: 'test-identity-token',
        nonce: 'test-nonce',
      });
      
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('updates user profile with Apple data', async () => {
      const { getByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      const button = getByTestId('apple-sign-in-button') || { props: { onPress: jest.fn() } };
      await button.props.onPress();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(supabase.from).toHaveBeenCalledWith('users');
      
      const mockUpsert = (supabase.from as jest.Mock).mock.results[0].value.upsert;
      expect(mockUpsert).toHaveBeenCalledWith({
        id: 'supabase-user-id',
        full_name: 'John Doe',
        email: 'test@example.com',
        updated_at: expect.any(String),
      });
    });
  });

  describe('Error handling', () => {
    it('handles missing identity token', async () => {
      (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
        user: 'test-user-id',
        email: 'test@example.com',
        // identityToken is missing
      });
      
      const { getByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      const button = getByTestId('apple-sign-in-button') || { props: { onPress: jest.fn() } };
      await button.props.onPress();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockOnError).toHaveBeenCalledWith('No identity token received from Apple');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('handles Supabase authentication errors', async () => {
      (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid token' },
      });
      
      const { getByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      const button = getByTestId('apple-sign-in-button') || { props: { onPress: jest.fn() } };
      await button.props.onPress();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockOnError).toHaveBeenCalledWith('Invalid token');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('handles user cancellation gracefully', async () => {
      (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValue({
        code: 'ERR_CANCELED',
        message: 'User cancelled',
      });
      
      const { getByTestId } = render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      const button = getByTestId('apple-sign-in-button') || { props: { onPress: jest.fn() } };
      await button.props.onPress();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockOnError).toHaveBeenCalledWith('Apple Sign In was cancelled');
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Component props', () => {
    it('respects disabled prop', () => {
      render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          disabled={true}
        />
      );
      
      expect(AppleAuthentication.AppleAuthenticationButton).toHaveBeenCalledWith(
        expect.objectContaining({
          disabled: true,
        }),
        expect.any(Object)
      );
    });

    it('uses correct button styling', () => {
      render(
        <AppleSignInButton 
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      );
      
      expect(AppleAuthentication.AppleAuthenticationButton).toHaveBeenCalledWith(
        expect.objectContaining({
          buttonType: AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
          buttonStyle: AppleAuthentication.AppleAuthenticationButtonStyle.BLACK,
          cornerRadius: 12,
          style: {
            width: '100%',
            height: 50,
          },
        }),
        expect.any(Object)
      );
    });
  });
});