import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock dependencies first
jest.mock('../../services/clubService');
jest.mock('../../hooks/useLocation');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

import { CreateClubForm } from '../../components/CreateClubForm';
import { ClubService } from '../../services/clubService';
import { useLocation } from '../../hooks/useLocation';
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('CreateClubForm', () => {
  let mockClubService: jest.Mocked<ClubService>;
  let mockUseLocation: jest.MockedFunction<typeof useLocation>;
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockClubService = {
      createClub: jest.fn(),
      getNearbyClubs: jest.fn(),
      calculateDistance: jest.fn(),
    } as any;

    mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>;
    mockUseLocation.mockReturnValue({
      location: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
      requestLocationPermission: jest.fn(),
      requestLocation: jest.fn(),
      error: null,
      loading: false,
    });

    (ClubService as jest.Mock).mockImplementation(() => mockClubService);
    
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      const { getByPlaceholderText, getByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Required form fields based on club-creation-flow.md
      expect(getByPlaceholderText('Riverside Tennis Club')).toBeTruthy();
      expect(getByPlaceholderText('A friendly community club for players of all levels...')).toBeTruthy();
      expect(getByPlaceholderText('San Francisco Bay Area')).toBeTruthy();
      expect(getByPlaceholderText('94102')).toBeTruthy();
      
      // Buttons
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Create Club')).toBeTruthy();
      expect(getByText('Use Current Location')).toBeTruthy();
    });

    it('should render header with back button and title', () => {
      const { getByText, getByTestId } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(getByTestId('back-button')).toBeTruthy();
      expect(getByText('Create Tennis Club')).toBeTruthy();
    });

    it('should have proper field labels', () => {
      const { getByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(getByText('Club Name')).toBeTruthy();
      expect(getByText('Description')).toBeTruthy();
      expect(getByText('Geographic Area')).toBeTruthy();
      expect(getByText('Zip Code (for discovery)')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should require club name', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Club name is required')).toBeTruthy();
      });
    });

    it('should require description', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const nameInput = getByPlaceholderText('Riverside Tennis Club');
      fireEvent.changeText(nameInput, 'Test Club');

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Description is required')).toBeTruthy();
      });
    });

    it('should require geographic area', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const nameInput = getByPlaceholderText('Riverside Tennis Club');
      const descInput = getByPlaceholderText('A friendly community club for players of all levels...');
      
      fireEvent.changeText(nameInput, 'Test Club');
      fireEvent.changeText(descInput, 'Test description');

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Geographic area is required')).toBeTruthy();
      });
    });

    it('should require zip code', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const nameInput = getByPlaceholderText('Riverside Tennis Club');
      const descInput = getByPlaceholderText('A friendly community club for players of all levels...');
      const areaInput = getByPlaceholderText('San Francisco Bay Area');
      
      fireEvent.changeText(nameInput, 'Test Club');
      fireEvent.changeText(descInput, 'Test description');
      fireEvent.changeText(areaInput, 'Test Area');

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Zip code is required')).toBeTruthy();
      });
    });

    it('should validate zip code format', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const zipInput = getByPlaceholderText('94102');
      fireEvent.changeText(zipInput, 'invalid-zip');

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Please enter a valid zip code')).toBeTruthy();
      });
    });

    it('should accept valid zip code formats', async () => {
      const { getByPlaceholderText, queryByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const zipInput = getByPlaceholderText('94102');
      
      // Test 5-digit zip
      fireEvent.changeText(zipInput, '94102');
      expect(queryByText('Please enter a valid zip code')).toBeFalsy();

      // Test 9-digit zip
      fireEvent.changeText(zipInput, '94102-1234');
      expect(queryByText('Please enter a valid zip code')).toBeFalsy();
    });
  });

  describe('Use Current Location Feature', () => {
    it('should auto-fill geographic area when using current location', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const useLocationButton = getByText('Use Current Location');
      fireEvent.press(useLocationButton);

      await waitFor(() => {
        const areaInput = getByPlaceholderText('San Francisco Bay Area');
        expect(areaInput.props.value).toContain('San Francisco');
      });
    });

    it('should estimate zip code from coordinates', async () => {
      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const useLocationButton = getByText('Use Current Location');
      fireEvent.press(useLocationButton);

      await waitFor(() => {
        const zipInput = getByPlaceholderText('94102');
        expect(zipInput.props.value).toMatch(/^\d{5}$/);
      });
    });

    it('should show error when location is unavailable', async () => {
      mockUseLocation.mockReturnValue({
        location: null,
        requestLocationPermission: jest.fn(),
        requestLocation: jest.fn(),
        error: 'Location permission denied',
        loading: false,
      });

      const { getByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const useLocationButton = getByText('Use Current Location');
      fireEvent.press(useLocationButton);

      await waitFor(() => {
        expect(getByText('Unable to get current location')).toBeTruthy();
      });
    });

    it('should disable location button while loading', () => {
      mockUseLocation.mockReturnValue({
        location: null,
        requestLocationPermission: jest.fn(),
        requestLocation: jest.fn(),
        error: null,
        loading: true,
      });

      const { getByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // When loading, the button text changes to "Getting Location..."
      expect(getByText('Getting Location...')).toBeTruthy();
      // And the normal text should not be present
      expect(() => getByText('Use Current Location')).toThrow();
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      name: 'Test Tennis Club',
      description: 'A great place to play tennis',
      area: 'San Francisco Bay Area',
      zipCode: '94102',
    };

    it('should create club with valid data', async () => {
      const mockCreatedClub = {
        id: 'new-club-123',
        name: validFormData.name,
        description: validFormData.description,
        location: validFormData.area,
        lat: 37.7749,
        lng: -122.4194,
        creator_id: 'current-user-id',
        created_at: new Date().toISOString(),
      };

      mockClubService.createClub.mockResolvedValue(mockCreatedClub);

      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Riverside Tennis Club'), validFormData.name);
      fireEvent.changeText(getByPlaceholderText('A friendly community club for players of all levels...'), validFormData.description);
      fireEvent.changeText(getByPlaceholderText('San Francisco Bay Area'), validFormData.area);
      fireEvent.changeText(getByPlaceholderText('94102'), validFormData.zipCode);

      // Submit
      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockClubService.createClub).toHaveBeenCalledWith({
          name: validFormData.name,
          description: validFormData.description,
          location: validFormData.area,
          zipCode: validFormData.zipCode,
          lat: 37.7749,
          lng: -122.4194,
          creator_id: 'current-user-id',
        });
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCreatedClub);
      });
    });

    it('should show loading state during submission', async () => {
      mockClubService.createClub.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Riverside Tennis Club'), validFormData.name);
      fireEvent.changeText(getByPlaceholderText('A friendly community club for players of all levels...'), validFormData.description);
      fireEvent.changeText(getByPlaceholderText('San Francisco Bay Area'), validFormData.area);
      fireEvent.changeText(getByPlaceholderText('94102'), validFormData.zipCode);

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Creating Club...')).toBeTruthy();
      });
      
      // Verify loading state is shown and normal text is not present
      expect(getByText('Creating Club...')).toBeTruthy();
      expect(() => getByText('Create Club')).toThrow();
    });

    it('should handle creation errors gracefully', async () => {
      const errorMessage = 'Failed to create club';
      mockClubService.createClub.mockRejectedValue(new Error(errorMessage));

      const { getByText, getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Riverside Tennis Club'), validFormData.name);
      fireEvent.changeText(getByPlaceholderText('A friendly community club for players of all levels...'), validFormData.description);
      fireEvent.changeText(getByPlaceholderText('San Francisco Bay Area'), validFormData.area);
      fireEvent.changeText(getByPlaceholderText('94102'), validFormData.zipCode);

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Failed to create club. Please try again.')).toBeTruthy();
      });
    });
  });

  describe('Navigation and Cancellation', () => {
    it('should call onCancel when Cancel button is pressed', () => {
      const { getByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const cancelButton = getByText('Cancel');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should call onCancel when back button is pressed', () => {
      const { getByTestId } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should prevent submission when form is invalid', async () => {
      const { getByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockClubService.createClub).not.toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      expect(getByLabelText('Club Name')).toBeTruthy();
      expect(getByLabelText('Description')).toBeTruthy();
      expect(getByLabelText('Geographic Area')).toBeTruthy();
      expect(getByLabelText('Zip Code')).toBeTruthy();
    });

    it('should announce form errors for screen readers', async () => {
      const { getByText, getByRole } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        const errorMessage = getByRole('alert');
        expect(errorMessage).toBeTruthy();
      });
    });
  });

  describe('Form State Management', () => {
    it('should maintain form data when switching between fields', () => {
      const { getByPlaceholderText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      const nameInput = getByPlaceholderText('Riverside Tennis Club');
      const descInput = getByPlaceholderText('A friendly community club for players of all levels...');

      fireEvent.changeText(nameInput, 'My Club');
      fireEvent.changeText(descInput, 'Great description');

      expect(nameInput.props.value).toBe('My Club');
      expect(descInput.props.value).toBe('Great description');
    });

    it('should clear error messages when user starts typing', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
        <CreateClubForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
      );

      // Trigger validation error
      const createButton = getByText('Create Club');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getByText('Club name is required')).toBeTruthy();
      });

      // Start typing
      const nameInput = getByPlaceholderText('Riverside Tennis Club');
      fireEvent.changeText(nameInput, 'T');

      expect(queryByText('Club name is required')).toBeFalsy();
    });
  });
});