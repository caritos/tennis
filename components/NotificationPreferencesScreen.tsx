import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useNotification } from '@/contexts/NotificationContext';

export interface NotificationPreferences {
  // Challenge notifications
  challenge_received: boolean;
  challenge_accepted: boolean;
  challenge_declined: boolean;
  challenge_expired: boolean;
  
  // Match invitation notifications
  match_invitation_received: boolean;
  match_invitation_matched: boolean;
  match_invitation_cancelled: boolean;
  
  // Match result notifications
  match_recorded: boolean;
  ranking_updated: boolean;
  
  // Club activity notifications
  new_club_member: boolean;
  club_announcement: boolean;
  
  // General settings
  push_notifications: boolean;
  email_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
}

interface NotificationPreferencesScreenProps {
  onBack: () => void;
  onSave: (preferences: NotificationPreferences) => Promise<void>;
  initialPreferences?: NotificationPreferences;
}

const defaultPreferences: NotificationPreferences = {
  challenge_received: true,
  challenge_accepted: true,
  challenge_declined: true,
  challenge_expired: false,
  match_invitation_received: true,
  match_invitation_matched: true,
  match_invitation_cancelled: true,
  match_recorded: true,
  ranking_updated: true,
  new_club_member: false,
  club_announcement: true,
  push_notifications: true,
  email_notifications: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

export const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({
  onBack,
  onSave,
  initialPreferences,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showSuccess, showError } = useNotification();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...defaultPreferences,
    ...initialPreferences,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(preferences);
      showSuccess('Notifications Updated', 'Your notification preferences have been saved');
      onBack();
    } catch (error: any) {
      console.error('Failed to update notification preferences:', error);
      showError('Update Failed', error.message || 'Failed to update notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const renderNotificationToggle = (
    key: keyof NotificationPreferences,
    title: string,
    description: string,
    icon?: string
  ) => {
    const value = preferences[key] as boolean;
    return (
      <View style={styles.toggleItem}>
        <View style={styles.toggleContent}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={24}
              color={colors.tabIconDefault}
              style={styles.toggleIcon}
            />
          )}
          <View style={styles.toggleText}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.toggleDescription, { color: colors.tabIconDefault }]}>
              {description}
            </Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={(newValue) => updatePreference(key, newValue)}
          trackColor={{ false: colors.tabIconDefault + '40', true: colors.tint + '40' }}
          thumbColor={value ? colors.tint : colors.background}
          ios_backgroundColor={colors.tabIconDefault + '40'}
        />
      </View>
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.background }]}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Notifications</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Master Controls */}
        {renderSection(
          'Master Controls',
          <>
            {renderNotificationToggle(
              'push_notifications',
              'Push Notifications',
              'Receive notifications on your device',
              'notifications-outline'
            )}
            {renderNotificationToggle(
              'email_notifications',
              'Email Notifications',
              'Receive notifications via email',
              'mail-outline'
            )}
          </>
        )}

        {/* Challenge Notifications */}
        {renderSection(
          'Challenge Notifications',
          <>
            {renderNotificationToggle(
              'challenge_received',
              'Challenge Received',
              'When someone challenges you to a match',
              'trophy-outline'
            )}
            {renderNotificationToggle(
              'challenge_accepted',
              'Challenge Accepted',
              'When someone accepts your challenge',
              'checkmark-circle-outline'
            )}
            {renderNotificationToggle(
              'challenge_declined',
              'Challenge Declined',
              'When someone declines your challenge',
              'close-circle-outline'
            )}
            {renderNotificationToggle(
              'challenge_expired',
              'Challenge Expired',
              'When a challenge expires without response',
              'time-outline'
            )}
          </>
        )}

        {/* Match Notifications */}
        {renderSection(
          'Match Notifications',
          <>
            {renderNotificationToggle(
              'match_invitation_received',
              'Match Invitation Received',
              'When someone invites you to play',
              'tennisball-outline'
            )}
            {renderNotificationToggle(
              'match_invitation_matched',
              'Match Found',
              'When enough players join your match invitation',
              'people-outline'
            )}
            {renderNotificationToggle(
              'match_invitation_cancelled',
              'Match Cancelled',
              'When a match invitation is cancelled',
              'calendar-outline'
            )}
            {renderNotificationToggle(
              'match_recorded',
              'Match Results',
              'When someone records a match with you',
              'stats-chart-outline'
            )}
            {renderNotificationToggle(
              'ranking_updated',
              'Ranking Changes',
              'When your club ranking changes',
              'trending-up-outline'
            )}
          </>
        )}

        {/* Club Notifications */}
        {renderSection(
          'Club Activity',
          <>
            {renderNotificationToggle(
              'new_club_member',
              'New Club Members',
              'When someone joins your clubs',
              'person-add-outline'
            )}
            {renderNotificationToggle(
              'club_announcement',
              'Club Announcements',
              'Important updates from your clubs',
              'megaphone-outline'
            )}
          </>
        )}

        {/* Quiet Hours */}
        {renderSection(
          'Quiet Hours',
          <>
            {renderNotificationToggle(
              'quiet_hours_enabled',
              'Enable Quiet Hours',
              'Silence notifications during specific hours',
              'moon-outline'
            )}
            {preferences.quiet_hours_enabled && (
              <View style={styles.quietHoursSettings}>
                <Text style={[styles.quietHoursNote, { color: colors.tabIconDefault }]}>
                  Quiet hours: {preferences.quiet_hours_start} - {preferences.quiet_hours_end}
                </Text>
                <Text style={[styles.quietHoursSubnote, { color: colors.tabIconDefault }]}>
                  You can customize these times in your device settings
                </Text>
              </View>
            )}
          </>
        )}

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.tabIconDefault }]}
            onPress={onBack}
            disabled={isLoading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.tint,
                opacity: isLoading ? 0.6 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    marginRight: 12,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
  },
  quietHoursSettings: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  quietHoursNote: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  quietHoursSubnote: {
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});