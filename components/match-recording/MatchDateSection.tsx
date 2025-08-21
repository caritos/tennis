import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CalendarDatePicker } from '@/components/CalendarDatePicker';
import { CompactStyles } from '@/constants/CompactStyles';

interface MatchDateSectionProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const MatchDateSection = React.memo(function MatchDateSection({
  selectedDate,
  onDateChange,
}: MatchDateSectionProps) {
  const getCurrentDate = () => {
    try {
      return new Date().toISOString().split('T')[0];
    } catch (error) {
      console.warn('Failed to get current date, using fallback');
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  return (
    <View style={styles.section}>
      <CalendarDatePicker
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        label="Match Date"
        placeholder="Select match date"
        maxDate={getCurrentDate()} // Can't select future dates
      />
    </View>
  );
});

export default MatchDateSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: CompactStyles.sectionMargin,
  },
});