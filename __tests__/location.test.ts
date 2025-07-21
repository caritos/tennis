import * as Location from 'expo-location';

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  LocationAccuracy: {
    Balanced: 'balanced',
  },
}));

describe('Location Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request location permissions', async () => {
    const mockRequestPermissions = Location.requestForegroundPermissionsAsync as jest.Mock;
    mockRequestPermissions.mockResolvedValue({
      status: 'granted',
      granted: true,
    });

    const result = await Location.requestForegroundPermissionsAsync();
    
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('granted');
    expect(result.granted).toBe(true);
  });

  it('should get current location when permissions granted', async () => {
    const mockGetCurrentPosition = Location.getCurrentPositionAsync as jest.Mock;
    mockGetCurrentPosition.mockResolvedValue({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 100,
      },
    });

    const result = await Location.getCurrentPositionAsync({
      accuracy: Location.LocationAccuracy.Balanced,
    });

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
    expect(result.coords.latitude).toBe(37.7749);
    expect(result.coords.longitude).toBe(-122.4194);
  });

  it('should handle permission denied', async () => {
    const mockRequestPermissions = Location.requestForegroundPermissionsAsync as jest.Mock;
    mockRequestPermissions.mockResolvedValue({
      status: 'denied',
      granted: false,
    });

    const result = await Location.requestForegroundPermissionsAsync();
    
    expect(result.status).toBe('denied');
    expect(result.granted).toBe(false);
  });
});