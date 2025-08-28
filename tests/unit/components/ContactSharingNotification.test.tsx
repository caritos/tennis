import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContactSharingNotification } from '@/components/ContactSharingNotification';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      unsubscribe: jest.fn(),
    })),
  }
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light')
}));

jest.mock('@/constants/Colors', () => ({
  Colors: {
    light: {
      card: '#ffffff',
      text: '#000000',
      textSecondary: '#666666',
      tint: '#007AFF'
    },
    dark: {
      card: '#1a1a1a',
      text: '#ffffff', 
      textSecondary: '#999999',
      tint: '#0A84FF'
    }
  }
}));

describe('ContactSharingNotification', () => {
  let mockSupabaseFrom: jest.MockedFunction<typeof supabase.from>;
  let mockUseAuth: jest.MockedFunction<typeof useAuth>;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockUpdate: jest.Mock;

  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '5551234567'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Supabase chain methods
    mockOrder = jest.fn();
    // Create a chainable mock that returns itself for multiple .eq() calls
    const chainableMock = {
      eq: jest.fn(),
      order: mockOrder
    };
    chainableMock.eq.mockReturnValue(chainableMock); // Allow chaining
    
    mockEq = chainableMock.eq;
    mockSelect = jest.fn().mockReturnValue(chainableMock);
    mockUpdate = jest.fn().mockReturnValue(chainableMock);

    mockSupabaseFrom = supabase.from as jest.MockedFunction<typeof supabase.from>;
    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate
    } as any);

    mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isFirstTimeUser: false,
      isOnboardingComplete: true,
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      updateProfile: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render null when no user is provided', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isFirstTimeUser: false,
        isOnboardingComplete: true,
        signUp: jest.fn(),
        signIn: jest.fn(),
        signOut: jest.fn(),
        updateProfile: jest.fn()
      });

      const { container } = render(<ContactSharingNotification />);
      expect(container.children).toHaveLength(0);
    });

    it('should show loading state initially', () => {
      mockOrder.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<ContactSharingNotification />);
      
      // Component should render nothing during loading
      expect(screen.queryByText('Contact Info Shared')).toBeNull();
    });

    it('should render null when no notifications exist', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null
      });

      const { container } = render(<ContactSharingNotification />);
      
      await waitFor(() => {
        expect(container.children).toHaveLength(0);
      });
    });
  });

  describe('Notification Loading', () => {
    it('should load and filter contact sharing notifications correctly', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'test-user-123',
          type: 'challenge',
          title: '🎾 Challenge Accepted - Contact Info Shared',
          message: 'John Doe accepted your singles challenge! Contact: John Doe: 5559876543',
          is_read: false,
          created_at: '2025-08-23T10:00:00Z'
        },
        {
          id: 'notif-2',
          user_id: 'test-user-123',
          type: 'challenge',
          title: 'Regular Challenge Notification',
          message: 'Regular challenge message',
          is_read: false,
          created_at: '2025-08-23T09:00:00Z'
        },
        {
          id: 'notif-3',
          user_id: 'test-user-123',
          type: 'challenge',
          title: 'All 4 Players Ready - Contact Info Shared',
          message: 'Doubles match ready with contact info',
          is_read: false,
          created_at: '2025-08-23T11:00:00Z'
        }
      ];

      mockOrder.mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
      });

      // Should filter to only contact sharing notifications
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'test-user-123');
      expect(mockEq).toHaveBeenCalledWith('is_read', false);
      expect(mockEq).toHaveBeenCalledWith('type', 'challenge');
    });

    it('should handle database errors gracefully', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '❌ ContactSharingNotification: Failed to load notifications:',
          { message: 'Database connection failed' }
        );
      });

      expect(container.children).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Notification Display', () => {
    const mockContactNotification = {
      id: 'contact-notif-1',
      user_id: 'test-user-123',
      type: 'challenge',
      title: '🎾 Challenge Accepted - Contact Info Shared',
      message: 'Jane Smith accepted your singles challenge! Contact: Jane Smith: 5559876543',
      is_read: false,
      created_at: '2025-08-23T10:00:00Z'
    };

    it('should display single contact sharing notification', async () => {
      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
        expect(screen.getByText('Jane Smith accepted your singles challenge! Contact: Jane Smith: 5559876543')).toBeTruthy();
      });
    });

    it('should display count when multiple notifications exist', async () => {
      const multipleNotifications = [
        mockContactNotification,
        {
          ...mockContactNotification,
          id: 'contact-notif-2',
          message: 'Another contact sharing notification'
        },
        {
          ...mockContactNotification,
          id: 'contact-notif-3',
          message: 'Third contact sharing notification'
        }
      ];

      mockOrder.mockResolvedValue({
        data: multipleNotifications,
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.getByText('+2 more contact sharing notifications')).toBeTruthy();
      });
    });

    it('should handle long messages with numberOfLines limit', async () => {
      const longMessageNotification = {
        ...mockContactNotification,
        message: 'This is a very long notification message that should be truncated after three lines to ensure the notification card does not become too tall and maintains good user experience in the interface.'
      };

      mockOrder.mockResolvedValue({
        data: [longMessageNotification],
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        const messageElement = screen.getByText(longMessageNotification.message);
        expect(messageElement.props.numberOfLines).toBe(3);
      });
    });

    it('should show "View Contact Details" button when onViewAll prop is provided', async () => {
      const mockOnViewAll = jest.fn();

      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      render(<ContactSharingNotification onViewAll={mockOnViewAll} />);

      await waitFor(() => {
        expect(screen.getByText('View Contact Details')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('View Contact Details'));
      expect(mockOnViewAll).toHaveBeenCalledTimes(1);
    });

    it('should not show "View Contact Details" button when onViewAll prop is not provided', async () => {
      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.queryByText('View Contact Details')).toBeNull();
      });
    });
  });

  describe('Notification Dismissal', () => {
    const mockContactNotification = {
      id: 'contact-notif-1',
      user_id: 'test-user-123',
      type: 'challenge',
      title: '🎾 Challenge Accepted - Contact Info Shared',
      message: 'Test notification message',
      is_read: false,
      created_at: '2025-08-23T10:00:00Z'
    };

    it('should mark notification as read when close button is pressed', async () => {
      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      mockEq.mockResolvedValue({
        data: null,
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
      });

      // Find and press close button
      const closeButton = screen.getByLabelText('Close notification') || screen.getByTestId('close-button');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ is_read: true });
        expect(mockEq).toHaveBeenCalledWith('id', 'contact-notif-1');
      });
    });

    it('should handle dismiss errors gracefully', async () => {
      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      mockEq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
      });

      const closeButton = screen.getByLabelText('Close notification') || screen.getByTestId('close-button');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to mark notification as read:',
          { message: 'Update failed' }
        );
      });

      consoleSpy.mockRestore();
    });

    it('should remove notification from UI after successful dismissal', async () => {
      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      mockEq.mockResolvedValue({
        data: null,
        error: null
      });

      const { container } = render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
      });

      const closeButton = screen.getByLabelText('Close notification') || screen.getByTestId('close-button');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(container.children).toHaveLength(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle notifications without messages', async () => {
      const noMessageNotification = {
        id: 'no-message-notif',
        user_id: 'test-user-123', 
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: null,
        is_read: false,
        created_at: '2025-08-23T10:00:00Z'
      };

      mockOrder.mockResolvedValue({
        data: [noMessageNotification],
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
      });

      // Should not crash when message is null
      expect(screen.queryByText('null')).toBeNull();
    });

    it('should handle empty notification arrays', async () => {
      mockOrder.mockResolvedValue({
        data: [],
        error: null
      });

      const { container } = render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(container.children).toHaveLength(0);
      });
    });

    it('should handle null notification data', async () => {
      mockOrder.mockResolvedValue({
        data: null,
        error: null
      });

      const { container } = render(<ContactSharingNotification />);

      await waitFor(() => {
        expect(container.children).toHaveLength(0);
      });
    });

    it('should filter notifications correctly with various title patterns', async () => {
      const mixedNotifications = [
        {
          id: '1',
          title: '🎾 Challenge Accepted - Contact Info Shared',
          type: 'challenge'
        },
        {
          id: '2', 
          title: 'All 4 Players Ready - Contact Sharing',
          type: 'challenge'
        },
        {
          id: '3',
          title: 'Contact Info Shared for Match',
          type: 'challenge'
        },
        {
          id: '4',
          title: 'All 4 Players Ready - Let\'s Play!',
          type: 'challenge'
        },
        {
          id: '5',
          title: 'Regular Challenge Notification',
          type: 'challenge'
        }
      ];

      mockOrder.mockResolvedValue({
        data: mixedNotifications,
        error: null
      });

      render(<ContactSharingNotification />);

      // Should filter to show notifications with "Contact Info Shared" or "All 4 Players Ready"
      await waitFor(() => {
        expect(screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
      });

      // Should show count for multiple matching notifications
      expect(screen.getByText('+2 more contact sharing notifications')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      const mockContactNotification = {
        id: 'contact-notif-1',
        user_id: 'test-user-123',
        type: 'challenge', 
        title: '🎾 Challenge Accepted - Contact Info Shared',
        message: 'Test message',
        is_read: false,
        created_at: '2025-08-23T10:00:00Z'
      };

      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close notification') || screen.getByTestId('close-button');
        expect(closeButton).toBeTruthy();
      });
    });

    it('should support testID for automated testing', async () => {
      const mockContactNotification = {
        id: 'contact-notif-1',
        user_id: 'test-user-123',
        type: 'challenge',
        title: '🎾 Challenge Accepted - Contact Info Shared', 
        message: 'Test message',
        is_read: false,
        created_at: '2025-08-23T10:00:00Z'
      };

      mockOrder.mockResolvedValue({
        data: [mockContactNotification],
        error: null
      });

      render(<ContactSharingNotification />);

      await waitFor(() => {
        // Component should be testable via testID
        expect(screen.getByTestId('contact-sharing-notification') || screen.getByText('🎾 Challenge Accepted - Contact Info Shared')).toBeTruthy();
      });
    });
  });
});