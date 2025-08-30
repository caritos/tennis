import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ContextualPromptData } from '@/types/contextualPrompts';

interface ContextualPromptProps {
  prompt: ContextualPromptData | null;
  onDismiss?: (promptId: string) => void;
  style?: any;
}

const { width: _screenWidth } = Dimensions.get('window');

export const ContextualPrompt: React.FC<ContextualPromptProps> = ({
  prompt,
  onDismiss,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Animate in when prompt appears
  useEffect(() => {
    if (prompt) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [prompt, opacityAnim, scaleAnim, slideAnim]);

  const handleDismiss = () => {
    if (prompt && onDismiss) {
      onDismiss(prompt.id);
    }
  };

  const handleActionPress = () => {
    if (prompt?.actionButton?.action) {
      prompt.actionButton.action();
      // Optionally dismiss after action
      if (prompt.type !== 'unrecorded_matches') { // Keep urgent prompts until resolved
        handleDismiss();
      }
    }
  };

  if (!prompt) {
    return null;
  }

  // Get colors based on priority
  const getPromptColors = () => {
    const baseColor = colors.tint;
    const baseColorWithOpacity = baseColor + '10'; // 10% opacity
    
    switch (prompt.priority) {
      case 'urgent':
        return {
          background: '#FF3B30' + '15', // Red with 15% opacity
          border: '#FF3B30' + '30',
          accent: '#FF3B30'
        };
      case 'high':
        return {
          background: '#FF6B35' + '15', // Orange-red with 15% opacity
          border: '#FF6B35' + '30',
          accent: '#FF6B35'
        };
      case 'medium':
        return {
          background: baseColorWithOpacity,
          border: baseColor + '30',
          accent: baseColor
        };
      case 'low':
        return {
          background: colors.tabIconDefault + '10',
          border: colors.tabIconDefault + '20',
          accent: colors.tabIconDefault
        };
      default:
        return {
          background: baseColorWithOpacity,
          border: baseColor + '30',
          accent: baseColor
        };
    }
  };

  const promptColors = getPromptColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
            { scale: scaleAnim },
          ],
        },
        style,
      ]}
    >
      <ThemedView
        style={[
          styles.promptContainer,
          {
            backgroundColor: promptColors.background,
            borderColor: promptColors.border,
          },
        ]}
      >
        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.textContainer}>
            {/* Icon and title row */}
            <View style={styles.titleRow}>
              {prompt.icon && (
                <Text style={styles.icon}>{prompt.icon}</Text>
              )}
              <ThemedText 
                type="defaultSemiBold" 
                style={[styles.title, { flex: 1 }]}
                numberOfLines={2}
              >
                {prompt.title}
              </ThemedText>
              
              {/* Dismiss button */}
              {prompt.dismissible && (
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={handleDismiss}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Dismiss prompt"
                  accessibilityRole="button"
                >
                  <Ionicons 
                    name="close" 
                    size={18} 
                    color={colors.tabIconDefault} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Subtitle */}
            {prompt.subtitle && (
              <ThemedText 
                style={[
                  styles.subtitle, 
                  { color: colors.tabIconDefault }
                ]}
                numberOfLines={2}
              >
                {prompt.subtitle}
              </ThemedText>
            )}
          </View>

          {/* Action button */}
          {prompt.actionButton && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: prompt.actionButton.variant === 'primary'
                    ? promptColors.accent
                    : 'transparent',
                  borderColor: promptColors.accent,
                  borderWidth: prompt.actionButton.variant === 'secondary' ? 1 : 0,
                },
              ]}
              onPress={handleActionPress}
              accessibilityLabel={prompt.actionButton.label}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: prompt.actionButton.variant === 'primary'
                      ? 'white'
                      : promptColors.accent,
                  },
                ]}
              >
                {prompt.actionButton.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Priority indicator */}
        {(prompt.priority === 'urgent' || prompt.priority === 'high') && (
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: promptColors.accent },
            ]}
          />
        )}
      </ThemedView>
    </Animated.View>
  );
};

// Compact version for smaller spaces
export const CompactContextualPrompt: React.FC<ContextualPromptProps> = ({
  prompt,
  _onDismiss,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!prompt) return null;

  return (
    <TouchableOpacity
      style={[
        styles.compactContainer,
        {
          backgroundColor: colors.tint + '10',
          borderColor: colors.tint + '30',
        },
        style,
      ]}
      onPress={prompt.actionButton?.action}
      accessibilityLabel={prompt.title}
      accessibilityRole="button"
    >
      <View style={styles.compactContent}>
        {prompt.icon && (
          <Text style={styles.compactIcon}>{prompt.icon}</Text>
        )}
        <ThemedText 
          style={styles.compactTitle} 
          numberOfLines={1}
        >
          {prompt.title}
        </ThemedText>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={colors.tabIconDefault} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  promptContainer: {
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  
  // Compact styles
  compactContainer: {
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  compactIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  compactTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ContextualPrompt;