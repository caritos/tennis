import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface MessageSectionProps {
  message: string;
  matchType: 'singles' | 'doubles';
  onMessageChange: (text: string) => void;
  colors: any;
}

const MessageSection = React.memo(function MessageSection({
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
});

export default MessageSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 20, // iOS HIG consistent spacing
  },
  sectionLabel: {
    fontSize: 17, // iOS HIG body font size
    fontWeight: '600',
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12, // iOS HIG rounded corner radius
    padding: 16, // Increased padding for better touch experience
    fontSize: 17, // iOS HIG body font size
    minHeight: 80,
    textAlignVertical: 'top',
  },
});