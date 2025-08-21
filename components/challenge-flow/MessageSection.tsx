import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface MessageSectionProps {
  message: string;
  matchType: 'singles' | 'doubles';
  onMessageChange: (text: string) => void;
  colors: any;
}

export default function MessageSection({
  message,
  matchType,
  onMessageChange,
  colors,
}: MessageSectionProps) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionLabel}>Message (Optional)</ThemedText>
      <TextInput
        style={[
          styles.messageInput,
          {
            borderColor: colors.tabIconDefault,
            color: colors.text,
            backgroundColor: colors.background,
          },
        ]}
        value={message}
        onChangeText={onMessageChange}
        placeholder={matchType === 'singles' 
          ? "Hey! Want to play a match?" 
          : "Want to play doubles? We'll figure out teams when we get there!"
        }
        placeholderTextColor={colors.tabIconDefault}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});