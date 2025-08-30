import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { NotificationBadge } from './NotificationBadge';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import {
  QuickActionItem,
  QuickActionButton,
  QuickActionsState,
  getUrgencyColor,
  getActionButtonColor,
} from '@/types/quickActions';

interface QuickActionsCardProps {
  quickActionsState: QuickActionsState;
  onToggleCollapse: () => void;
  onActionPress: (item: QuickActionItem, action: QuickActionButton) => void;
  onRefresh?: () => void;
  onDismissItem?: (itemId: string) => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  quickActionsState,
  onToggleCollapse,
  onActionPress,
  onRefresh,
  onDismissItem
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  // Animate collapse/expand
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: quickActionsState.isCollapsed ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [quickActionsState.isCollapsed, animatedHeight]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
  };

  const handleActionPress = (item: QuickActionItem, action: QuickActionButton) => {
    if (action.confirmationRequired) {
      Alert.alert(
        'Confirm Action',
        action.confirmationMessage || `Are you sure you want to ${action.label.toLowerCase()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: action.label, 
            style: action.variant === 'danger' ? 'destructive' : 'default',
            onPress: () => onActionPress(item, action)
          }
        ]
      );
    } else {
      onActionPress(item, action);
    }
  };

  const handleDismiss = (itemId: string) => {
    if (onDismissItem) {
      onDismissItem(itemId);
    }
  };

  // Don't render if no items
  if (quickActionsState.totalCount === 0) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={[styles.header, { borderBottomColor: colors.tabIconDefault + '20' }]}
        onPress={onToggleCollapse}
        accessibilityRole="button"
        accessibilityLabel={`Quick Actions, ${quickActionsState.totalCount} pending items, ${quickActionsState.isCollapsed ? 'collapsed' : 'expanded'}`}
      >
        <View style={styles.headerLeft}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Quick Actions
          </ThemedText>
          <NotificationBadge
            count={quickActionsState.totalCount}
            size="small"
            color={getUrgencyColor(quickActionsState.highestUrgency)}
            style={styles.headerBadge}
          />
        </View>
        
        <View style={styles.headerRight}>
          {quickActionsState.loading && (
            <Ionicons 
              name="refresh" 
              size={16} 
              color={colors.tabIconDefault} 
              style={styles.loadingIcon}
            />
          )}
          <Ionicons
            name={quickActionsState.isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={colors.tabIconDefault}
            style={[
              styles.chevron,
              {
                transform: [{
                  rotate: quickActionsState.isCollapsed ? '0deg' : '180deg'
                }]
              }
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* Collapsible Content */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500], // Adjust max height as needed
            }),
            opacity: animatedHeight,
          },
        ]}
      >
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.tint}
              />
            ) : undefined
          }
        >
          {quickActionsState.items.map((item, index) => (
            <QuickActionItemCard
              key={item.id}
              item={item}
              isLast={index === quickActionsState.items.length - 1}
              onActionPress={(action) => handleActionPress(item, action)}
              onDismiss={() => handleDismiss(item.id)}
              colors={colors}
            />
          ))}
          
          {/* Show more indicator if there are many items */}
          {quickActionsState.totalCount > quickActionsState.items.length && (
            <View style={styles.showMoreContainer}>
              <ThemedText style={[styles.showMoreText, { color: colors.tabIconDefault }]}>
                +{quickActionsState.totalCount - quickActionsState.items.length} more items
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </ThemedView>
  );
};

// Individual Quick Action Item Component
interface QuickActionItemCardProps {
  item: QuickActionItem;
  isLast: boolean;
  onActionPress: (action: QuickActionButton) => void;
  onDismiss: () => void;
  colors: any;
}

const QuickActionItemCard: React.FC<QuickActionItemCardProps> = ({
  item,
  isLast,
  onActionPress,
  onDismiss,
  colors
}) => {
  const urgencyColor = getUrgencyColor(item.urgency);
  
  return (
    <View style={[
      styles.itemCard,
      !isLast && { borderBottomColor: colors.tabIconDefault + '10', borderBottomWidth: 1 }
    ]}>
      {/* Priority indicator */}
      <View
        style={[
          styles.priorityIndicator,
          { backgroundColor: urgencyColor }
        ]}
      />

      {/* Content */}
      <View style={styles.itemContent}>
        {/* Header row */}
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <ThemedText type="defaultSemiBold" style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText style={[styles.itemClub, { color: colors.tabIconDefault }]} numberOfLines={1}>
              {item.clubName}
            </ThemedText>
          </View>
          
          {/* Dismiss button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Dismiss"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={16} color={colors.tabIconDefault} />
          </TouchableOpacity>
        </View>

        {/* Subtitle */}
        {item.subtitle && (
          <ThemedText 
            style={[styles.itemSubtitle, { color: colors.tabIconDefault }]}
            numberOfLines={1}
          >
            {item.subtitle}
          </ThemedText>
        )}

        {/* Description */}
        {item.description && (
          <ThemedText 
            style={[styles.itemDescription, { color: colors.tabIconDefault }]}
            numberOfLines={2}
          >
            {item.description}
          </ThemedText>
        )}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          {item.actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.variant === 'secondary' 
                    ? 'transparent' 
                    : getActionButtonColor(action.variant),
                  borderColor: getActionButtonColor(action.variant),
                  borderWidth: action.variant === 'secondary' ? 1 : 0,
                }
              ]}
              onPress={() => onActionPress(action)}
              accessibilityLabel={action.label}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.actionButtonText,
                  {
                    color: action.variant === 'secondary'
                      ? getActionButtonColor(action.variant)
                      : 'white',
                  }
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

// Empty state component
export const QuickActionsEmptyState: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>✅</Text>
      <ThemedText type="subtitle" style={styles.emptyTitle}>
        All caught up!
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
        No pending actions right now. Check back later for new challenges and matches.
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerBadge: {
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },
  chevron: {
    // Transition handled by Animated.View
  },
  contentWrapper: {
    overflow: 'hidden',
  },
  scrollContent: {
    maxHeight: 400, // Limit height for scrolling
  },
  itemCard: {
    flexDirection: 'row',
    position: 'relative',
  },
  priorityIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  itemContent: {
    flex: 1,
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  itemClub: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  itemSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  showMoreContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  showMoreText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default QuickActionsCard;