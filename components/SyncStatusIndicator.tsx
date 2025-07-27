// Sync status indicator component for the universal offline queue
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSync } from '../hooks/useSync';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  onPress?: () => void;
}

export function SyncStatusIndicator({ showDetails = false, onPress }: SyncStatusIndicatorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    isOnline,
    isProcessing,
    pendingCount,
    failedCount,
    connectionStatus,
    networkQuality,
    sync,
    retryFailed,
  } = useSync();

  const getStatusColor = () => {
    if (!isOnline) return '#ff4444'; // Red for offline
    if (failedCount > 0) return '#ff8800'; // Orange for failed operations
    if (pendingCount > 0) return '#0066cc'; // Blue for pending
    return '#00aa00'; // Green for all synced
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isProcessing) return 'Syncing...';
    if (failedCount > 0) return `${failedCount} failed`;
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'Synced';
  };

  const getNetworkIcon = () => {
    switch (networkQuality) {
      case 'excellent':
        return '📶';
      case 'good':
        return '📶';
      case 'poor':
        return '📱';
      case 'offline':
        return '📵';
      default:
        return '❓';
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (failedCount > 0) {
      retryFailed();
    } else if (pendingCount > 0 && isOnline) {
      sync();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: getStatusColor(),
    },
    pressableContainer: {
      opacity: onPress || failedCount > 0 || (pendingCount > 0 && isOnline) ? 1 : 0.7,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: getStatusColor(),
      marginRight: 6,
    },
    statusText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    detailsContainer: {
      marginTop: 4,
    },
    detailText: {
      fontSize: 10,
      color: colors.tabIconDefault,
    },
    networkIcon: {
      marginLeft: 4,
      fontSize: 10,
    },
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.statusDot} />
      <Text style={styles.statusText}>{getStatusText()}</Text>
      <Text style={styles.networkIcon}>{getNetworkIcon()}</Text>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>{connectionStatus}</Text>
          {pendingCount > 0 && (
            <Text style={styles.detailText}>
              {pendingCount} operation{pendingCount !== 1 ? 's' : ''} pending
            </Text>
          )}
          {failedCount > 0 && (
            <Text style={styles.detailText}>
              {failedCount} operation{failedCount !== 1 ? 's' : ''} failed
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (onPress || failedCount > 0 || (pendingCount > 0 && isOnline)) {
    return (
      <Pressable 
        style={styles.pressableContainer}
        onPress={handlePress}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Minimal sync status dot for headers/navigation
 */
export function SyncStatusDot() {
  const { isOnline, failedCount, pendingCount } = useSync();

  const getColor = () => {
    if (!isOnline) return '#ff4444';
    if (failedCount > 0) return '#ff8800';
    if (pendingCount > 0) return '#0066cc';
    return '#00aa00';
  };

  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: getColor(),
      }}
    />
  );
}