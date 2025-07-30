import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { pushNotificationService } from '@/services/pushNotificationService';

export function useNotificationListener() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      // Optional: Show custom in-app notification UI
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      
      // Handle the notification response
      pushNotificationService.handleNotificationResponse(response);
      
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

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    // Could expose methods to send test notifications, etc.
  };
}