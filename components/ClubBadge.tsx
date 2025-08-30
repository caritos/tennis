import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClubBadgeData, getBadgeColor } from '@/types/badges';

interface ClubBadgeProps {
  clubBadgeData: ClubBadgeData | null;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  maxCount?: number;
  showUrgencyIndicator?: boolean;
}

export const ClubBadge: React.FC<ClubBadgeProps> = ({
  clubBadgeData,
  size = 'medium',
  style,
  maxCount = 99,
  showUrgencyIndicator = false,
}) => {
  if (!clubBadgeData || clubBadgeData.totalCount <= 0) {
    return null;
  }

  const { totalCount, highestUrgency } = clubBadgeData;
  const displayCount = totalCount > maxCount ? `${maxCount}+` : totalCount.toString();
  const badgeColor = getBadgeColor(highestUrgency);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { minWidth: 16, height: 16, borderRadius: 8 },
          text: { fontSize: 10, lineHeight: 16 },
          urgencyDot: { width: 4, height: 4, borderRadius: 2 },
        };
      case 'large':
        return {
          container: { minWidth: 24, height: 24, borderRadius: 12 },
          text: { fontSize: 14, lineHeight: 24 },
          urgencyDot: { width: 6, height: 6, borderRadius: 3 },
        };
      default: // medium
        return {
          container: { minWidth: 20, height: 20, borderRadius: 10 },
          text: { fontSize: 12, lineHeight: 20 },
          urgencyDot: { width: 5, height: 5, borderRadius: 2.5 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.badgeContainer, style]}>
      <View
        style={[
          styles.badge,
          sizeStyles.container,
          { backgroundColor: badgeColor },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            sizeStyles.text,
            { color: 'white' },
          ]}
          numberOfLines={1}
        >
          {displayCount}
        </Text>
      </View>
      
      {/* Urgency indicator dot */}
      {showUrgencyIndicator && (highestUrgency === 'urgent' || highestUrgency === 'high') && (
        <View
          style={[
            styles.urgencyDot,
            sizeStyles.urgencyDot,
            { 
              backgroundColor: highestUrgency === 'urgent' ? '#FF3B30' : '#FF6B35',
            },
          ]}
        />
      )}
    </View>
  );
};

interface MultiTypeBadgeProps {
  clubBadgeData: ClubBadgeData | null;
  maxTypes?: number;
  size?: 'small' | 'medium';
}

/**
 * Shows multiple badge types in a compact row (for detailed views)
 */
export const MultiTypeBadge: React.FC<MultiTypeBadgeProps> = ({
  clubBadgeData,
  maxTypes = 3,
  size = 'small',
}) => {
  if (!clubBadgeData || clubBadgeData.totalCount <= 0) {
    return null;
  }

  // Sort badges by urgency and count
  const sortedBadges = Object.values(clubBadgeData.badges)
    .sort((a, b) => {
      // First sort by urgency
      const urgencyOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Then by count
      return b.count - a.count;
    })
    .slice(0, maxTypes);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { minWidth: 14, height: 14, borderRadius: 7 },
          text: { fontSize: 9, lineHeight: 14 },
          spacing: 4,
        };
      default: // medium
        return {
          container: { minWidth: 18, height: 18, borderRadius: 9 },
          text: { fontSize: 11, lineHeight: 18 },
          spacing: 6,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.multiTypeBadgeContainer, { gap: sizeStyles.spacing }]}>
      {sortedBadges.map((badge, _index) => (
        <View
          key={badge.type}
          style={[
            styles.badge,
            sizeStyles.container,
            { backgroundColor: getBadgeColor(badge.urgency) },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              sizeStyles.text,
              { color: 'white' },
            ]}
            numberOfLines={1}
          >
            {badge.count}
          </Text>
        </View>
      ))}
      
      {/* Show overflow indicator if there are more badge types */}
      {Object.keys(clubBadgeData.badges).length > maxTypes && (
        <View
          style={[
            styles.badge,
            sizeStyles.container,
            { backgroundColor: '#8E8E93' }, // Gray for overflow
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              sizeStyles.text,
              { color: 'white' },
            ]}
            numberOfLines={1}
          >
            +
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  badgeText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  urgencyDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 1,
    borderColor: 'white',
  },
  multiTypeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ClubBadge;