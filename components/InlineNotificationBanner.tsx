import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type InlineNotificationVariant = 'info' | 'success' | 'warning' | 'error' | 'welcome';
export type InlineNotificationIcon = keyof typeof Ionicons.glyphMap | string;

interface InlineNotificationBannerProps {
  title: string;
  description?: string;
  icon?: InlineNotificationIcon;
  variant?: InlineNotificationVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
  style?: any;
}

export const InlineNotificationBanner: React.FC<InlineNotificationBannerProps> = ({
  title,
  description,
  icon,
  variant = 'info',
  dismissible = true,
  onDismiss,
  onPress,
  actionLabel,
  onAction,
  testID = 'inline-notification-banner',
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          background: '#10B981' + '08',
          border: '#10B981' + '20',
          iconBackground: '#10B981' + '15',
          iconColor: '#10B981',
        };
      case 'warning':
        return {
          background: '#F59E0B' + '08',
          border: '#F59E0B' + '20',
          iconBackground: '#F59E0B' + '15',
          iconColor: '#F59E0B',
        };
      case 'error':
        return {
          background: '#EF4444' + '08',
          border: '#EF4444' + '20',
          iconBackground: '#EF4444' + '15',
          iconColor: '#EF4444',
        };
      case 'welcome':
        return {
          background: colors.tint + '08',
          border: colors.tint + '20',
          iconBackground: colors.tint + '15',
          iconColor: colors.tint,
        };
      default: // info
        return {
          background: colors.tint + '08',
          border: colors.tint + '20',
          iconBackground: colors.tint + '15',
          iconColor: colors.tint,
        };
    }
  };

  const getDefaultIcon = (): InlineNotificationIcon => {
    switch (variant) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'alert-circle';
      case 'welcome':
        return '🎾'; // Default to tennis ball emoji for welcome
      default:
        return 'information-circle';
    }
  };

  const variantColors = getVariantColors();
  const displayIcon = icon || getDefaultIcon();

  const renderIcon = () => {
    // Check if it's an emoji (single character that's not alphanumeric)
    if (typeof displayIcon === 'string' && displayIcon.length <= 2 && !/^[a-zA-Z0-9-]+$/.test(displayIcon)) {
      return (
        <ThemedText style={styles.emojiIcon}>
          {displayIcon}
        </ThemedText>
      );
    }
    
    // Ionicon
    return (
      <Ionicons 
        name={displayIcon as keyof typeof Ionicons.glyphMap} 
        size={20} 
        color={variantColors.iconColor} 
      />
    );
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <ThemedView 
      style={[
        styles.container, 
        { 
          backgroundColor: variantColors.background,
          borderColor: variantColors.border,
        },
        style
      ]}
      testID={testID}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress ? handlePress : undefined}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <View style={styles.mainContent}>
          <View style={styles.titleRow}>
            <View style={[
              styles.iconContainer, 
              { backgroundColor: variantColors.iconBackground }
            ]}>
              {renderIcon()}
            </View>
            <ThemedText 
              type="subtitle" 
              style={[styles.title, { color: colors.text }]}
              numberOfLines={2}
            >
              {title}
            </ThemedText>
            {dismissible && (
              <TouchableOpacity
                style={[styles.dismissButton, { backgroundColor: colors.background + '80' }]}
                onPress={handleDismiss}
                testID={`${testID}-dismiss`}
              >
                <Ionicons name="close" size={18} color={colors.tabIconDefault} />
              </TouchableOpacity>
            )}
          </View>
          {description && (
            <ThemedText 
              style={[styles.description, { color: colors.tabIconDefault }]}
              numberOfLines={3}
            >
              {description}
            </ThemedText>
          )}
          {actionLabel && onAction && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: variantColors.iconColor }]}
              onPress={onAction}
              testID={`${testID}-action`}
            >
              <ThemedText style={[styles.actionButtonText, { color: variantColors.iconColor }]}>
                {actionLabel}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: 20,
  },
  mainContent: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
    marginLeft: 52,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    marginTop: 12,
    marginLeft: 52,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});