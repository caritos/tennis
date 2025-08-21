import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RadioGroup from 'react-native-radio-buttons-group';

interface MatchTypeSelectorProps {
  selectedType: 'singles' | 'doubles';
  onTypeChange: (type: 'singles' | 'doubles') => void;
  colors: any;
}

const MatchTypeSelector = React.memo(function MatchTypeSelector({
  selectedType,
  onTypeChange,
  colors,
}: MatchTypeSelectorProps) {
  const matchTypeRadioButtons = useMemo(() => [
    {
      id: 'singles',
      label: 'Singles',
      value: 'singles',
      color: colors.tint,
      labelStyle: { color: colors.text, fontSize: 16 },
    },
    {
      id: 'doubles', 
      label: 'Doubles',
      value: 'doubles',
      color: colors.tint,
      labelStyle: { color: colors.text, fontSize: 16 },
    }
  ], [colors.tint, colors.text]);

  const handleMatchTypeChange = (selectedId: string) => {
    onTypeChange(selectedId as 'singles' | 'doubles');
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Match Type</Text>
      <RadioGroup 
        radioButtons={matchTypeRadioButtons}
        onPress={handleMatchTypeChange}
        selectedId={selectedType}
        layout="row"
        containerStyle={styles.radioGroupContainer}
      />
    </View>
  );
});

export default MatchTypeSelector;

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  radioGroupContainer: {
    alignItems: 'flex-start',
  },
});