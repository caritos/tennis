import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export interface ScoreBoxProps {
  score: string | number;
  isWinner?: boolean;
  isLoser?: boolean;
  isCurrentSet?: boolean;
  isTiebreak?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'filled';
  disabled?: boolean;
}

export const ScoreBox: React.FC<ScoreBoxProps> = ({
  score,
  isWinner = false,
  isLoser = false,
  isCurrentSet = false,
  isTiebreak = false,
  size = 'medium',
  variant = 'default',
  disabled = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          text: styles.largeText,
        };
      default:
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
        };
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      backgroundColor: colors.background,
      borderColor: colors.tabIconDefault + '40',
    };

    if (disabled) {
      return {
        ...baseStyles,
        backgroundColor: colors.tabIconDefault + '10',
        borderColor: colors.tabIconDefault + '20',
      };
    }

    if (isWinner) {
      return {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
      };
    }

    if (isLoser) {
      return {
        backgroundColor: colors.background,
        borderColor: colors.tabIconDefault + '60',
      };
    }

    if (isCurrentSet) {
      return {
        backgroundColor: colors.tint + '10',
        borderColor: colors.tint,
      };
    }

    if (isTiebreak) {
      return {
        backgroundColor: '#FF9800' + '10',
        borderColor: '#FF9800',
      };
    }

    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.tint,
        };
      case 'filled':
        return {
          backgroundColor: colors.tint + '20',
          borderColor: colors.tint,
        };
      default:
        return baseStyles;
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return colors.tabIconDefault + '60';
    }

    if (isWinner) {
      return '#FFFFFF';
    }

    if (isCurrentSet || isTiebreak) {
      return isCurrentSet ? colors.tint : '#FF9800';
    }

    if (variant === 'outlined' || variant === 'filled') {
      return colors.tint;
    }

    return colors.text;
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const textColor = getTextColor();

  return (
    <View style={[
      styles.container,
      sizeStyles.container,
      variantStyles,
      isWinner && styles.winnerGlow,
    ]}>
      <ThemedText style={[
        styles.text,
        sizeStyles.text,
        { color: textColor },
        isWinner && styles.winnerText,
        disabled && styles.disabledText,
      ]}>
        {score}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  
  // Size variants
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    borderRadius: 6,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 40,
    borderRadius: 8,
  },
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 48,
    borderRadius: 10,
  },

  // Text styles
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 18,
  },
  largeText: {
    fontSize: 24,
  },

  // Special states
  winnerText: {
    fontWeight: '800',
  },
  disabledText: {
    opacity: 0.6,
  },
  winnerGlow: {
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
});

// Convenience components for common use cases
export const WinnerScoreBox: React.FC<Omit<ScoreBoxProps, 'isWinner'>> = (props) => (
  <ScoreBox {...props} isWinner={true} />
);

export const LoserScoreBox: React.FC<Omit<ScoreBoxProps, 'isLoser'>> = (props) => (
  <ScoreBox {...props} isLoser={true} />
);

export const TiebreakScoreBox: React.FC<Omit<ScoreBoxProps, 'isTiebreak'>> = (props) => (
  <ScoreBox {...props} isTiebreak={true} size={props.size || 'small'} />
);

export const CurrentSetScoreBox: React.FC<Omit<ScoreBoxProps, 'isCurrentSet'>> = (props) => (
  <ScoreBox {...props} isCurrentSet={true} />
);