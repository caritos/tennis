import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';
import LookingToPlaySection from '@/components/LookingToPlaySection';

interface Match {
  id: string;
  player1_name: string;
  player2_name?: string;
  opponent2_name?: string;
  partner3_name?: string;
  partner4_name?: string;
  player1_id: string;
  player2_id?: string;
  player3_id?: string;
  player4_id?: string;
  scores: string;
  winner: number;
  match_type: 'singles' | 'doubles';
  date: string;
}

interface ClubMatchesProps {
  matches: Match[];
  club: { id: string; name: string } | null;
  colors: any;
  filterType: 'all' | 'singles' | 'doubles';
  filterDate: 'all' | 'week' | 'month';
  onFilterTypeChange: (type: 'all' | 'singles' | 'doubles') => void;
  onFilterDateChange: (date: 'all' | 'week' | 'month') => void;
  onClaimMatch?: (matchId: string, playerPosition: "player2" | "player3" | "player4") => void;
  onRecordMatch?: () => void;
}

export default function ClubMatches({
  matches,
  club,
  colors,
  filterType,
  filterDate,
  onFilterTypeChange,
  onFilterDateChange,
  onClaimMatch,
  onRecordMatch,
}: ClubMatchesProps) {
  // Filter matches based on type and date
  const filteredMatches = matches.filter(match => {
    // Filter by match type
    if (filterType !== 'all' && match.match_type !== filterType) {
      return false;
    }
    
    // Filter by date
    if (filterDate !== 'all') {
      const matchDate = new Date(match.date);
      const now = new Date();
      
      if (filterDate === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (matchDate < weekAgo) return false;
      } else if (filterDate === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        if (matchDate < monthAgo) return false;
      }
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter Controls */}
      <ThemedView style={[styles.filtersCard, { backgroundColor: colors.card }]}>
        <View style={styles.filterSection}>
          <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>
            MATCH TYPE
          </ThemedText>
          <View style={styles.filterButtons}>
            {(['all', 'singles', 'doubles'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  filterType === type && { backgroundColor: colors.tint },
                  filterType !== type && { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onFilterTypeChange(type)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    { color: filterType === type ? '#fff' : colors.text }
                  ]}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <ThemedText style={[styles.filterLabel, { color: colors.textSecondary }]}>
            TIME PERIOD
          </ThemedText>
          <View style={styles.filterButtons}>
            {([
              { key: 'all', label: 'All Time' },
              { key: 'week', label: 'This Week' },
              { key: 'month', label: 'This Month' }
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterButton,
                  filterDate === key && { backgroundColor: colors.tint },
                  filterDate !== key && { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onFilterDateChange(key)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    { color: filterDate === key ? '#fff' : colors.text }
                  ]}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ThemedView>

      {/* Upcoming Section - Looking to Play */}
      {club?.id && <LookingToPlaySection clubId={club.id} />}

      {/* Matches List */}
      <ThemedView style={[styles.matchesCard, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Match History ({filteredMatches.length})
          </ThemedText>
        </View>

        {filteredMatches.length > 0 ? (
          <View style={styles.matchesList}>
            {filteredMatches.map((match, index) => (
              <View
                key={match.id}
                style={[
                  styles.matchItem,
                  index !== filteredMatches.length - 1 && styles.matchItemBorder,
                  { borderColor: colors.border }
                ]}
              >
                <TennisScoreDisplay
                  player1Name={match.player1_name}
                  player2Name={match.player2_name || match.opponent2_name}
                  scores={match.scores}
                  winner={match.winner as 1 | 2}
                  matchId={match.id}
                  player1Id={match.player1_id}
                  player2Id={match.player2_id}
                  player3Id={match.player3_id}
                  player4Id={match.player4_id}
                  matchType={match.match_type}
                  clubName={club?.name || ''}
                  matchDate={match.date}
                  isPlayer1Unregistered={false}
                  isPlayer2Unregistered={!match.player2_id && !!match.opponent2_name}
                  isPlayer3Unregistered={!match.player3_id && !!match.partner3_name}
                  isPlayer4Unregistered={!match.player4_id && !!match.partner4_name}
                  unregisteredPlayer2Name={match.opponent2_name}
                  unregisteredPlayer3Name={match.partner3_name}
                  unregisteredPlayer4Name={match.partner4_name}
                  onClaimMatch={onClaimMatch}
                  colors={colors}
                  showMeta={true}
                />
                
                {/* Match Date */}
                <View style={styles.matchMeta}>
                  <ThemedText style={[styles.matchDate, { color: colors.textSecondary }]}>
                    {formatDate(match.date)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.placeholder, { borderColor: colors.border }]}>
            <ThemedText style={styles.placeholderEmoji}>🎾</ThemedText>
            <ThemedText style={[styles.placeholderText, { color: colors.text }]}>
              {filterType === 'all' && filterDate === 'all' 
                ? 'No matches yet • Be the first to play!'
                : 'No matches found for your filters'
              }
            </ThemedText>
            <ThemedText style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              {filterType === 'all' && filterDate === 'all'
                ? 'Record your match to start building history'
                : 'Try adjusting your filters to see more matches'
              }
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Bottom padding */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  filtersCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  matchesCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  matchesList: {
    gap: 0,
  },
  matchItem: {
    paddingVertical: 16,
  },
  matchItemBorder: {
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  matchMeta: {
    marginTop: 8,
    alignItems: 'center',
  },
  matchDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    minHeight: 140, // Ensure enough space for emoji and text
  },
  placeholderEmoji: {
    fontSize: 32,
    marginBottom: 8,
    lineHeight: 40, // Ensure proper line height for emoji
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});