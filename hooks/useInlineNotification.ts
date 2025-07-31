import { useState, useCallback } from 'react';

export type InlineNotificationType = 'success' | 'error' | 'warning' | 'info';

export interface InlineNotificationData {
  type: InlineNotificationType;
  title: string;
  message?: string;
  dismissible?: boolean;
}

export const useInlineNotification = () => {
  const [notification, setNotification] = useState<InlineNotificationData | null>(null);

  const showNotification = useCallback((
    type: InlineNotificationType,
    title: string,
    message?: string,
    options?: {
      dismissible?: boolean;
      duration?: number;
    }
  ) => {
    setNotification({
      type,
      title,
      message,
      dismissible: options?.dismissible ?? true,
    });

    // Auto-dismiss after duration if specified
    if (options?.duration && options.duration > 0) {
      setTimeout(() => {
        setNotification(null);
      }, options.duration);
    }
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('success', title, message, { duration });
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('error', title, message, { duration });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('warning', title, message, { duration });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    showNotification('info', title, message, { duration });
  }, [showNotification]);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissNotification,
  };
};