import React from 'react';
import { InlineNotificationBanner } from './InlineNotificationBanner';
import { InlineNotificationData } from '@/hooks/useInlineNotification';

interface InlineNotificationRendererProps {
  notification: InlineNotificationData | null;
  onDismiss: () => void;
  style?: any;
}

export const InlineNotificationRenderer: React.FC<InlineNotificationRendererProps> = ({
  notification,
  onDismiss,
  style,
}) => {
  if (!notification) return null;

  const getVariant = () => {
    switch (notification.type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <InlineNotificationBanner
      title={notification.title}
      description={notification.message}
      variant={getVariant()}
      dismissible={notification.dismissible}
      onDismiss={onDismiss}
      style={style}
    />
  );
};