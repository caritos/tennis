import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface SignUpHeaderProps {
  colors: any;
  onBack: () => void;
}

export default function SignUpHeader({
  colors,
  onBack,
}: SignUpHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          console.log('🔘 BUTTON: Back button pressed');
          onBack();
        }}
        accessibilityRole="button"
        accessibilityLabel="Back"
        accessibilityHint="Go back to the previous screen"
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={colors.text} 
        />
      </TouchableOpacity>
      
      <ThemedText type="title" style={styles.headerTitle}>
        Create Account
      </ThemedText>
      
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
});