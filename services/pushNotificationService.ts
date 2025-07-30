import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'challenge' | 'match_invitation' | 'match_result' | 'ranking_update' | 'club_activity';
  title: string;
  body: string;
  data?: any;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private pushToken: string | null = null;
  private initialized = false;

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Register for push notifications
      const token = await this.registerForPushNotifications();
      if (token && userId) {
        await this.storePushToken(userId, token);
      }

      // Set up notification categories for actionable notifications
      await this.setupNotificationCategories();

      this.initialized = true;
      console.log('✅ Push notification service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
    }
  }

  async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Push notifications require a physical device');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Push notification permissions not granted');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined,
      });

      this.pushToken = tokenData.data;
      console.log('🔔 Push token obtained:', this.pushToken);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tennis-notifications', {
          name: 'Tennis Club Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
        });
      }

      return this.pushToken;
    } catch (error) {
      console.error('❌ Failed to register for push notifications:', error);
      return null;
    }
  }

  async storePushToken(userId: string, token: string): Promise<void> {
    try {
      // Store locally
      await AsyncStorage.setItem('pushToken', token);

      // Store in Supabase user metadata
      const { error } = await supabase.auth.updateUser({
        data: { push_token: token }
      });

      if (error) {
        console.error('❌ Failed to store push token in Supabase:', error);
      } else {
        console.log('✅ Push token stored successfully');
      }
    } catch (error) {
      console.error('❌ Failed to store push token:', error);
    }
  }

  async setupNotificationCategories(): Promise<void> {
    try {
      // Challenge notification with Accept/Decline actions
      await Notifications.setNotificationCategoryAsync('challenge', [
        {
          identifier: 'accept',
          buttonTitle: 'Accept',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'decline',
          buttonTitle: 'Decline',
          options: { opensAppToForeground: false },
        },
      ]);

      // Match invitation with Join action
      await Notifications.setNotificationCategoryAsync('match_invitation', [
        {
          identifier: 'join',
          buttonTitle: 'Join Match',
          options: { opensAppToForeground: true },
        },
      ]);

      console.log('✅ Notification categories configured');
    } catch (error) {
      console.error('❌ Failed to setup notification categories:', error);
    }
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      const categoryId = this.getCategoryId(notification.type);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          categoryIdentifier: categoryId,
          sound: true,
        },
        trigger: null, // Send immediately
      });

      console.log('📬 Local notification sent:', notification.title);
    } catch (error) {
      console.error('❌ Failed to send local notification:', error);
    }
  }

  private getCategoryId(type: NotificationData['type']): string | undefined {
    switch (type) {
      case 'challenge':
        return 'challenge';
      case 'match_invitation':
        return 'match_invitation';
      default:
        return undefined;
    }
  }

  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { notification, actionIdentifier } = response;
    const { type, data } = notification.request.content.data as any;

    console.log('🎯 Notification action:', actionIdentifier, 'for type:', type);

    try {
      switch (type) {
        case 'challenge':
          await this.handleChallengeAction(actionIdentifier, data);
          break;
        case 'match_invitation':
          await this.handleMatchInvitationAction(actionIdentifier, data);
          break;
        default:
          console.log('ℹ️ No specific handler for notification type:', type);
      }
    } catch (error) {
      console.error('❌ Failed to handle notification response:', error);
    }
  }

  private async handleChallengeAction(action: string, data: any): Promise<void> {
    console.log(`🎾 Handling challenge ${action}:`, data);
    
    try {
      // Import the challenge service dynamically to avoid circular imports
      const { challengeService } = await import('./challengeService');
      
      if (action === 'accept') {
        await challengeService.acceptChallenge(data.challengeId, data.challengedId);
        console.log('✅ Challenge accepted via notification');
      } else if (action === 'decline') {
        await challengeService.declineChallenge(data.challengeId, data.challengedId);
        console.log('✅ Challenge declined via notification');
      }
    } catch (error) {
      console.error('❌ Failed to handle challenge action:', error);
    }
  }

  private async handleMatchInvitationAction(action: string, data: any): Promise<void> {
    console.log(`🎾 Handling match invitation ${action}:`, data);
    
    try {
      // Import the match invitation service dynamically to avoid circular imports
      const { matchInvitationService } = await import('./matchInvitationService');
      
      if (action === 'join') {
        await matchInvitationService.respondToInvitation(
          data.invitationId,
          data.userId,
          'Interested via notification'
        );
        console.log('✅ Match invitation response sent via notification');
      }
    } catch (error) {
      console.error('❌ Failed to handle match invitation action:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('🧹 All notifications cleared');
    } catch (error) {
      console.error('❌ Failed to clear notifications:', error);
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log(`🏷️ Badge count set to: ${count}`);
    } catch (error) {
      console.error('❌ Failed to set badge count:', error);
    }
  }

  getPushToken(): string | null {
    return this.pushToken;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const pushNotificationService = PushNotificationService.getInstance();