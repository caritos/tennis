import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function TermsOfServiceScreen() {
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
        <ThemedText type="title" style={styles.headerTitle}>Terms of Service</ThemedText>
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
            Welcome to Play Serve! These Terms of Service (&quot;Terms&quot;) govern your use of our mobile application and services. By using Play Serve, you agree to these Terms.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            About Play Serve
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            Play Serve is a mobile application that connects tennis players within local clubs. Our service allows you to:
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Join tennis clubs in your area
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Find other players for matches
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Record match results and track rankings
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Coordinate matches through our invitation system
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account Requirements
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Eligibility</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • You must be at least 13 years old to use Tennis Club
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • You must provide accurate and complete information
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • You are responsible for maintaining account security
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Account Information</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Real Names Required</ThemedText>: You must use your real, legal name
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Accurate Contact Info</ThemedText>: Phone number and email must be current and valid
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>One Account Per Person</ThemedText>: Multiple accounts are not permitted
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Community Standards
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Expected Behavior</ThemedText>
          <ThemedText style={styles.paragraph}>All Tennis Club users must:</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Honor Commitments</ThemedText>: Show up for confirmed matches on time
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Be Respectful</ThemedText>: Treat all players with courtesy and sportsmanship
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Play Fair</ThemedText>: Report accurate match scores using our honor system
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Communicate Clearly</ThemedText>: Respond to match invitations promptly
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Prohibited Conduct</ThemedText>
          <ThemedText style={styles.paragraph}>The following behaviors are not allowed:</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • No-shows: Repeatedly failing to appear for confirmed matches
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Unsportsmanlike behavior: Arguing, harassment, or poor conduct during matches
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • False information: Providing fake personal details or match results
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Abuse of others: Harassment, discrimination, or threatening behavior
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Community Reporting System
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            Our system processes behavior reports automatically with escalating consequences:
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • 2 reports = Warning notification with community guidelines
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • 3 reports = Temporary removal from all clubs (7 days)
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • 4 reports = Permanent ban from the platform
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Match Recording and Rankings
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Honor System</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Match scores are final when recorded
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Any match participant can edit results if needed
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • We use an honor system instead of formal dispute processes
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Points and rankings update immediately after matches
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy and Data
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Information Sharing</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Your name and ranking are visible to club members
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Phone numbers are automatically shared with confirmed match partners
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Club rankings and statistics are visible to all club members
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            For complete details, see our Privacy Policy.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Account Termination
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Your Rights</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • You may delete your account at any time through app settings
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Account deletion removes your personal information within 30 days
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Match history may be anonymized and retained for ranking integrity
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Our Rights</ThemedText>
          <ThemedText style={styles.paragraph}>We may suspend or terminate accounts for:</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Violation of these Terms
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Multiple community reports
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Fraudulent or abusive behavior
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Legal or safety concerns
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Disclaimers and Limitations
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            Tennis Club is provided &quot;as is&quot; without warranties of any kind. We are not responsible for disputes between users or for your safety during tennis matches.
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            To the maximum extent permitted by law, our liability is limited and we are not liable for indirect, incidental, or consequential damages.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Changes to Terms
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            We may update these Terms to reflect changes in our service or legal requirements. Significant changes will be communicated through the app or email. Changes take effect 30 days after notification.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Contact Information
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            For questions about these Terms or Tennis Club:
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>Email</ThemedText>: support@tennisclub.app
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>Legal</ThemedText>: legal@tennisclub.app
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            By using Tennis Club, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 44,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  effectiveDate: {
    fontSize: 13,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 8,
    paddingLeft: 0,
  },
  bold: {
    fontWeight: '600',
  },
});