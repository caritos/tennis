import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileTab from '@/components/profile/ProfileTab';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: jest.fn(() => Promise.resolve({ error: null })),
    })),
    auth: {
      updateUser: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

jest.spyOn(Alert, 'alert');

describe('ProfileTab - Phone Number Display and Persistence', () => {
  const mockColors = {
    text: '#000000',
    background: '#FFFFFF',
    tabIconDefault: '#666666',
    tint: '#007AFF',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Phone number from signup user_metadata', () => {
    it('should display phone number from user.phone field', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        phone: '+1234567890', // Direct phone field
        user_metadata: {
          full_name: 'Test User',
        },
      };

      const { getByDisplayValue } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Phone number should be displayed
      const phoneInput = getByDisplayValue('+1234567890');
      expect(phoneInput).toBeTruthy();
    });

    it('should display phone number from user_metadata.phone field', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          phone: '+1234567890', // Phone from metadata (signup)
        },
      };

      const { getByDisplayValue } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Phone number from metadata should be displayed
      const phoneInput = getByDisplayValue('+1234567890');
      expect(phoneInput).toBeTruthy();
    });

    it('should prioritize user.phone over user_metadata.phone', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        phone: '+1111111111', // Direct field (priority)
        user_metadata: {
          full_name: 'Test User',
          phone: '+2222222222', // Metadata field
        },
      };

      const { getByDisplayValue } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Should show direct phone field, not metadata
      const phoneInput = getByDisplayValue('+1111111111');
      expect(phoneInput).toBeTruthy();
    });

    it('should show placeholder when no phone is available', () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          // No phone in metadata
        },
        // No direct phone field
      };

      const { getByPlaceholderText } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Should show placeholder
      const phoneInput = getByPlaceholderText('Enter your phone number');
      expect(phoneInput).toBeTruthy();
    });
  });

  describe('Phone number persistence after signup', () => {
    it('should update both database and auth when phone is changed', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        phone: '+1234567890',
        user_metadata: {
          full_name: 'Test User',
        },
      };

      const onUserUpdate = jest.fn();
      const { getByDisplayValue, getByText } = render(
        <ProfileTab 
          user={mockUser} 
          colors={mockColors} 
          onUserUpdate={onUserUpdate}
        />
      );

      const phoneInput = getByDisplayValue('+1234567890');
      
      // Change phone number
      fireEvent.changeText(phoneInput, '+9999999999');
      
      // Save changes
      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        // Should update users table in database
        expect(supabase.from).toHaveBeenCalledWith('users');
        
        // Should include updated phone in database update
        const mockUpsert = supabase.from('users').upsert as jest.Mock;
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+9999999999',
          })
        );
        
        // Should show success message
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile updated successfully!');
      });
    });

    it('should handle phone updates for users created via signup', async () => {
      // User created via signup (phone in metadata initially)
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          phone: '+1234567890', // From signup
        },
      };

      const { getByDisplayValue, getByText } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Phone from metadata should be displayed
      const phoneInput = getByDisplayValue('+1234567890');
      
      // Update phone
      fireEvent.changeText(phoneInput, '+5555555555');
      
      // Save
      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        // Should save to database (moves from metadata to direct field)
        const mockUpsert = supabase.from('users').upsert as jest.Mock;
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '+5555555555',
          })
        );
      });
    });
  });

  describe('Phone number validation in profile', () => {
    it('should allow saving valid phone numbers', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        phone: '',
        user_metadata: {
          full_name: 'Test User',
        },
      };

      const { getByPlaceholderText, getByText } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      const phoneInput = getByPlaceholderText('Enter your phone number');
      
      // Enter valid phone
      fireEvent.changeText(phoneInput, '+1234567890');
      
      // Save button should appear
      const saveButton = getByText('Save Changes');
      expect(saveButton).toBeTruthy();
      
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        // Should successfully save
        expect(supabase.from).toHaveBeenCalledWith('users');
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile updated successfully!');
      });
    });

    it('should handle empty phone number gracefully', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        phone: '+1234567890',
        user_metadata: {
          full_name: 'Test User',
        },
      };

      const { getByDisplayValue, getByText } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      const phoneInput = getByDisplayValue('+1234567890');
      
      // Clear phone number
      fireEvent.changeText(phoneInput, '');
      
      // Save
      const saveButton = getByText('Save Changes');
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        // Should save empty string
        const mockUpsert = supabase.from('users').upsert as jest.Mock;
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: '',
          })
        );
      });
    });
  });
});