import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useClubBadges } from './useClubBadges';
import { initializeDatabase } from '@/database/database';
import { NotificationService } from '@/services/NotificationService';
import {
  QuickActionItem,
  QuickActionButton,
  QuickActionsState,
  QuickActionsSummary,
  QuickActionType,
  QuickActionButtonType,
  QUICK_ACTION_RULES,
  getUrgencyColor
} from '@/types/quickActions';

const QUICK_ACTIONS_STORAGE_KEY = 'quick_actions_state_v1';
const COLLAPSED_STATE_KEY = 'quick_actions_collapsed';

export function useQuickActions(userClubs: any[] = [], clubId?: string) {
  const { user } = useAuth();
  const { clubBadges, refreshBadges } = useClubBadges();
  
  const [quickActionsState, setQuickActionsState] = useState<QuickActionsState>({
    items: [],
    totalCount: 0,
    highestUrgency: 'low',
    lastUpdated: new Date().toISOString(),
    isCollapsed: true, // Start collapsed
    loading: false
  });

  // Load collapsed state from storage
  const loadCollapsedState = useCallback(async (): Promise<boolean> => {
    try {
      const stored = await AsyncStorage.getItem(COLLAPSED_STATE_KEY);
      return stored ? JSON.parse(stored) : true; // Default to collapsed
    } catch (error) {
      console.error('Failed to load collapsed state:', error);
      return true;
    }
  }, []);

  // Save collapsed state to storage
  const saveCollapsedState = useCallback(async (isCollapsed: boolean) => {
    try {
      await AsyncStorage.setItem(COLLAPSED_STATE_KEY, JSON.stringify(isCollapsed));
    } catch (error) {
      console.error('Failed to save collapsed state:', error);
    }
  }, []);

  // Generate quick action items from current data
  const generateQuickActionItems = useCallback(async (): Promise<QuickActionItem[]> => {
    if (!user?.id) return [];

    const items: QuickActionItem[] = [];

    try {
      const db = await initializeDatabase();
      const notificationService = new NotificationService(db);

      // Get all unread notifications for the user
      const notifications = await notificationService.getNotifications(user.id, 50);
      const unreadNotifications = notifications.filter(n => !n.is_read);

      // Process each notification type
      for (const notification of unreadNotifications) {
        // Filter club-specific notifications based on context
        if (notification.type === 'match_invitation') {
          const notificationClubId = notification.action_data?.clubId;
          
          // If we're on the main clubs page (no clubId), skip club-specific notifications
          if (!clubId && notificationClubId) {
            console.log('🔍 Skipping club-specific match_invitation notification on main clubs page:', notification.id);
            continue;
          }
          
          // If we're on a specific club page, only show notifications for that club
          if (clubId && notificationClubId && notificationClubId !== clubId) {
            console.log('🔍 Skipping match_invitation notification for different club:', notification.id);
            continue;
          }
        }

        const rule = QUICK_ACTION_RULES.find(r => 
          (notification.type === 'challenge' && r.type === 'challenge_received') ||
          (notification.type === 'match_invitation' && r.type === 'match_invitation') ||
          (notification.type === 'match_result' && r.type === 'unrecorded_match')
        );

        if (rule) {
          try {
            // Mock data for demonstration - in real app this would come from proper tables
            const mockData = generateMockDataForNotification(notification);
            const quickActionItem = rule.generateItem(mockData);
            items.push(quickActionItem);
          } catch (error) {
            console.error('Failed to generate quick action item:', error);
          }
        }
      }

      // Sort by priority (highest first) and then by creation date
      items.sort((a, b) => {
        const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorities[b.urgency] - priorities[a.urgency];
        if (priorityDiff !== 0) return priorityDiff;
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Limit to top 10 items for performance
      return items.slice(0, 10);

    } catch (error) {
      console.error('Failed to generate quick action items:', error);
      return [];
    }
  }, [user?.id]);

  // Mock data generator for notifications (replace with real data fetching)
  const generateMockDataForNotification = (notification: any) => {
    const actionData = notification.action_data || {};
    
    switch (notification.type) {
      case 'challenge':
        return {
          id: notification.related_id || notification.id,
          challengerName: 'John Doe', // Would come from user lookup
          challengerId: actionData.challengerId || 'user123',
          matchType: actionData.matchType || 'singles',
          proposedDate: actionData.date || new Date().toISOString(),
          clubId: actionData.clubId || 'club123',
          clubName: 'Tennis Club', // Would come from club lookup
          createdAt: notification.created_at,
          expiresAt: notification.expires_at
        };
        
      case 'match_invitation':
        return {
          id: notification.related_id || notification.id,
          creatorName: 'Jane Smith', // Would come from user lookup
          creatorId: actionData.creatorId || 'user456',
          matchType: actionData.matchType || 'doubles',
          matchDate: actionData.date || new Date().toISOString(),
          clubId: actionData.clubId || 'club123',
          clubName: 'Tennis Club',
          createdAt: notification.created_at,
          expiresAt: notification.expires_at
        };
        
      case 'match_result':
        return {
          id: notification.related_id || notification.id,
          opponentName: 'Mike Johnson', // Would come from match data
          opponentId: actionData.opponentId || 'user789',
          matchDate: actionData.matchDate || new Date().toISOString(),
          clubId: actionData.clubId || 'club123',
          clubName: 'Tennis Club',
          createdAt: notification.created_at
        };
        
      default:
        return {};
    }
  };

  // Calculate summary statistics
  const calculateSummary = useCallback((items: QuickActionItem[]): QuickActionsSummary => {
    const summary: QuickActionsSummary = {
      challenges: 0,
      matchInvitations: 0,
      lookingToPlay: 0,
      unrecordedMatches: 0,
      clubRequests: 0,
      total: items.length,
      urgentCount: 0
    };

    items.forEach(item => {
      switch (item.type) {
        case 'challenge_received':
          summary.challenges++;
          break;
        case 'match_invitation':
          summary.matchInvitations++;
          break;
        case 'looking_to_play':
          summary.lookingToPlay++;
          break;
        case 'unrecorded_match':
          summary.unrecordedMatches++;
          break;
        case 'club_join_request':
          summary.clubRequests++;
          break;
      }

      if (item.urgency === 'urgent') {
        summary.urgentCount++;
      }
    });

    return summary;
  }, []);

  // Get highest urgency from items
  const getHighestUrgency = useCallback((items: QuickActionItem[]) => {
    if (items.length === 0) return 'low';
    
    const urgencies = items.map(item => item.urgency);
    if (urgencies.includes('urgent')) return 'urgent';
    if (urgencies.includes('high')) return 'high';
    if (urgencies.includes('medium')) return 'medium';
    return 'low';
  }, []);

  // Refresh quick actions data
  const refreshQuickActions = useCallback(async () => {
    if (!user?.id) {
      setQuickActionsState(prev => ({ ...prev, items: [], totalCount: 0, loading: false }));
      return;
    }

    setQuickActionsState(prev => ({ ...prev, loading: true }));

    try {
      const items = await generateQuickActionItems();
      const highestUrgency = getHighestUrgency(items);

      setQuickActionsState(prev => ({
        ...prev,
        items,
        totalCount: items.length,
        highestUrgency,
        lastUpdated: new Date().toISOString(),
        loading: false
      }));

    } catch (error) {
      console.error('Failed to refresh quick actions:', error);
      setQuickActionsState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.id, generateQuickActionItems, getHighestUrgency]);

  // Toggle collapse state
  const toggleCollapse = useCallback(async () => {
    const newCollapsedState = !quickActionsState.isCollapsed;
    setQuickActionsState(prev => ({ ...prev, isCollapsed: newCollapsedState }));
    await saveCollapsedState(newCollapsedState);
  }, [quickActionsState.isCollapsed, saveCollapsedState]);

  // Handle action button press
  const handleActionPress = useCallback(async (item: QuickActionItem, action: QuickActionButton) => {
    console.log('Quick action pressed:', action.action, 'for item:', item.id);

    try {
      switch (action.action) {
        case 'accept_challenge':
          // TODO: Implement challenge acceptance
          router.push('/notifications');
          break;
          
        case 'decline_challenge':
          // TODO: Implement challenge decline
          await dismissItem(item.id);
          break;
          
        case 'join_match':
          // TODO: Implement match joining
          router.push('/notifications');
          break;
          
        case 'record_score':
          router.push('/record-match');
          break;
          
        case 'view_details':
          router.push('/notifications');
          break;
          
        case 'approve_join_request':
          // TODO: Implement join request approval
          await dismissItem(item.id);
          break;
          
        case 'deny_join_request':
          // TODO: Implement join request denial
          await dismissItem(item.id);
          break;
          
        case 'dismiss':
          await dismissItem(item.id);
          break;
          
        default:
          console.log('Unhandled action:', action.action);
      }

      // Refresh data after action
      setTimeout(() => {
        refreshQuickActions();
        refreshBadges();
      }, 1000);

    } catch (error) {
      console.error('Failed to handle action:', error);
    }
  }, [refreshQuickActions, refreshBadges]);

  // Dismiss an item
  const dismissItem = useCallback(async (itemId: string) => {
    // Optimistically remove from UI
    setQuickActionsState(prev => {
      const newItems = prev.items.filter(item => item.id !== itemId);
      return {
        ...prev,
        items: newItems,
        totalCount: newItems.length,
        highestUrgency: getHighestUrgency(newItems)
      };
    });

    // TODO: Mark corresponding notification as read in database
    try {
      const db = await initializeDatabase();
      const notificationService = new NotificationService(db);
      
      // Extract notification ID from item ID (assuming format: type_notificationId)
      const notificationId = itemId.split('_').slice(1).join('_');
      await notificationService.markAsRead(notificationId);
      
    } catch (error) {
      console.error('Failed to dismiss item:', error);
      // Revert optimistic update on error
      refreshQuickActions();
    }
  }, [getHighestUrgency, refreshQuickActions]);

  // Initialize collapsed state
  useEffect(() => {
    const initCollapsedState = async () => {
      const isCollapsed = await loadCollapsedState();
      setQuickActionsState(prev => ({ ...prev, isCollapsed }));
    };
    
    initCollapsedState();
  }, [loadCollapsedState]);

  // Refresh on user or club changes
  useEffect(() => {
    refreshQuickActions();
  }, [user?.id, userClubs.length, clubId, refreshQuickActions]);

  // Get summary for external use
  const getSummary = useCallback((): QuickActionsSummary => {
    return calculateSummary(quickActionsState.items);
  }, [quickActionsState.items, calculateSummary]);

  return {
    quickActionsState,
    refreshQuickActions,
    toggleCollapse,
    handleActionPress,
    dismissItem,
    getSummary,
    
    // Computed values
    hasItems: quickActionsState.totalCount > 0,
    hasUrgentItems: quickActionsState.items.some(item => item.urgency === 'urgent'),
    
    // For testing
    generateMockItem: __DEV__ ? generateMockDataForNotification : undefined
  };
}