import { ScrollView, StyleSheet, View, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import clubService from '@/services/clubService';
import { Club } from '@/lib/supabase';
import { MatchHistoryView } from '@/components/MatchHistoryView';
import { PlayerStatsDisplay } from '@/components/PlayerStatsDisplay';
import { usePlayerStats } from '@/hooks/usePlayerStats';

type TabType = 'profile' | 'stats' | 'matches' | 'settings';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Load player statistics
  const { stats, loading: statsLoading, error: statsError, refreshStats } = usePlayerStats(user?.id || null);

  const handleSignOut = async () => {
    console.log('🔘 BUTTON: Sign Out pressed');
    console.log('Signing out user...');
    await signOut();
    router.replace('/welcome');
  };

  const handleContactSupport = async () => {
    console.log('📧 Contact Support button pressed');
    
    const supportEmail = 'support@caritos.com';
    const subject = 'Tennis Club App Support Request';
    
    // Try simple mailto first
    const simpleEmailUrl = `mailto:${supportEmail}`;
    
    try {
      console.log('📧 Trying simple email URL:', simpleEmailUrl);
      const supported = await Linking.canOpenURL(simpleEmailUrl);
      console.log('📧 Simple email supported:', supported);
      
      if (supported) {
        // Try with subject and body
        const body = `Hi Support Team,

I need help with the Tennis Club app.

Issue Description:
[Please describe your issue or question here]

Device Information:
- Platform: ${Platform.OS} ${Platform.Version}
- User: ${user?.email || 'Not signed in'}

Thank you!`;

        const fullEmailUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        console.log('📧 Trying full email URL');
        
        await Linking.openURL(fullEmailUrl);
        console.log('📧 Email app opened successfully');
      } else {
        console.log('📧 Email client not available, showing alert');
        Alert.alert(
          'Contact Support',
          `Please send an email to:\n\n${supportEmail}\n\nSubject: ${subject}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('📧 Error opening email client:', error);
      Alert.alert(
        'Contact Support',
        `Please send an email to:\n\n${supportEmail}\n\nSubject: ${subject}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with user name */}
      <View style={[styles.header, { borderBottomColor: colors.tabIconDefault + '20' }]}>
        <ThemedText type="title" style={styles.headerTitle}>
          {user?.user_metadata?.full_name || user?.email || 'Tennis Player'}
        </ThemedText>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.tabIconDefault + '20' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && { borderBottomColor: colors.tint }]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons 
            name={activeTab === 'profile' ? 'person' : 'person-outline'} 
            size={20} 
            color={activeTab === 'profile' ? colors.tint : colors.tabIconDefault}
          />
          <ThemedText style={[styles.tabText, activeTab === 'profile' && { color: colors.tint }]}>
            Profile
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && { borderBottomColor: colors.tint }]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons 
            name={activeTab === 'stats' ? 'stats-chart' : 'stats-chart-outline'} 
            size={20} 
            color={activeTab === 'stats' ? colors.tint : colors.tabIconDefault}
          />
          <ThemedText style={[styles.tabText, activeTab === 'stats' && { color: colors.tint }]}>
            Stats
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && { borderBottomColor: colors.tint }]}
          onPress={() => setActiveTab('matches')}
        >
          <Ionicons 
            name={activeTab === 'matches' ? 'tennisball' : 'tennisball-outline'} 
            size={20} 
            color={activeTab === 'matches' ? colors.tint : colors.tabIconDefault}
          />
          <ThemedText style={[styles.tabText, activeTab === 'matches' && { color: colors.tint }]}>
            Matches
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && { borderBottomColor: colors.tint }]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons 
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'} 
            size={20} 
            color={activeTab === 'settings' ? colors.tint : colors.tabIconDefault}
          />
          <ThemedText style={[styles.tabText, activeTab === 'settings' && { color: colors.tint }]}>
            Settings
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            <ThemedView style={styles.section}>
              <View style={styles.userSection}>
                <View style={styles.userInfoContainer}>
                  <View>
                    <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
                    {user?.phone && (
                      <ThemedText style={styles.userPhone}>{user.phone}</ThemedText>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.editButton, { borderColor: colors.tint }]}
                    onPress={() => router.push('/edit-profile')}
                  >
                    <Ionicons name="pencil" size={16} color={colors.tint} />
                    <ThemedText style={[styles.editButtonText, { color: colors.tint }]}>
                      Edit Profile
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </ThemedView>

          </>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <ThemedView style={styles.section}>
            <PlayerStatsDisplay 
              stats={stats || {
                totalMatches: 0,
                wins: 0,
                losses: 0,
                winPercentage: 0,
                singlesRecord: { wins: 0, losses: 0, winPercentage: 0 },
                doublesRecord: { wins: 0, losses: 0, winPercentage: 0 },
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
              }}
              loading={statsLoading}
              error={statsError}
            />
          </ThemedView>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <ThemedView style={styles.section}>
            {user?.id ? (
              <View style={styles.matchHistoryContainer}>
                <MatchHistoryView playerId={user.id} />
              </View>
            ) : (
              <ThemedView style={[styles.placeholder, { borderColor: colors.icon }]}>
                <ThemedText style={styles.placeholderText}>Sign in to view match history</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <ThemedView style={styles.section}>
            <View style={styles.settingsContainer}>
              <TouchableOpacity
                style={[styles.settingsItem, { borderColor: colors.icon + '20' }]}
                onPress={() => router.push('/faq')}
                accessibilityRole="button"
                accessibilityLabel="FAQ"
                accessibilityHint="View frequently asked questions"
              >
                <View style={styles.settingsItemContent}>
                  <Ionicons name="help-circle-outline" size={24} color={colors.tint} />
                  <ThemedText style={styles.settingsItemText}>FAQ / Help</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { borderColor: colors.icon + '20' }]}
                onPress={() => router.push('/privacy-policy')}
                accessibilityRole="button"
                accessibilityLabel="Privacy Policy"
                accessibilityHint="View privacy policy"
              >
                <View style={styles.settingsItemContent}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={colors.tint} />
                  <ThemedText style={styles.settingsItemText}>Privacy Policy</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsItem, { borderColor: colors.icon + '20' }]}
                onPress={handleContactSupport}
                accessibilityRole="button"
                accessibilityLabel="Contact Support"
                accessibilityHint="Send an email to support"
              >
                <View style={styles.settingsItemContent}>
                  <Ionicons name="mail-outline" size={24} color={colors.tint} />
                  <ThemedText style={styles.settingsItemText}>Contact Support</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.icon} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.signOutButton, { backgroundColor: colors.tint }]}
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Sign Out"
                accessibilityHint="Sign out of your account"
              >
                <ThemedText style={styles.signOutButtonText}>
                  Sign Out
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  placeholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  placeholderSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  clubsList: {
    gap: 12,
  },
  clubCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'transparent',
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  clubLocation: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  clubMembers: {
    fontSize: 12,
    opacity: 0.6,
  },
  matchHistoryContainer: {
    // Remove maxHeight constraint to prevent overflow
  },
  settingsContainer: {
    paddingVertical: 8,
    gap: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signOutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
