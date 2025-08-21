import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface MatchTypeSelectionProps {
  matchType: 'singles' | 'doubles';
  onMatchTypeChange: (type: 'singles' | 'doubles') => void;
  colors: any;
}

const MatchTypeSelection = React.memo(function MatchTypeSelection({
  matchType,
  onMatchTypeChange,
  colors,
}: MatchTypeSelectionProps) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionLabel}>Match Type</ThemedText>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={[
            styles.radioOption,
            { borderColor: colors.tabIconDefault },
            matchType === 'singles' && { 
              borderColor: colors.tint,
              backgroundColor: colors.tint + '10'
            }
          ]}
          onPress={() => onMatchTypeChange('singles')}
        >
          <View style={[
            styles.radioCircle,
            { borderColor: colors.tabIconDefault },
            matchType === 'singles' && { borderColor: colors.tint }
          ]}>
            {matchType === 'singles' && (
              <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
            )}
          </View>
          <ThemedText style={styles.radioLabel}>Singles</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.radioOption,
            { borderColor: colors.tabIconDefault },
            matchType === 'doubles' && { 
              borderColor: colors.tint,
              backgroundColor: colors.tint + '10'
            }
          ]}
          onPress={() => onMatchTypeChange('doubles')}
        >
          <View style={[
            styles.radioCircle,
            { borderColor: colors.tabIconDefault },
            matchType === 'doubles' && { borderColor: colors.tint }
          ]}>
            {matchType === 'doubles' && (
              <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
            )}
          </View>
          <ThemedText style={styles.radioLabel}>Doubles</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default MatchTypeSelection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
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
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});