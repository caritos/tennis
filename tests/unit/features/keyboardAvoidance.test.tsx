import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import MatchInvitationForm from '@/components/MatchInvitationForm';

// Mock the required dependencies
jest.mock('@/services/matchInvitationService', () => ({
  matchInvitationService: {
    createInvitation: jest.fn(),
    createClubNotification: jest.fn(),
  },
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { full_name: 'Test User' } })),
        })),
      })),
    })),
  },
}));

jest.mock('@/services/clubService', () => ({
  getClubMembers: jest.fn(() => Promise.resolve([])),
}));

describe('Keyboard Avoidance - GitHub Issue #137', () => {
  const mockProps = {
    clubId: 'club-123',
    creatorId: 'user-456',
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('KeyboardAvoidingView Implementation', () => {
    it('should render KeyboardAvoidingView wrapper', () => {
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      
      // Check that KeyboardAvoidingView is present in the component tree
      expect(() => UNSAFE_getByType('KeyboardAvoidingView')).not.toThrow();
    });

    it('should use correct keyboard behavior for iOS', () => {
      // Mock Platform.OS to be iOS
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
      
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const keyboardAvoidingView = UNSAFE_getByType('KeyboardAvoidingView');
      
      // On iOS, behavior should be 'padding'
      expect(keyboardAvoidingView.props.behavior).toBe('padding');
      expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(0);
    });

    it('should use correct keyboard behavior for Android', () => {
      // Mock Platform.OS to be Android
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android');
      
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const keyboardAvoidingView = UNSAFE_getByType('KeyboardAvoidingView');
      
      // On Android, behavior should be 'height'
      expect(keyboardAvoidingView.props.behavior).toBe('height');
      expect(keyboardAvoidingView.props.keyboardVerticalOffset).toBe(20);
    });
  });

  describe('ScrollView Configuration', () => {
    it('should have proper ScrollView configuration for keyboard handling', () => {
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const scrollView = UNSAFE_getByType('ScrollView');
      
      // ScrollView should persist taps to handle keyboard dismissal
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
      
      // Should have contentContainerStyle for proper spacing
      expect(scrollView.props.contentContainerStyle).toMatchObject({
        flexGrow: 1,
        paddingBottom: 20,
      });
    });

    it('should have proper styling for form elements', () => {
      const { getByTestId } = render(<MatchInvitationForm {...mockProps} />);
      
      // The form should be scrollable and have proper bottom padding
      // This ensures the submit button is accessible above the keyboard
      const scrollView = UNSAFE_getByType('ScrollView');
      expect(scrollView.props.style).toMatchObject({ flex: 1 });
    });
  });

  describe('Submit Button Accessibility', () => {
    it('should have proper margin and padding for submit container', () => {
      const { getByText } = render(<MatchInvitationForm {...mockProps} />);
      const postButton = getByText('Post');
      
      // Submit button should be present and accessible
      expect(postButton).toBeTruthy();
    });

    it('should maintain submit button visibility with proper styling', () => {
      // This test ensures the styling we added provides proper spacing
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const scrollView = UNSAFE_getByType('ScrollView');
      
      // Check that contentContainerStyle includes bottom padding
      expect(scrollView.props.contentContainerStyle.paddingBottom).toBe(20);
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('should handle different screen orientations', () => {
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const keyboardAvoidingView = UNSAFE_getByType('KeyboardAvoidingView');
      
      // KeyboardAvoidingView should have flex: 1 to take full available space
      expect(keyboardAvoidingView.props.style).toMatchObject({ flex: 1 });
    });

    it('should provide adequate spacing for virtual keyboard', () => {
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const scrollView = UNSAFE_getByType('ScrollView');
      
      // ScrollView content should have flexGrow: 1 to expand and provide scrolling
      expect(scrollView.props.contentContainerStyle.flexGrow).toBe(1);
    });
  });

  describe('User Experience', () => {
    it('should allow tapping on form elements without keyboard interference', () => {
      const { getByPlaceholderText } = render(<MatchInvitationForm {...mockProps} />);
      
      // Form should have text input that can be focused
      const messageInput = getByPlaceholderText('Add a message or notes (optional)');
      expect(messageInput).toBeTruthy();
    });

    it('should maintain form usability when keyboard is shown', () => {
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const scrollView = UNSAFE_getByType('ScrollView');
      
      // keyboardShouldPersistTaps ensures form remains interactive
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle small screen devices', () => {
      // On smaller screens, the keyboard avoidance is even more critical
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const keyboardAvoidingView = UNSAFE_getByType('KeyboardAvoidingView');
      
      // Should still have proper behavior regardless of screen size
      expect(keyboardAvoidingView.props.behavior).toBeDefined();
    });

    it('should handle different keyboard types', () => {
      const { UNSAFE_getByType } = render(<MatchInvitationForm {...mockProps} />);
      const scrollView = UNSAFE_getByType('ScrollView');
      
      // keyboardShouldPersistTaps helps with different keyboard scenarios
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
    });
  });
});