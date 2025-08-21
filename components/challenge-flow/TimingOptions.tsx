import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

type TimeOption = 'today' | 'tomorrow' | 'weekend' | 'next_week' | 'flexible';

interface TimingOptionsProps {
  selectedTime: TimeOption;
  onTimeChange: (option: TimeOption) => void;
  colors: any;
}

const TimingOptions = React.memo(function TimingOptions({
  selectedTime,
  onTimeChange,
  colors,
}: TimingOptionsProps) {
  const getTimingText = (option: TimeOption): string => {
    switch (option) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'weekend': return 'This Weekend';
      case 'next_week': return 'Next Week';
      case 'flexible': return 'Flexible';
    }
  };

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionLabel}>When would you like to play?</ThemedText>
      <View style={styles.timingGrid}>
        {(['today', 'tomorrow', 'weekend', 'next_week', 'flexible'] as TimeOption[]).map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.timingOption,
              { borderColor: colors.tabIconDefault },
              selectedTime === option && { 
                borderColor: colors.tint,
                backgroundColor: colors.tint + '10'
              }
            ]}
            onPress={() => onTimeChange(option)}
          >
            <View style={[
              styles.radioCircle,
              { borderColor: colors.tabIconDefault },
              selectedTime === option && { borderColor: colors.tint }
            ]}>
              {selectedTime === option && (
                <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
              )}
            </View>
            <ThemedText style={styles.timingLabel}>{getTimingText(option)}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

export default TimingOptions;

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
    minWidth: '48%',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});