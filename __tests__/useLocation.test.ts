import { renderHook, act } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useLocation } from '../hooks/useLocation';

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  LocationAccuracy: {
    Balanced: 'balanced',
  },
}));

describe('useLocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request location permissions and get current location', async () => {
    const mockRequestPermissions = Location.requestForegroundPermissionsAsync as jest.Mock;
    const mockGetCurrentPosition = Location.getCurrentPositionAsync as jest.Mock;
    
    mockRequestPermissions.mockResolvedValue({
      status: 'granted',
      granted: true,
    });
    
    mockGetCurrentPosition.mockResolvedValue({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 100,
      },
    });

    const { result } = renderHook(() => useLocation());

    expect(result.current.location).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.requestLocation();
    });

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
    expect(result.current.location).toEqual({
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 100,
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle permission denied', async () => {
    const mockRequestPermissions = Location.requestForegroundPermissionsAsync as jest.Mock;
    
    mockRequestPermissions.mockResolvedValue({
      status: 'denied',
      granted: false,
    });

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.requestLocation();
    });

    expect(result.current.location).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Location permission denied');
  });

  it('should handle location errors', async () => {
    const mockRequestPermissions = Location.requestForegroundPermissionsAsync as jest.Mock;
    const mockGetCurrentPosition = Location.getCurrentPositionAsync as jest.Mock;
    
    mockRequestPermissions.mockResolvedValue({
      status: 'granted',
      granted: true,
    });
    
    mockGetCurrentPosition.mockRejectedValue(new Error('Location unavailable'));

    const { result } = renderHook(() => useLocation());

    await act(async () => {
      await result.current.requestLocation();
    });

    expect(result.current.location).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to get location: Location unavailable');
  });

  it('should set loading state correctly', async () => {
    const mockRequestPermissions = Location.requestForegroundPermissionsAsync as jest.Mock;
    const mockGetCurrentPosition = Location.getCurrentPositionAsync as jest.Mock;
    
    // Simulate slow permission request
    let resolvePermissions: (value: any) => void;
    const permissionPromise = new Promise((resolve) => {
      resolvePermissions = resolve;
    });
    mockRequestPermissions.mockReturnValue(permissionPromise);
    
    mockGetCurrentPosition.mockResolvedValue({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 100,
      },
    });

    const { result } = renderHook(() => useLocation());

    expect(result.current.loading).toBe(false);

    // Start the request without awaiting
    act(() => {
      result.current.requestLocation();
    });

    expect(result.current.loading).toBe(true);

    // Resolve the permission request
    await act(async () => {
      resolvePermissions({
        status: 'granted',
        granted: true,
      });
    });

    expect(result.current.loading).toBe(false);
  });
});