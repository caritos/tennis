import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UpcomingMatchesNotification } from '@/components/UpcomingMatchesNotification';
import { Club } from '@/lib/supabase';

interface ClubOverviewProps {
  club: Club;
  memberCount: number;
  colors: any;
  user: any;
  onViewAllMembers: () => void;
  onRecordMatch: () => void;
  onInvitePlayers: () => void;
  onViewAllMatches: () => void;
}

export default function ClubOverview({
  club,
  memberCount,
  colors,
  user,
  onViewAllMembers,
  onRecordMatch,
  onInvitePlayers,
  onViewAllMatches,
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

      {/* Upcoming Matches Notification */}
      {user?.id && (
        <UpcomingMatchesNotification 
          clubId={club.id} 
          userId={user.id}
          onViewDetails={onViewAllMatches}
        />
      )}



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
});