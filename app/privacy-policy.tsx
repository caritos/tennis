import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Privacy Policy</ThemedText>
        <ThemedView style={styles.headerSpacer} />
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.effectiveDate, { color: colors.tabIconDefault }]}>
            Effective Date: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Tennis Club (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Information We Collect
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Personal Information</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Name</ThemedText>: Your full name for identification within tennis clubs
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Email Address</ThemedText>: For account creation and essential communications
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Phone Number</ThemedText>: Shared automatically with match partners for coordination
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Location Data</ThemedText>: Your approximate location to discover nearby tennis clubs
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Tennis Activity Data</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Match results, club memberships, and rankings
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Match invitations and challenges you create or respond to
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Automatically Collected Information</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Device information and app version
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Usage analytics (anonymized) and crash reports
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            How We Use Your Information
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Core App Functionality</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Show nearby tennis clubs based on your location
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Connect you with other tennis players in your clubs
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Share contact information automatically after match confirmations
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Calculate rankings and statistics from your match history
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Communications</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Send essential notifications about matches and invitations
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Account verification, password resets, and security alerts
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Information Sharing
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Within Tennis Clubs</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Your name, ranking, and match history are visible to club members
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Phone numbers are automatically shared with confirmed match partners
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>We Do Not Sell Your Data</ThemedText>
          <ThemedText style={styles.paragraph}>
            We never sell, rent, or trade your personal information to third parties for marketing purposes.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Your Privacy Rights
          </ThemedText>
          
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>View Your Data</ThemedText>: Access all personal information we have about you
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Update Information</ThemedText>: Edit your profile and account details anytime
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Delete Account</ThemedText>: Request complete account and data deletion
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Control Notifications</ThemedText>: Turn notifications on or off in app settings
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Location Privacy</ThemedText>: Disable location services in your device settings
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Data Security
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            All data is encrypted in transit and at rest. We implement strict access controls and conduct regular security audits to protect your information.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Data Retention
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            We keep your data while your account is active. When you delete your account, personal information is removed within 30 days, though match history may be anonymized and retained for club rankings integrity.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contact Us
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            If you have questions about this Privacy Policy or your privacy rights:
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>Email</ThemedText>: privacy@tennisclub.app
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            State-Specific Rights
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>California & European Residents</ThemedText>: You have additional rights under CCPA and GDPR, including rights to access, delete, and control how your data is processed. Contact us at privacy@tennisclub.app to exercise these rights.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  effectiveDate: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 0,
  },
  bold: {
    fontWeight: '600',
  },
});