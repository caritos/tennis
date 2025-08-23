import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';
import { EditProfileScreen, ProfileData } from './EditProfileScreen';
import { NotificationPreferencesScreen, NotificationPreferences } from './NotificationPreferencesScreen';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
// import { initializeDatabase } from '@/database/database'; // Removed - using Supabase
import { supabase } from '@/lib/supabase';
import { CompactStyles } from '@/constants/CompactStyles';

interface AdvancedProfileScreenProps {
  onBack: () => void;
}

interface UserProfile {
  full_name: string;
  phone: string;
  profile_photo_uri?: string;
  notification_preferences?: NotificationPreferences;
}

type ScreenType = 'main' | 'edit_profile' | 'notifications' | 'security' | 'data';

export const AdvancedProfileScreen: React.FC<AdvancedProfileScreenProps> = ({ onBack }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, signOut } = useAuth();
  const { showError } = useNotification();

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('main');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      const { data: result, error } = await supabase
        .from('users')
        .select('full_name, phone, profile_photo_uri, notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to load user profile:', error);
        showError('Load Failed', 'Failed to load profile data');
        return;
      }

      if (result) {
        const profile: UserProfile = {
          full_name: result.full_name || '',
          phone: result.phone || '',
          profile_photo_uri: result.profile_photo_uri || undefined,
        };

        // Parse notification preferences if they exist
        if (result.notification_preferences) {
          try {
            profile.notification_preferences = JSON.parse(result.notification_preferences);
          } catch (error) {
            console.warn('Failed to parse notification preferences:', error);
          }
        }

        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      showError('Load Failed', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (profileData: ProfileData) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          profile_photo_uri: profileData.profile_photo_uri || null,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save profile:', error);
        throw new Error('Failed to save profile changes');
      }

      // Update local state
      setUserProfile(prev => prev ? { 
        ...prev, 
        full_name: profileData.full_name,
        phone: profileData.phone,
        profile_photo_uri: profileData.profile_photo_uri,
      } : null);
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw new Error('Failed to save profile changes');
    }
  };

  const handleSaveNotificationPreferences = async (preferences: NotificationPreferences) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ notification_preferences: JSON.stringify(preferences) })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to save notification preferences:', error);
        throw new Error('Failed to save notification preferences');
      }

      // Update local state
      setUserProfile(prev => prev ? { ...prev, notification_preferences: preferences } : null);
      
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      throw new Error('Failed to save notification preferences');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              onBack();
            } catch (error) {
              console.error('Failed to sign out:', error);
              showError('Sign Out Failed', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderMenuSection = (title: string, items: React.ReactNode[]) => (
    <View style={styles.menuSection}>
      <Text style={[styles.menuSectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.menuItems, { backgroundColor: colors.background }]}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item}
            {index < items.length - 1 && (
              <View style={[styles.menuSeparator, { backgroundColor: colors.tabIconDefault + '20' }]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    showArrow = true
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuItemIcon, { backgroundColor: colors.tint + '15' }]}>
          <Ionicons name={icon as any} size={20} color={colors.tint} />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.menuItemSubtitle, { color: colors.tabIconDefault }]}>{subtitle}</Text>
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
      )}
    </TouchableOpacity>
  );

  const renderMainScreen = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Profile Settings</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Summary */}
      <View style={[styles.profileSummary, { backgroundColor: colors.background }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.tint }]}>
          <Text style={styles.profileAvatarText}>
            {userProfile?.full_name.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {userProfile?.full_name || 'Unknown User'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.tabIconDefault }]}>
            {user?.email || 'No email'}
          </Text>
        </View>
      </View>

      {/* Profile Settings */}
      {renderMenuSection('Profile', [
        renderMenuItem(
          'person-outline',
          'Edit Profile',
          'Personal information, tennis level, and playing style',
          () => setCurrentScreen('edit_profile')
        ),
        renderMenuItem(
          'notifications-outline',
          'Notifications',
          'Configure notification preferences and quiet hours',
          () => setCurrentScreen('notifications')
        ),
      ])}

      {/* Privacy & Security */}
      {renderMenuSection('Privacy & Security', [
        renderMenuItem(
          'shield-outline',
          'Account Security',
          'Password, two-factor authentication, and login activity',
          () => setCurrentScreen('security')
        ),
        renderMenuItem(
          'document-outline',
          'Data & Privacy',
          'Download data, delete account, and privacy controls',
          () => setCurrentScreen('data')
        ),
      ])}

      {/* Support & Legal */}
      {renderMenuSection('Support & Legal', [
        renderMenuItem(
          'help-circle-outline',
          'Help & Support',
          'Get help, report issues, and contact support',
          () => console.log('Support page not implemented yet')
        ),
        renderMenuItem(
          'document-text-outline',
          'Terms & Privacy',
          'Terms of service and privacy policy',
          () => console.log('Legal page not implemented yet')
        ),
      ])}

      {/* Sign Out */}
      <View style={styles.signOutSection}>
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: '#FF3B30' }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {currentScreen === 'main' && renderMainScreen()}
      
      {currentScreen === 'edit_profile' && userProfile && (
        <EditProfileScreen
          onBack={() => setCurrentScreen('main')}
          onSave={handleSaveProfile}
          initialData={userProfile ? {
            full_name: userProfile.full_name,
            phone: userProfile.phone,
            profile_photo_uri: userProfile.profile_photo_uri,
          } : undefined}
        />
      )}
      
      {currentScreen === 'notifications' && (
        <NotificationPreferencesScreen
          onBack={() => setCurrentScreen('main')}
          onSave={handleSaveNotificationPreferences}
          initialPreferences={userProfile?.notification_preferences}
        />
      )}
      
      {currentScreen === 'security' && (
        <View style={styles.placeholderScreen}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            Account Security settings coming soon...
          </Text>
        </View>
      )}
      
      {currentScreen === 'data' && (
        <View style={styles.placeholderScreen}>
          <TouchableOpacity onPress={() => setCurrentScreen('main')} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
            <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.placeholderText, { color: colors.text }]}>
            Data & Privacy settings coming soon...
          </Text>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
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
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  skillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  menuItems: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  signOutSection: {
    paddingHorizontal: CompactStyles.scrollContent.paddingHorizontal,
    paddingTop: CompactStyles.itemMargin,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: CompactStyles.button.paddingVertical,
    borderRadius: CompactStyles.button.borderRadius,
    borderWidth: 1,
    gap: CompactStyles.smallMargin,
  },
  signOutText: {
    fontSize: CompactStyles.buttonText.fontSize,
    fontWeight: '600',
    color: '#FF3B30',
  },
  placeholderScreen: {
    flex: 1,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});