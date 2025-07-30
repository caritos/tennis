import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Check if we're in a development build or production (not Expo Go)
const isNativeModuleAvailable = Constants.appOwnership === 'standalone' || Constants.appOwnership === 'expo';

export function useNotificationListener() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Skip notification setup in Expo Go to avoid native module errors
    if (!isNativeModuleAvailable) {
      console.log('📱 Running in Expo Go - Push notifications disabled');
      return;
    }

    try {
      // Listen for notifications received while app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received:', notification);
        // Optional: Show custom in-app notification UI
      });

      // Listen for user interactions with notifications
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification response:', response);
        
        // Navigate based on notification type
        const { type, data } = response.notification.request.content.data as any;
        
        switch (type) {
          case 'challenge':
            router.push('/(tabs)'); // Navigate to clubs tab where challenges are visible
            break;
          case 'match_invitation':
            router.push('/(tabs)'); // Navigate to clubs tab for match invitations
            break;
          case 'match_result':
            router.push('/(tabs)/profile'); // Navigate to profile for match history
            break;
          case 'ranking_update':
            router.push('/(tabs)'); // Navigate to clubs tab for rankings
            break;
          default:
            router.push('/(tabs)'); // Default navigation
        }
      });

    } catch (error) {
      console.warn('⚠️ Failed to setup notification listeners:', error);
    }

    return () => {
      // Clean up listeners
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (error) {
        console.warn('⚠️ Failed to cleanup notification listeners:', error);
      }
    };
  }, []);

  return {
    // Could expose methods to send test notifications, etc.
  };
}