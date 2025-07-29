import { useState } from 'react';
import * as Location from 'expo-location';

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  requestLocationPermission: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
      });
    } catch (err) {
      setError(`Failed to get location: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async (): Promise<void> => {
    try {
      // First check if permission is already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        // If already granted, just get the location
        await requestLocation();
        return;
      }

      // Request permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        // If permission is granted, also get the location
        await requestLocation();
      } else if (status === 'denied') {
        setError('Location access denied. You can enable it in Settings to discover nearby tennis clubs.');
      } else {
        setError('Location permission is required to discover nearby tennis clubs.');
      }
    } catch (err) {
      console.error('Location permission error:', err);
      setError(`Unable to access location: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return {
    location,
    loading,
    error,
    requestLocation,
    requestLocationPermission,
  };
}