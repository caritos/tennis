import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface ClubMember {
  id: string;
  full_name: string;
  joined_at: string;
  match_count: number;
  wins: number;
  ranking?: number;
  eloRating?: number;
}

interface ClubMembersProps {
  members: ClubMember[];
  colors: any;
  sortBy: 'name' | 'wins' | 'matches' | 'joined' | 'ranking';
  filterBy: 'all' | 'active' | 'new';
  onSortChange: (sort: 'name' | 'wins' | 'matches' | 'joined' | 'ranking') => void;
  onFilterChange: (filter: 'all' | 'active' | 'new') => void;
}

export default function ClubMembers({
  members,
  colors,
  sortBy,
  filterBy,
  onSortChange,
  onFilterChange,
}: ClubMembersProps) {
  // Filter members
  const filteredMembers = members.filter(member => {
    if (filterBy === 'active') {
      return member.match_count > 3;
    }
    if (filterBy === 'new') {
      const joinedDate = new Date(member.joined_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joinedDate > thirtyDaysAgo;
    }
    return true;
  });

  // Sort members
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case 'ranking':
        // Sort by ELO rating (higher is better)
        // Put unranked members (1200 starting rating or undefined) at the end
        const eloA = a.eloRating ?? 1200;
        const eloB = b.eloRating ?? 1200;
        return eloB - eloA;
      case 'wins':
        return (b.wins || 0) - (a.wins || 0);
      case 'matches':
        return (b.match_count || 0) - (a.match_count || 0);
      case 'joined':
        return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
      default: // name
        return (a.full_name || '').localeCompare(b.full_name || '');
    }
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter & Sort Controls */}
      <ThemedView style={[styles.controlsCard, { backgroundColor: colors.card }]}>
        <View style={styles.controlSection}>
          <ThemedText style={[styles.controlLabel, { color: colors.textSecondary }]}>
            FILTER
          </ThemedText>
          <View style={styles.filterButtons}>
            {(['all', 'active', 'new'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  filterBy === filter && { backgroundColor: colors.tint },
                  filterBy !== filter && { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onFilterChange(filter)}
              >
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    { color: filterBy === filter ? '#fff' : colors.text }
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.controlSection}>
          <ThemedText style={[styles.controlLabel, { color: colors.textSecondary }]}>
            SORT BY
          </ThemedText>
          <View style={styles.sortButtons}>
            {([
              { key: 'name', label: 'Name' },
              { key: 'ranking', label: 'Rank' },
              { key: 'wins', label: 'Wins' },
              { key: 'matches', label: 'Matches' },
              { key: 'joined', label: 'Joined' }
            ] as const).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.sortButton,
                  sortBy === key && { backgroundColor: colors.tint },
                  sortBy !== key && { borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => onSortChange(key)}
              >
                <ThemedText
                  style={[
                    styles.sortButtonText,
                    { color: sortBy === key ? '#fff' : colors.text }
                  ]}
                >
                  {label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ThemedView>

      {/* Members List */}
      <ThemedView style={[styles.membersCard, { backgroundColor: colors.card }]}>

        {sortedMembers.length === 0 ? (
          <View style={[styles.placeholder, { borderColor: colors.border }]}>
            <ThemedText style={styles.placeholderEmoji}>👥</ThemedText>
            <ThemedText style={[styles.placeholderText, { color: colors.text }]}>
              No members found
            </ThemedText>
            <ThemedText style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              Try adjusting your filters
            </ThemedText>
          </View>
        ) : (
          <View style={styles.membersList}>
            {sortedMembers.map((member, index) => {
              const winRate = member.match_count > 0 ? (member.wins / member.match_count) * 100 : 0;
              const isActive = member.match_count > 3;
              const isNew = (() => {
                const joinedDate = new Date(member.joined_at);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return joinedDate > thirtyDaysAgo;
              })();

              return (
                <View
                  key={member.id}
                  style={[
                    styles.memberItem,
                    index !== sortedMembers.length - 1 && styles.memberItemBorder,
                    { borderColor: colors.border }
                  ]}
                >
                  <View style={styles.memberHeader}>
                    <View style={styles.memberNameContainer}>
                      <View style={styles.memberNameRow}>
                        <View style={styles.nameWithBadge}>
                          <ThemedText style={styles.memberName}>
                            <ThemedText style={[styles.rankScore, { color: colors.tint }]}>
                              {member.eloRating || 1200}{' '}
                            </ThemedText>
                            {member.full_name || 'Unknown Member'}
                          </ThemedText>
                          {isNew && (
                            <View style={[styles.memberBadge, { backgroundColor: '#4CAF50' }]}>
                              <ThemedText style={styles.badgeText}>NEW</ThemedText>
                            </View>
                          )}
                          {isActive && (
                            <View style={[styles.memberBadge, { backgroundColor: colors.tint }]}>
                              <ThemedText style={styles.badgeText}>ACTIVE</ThemedText>
                            </View>
                          )}
                        </View>
                        <ThemedText style={[styles.memberJoinedDate, { color: colors.textSecondary }]}>
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.memberStatsContainer}>
                    <View style={styles.statGroup}>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statValue}>{member.match_count}</ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Matches
                        </ThemedText>
                      </View>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statValue}>{member.wins}</ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Wins
                        </ThemedText>
                      </View>
                      <View style={styles.statItem}>
                        <ThemedText style={styles.statValue}>{Math.round(winRate)}%</ThemedText>
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Win Rate
                        </ThemedText>
                      </View>
                    </View>

                    {member.match_count > 0 && (
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { backgroundColor: colors.textSecondary + '20' }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: winRate >= 60 ? '#4CAF50' : winRate >= 40 ? '#FF9800' : '#FF5722',
                                width: `${winRate}%`
                              }
                            ]}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
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
  controlsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  membersCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  controlSection: {
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
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
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  membersList: {
    gap: 0,
  },
  memberItem: {
    paddingVertical: 16,
  },
  memberItemBorder: {
    borderBottomWidth: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  memberNameRow: {
    gap: 4,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  memberJoinedDate: {
    fontSize: 12,
  },
  memberStatsContainer: {
    gap: 8,
  },
  statGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
    marginBottom: 8,
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