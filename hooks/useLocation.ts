import { useState, useEffect, useCallback } from 'react';
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
  hasLocationPermission: boolean | null;
  requestLocation: () => Promise<void>;
  requestLocationPermission: () => Promise<void>;
}

export function useLocation(autoRequest: boolean = true): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  const requestLocation = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      if (currentStatus !== 'granted') {
        // Request permissions if not granted
        const { status } = await Location.requestForegroundPermissionsAsync();
        setHasLocationPermission(status === 'granted');
        
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }
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
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if permission is already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setHasLocationPermission(true);
        // If already granted, just get the location
        await requestLocation();
        return;
      }

      // Request permission if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
      
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
      setHasLocationPermission(false);
    } finally {
      setLoading(false);
    }
  }, [requestLocation]);

  // Check permission status on mount and auto-request if enabled
  useEffect(() => {
    const checkPermissionStatus = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setHasLocationPermission(status === 'granted');
        
        if (autoRequest) {
          if (status === 'undetermined') {
            // Auto-request permission if not yet determined
            await requestLocationPermission();
          } else if (status === 'granted') {
            // If already granted and auto-request is enabled, get location
            await requestLocation();
          }
        }
      } catch (err) {
        console.error('Error checking location permission:', err);
        setHasLocationPermission(false);
      }
    };

    checkPermissionStatus();
  }, [autoRequest, requestLocation, requestLocationPermission]);

  return {
    location,
    loading,
    error,
    hasLocationPermission,
    requestLocation,
    requestLocationPermission,
  };
}