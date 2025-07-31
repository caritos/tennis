import React, { createContext, useContext, useState, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationBanner, { NotificationData, NotificationType } from '@/components/NotificationBanner';

interface NotificationContextType {
  showNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      actionLabel?: string;
      onAction?: () => void;
      onDismiss?: () => void;
      customIcon?: 'tennis-info' | keyof typeof Ionicons.glyphMap;
    }
  ) => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (
    type: NotificationType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      actionLabel?: string;
      onAction?: () => void;
      onDismiss?: () => void;
      customIcon?: 'tennis-info' | keyof typeof Ionicons.glyphMap;
    }
  ) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: NotificationData = {
      id,
      type,
      title,
      message,
      duration: options?.duration ?? (type === 'error' ? 5000 : 3000), // Errors stay longer
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      onDismiss: options?.onDismiss,
      customIcon: options?.customIcon,
    };

    setNotifications(prev => {
      // Limit to 3 notifications at once
      const newNotifications = [notification, ...prev].slice(0, 3);
      return newNotifications;
    });
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    showNotification('success', title, message, { duration });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    showNotification('error', title, message, { duration });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    showNotification('warning', title, message, { duration });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    showNotification('info', title, message, { duration });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Render notifications */}
      <View style={styles.notificationContainer} pointerEvents="box-none">
        {notifications.map((notification, index) => (
          <View 
            key={notification.id} 
            style={[styles.notificationWrapper, { top: index * 80 }]}
          >
            <NotificationBanner
              notification={notification}
              onDismiss={dismissNotification}
            />
          </View>
        ))}
      </View>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  notificationWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});