import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isDisabled = disabled || isLoading;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.base];
    
    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.small);
        break;
      case 'large':
        baseStyle.push(styles.large);
        break;
      default:
        baseStyle.push(styles.medium);
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push({
          backgroundColor: isDisabled ? colors.tabIconDefault : colors.tint,
        });
        break;
      case 'secondary':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDisabled ? colors.tabIconDefault : colors.tint,
        });
        break;
      case 'text':
        baseStyle.push({
          backgroundColor: 'transparent',
        });
        break;
    }

    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseTextStyle: TextStyle[] = [styles.text];

    // Size text styles
    switch (size) {
      case 'small':
        baseTextStyle.push(styles.smallText);
        break;
      case 'large':
        baseTextStyle.push(styles.largeText);
        break;
      default:
        baseTextStyle.push(styles.mediumText);
    }

    // Variant text styles
    switch (variant) {
      case 'primary':
        baseTextStyle.push({ color: '#ffffff' });
        break;
      case 'secondary':
      case 'text':
        baseTextStyle.push({
          color: isDisabled ? colors.tabIconDefault : colors.tint,
        });
        break;
    }

    if (textStyle) {
      baseTextStyle.push(textStyle);
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={getButtonStyle()}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#ffffff' : colors.tint}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  // Size styles
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});