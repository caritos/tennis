import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  style?: any;
  maxCount?: number;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'medium',
  color,
  textColor = 'white',
  style,
  maxCount = 99,
}) => {
  const colorScheme = useColorScheme();
  const _colors = Colors[colorScheme ?? 'light'];

  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const badgeColor = color || '#FF3B30'; // iOS red

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { minWidth: 16, height: 16, borderRadius: 8 },
          text: { fontSize: 10, lineHeight: 16 },
        };
      case 'large':
        return {
          container: { minWidth: 24, height: 24, borderRadius: 12 },
          text: { fontSize: 14, lineHeight: 24 },
        };
      default: // medium
        return {
          container: { minWidth: 20, height: 20, borderRadius: 10 },
          text: { fontSize: 12, lineHeight: 20 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        sizeStyles.container,
        { backgroundColor: badgeColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          sizeStyles.text,
          { color: textColor },
        ]}
        numberOfLines={1}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  badgeText: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationBadge;