import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TennisScoreEntry } from '@/components/TennisScoreEntry';
import { TennisSet } from '@/types/tennis';
import { CompactStyles } from '@/constants/CompactStyles';

interface Player {
  id: string;
  name: string;
}

interface ScoreSectionProps {
  matchType: 'singles' | 'doubles';
  selectedOpponent: Player | null;
  selectedPartner: Player | null;
  selectedOpponentPartner: Player | null;
  tennisSets: TennisSet[];
  onScoreChange: (sets: TennisSet[]) => void;
  colors: any;
  isEditing?: boolean;
  initialData?: any;
}

const ScoreSection = React.memo(function ScoreSection({
  matchType,
  selectedOpponent,
  selectedPartner,
  selectedOpponentPartner,
  tennisSets,
  onScoreChange,
  colors,
  isEditing = false,
  initialData,
}: ScoreSectionProps) {
  // Calculate player names safely
  const player1Name = matchType === 'doubles' ? 
    (selectedPartner?.name ? `You & ${selectedPartner.name}` : "You & [Partner not selected]") : 
    "You";
  
  const player2Name = matchType === 'doubles' ? 
    (selectedOpponentPartner?.name ? 
      `${selectedOpponent?.name || 'Opponent'} & ${selectedOpponentPartner.name}` : 
      `${selectedOpponent?.name || 'Opponent'} & [Partner not selected]`) : 
    (selectedOpponent?.name || 'Opponent');

  // Only render if we have the required players and valid names
  const canRender = (matchType === 'singles' && selectedOpponent && selectedOpponent.name) || 
                   (matchType === 'doubles' && selectedOpponent && selectedPartner && selectedOpponentPartner &&
                    selectedOpponent.name && selectedPartner.name && selectedOpponentPartner.name);

  if (canRender && player1Name && player2Name) {
    return (
      <View style={styles.section}>
        <TennisScoreEntry
          player1Name={player1Name}
          player2Name={player2Name}
          matchType={matchType}
          onScoreChange={(sets) => {
            console.log('🎾 ScoreSection: onScoreChange received:', sets);
            onScoreChange(sets);
          }}
          initialSets={tennisSets}
          showPreview={true}
          compact={false}
        />
        {/* Debug info - only show in development/editing */}
        {isEditing && initialData?.scores && (
          <>
            <Text style={[styles.debugText, { color: colors.tabIconDefault }]}>
              Debug - Initial scores: {initialData.scores}
            </Text>
            <Text style={[styles.debugText, { color: colors.tabIconDefault }]}>
              Debug - Tennis sets: {JSON.stringify(tennisSets)}
            </Text>
          </>
        )}
      </View>
    );
  } else {
    return (
      <View style={styles.section}>
        <View style={[styles.placeholderContainer, { borderColor: colors.tabIconDefault }]}>
          <Text style={[styles.placeholderTitle, { color: colors.text }]}>
            ⏳ Select {matchType === 'doubles' ? 'all players' : 'an opponent'} to continue
          </Text>
          <Text style={[styles.placeholderText, { color: colors.tabIconDefault }]}>
            {matchType === 'doubles' ? 
              'Select your partner and both opponents to start recording match scores' :
              'Search for a club member or add a new player to start recording match scores'}
          </Text>
        </View>
      </View>
    );
  }
});

export default ScoreSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: CompactStyles.sectionMargin,
  },
  placeholderContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,  // iOS HIG: Standard corner radius
    padding: 24,
    alignItems: 'center',
    marginVertical: 20,
  },
  placeholderTitle: {
    fontSize: 17,  // iOS HIG: Headline
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 15,  // iOS HIG: Body text
    textAlign: 'center',
    lineHeight: 22,  // iOS HIG: Better line height for body
  },
  debugText: {
    fontSize: 13,  // iOS HIG: Caption 1
    marginTop: 10,
    fontFamily: 'monospace',
  },
});