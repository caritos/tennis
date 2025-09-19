import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Club } from '@/lib/supabase';

interface ClubCardProps {
  club: Club;
  onPress: (club: Club) => void;
  onJoin?: (club: Club) => void;
  distance?: number;
  isJoined?: boolean;
  isJoining?: boolean;
}

export function ClubCard({ club, onPress, onJoin, distance, isJoined, isJoining }: ClubCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatDistance = (distance: number): string => {
    // Distance is in kilometers, convert and format appropriately
    if (distance < 0.1) {
      return 'Nearby';
    }
    
    if (distance < 1) {
      // Show in meters for very close distances
      const meters = Math.round(distance * 1000);
      return `${meters}m`;
    }
    
    if (distance < 10) {
      // Show 1 decimal place for distances under 10km
      return `${distance.toFixed(1)}km`;
    }
    
    if (distance < 100) {
      // Show whole numbers for distances under 100km
      return `${Math.round(distance)}km`;
    }
    
    // For very far distances, show approximate range
    if (distance < 500) {
      return `${Math.round(distance / 10) * 10}km+`;
    }
    
    return 'Far';
  };

  const formatMemberCount = (count: number): string => {
    if (count === 0) {
      return 'New club';
    }
    if (count === 1) {
      return '1 member';
    }
    if (count < 100) {
      return `${count} members`;
    }
    if (count < 1000) {
      return `${Math.round(count / 10) * 10}+ members`;
    }
    return `${Math.round(count / 100) * 100}+ members`;
  };

  const accessibilityLabel = `${club.name}, ${formatMemberCount((club as any).memberCount || 0)} members${distance ? `, ${formatDistance(distance)} away` : ''}`;

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: colors.tabIconDefault + '30' }]}
      onPress={() => onPress(club)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.7}
    >
      <ThemedView style={styles.content}>
        <View style={styles.firstRow}>
          <View style={styles.nameContainer}>
            <View style={styles.nameWithBadge}>
              <ThemedText style={styles.tennisEmoji}>🎾</ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.clubName} numberOfLines={1}>
                {club.name}
              </ThemedText>
            </View>
          </View>
          <View style={styles.rightContainer}>
            {distance && (
              <ThemedText type="default" style={[styles.distance, { color: colors.tabIconDefault }]}>
                {formatDistance(distance)}
              </ThemedText>
            )}
            {!isJoined && onJoin && (
              <TouchableOpacity 
                style={[
                  styles.joinButton, 
                  { 
                    backgroundColor: isJoining ? colors.tabIconDefault : colors.tint,
                    opacity: isJoining ? 0.6 : 1,
                  }
                ]}
                onPress={() => !isJoining && onJoin(club)}
                disabled={isJoining}
                accessibilityRole="button"
                accessibilityLabel={isJoining ? `Joining ${club.name}` : `Join ${club.name}`}
                accessibilityHint="Tap to join this tennis club"
              >
                <ThemedText style={styles.joinButtonText}>
                  {isJoining ? 'Joining...' : 'Join'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.secondRow}>
          <ThemedText type="default" style={[styles.memberInfo, { color: colors.tabIconDefault }]}>
            {formatMemberCount((club as any).memberCount || 0)}
          </ThemedText>
          {isJoined && (
            <ThemedText style={[styles.activityIndicator, { color: colors.tabIconDefault }]}>
              • Member since recently
            </ThemedText>
          )}
          {!isJoined && (
            <ThemedText style={[styles.activityIndicator, { color: colors.tabIconDefault }]}>
              • Active community
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 0,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: 12,
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tennisEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  clubBadge: {
    marginLeft: 6,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  joinButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  secondRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    fontSize: 14,
    marginRight: 8,
  },
  activityIndicator: {
    fontSize: 14,
    flex: 1,
  },
});