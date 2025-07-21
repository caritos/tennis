import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CreateClubButtonProps {
  onPress: () => void;
  text?: string;
  loadingText?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  showIcon?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function CreateClubButton({
  onPress,
  text = 'Create Club',
  loadingText = 'Creating...',
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  showIcon = true,
  accessibilityLabel = 'Create new tennis club',
  testID = 'create-club-button',
}: CreateClubButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [debouncing, setDebouncing] = useState(false);

  const isDisabled = disabled || loading || debouncing;

  const handlePress = async () => {
    if (isDisabled) return;

    // Prevent rapid taps
    setDebouncing(true);
    try {
      await onPress();
    } finally {
      // Reset debouncing after a short delay
      setTimeout(() => setDebouncing(false), 300);
    }
  };

  const getButtonStyles = () => {
    const baseStyles = [styles.button];
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.buttonSmall);
        break;
      case 'large':
        baseStyles.push(styles.buttonLarge);
        break;
      default:
        baseStyles.push(styles.buttonMedium);
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles.push({
          backgroundColor: colors.tabIconDefault,
        });
        break;
      case 'outline':
        baseStyles.push({
          backgroundColor: 'transparent',
          borderColor: colors.tint,
          borderWidth: 2,
        });
        break;
      default:
        baseStyles.push({
          backgroundColor: colors.tint,
        });
    }

    // State styles
    if (isDisabled) {
      baseStyles.push({
        backgroundColor: colors.tabIconDefault,
        opacity: 0.6,
      });
    }

    // Full width
    if (fullWidth) {
      baseStyles.push(styles.fullWidth);
    }

    return baseStyles;
  };

  const getTextStyles = () => {
    const baseStyles = [styles.buttonText];

    // Size text styles
    switch (size) {
      case 'small':
        baseStyles.push(styles.textSmall);
        break;
      case 'large':
        baseStyles.push(styles.textLarge);
        break;
      default:
        baseStyles.push(styles.textMedium);
    }

    // Variant text styles
    switch (variant) {
      case 'outline':
        baseStyles.push({ color: colors.tint });
        break;
      default:
        baseStyles.push({ color: colors.background });
    }

    // Disabled text color
    if (isDisabled && variant === 'outline') {
      baseStyles.push({ color: colors.tabIconDefault });
    }

    return baseStyles;
  };

  const renderIcon = () => {
    if (!showIcon) return null;

    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.tint : colors.background}
          style={styles.icon}
        />
      );
    }

    return (
      <View testID="create-club-icon" style={styles.icon}>
        <ThemedText style={[getTextStyles(), { fontSize: 18 }]}>+</ThemedText>
      </View>
    );
  };

  const displayText = loading ? loadingText : text;

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens form to create a new tennis club"
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {renderIcon()}
        <ThemedText style={getTextStyles()}>
          {displayText}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  buttonMedium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  buttonLarge: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 52,
  },
  fullWidth: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  icon: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});