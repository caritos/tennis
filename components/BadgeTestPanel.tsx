import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { ClubBadge, MultiTypeBadge } from './ClubBadge';
import { useClubBadges } from '@/hooks/useClubBadges';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService } from '@/services/NotificationService';
// import { initializeDatabase } from '@/database/database'; // Disabled - dev component
import { ClubBadgeData, BadgeType } from '@/types/badges';

/**
 * Development component for testing badge functionality
 * Remove this from production builds
 */
export const BadgeTestPanel: React.FC = () => {
  const { user } = useAuth();
  const { totalBadgeCount, clubBadges, forceRefresh } = useClubBadges();

  // Create sample badge data for testing
  const createSampleBadgeData = (clubId: string, totalCount: number): ClubBadgeData => ({
    clubId,
    totalCount,
    highestUrgency: totalCount > 5 ? 'urgent' : totalCount > 2 ? 'high' : 'medium',
    badges: {
      challenge_pending: {
        count: Math.min(totalCount, 3),
        type: 'challenge_pending',
        urgency: 'high',
        lastUpdated: new Date().toISOString(),
      },
      match_invitation: {
        count: Math.min(Math.max(0, totalCount - 3), 2),
        type: 'match_invitation',
        urgency: 'high',
        lastUpdated: new Date().toISOString(),
      },
      unrecorded_match: totalCount > 5 ? {
        count: 1,
        type: 'unrecorded_match',
        urgency: 'urgent',
        lastUpdated: new Date().toISOString(),
      } : undefined,
    }
  });

  const handleCreateTestNotification = async () => {
    console.log('Test notification creation disabled - using Supabase now');
    // Development testing disabled since moving to Supabase
  };

  if (!__DEV__) {
    return null; // Don't show in production
  }

  const sampleClubBadge1 = createSampleBadgeData('test-club-1', 3);
  const sampleClubBadge2 = createSampleBadgeData('test-club-2', 7);

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>🧪 Badge Test Panel</ThemedText>
      
      {/* Current State */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Current State</ThemedText>
        <ThemedText>Total Badge Count: {totalBadgeCount}</ThemedText>
        <ThemedText>Club Badges: {Object.keys(clubBadges).length}</ThemedText>
      </View>

      {/* Test Components */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Badge Components</ThemedText>
        
        <View style={styles.badgeRow}>
          <ThemedText>Small: </ThemedText>
          <ClubBadge clubBadgeData={sampleClubBadge1} size="small" />
          <ThemedText> Medium: </ThemedText>
          <ClubBadge clubBadgeData={sampleClubBadge1} size="medium" />
          <ThemedText> Large: </ThemedText>
          <ClubBadge clubBadgeData={sampleClubBadge1} size="large" />
        </View>

        <View style={styles.badgeRow}>
          <ThemedText>Urgent: </ThemedText>
          <ClubBadge 
            clubBadgeData={sampleClubBadge2} 
            size="medium" 
            showUrgencyIndicator={true} 
          />
          <ThemedText> Multi-Type: </ThemedText>
          <MultiTypeBadge clubBadgeData={sampleClubBadge2} size="medium" />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Actions</ThemedText>
        
        <TouchableOpacity style={styles.button} onPress={forceRefresh}>
          <Text style={styles.buttonText}>Refresh Badges</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={handleCreateTestNotification}>
          <Text style={styles.buttonText}>Create Test Notification</Text>
        </TouchableOpacity>
      </View>

      {/* Real Club Badges */}
      {Object.keys(clubBadges).length > 0 && (
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Real Club Badges</ThemedText>
          {Object.entries(clubBadges).map(([clubId, badgeData]) => (
            <View key={clubId} style={styles.badgeRow}>
              <ThemedText>{clubId}: </ThemedText>
              <ClubBadge clubBadgeData={badgeData} size="medium" />
              <MultiTypeBadge clubBadgeData={badgeData} size="small" />
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
});