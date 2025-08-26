import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FormHeader from '../../../components/FormHeader';

describe('FormHeader Component', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title correctly', () => {
    const { getByText } = render(
      <FormHeader title="Test Title" onBack={mockOnBack} />
    );
    
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('renders back button and calls onBack when pressed', () => {
    const { getByRole } = render(
      <FormHeader title="Test Title" onBack={mockOnBack} />
    );
    
    const backButton = getByRole('button');
    expect(backButton).toBeTruthy();
    
    fireEvent.press(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('renders back button with correct accessibility label', () => {
    const { getByLabelText } = render(
      <FormHeader title="Test Title" onBack={mockOnBack} />
    );
    
    expect(getByLabelText('Go back')).toBeTruthy();
  });

  it('renders optional right action when provided', () => {
    const RightAction = () => <button testID="right-action">Settings</button>;
    
    const { getByTestId } = render(
      <FormHeader 
        title="Test Title" 
        onBack={mockOnBack} 
        rightAction={<RightAction />} 
      />
    );
    
    expect(getByTestId('right-action')).toBeTruthy();
  });

  it('does not render right action when not provided', () => {
    const { queryByTestId } = render(
      <FormHeader title="Test Title" onBack={mockOnBack} />
    );
    
    expect(queryByTestId('right-action')).toBeNull();
  });

  it('applies correct styling structure', () => {
    const { getByTestId } = render(
      <FormHeader title="Test Title" onBack={mockOnBack} />
    );
    
    const container = getByTestId('form-header-container');
    expect(container).toBeTruthy();
    
    // Style can be an array, so flatten it first
    const style = Array.isArray(container.props.style) 
      ? Object.assign({}, ...container.props.style.filter(Boolean))
      : container.props.style;
    
    expect(style).toEqual(
      expect.objectContaining({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      })
    );
  });

  it('centers title when no right action is provided', () => {
    const { getByTestId } = render(
      <FormHeader title="Test Title" onBack={mockOnBack} />
    );
    
    const titleContainer = getByTestId('title-container');
    expect(titleContainer.props.style).toEqual(
      expect.objectContaining({
        flex: 1,
        alignItems: 'center',
      })
    );
  });

  it('handles long titles appropriately', () => {
    const longTitle = 'This is a very long title that might overflow';
    const { getByText } = render(
      <FormHeader title={longTitle} onBack={mockOnBack} />
    );
    
    const titleElement = getByText(longTitle);
    expect(titleElement.props.numberOfLines).toBe(1);
  });

  it('uses themed colors correctly', () => {
    const { getByText } = render(
      <FormHeader title="Test Title" onBack={mockOnBack} />
    );
    
    const titleElement = getByText('Test Title');
    
    // Style can be an array, so flatten it first
    const style = Array.isArray(titleElement.props.style) 
      ? Object.assign({}, ...titleElement.props.style.filter(Boolean))
      : titleElement.props.style;
    
    // Title should use themed text color
    expect(style).toEqual(
      expect.objectContaining({
        color: expect.any(String),
      })
    );
  });
});