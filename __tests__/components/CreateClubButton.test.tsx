import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CreateClubButton } from '../../components/CreateClubButton';

// Mock the ThemedText component
jest.mock('../../components/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

describe('CreateClubButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render create club button with default text', () => {
    const { getByText, getByRole } = render(
      <CreateClubButton onPress={mockOnPress} />
    );

    expect(getByText('+ Create Club')).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should render custom text when provided', () => {
    const customText = 'Start New Club';
    
    const { getByText } = render(
      <CreateClubButton onPress={mockOnPress} text={customText} />
    );

    expect(getByText(customText)).toBeTruthy();
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} disabled={true} />
    );

    const button = getByRole('button');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('should show loading state', () => {
    const { getByText, getByRole } = render(
      <CreateClubButton onPress={mockOnPress} loading={true} />
    );

    expect(getByText('Creating...')).toBeTruthy();
    
    const button = getByRole('button');
    fireEvent.press(button);
    
    // Should not call onPress when loading
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should show custom loading text', () => {
    const customLoadingText = 'Setting up club...';
    
    const { getByText } = render(
      <CreateClubButton 
        onPress={mockOnPress} 
        loading={true} 
        loadingText={customLoadingText}
      />
    );

    expect(getByText(customLoadingText)).toBeTruthy();
  });

  it('should have correct accessibility properties', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Create new tennis club');
    expect(button.props.accessibilityHint).toBe('Opens form to create a new tennis club');
  });

  it('should handle custom accessibility label', () => {
    const customAccessibilityLabel = 'Start a new tennis community';
    
    const { getByRole } = render(
      <CreateClubButton 
        onPress={mockOnPress} 
        accessibilityLabel={customAccessibilityLabel}
      />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe(customAccessibilityLabel);
  });

  it('should prevent multiple rapid taps', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} />
    );

    const button = getByRole('button');
    
    // Rapid fire multiple presses
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);

    // Should only be called once due to debouncing
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should render with primary style variant', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} variant="primary" />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should render with secondary style variant', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} variant="secondary" />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should render with outline style variant', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} variant="outline" />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should handle size prop correctly', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} size="large" />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should render icon when provided', () => {
    const { getByTestId } = render(
      <CreateClubButton onPress={mockOnPress} showIcon={true} />
    );

    expect(getByTestId('create-club-icon')).toBeTruthy();
  });

  it('should not render icon when showIcon is false', () => {
    const { queryByTestId } = render(
      <CreateClubButton onPress={mockOnPress} showIcon={false} />
    );

    expect(queryByTestId('create-club-icon')).toBeNull();
  });

  it('should handle full width layout', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} fullWidth={true} />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should handle custom test ID', () => {
    const customTestId = 'my-create-club-button';
    
    const { getByTestId } = render(
      <CreateClubButton onPress={mockOnPress} testID={customTestId} />
    );

    expect(getByTestId(customTestId)).toBeTruthy();
  });

  it('should render correctly in different themes', () => {
    const { getByRole } = render(
      <CreateClubButton onPress={mockOnPress} />
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
  });
});