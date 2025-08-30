import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 means permanent
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  customIcon?: 'tennis-info' | 'shield-checkmark' | keyof typeof Ionicons.glyphMap;
}

interface NotificationBannerProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [slideAnim] = useState(new Animated.Value(-100));

  const getNotificationColors = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          background: '#4CAF50',
          text: '#FFFFFF',
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          background: '#F44336',
          text: '#FFFFFF',
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          background: '#FF9800',
          text: '#FFFFFF',
          icon: 'warning' as const,
        };
      case 'info':
        return {
          background: colors.tint,
          text: '#FFFFFF',
          icon: 'information-circle' as const,
        };
    }
  };

  const notificationColors = getNotificationColors(notification.type);

  const renderIcon = () => {
    if (notification.customIcon === 'tennis-info') {
      return (
        <View style={styles.tennisInfoIcon}>
          <ThemedText style={styles.tennisEmoji}>🎾</ThemedText>
          <View style={styles.infoOverlay}>
            <Ionicons 
              name="information" 
              size={14} 
              color="#FFFFFF" 
            />
          </View>
        </View>
      );
    }
    
    if (notification.customIcon === 'shield-checkmark') {
      return (
        <Ionicons 
          name="shield-checkmark" 
          size={24} 
          color={notificationColors.text} 
        />
      );
    }
    
    const iconName = notification.customIcon || notificationColors.icon;
    return (
      <Ionicons 
        name={iconName as keyof typeof Ionicons.glyphMap} 
        size={24} 
        color={notificationColors.text} 
        style={styles.icon}
      />
    );
  };

  useEffect(() => {
    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, slideAnim]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Call the notification's onDismiss callback if provided
      notification.onDismiss?.();
      // Call the parent component's onDismiss to remove from state
      onDismiss(notification.id);
    });
  };

  const handleAction = () => {
    if (notification.onAction) {
      notification.onAction();
    }
    handleDismiss();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: notificationColors.background,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        {renderIcon()}
        
        <View style={styles.textContainer}>
          <ThemedText 
            style={[styles.title, { color: notificationColors.text }]}
            numberOfLines={1}
          >
            {notification.title}
          </ThemedText>
          
          {notification.message && (
            <ThemedText 
              style={[styles.message, { color: notificationColors.text }]}
              numberOfLines={2}
            >
              {notification.message}
            </ThemedText>
          )}
        </View>

        <View style={styles.actions}>
          {notification.actionLabel && notification.onAction && (
            <TouchableOpacity 
              style={[styles.actionButton, { borderColor: notificationColors.text }]}
              onPress={handleAction}
            >
              <ThemedText 
                style={[styles.actionText, { color: notificationColors.text }]}
              >
                {notification.actionLabel}
              </ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Ionicons 
              name="close" 
              size={20} 
              color={notificationColors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default NotificationBanner;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 50, // Account for status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
  },
  tennisInfoIcon: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  tennisEmoji: {
    fontSize: 24,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});