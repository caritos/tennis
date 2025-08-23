import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TennisScoreDisplay } from '@/components/TennisScoreDisplay';
import { ClubRankings, RankedPlayer } from '@/components/ClubRankings';
import { Club } from '@/lib/supabase';

interface ClubOverviewProps {
  club: Club;
  memberCount: number;
  rankings: RankedPlayer[];
  recentMatches: any[];
  colors: any;
  user: any;
  pendingChallenges: Set<string>;
  onChallengePress: (playerId: string, playerName: string) => void;
  onViewAllMatches: () => void;
  onViewAllMembers: () => void;
  onRecordMatch: () => void;
  onInvitePlayers: () => void;
}

export default function ClubOverview({
  club,
  memberCount,
  rankings,
  recentMatches,
  colors,
  user,
  pendingChallenges,
  onChallengePress,
  onViewAllMatches,
  onViewAllMembers,
  onRecordMatch,
  onInvitePlayers,
}: ClubOverviewProps) {
  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Quick Actions */}
      <ThemedView style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={onRecordMatch}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>
              Record Match
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.tint }]}
            onPress={onInvitePlayers}
          >
            <Ionicons name="people-outline" size={20} color={colors.tint} />
            <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
              Looking to Play
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Rankings */}
      <ThemedView style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderWithIcon}>
            <Ionicons name="trophy-outline" size={20} color={colors.tint} style={styles.sectionIcon} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Rankings</ThemedText>
          </View>
          <TouchableOpacity onPress={onViewAllMembers}>
            <ThemedText style={[styles.viewAllLink, { color: colors.tint }]}>View All</ThemedText>
          </TouchableOpacity>
        </View>
        
        {rankings.length > 0 ? (
          <ClubRankings
            rankings={rankings.slice(0, 5)}
            colors={colors}
            currentUserId={user?.id}
            showChallengeButtons={true}
            pendingChallenges={pendingChallenges}
            onChallengePress={(target) => onChallengePress(target.id, target.name)}
            compact={true}
          />
        ) : (
          <View style={[styles.placeholder, { borderColor: colors.border }]}>
            <ThemedText style={styles.placeholderEmoji}>🏆</ThemedText>
            <ThemedText style={[styles.placeholderText, { color: colors.text }]}>
              No rankings yet
            </ThemedText>
            <ThemedText style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              Rankings will appear after matches are played
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Recent Matches */}
      <ThemedView style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderWithIcon}>
            <Ionicons name="tennisball-outline" size={20} color={colors.tint} style={styles.sectionIcon} />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Recent Matches</ThemedText>
          </View>
          <TouchableOpacity onPress={onViewAllMatches}>
            <ThemedText style={[styles.viewAllLink, { color: colors.tint }]}>View All</ThemedText>
          </TouchableOpacity>
        </View>
        
        {recentMatches.length > 0 ? (
          <View style={styles.matchesList}>
            {recentMatches.slice(0, 3).map((match, index) => (
              <View key={match.id} style={styles.matchItem}>
                <TennisScoreDisplay
                  player1Name={match.player1_name}
                  player2Name={match.player2_name}
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
                  colors={colors}
                  showMeta={true}
                  compact={true}
                />
                {index < recentMatches.slice(0, 3).length - 1 && (
                  <View style={[styles.matchItemBorder, { borderBottomColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.placeholder, { borderColor: colors.border }]}>
            <ThemedText style={styles.placeholderEmoji}>🎾</ThemedText>
            <ThemedText style={[styles.placeholderText, { color: colors.text }]}>
              No matches yet
            </ThemedText>
            <ThemedText style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              Record your first match to see it here
            </ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Information */}
      <ThemedView style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeaderWithIcon}>
          <Ionicons name="information-circle-outline" size={20} color={colors.tint} style={styles.sectionIcon} />
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Information</ThemedText>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{memberCount}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Members
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{recentMatches.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Recent Matches
            </ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{rankings.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Players
            </ThemedText>
          </View>
        </View>

        {/* Location */}
        <View style={styles.infoSubsection}>
          <View style={styles.sectionHeaderWithIcon}>
            <Ionicons name="location-outline" size={18} color={colors.tint} style={styles.sectionIcon} />
            <ThemedText style={[styles.subsectionTitle, { color: colors.text }]}>Location</ThemedText>
          </View>
          <ThemedText style={[styles.locationText, { color: colors.textSecondary }]}>
            {club.location}
          </ThemedText>
        </View>
        
        {/* About */}
        {club.description && (
          <View style={styles.infoSubsection}>
            <View style={styles.sectionHeaderWithIcon}>
              <Ionicons name="document-text-outline" size={18} color={colors.tint} style={styles.sectionIcon} />
              <ThemedText style={[styles.subsectionTitle, { color: colors.text }]}>About</ThemedText>
            </View>
            <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {club.description}
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
  sectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
    opacity: 0.5,
  },
  locationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  infoSubsection: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
  matchesList: {
    gap: 16,
  },
  matchItem: {
    marginBottom: 6,
  },
  matchItemBorder: {
    borderBottomWidth: 1,
    marginTop: 16,
  },
});