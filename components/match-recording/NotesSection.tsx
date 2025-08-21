import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CompactStyles } from '@/constants/CompactStyles';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  colors: any;
}

const NotesSection = React.memo(function NotesSection({
  notes,
  onNotesChange,
  colors,
}: NotesSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
      <TextInput
        style={[
          styles.notesInput,
          {
            borderColor: colors.tabIconDefault,
            backgroundColor: colors.background,
            color: colors.text,
          }
        ]}
        value={notes}
        onChangeText={onNotesChange}
        placeholder="Great competitive match!"
        placeholderTextColor={colors.tabIconDefault}
        multiline
        numberOfLines={3}
      />
    </View>
  );
});

export default NotesSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: CompactStyles.sectionMargin,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: CompactStyles.smallMargin,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: CompactStyles.input.borderRadius,
    paddingVertical: CompactStyles.input.paddingVertical,
    paddingHorizontal: CompactStyles.input.paddingHorizontal,
    fontSize: CompactStyles.input.fontSize,
    textAlignVertical: 'top',
    minHeight: 80,
  },
});