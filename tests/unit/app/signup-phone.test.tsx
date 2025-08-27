import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignUpPage from '@/app/signup';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      upsert: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

// Mock error handling utilities
jest.mock('@/utils/errorHandling', () => ({
  getAuthErrorMessage: jest.fn((error) => error.message || 'Auth error'),
  logError: jest.fn(),
}));

describe('SignUp - Phone Number Integration', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful signup by default
    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        session: null,
      },
      error: null,
    } as any);
  });

  describe('Phone number in signup data', () => {
    it('should include phone number in user_metadata when signing up', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(<SignUpPage />);

      // Fill out the form
      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your phone number'), '1234567890');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
      
      // Agree to terms
      const checkbox = getByTestId('terms-checkbox');
      fireEvent.press(checkbox);

      // Submit form
      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      // Wait for signup to be called
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'Test User',
              phone: '1234567890', // Phone should be included
            },
          },
        });
      });
    });

    it('should include trimmed phone number in user_metadata', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(<SignUpPage />);

      // Fill out form with phone that has whitespace
      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'Test User');
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your phone number'), '  1234567890  ');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
      
      // Agree to terms
      const checkbox = getByTestId('terms-checkbox');
      fireEvent.press(checkbox);

      // Submit form
      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      // Wait for signup to be called with trimmed phone
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'Test User',
              phone: '1234567890', // Should be trimmed
            },
          },
        });
      });
    });

    it('should validate phone number before signup', async () => {
      const { getByTestId, getByText, queryByText } = render(<SignUpPage />);

      // Fill out form with invalid phone (too short)
      fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      fireEvent.changeText(getByTestId('phone-input'), '123'); // Too short
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
      
      // Agree to terms
      const checkbox = getByTestId('terms-checkbox');
      fireEvent.press(checkbox);

      // Submit form
      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      // Should show validation error and NOT call signup
      await waitFor(() => {
        expect(queryByText(/valid phone number/i)).toBeTruthy();
        expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
      });
    });

    it('should require phone number for signup', async () => {
      const { getByTestId, getByText, queryByText } = render(<SignUpPage />);

      // Fill out form without phone number
      fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
      fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
      // Skip phone number
      fireEvent.changeText(getByTestId('password-input'), 'password123');
      fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
      
      // Agree to terms
      const checkbox = getByTestId('terms-checkbox');
      fireEvent.press(checkbox);

      // Submit form
      const signUpButton = getByText('Create Account');
      fireEvent.press(signUpButton);

      // Should show validation error and NOT call signup
      await waitFor(() => {
        expect(queryByText(/enter your phone number/i)).toBeTruthy();
        expect(mockSupabase.auth.signUp).not.toHaveBeenCalled();
      });
    });
  });

  describe('Phone number formatting', () => {
    it('should accept phone numbers with various formats', async () => {
      const testCases = [
        '1234567890',
        '(123) 456-7890', 
        '123-456-7890',
        '+1 123 456 7890',
        '123.456.7890'
      ];

      for (const phoneInput of testCases) {
        jest.clearAllMocks();
        
        const { getByTestId, getByText } = render(<SignUpPage />);

        // Fill out form
        fireEvent.changeText(getByTestId('fullname-input'), 'Test User');
        fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
        fireEvent.changeText(getByTestId('phone-input'), phoneInput);
        fireEvent.changeText(getByTestId('password-input'), 'password123');
        fireEvent.changeText(getByTestId('confirm-password-input'), 'password123');
        
        // Agree to terms
        const checkbox = getByTestId('terms-checkbox');
        fireEvent.press(checkbox);

        // Submit form
        const signUpButton = getByText('Create Account');
        fireEvent.press(signUpButton);

        // Should accept the phone format and call signup
        await waitFor(() => {
          expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
            options: {
              data: {
                full_name: 'Test User',
                phone: phoneInput.trim(), // Should include the phone as entered
              },
            },
          });
        });
      }
    });
  });
});