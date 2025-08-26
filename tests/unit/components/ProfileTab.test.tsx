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

describe('ProfileTab', () => {
  const mockColors = {
    text: '#000000',
    background: '#FFFFFF',
    tabIconDefault: '#666666',
    tint: '#007AFF',
  };

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    phone: '+1234567890',
    user_metadata: {
      full_name: 'Test User',
      phone: '+1234567890',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Issue #98: Phone number display', () => {
    it('should display phone number from user.phone field', () => {
      const { getByDisplayValue } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Phone number should be displayed in the input field
      const phoneInput = getByDisplayValue('+1234567890');
      expect(phoneInput).toBeTruthy();
    });

    it('should fall back to user_metadata.phone if user.phone is not available', () => {
      const userWithoutDirectPhone = {
        ...mockUser,
        phone: undefined,
        user_metadata: {
          full_name: 'Test User',
          phone: '+9876543210',
        },
      };

      const { getByDisplayValue } = render(
        <ProfileTab user={userWithoutDirectPhone} colors={mockColors} />
      );

      // Should use phone from user_metadata
      const phoneInput = getByDisplayValue('+9876543210');
      expect(phoneInput).toBeTruthy();
    });

    it('should show placeholder when no phone number is available', () => {
      const userWithoutPhone = {
        ...mockUser,
        phone: undefined,
        user_metadata: {
          full_name: 'Test User',
          phone: undefined,
        },
      };

      const { getByPlaceholderText } = render(
        <ProfileTab user={userWithoutPhone} colors={mockColors} />
      );

      // Should show placeholder text
      const phoneInput = getByPlaceholderText('Enter your phone number');
      expect(phoneInput).toBeTruthy();
      expect(phoneInput.props.value).toBe('');
    });

    it('should allow editing and saving phone number', async () => {
      const onUserUpdate = jest.fn();
      const { getByDisplayValue, getByText, getByPlaceholderText } = render(
        <ProfileTab 
          user={mockUser} 
          colors={mockColors} 
          onUserUpdate={onUserUpdate}
        />
      );

      const phoneInput = getByDisplayValue('+1234567890');
      
      // Change phone number
      fireEvent.changeText(phoneInput, '+1111111111');
      
      // Save button should appear
      const saveButton = getByText('Save Changes');
      expect(saveButton).toBeTruthy();
      
      // Mock successful save
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn(() => Promise.resolve({ error: null })),
      });
      
      // Click save
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile updated successfully!');
      });
      
      // Verify the database update was called with correct phone
      expect(supabase.from).toHaveBeenCalledWith('users');
      const upsertCall = (supabase.from as jest.Mock).mock.results[0].value.upsert;
      expect(upsertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+1111111111',
        })
      );
    });
  });

  describe('Profile data persistence', () => {
    it('should show loading state when user is null', () => {
      const { getByText } = render(
        <ProfileTab user={null} colors={mockColors} />
      );

      expect(getByText('Loading profile...')).toBeTruthy();
    });

    it('should handle timing issues with user data loading', () => {
      const { getByText, rerender, getByDisplayValue } = render(
        <ProfileTab user={null} colors={mockColors} />
      );

      // Initially shows loading
      expect(getByText('Loading profile...')).toBeTruthy();

      // User data loads
      rerender(<ProfileTab user={mockUser} colors={mockColors} />);

      // Phone should now be displayed
      expect(getByDisplayValue('+1234567890')).toBeTruthy();
    });

    it('should maintain phone number after component re-render', () => {
      const { getByDisplayValue, rerender } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Initial render - phone should be displayed
      expect(getByDisplayValue('+1234567890')).toBeTruthy();

      // Re-render with same props
      rerender(<ProfileTab user={mockUser} colors={mockColors} />);

      // Phone should still be displayed
      expect(getByDisplayValue('+1234567890')).toBeTruthy();
    });

    it('should update display when user prop changes', () => {
      const { getByDisplayValue, rerender } = render(
        <ProfileTab user={mockUser} colors={mockColors} />
      );

      // Initial phone
      expect(getByDisplayValue('+1234567890')).toBeTruthy();

      // Update user with new phone
      const updatedUser = {
        ...mockUser,
        phone: '+5555555555',
      };

      rerender(<ProfileTab user={updatedUser} colors={mockColors} />);

      // New phone should be displayed
      expect(getByDisplayValue('+5555555555')).toBeTruthy();
    });
  });
});