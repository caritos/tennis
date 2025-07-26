import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CreateClubButton } from '../../components/CreateClubButton';

describe('CreateClubButton UI Updates', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Single Plus Icon Fix', () => {
    it('should render only one plus sign (from icon, not text)', () => {
      const { queryAllByText, getByText } = render(
        <CreateClubButton onPress={mockOnPress} />
      );

      // Should have button text without plus
      expect(getByText('Create Club')).toBeTruthy();
      
      // Should only have one plus sign in the entire component (from icon)
      const plusSigns = queryAllByText('+');
      expect(plusSigns.length).toBe(1);
    });

    it('should not have plus in the default text prop', () => {
      const { getByText, queryByText } = render(
        <CreateClubButton onPress={mockOnPress} />
      );

      // Text should be "Create Club" not "+ Create Club"
      expect(getByText('Create Club')).toBeTruthy();
      expect(queryByText('+ Create Club')).toBeNull();
    });

    it('should render plus icon separately from text', () => {
      const { getByText, getByTestId } = render(
        <CreateClubButton onPress={mockOnPress} />
      );

      // Icon container should exist
      expect(getByTestId('create-club-icon')).toBeTruthy();
      
      // Text should exist without plus
      expect(getByText('Create Club')).toBeTruthy();
    });
  });

  describe('Custom Text Prop', () => {
    it('should accept custom text without affecting icon', () => {
      const { getByText, queryAllByText } = render(
        <CreateClubButton 
          onPress={mockOnPress} 
          text="Custom Text"
        />
      );

      expect(getByText('Custom Text')).toBeTruthy();
      
      // Should still have only one plus sign (from icon)
      const plusSigns = queryAllByText('+');
      expect(plusSigns.length).toBe(1);
    });

    it('should not add extra plus if custom text includes it', () => {
      const { getByText, getByTestId } = render(
        <CreateClubButton 
          onPress={mockOnPress} 
          text="+ Custom Text"
        />
      );

      expect(getByText('+ Custom Text')).toBeTruthy();
      
      // Should have icon plus and text plus
      expect(getByTestId('create-club-icon')).toBeTruthy();
    });
  });

  describe('Icon Visibility', () => {
    it('should show icon by default', () => {
      const { getByTestId } = render(
        <CreateClubButton onPress={mockOnPress} />
      );

      expect(getByTestId('create-club-icon')).toBeTruthy();
    });

    it('should hide icon when showIcon is false', () => {
      const { queryByTestId, getByText } = render(
        <CreateClubButton 
          onPress={mockOnPress} 
          showIcon={false}
        />
      );

      expect(queryByTestId('create-club-icon')).toBeNull();
      expect(getByText('Create Club')).toBeTruthy();
    });
  });

  describe('Button Functionality', () => {
    it('should call onPress when button is pressed', () => {
      const { getByText } = render(
        <CreateClubButton onPress={mockOnPress} />
      );

      fireEvent.press(getByText('Create Club'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should have correct accessibility properties', () => {
      const { getByRole } = render(
        <CreateClubButton onPress={mockOnPress} />
      );

      const button = getByRole('button');
      expect(button).toBeTruthy();
      expect(button.props.accessibilityLabel).toBe('Create new tennis club');
    });
  });
});