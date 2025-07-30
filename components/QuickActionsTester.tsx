import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { QuickActionsCard } from './QuickActionsCard';
import { 
  QuickActionItem, 
  QuickActionsState,
  QuickActionType,
  ActionUrgency
} from '@/types/quickActions';

/**
 * Development component for testing Quick Actions functionality
 * Remove this from production builds
 */
export const QuickActionsTester: React.FC = () => {
  const [testState, setTestState] = useState<QuickActionsState>({
    items: [],
    totalCount: 0,
    highestUrgency: 'low',
    lastUpdated: new Date().toISOString(),
    isCollapsed: true,
    loading: false
  });

  // Sample quick action items for testing
  const sampleItems: Record<string, QuickActionItem> = {
    challengeReceived: {
      id: 'challenge_received_1',
      type: 'challenge_received',
      title: 'Challenge from John Doe',
      subtitle: 'Singles • Today',
      clubId: 'club1',
      clubName: 'Riverside Tennis Club',
      urgency: 'high',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        challengeId: 'challenge1',
        challengerName: 'John Doe',
        challengerId: 'user123',
        matchType: 'singles',
        proposedDate: new Date().toISOString()
      },
      actions: [
        {
          id: 'accept',
          label: 'Accept',
          variant: 'success',
          action: 'accept_challenge'
        },
        {
          id: 'decline',
          label: 'Decline',
          variant: 'secondary',
          action: 'decline_challenge'
        }
      ]
    },

    unrecordedMatch: {
      id: 'unrecorded_match_1',
      type: 'unrecorded_match',
      title: 'Match score needed',
      subtitle: 'vs Jane Smith • Yesterday',
      description: 'Record the score to update rankings',
      clubId: 'club1',
      clubName: 'Riverside Tennis Club',
      urgency: 'urgent',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        matchId: 'match1',
        matchDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        opponentName: 'Jane Smith',
        opponentId: 'user456'
      },
      actions: [
        {
          id: 'record',
          label: 'Record Score',
          variant: 'primary',
          action: 'record_score'
        },
        {
          id: 'view',
          label: 'View Match',
          variant: 'secondary',
          action: 'view_details'
        }
      ]
    },

    matchInvitation: {
      id: 'match_invitation_1',
      type: 'match_invitation',
      title: 'Match invitation from Mike Wilson',
      subtitle: 'Doubles • Tomorrow 2PM',
      clubId: 'club2',
      clubName: 'City Tennis Center',
      urgency: 'high',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      metadata: {
        matchId: 'invitation1',
        matchDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        creatorName: 'Mike Wilson',
        creatorId: 'user789',
        matchType: 'doubles'
      },
      actions: [
        {
          id: 'join',
          label: 'Join Match',
          variant: 'success',
          action: 'join_match'
        },
        {
          id: 'decline',
          label: 'Pass',
          variant: 'secondary',
          action: 'dismiss'
        }
      ]
    },

    lookingToPlay: {
      id: 'looking_to_play_1',
      type: 'looking_to_play',
      title: 'Sarah Connor is looking to play',
      subtitle: '1 spot left',
      clubId: 'club1',
      clubName: 'Riverside Tennis Club',
      urgency: 'medium',
      createdAt: new Date().toISOString(),
      metadata: {
        lookingToPlayId: 'ltp1',
        creatorName: 'Sarah Connor',
        creatorId: 'user999',
        playersNeeded: 2,
        currentPlayers: 1
      },
      actions: [
        {
          id: 'join',
          label: 'Join',
          variant: 'primary',
          action: 'join_match'
        },
        {
          id: 'view',
          label: 'Details',
          variant: 'secondary',
          action: 'view_details'
        }
      ]
    },

    clubJoinRequest: {
      id: 'club_join_request_1',
      type: 'club_join_request',
      title: 'Join request from Alex Johnson',
      subtitle: 'New member wants to join your club',
      clubId: 'club1',
      clubName: 'Riverside Tennis Club',
      urgency: 'medium',
      createdAt: new Date().toISOString(),
      metadata: {
        joinRequestId: 'joinreq1',
        requesterName: 'Alex Johnson',
        requesterId: 'user111'
      },
      actions: [
        {
          id: 'approve',
          label: 'Approve',
          variant: 'success',
          action: 'approve_join_request'
        },
        {
          id: 'deny',
          label: 'Deny',
          variant: 'danger',
          action: 'deny_join_request',
          confirmationRequired: true,
          confirmationMessage: 'Are you sure you want to deny this join request?'
        }
      ]
    }
  };

  const getHighestUrgency = (items: QuickActionItem[]): ActionUrgency => {
    if (items.length === 0) return 'low';
    
    const urgencies = items.map(item => item.urgency);
    if (urgencies.includes('urgent')) return 'urgent';
    if (urgencies.includes('high')) return 'high';
    if (urgencies.includes('medium')) return 'medium';
    return 'low';
  };

  const addTestItem = (itemKey: string) => {
    const item = sampleItems[itemKey];
    if (!item) return;

    setTestState(prev => {
      const newItems = [...prev.items, item];
      return {
        ...prev,
        items: newItems,
        totalCount: newItems.length,
        highestUrgency: getHighestUrgency(newItems),
        lastUpdated: new Date().toISOString()
      };
    });
  };

  const clearAllItems = () => {
    setTestState(prev => ({
      ...prev,
      items: [],
      totalCount: 0,
      highestUrgency: 'low',
      lastUpdated: new Date().toISOString()
    }));
  };

  const addMultipleItems = () => {
    const items = Object.values(sampleItems);
    setTestState(prev => ({
      ...prev,
      items,
      totalCount: items.length,
      highestUrgency: getHighestUrgency(items),
      lastUpdated: new Date().toISOString()
    }));
  };

  const toggleCollapse = () => {
    setTestState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed
    }));
  };

  const handleActionPress = (item: QuickActionItem, action: any) => {
    console.log('Test action pressed:', action.action, 'for item:', item.title);
    
    // Remove item from state for testing
    setTestState(prev => {
      const newItems = prev.items.filter(i => i.id !== item.id);
      return {
        ...prev,
        items: newItems,
        totalCount: newItems.length,
        highestUrgency: getHighestUrgency(newItems)
      };
    });
  };

  const handleDismissItem = (itemId: string) => {
    console.log('Test dismiss item:', itemId);
    
    setTestState(prev => {
      const newItems = prev.items.filter(i => i.id !== itemId);
      return {
        ...prev,
        items: newItems,
        totalCount: newItems.length,
        highestUrgency: getHighestUrgency(newItems)
      };
    });
  };

  const handleRefresh = async () => {
    console.log('Test refresh triggered');
    setTestState(prev => ({ ...prev, loading: true }));
    
    // Simulate loading
    setTimeout(() => {
      setTestState(prev => ({ ...prev, loading: false }));
    }, 1000);
  };

  if (!__DEV__) {
    return null; // Don't show in production
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>⚡ Quick Actions Tester</ThemedText>
      
      {/* Quick Actions Component */}
      <View style={styles.componentSection}>
        <QuickActionsCard
          quickActionsState={testState}
          onToggleCollapse={toggleCollapse}
          onActionPress={handleActionPress}
          onRefresh={handleRefresh}
          onDismissItem={handleDismissItem}
        />
      </View>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <ThemedText style={styles.sectionTitle}>Controls:</ThemedText>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#007AFF' }]}
            onPress={addMultipleItems}
          >
            <Text style={styles.controlButtonText}>Add All Items</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#FF3B30' }]}
            onPress={clearAllItems}
          >
            <Text style={styles.controlButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ThemedText style={styles.sectionTitle}>Add Individual Items:</ThemedText>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.itemButtonRow}>
            {Object.entries(sampleItems).map(([key, item]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.itemButton,
                  { backgroundColor: getUrgencyColor(item.urgency) }
                ]}
                onPress={() => addTestItem(key)}
              >
                <Text style={styles.itemButtonTitle}>
                  {formatItemType(key)}
                </Text>
                <Text style={styles.itemButtonUrgency}>
                  {item.urgency.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* State Info */}
      <View style={styles.infoSection}>
        <ThemedText style={styles.infoTitle}>Current State:</ThemedText>
        <ThemedText style={styles.infoText}>
          Items: {testState.totalCount} | 
          Urgency: {testState.highestUrgency} | 
          Collapsed: {testState.isCollapsed ? 'Yes' : 'No'}
        </ThemedText>
      </View>
    </ThemedView>
  );
};

// Helper functions
function getUrgencyColor(urgency: ActionUrgency): string {
  switch (urgency) {
    case 'urgent': return '#FF3B30';
    case 'high': return '#FF6B35';
    case 'medium': return '#FF9500';
    case 'low': return '#007AFF';
    default: return '#007AFF';
  }
}

function formatItemType(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
    .substring(0, 12) + '...';
}

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
  componentSection: {
    marginBottom: 20,
  },
  controlsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  itemButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  itemButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
  },
  itemButtonTitle: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
  },
  itemButtonUrgency: {
    color: 'white',
    fontSize: 9,
    opacity: 0.8,
  },
  infoSection: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 6,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
});