import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import ProfileTab from '@/components/profile/ProfileTab';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileSettings from '@/components/profile/ProfileSettings';

type TabType = 'profile' | 'stats' | 'settings';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Load player statistics
  const { stats, loading: statsLoading, error: statsError } = usePlayerStats(user?.id || null);

  const handleSignOut = async () => {
    console.log('🔘 BUTTON: Sign Out pressed');
    console.log('Signing out user...');
    await signOut();
    router.replace('/welcome');
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
          <ProfileTab user={user} colors={colors} />
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <ProfileStats
            stats={stats}
            loading={statsLoading}
            error={statsError}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <ProfileSettings
            user={user}
            colors={colors}
            onSignOut={handleSignOut}
          />
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
    paddingHorizontal: 16,  // iOS HIG: Standard margins
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 0.5,  // iOS HIG: Thinner separator
  },
  headerTitle: {
    fontSize: 34,  // iOS HIG: Large Title
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
    minHeight: 44,  // iOS HIG: Minimum touch target
  },
  tabText: {
    fontSize: 10,  // iOS HIG: Tab bar labels
    fontWeight: '500',
    textAlign: 'center',
  },
});
