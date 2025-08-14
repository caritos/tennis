import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface FormHeaderProps {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

export default function FormHeader({ title, onBack, rightAction }: FormHeaderProps) {
  const borderColor = useThemeColor({}, 'tabIconDefault');
  const textColor = useThemeColor({}, 'text');

  return (
    <View 
      style={[styles.container, { borderBottomColor: borderColor }]}
      testID="form-header-container"
    >
      {/* Back Button */}
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ThemedText style={styles.backText}>{'< Back'}</ThemedText>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer} testID="title-container">
        <ThemedText 
          style={[styles.title, { color: textColor }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </ThemedText>
      </View>

      {/* Right Action or Spacer */}
      <View style={styles.rightContainer}>
        {rightAction || null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 56, // Consistent header height
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 60, // Ensure consistent touch target
  },
  backText: {
    fontSize: 16,
    fontWeight: '400',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  rightContainer: {
    minWidth: 60, // Match back button width for balance
    alignItems: 'flex-end',
  },
});