import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface User {
  email?: string;
}

interface ProfileSettingsProps {
  user: User | null;
  colors: any;
  onSignOut: () => Promise<void>;
}

const ProfileSettings = React.memo(function ProfileSettings({ user, colors, onSignOut }: ProfileSettingsProps) {
  const handleContactSupport = async () => {
    console.log('📧 Contact Support button pressed');
    
    const supportEmail = 'support@caritos.com';
    const subject = 'Play Serve App Support Request';
    
    // Try simple mailto first
    const simpleEmailUrl = `mailto:${supportEmail}`;
    
    try {
      console.log('📧 Trying simple email URL:', simpleEmailUrl);
      const supported = await Linking.canOpenURL(simpleEmailUrl);
      console.log('📧 Simple email supported:', supported);
      
      if (supported) {
        // Try with subject and body
        const body = `Hi Support Team,

I need help with the Play Serve app.

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
          onPress={onSignOut}
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
  );
});

export default ProfileSettings;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,  // iOS HIG: Standard margins
    paddingVertical: 16,
    marginBottom: 0,
  },
  settingsContainer: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 12,  // iOS HIG: Group container
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 0,  // iOS HIG: Settings list should not have individual borders
    borderWidth: 0,
    borderBottomWidth: 0.5,  // iOS HIG: Separator lines
    minHeight: 44,  // iOS HIG: Minimum touch target
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsItemText: {
    fontSize: 17,  // iOS HIG: Body text
    fontWeight: '400',  // iOS HIG: Regular weight for list items
  },
  signOutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,  // iOS HIG: Standard corner radius
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,  // iOS HIG: Separate destructive actions
    minHeight: 50,  // iOS HIG: Standard button height
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 17,  // iOS HIG: Button text size
    fontWeight: '600',
  },
});