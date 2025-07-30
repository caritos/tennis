import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function CommunityGuidelinesScreen() {
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
        <ThemedText type="title" style={styles.headerTitle}>Community Guidelines</ThemedText>
        <ThemedView style={styles.headerSpacer} />
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.section}>
          <ThemedText style={[styles.lastUpdated, { color: colors.tabIconDefault }]}>
            Last Updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </ThemedText>

          <ThemedText style={styles.intro}>
            Play Serve is built on the foundation of sportsmanship, respect, and the love of tennis. 
            These Community Guidelines help ensure our platform remains a safe, welcoming space for 
            tennis players of all skill levels to connect, compete, and grow together.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🎾 Our Tennis Community Values
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Sportsmanship First</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Respect all players regardless of skill level, age, or background
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Honor the tennis tradition of fair play and integrity
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Be gracious in both victory and defeat
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Encourage and support fellow players&apos; improvement
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Inclusive Environment</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Welcome players of all backgrounds, abilities, and experience levels
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Use inclusive language that makes everyone feel welcome
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Offer help and advice to newcomers learning the game
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ✅ What We Encourage
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Positive Interactions</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Share tennis tips, techniques, and strategies
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Celebrate achievements and milestones with fellow players
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Organize friendly tournaments and social events
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Provide constructive feedback and encouragement
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Accurate Information</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Use your real name and accurate skill level information
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Report match scores honestly and accurately
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Share reliable information about courts, clubs, and events
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🚫 What We Don't Allow
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Harassment and Bullying</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Personal attacks, insults, or derogatory comments
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Discriminatory language based on race, gender, religion, or other characteristics
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Intimidation, threats, or aggressive behavior
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Persistent unwanted contact or communication
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Spam and Misuse</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Excessive promotional content or advertising
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Fake profiles or impersonation of others
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Deliberately false or misleading information
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Manipulating rankings or match results
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Inappropriate Content</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Content that is sexually explicit, violent, or otherwise inappropriate
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Illegal activities or content that violates laws
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Sharing personal information of others without consent
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🛡️ Safety and Privacy
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Meeting Safely</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Meet new players in public tennis facilities when possible
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Trust your instincts if something doesn&apos;t feel right
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Share your location with friends when meeting new players
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Report any concerning behavior to our safety team
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Privacy Protection</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Only share contact information with confirmed match partners
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Respect others&apos; privacy preferences and boundaries
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Don't share screenshots or personal information outside the app
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📱 Platform Guidelines
          </ThemedText>
          
          <ThemedText style={styles.subSectionTitle}>Account Responsibility</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Keep your account secure and don&apos;t share login credentials
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Maintain one active account per person
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Update your availability and preferences regularly
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Honor your match commitments and communicate changes promptly
          </ThemedText>

          <ThemedText style={styles.subSectionTitle}>Reporting Issues</ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Report inappropriate behavior, content, or safety concerns immediately
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Use the in-app reporting tools or contact safety@tennisclub.app
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Provide specific details to help our team investigate effectively
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • Don't make false reports or abuse the reporting system
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ⚖️ Enforcement and Consequences
          </ThemedText>
          
          <ThemedText style={styles.paragraph}>
            When community guidelines are violated, we may take action including:
          </ThemedText>

          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Warning</ThemedText>: First offense for minor violations
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Temporary Suspension</ThemedText>: Limited app access for repeated violations
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Feature Restrictions</ThemedText>: Limited messaging, challenges, or club participation
          </ThemedText>
          <ThemedText style={styles.bulletPoint}>
            • <ThemedText style={styles.bold}>Account Termination</ThemedText>: Permanent removal for serious or repeated violations
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            We review each report carefully and consider context, intent, and severity. 
            Users may appeal enforcement decisions by contacting our support team.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🤝 Building Our Community Together
          </ThemedText>
          
          <ThemedText style={styles.paragraph}>
            Every member plays a vital role in maintaining the positive, supportive atmosphere 
            that makes Play Serve special. By following these guidelines and holding each other 
            accountable, we create an environment where tennis players can thrive, improve, 
            and build lasting friendships through our shared love of the game.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>Remember</ThemedText>: Tennis has always been a sport 
            of honor, integrity, and mutual respect. Let&apos;s bring those same values to our digital 
            tennis community.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📞 Contact & Support
          </ThemedText>
          
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>Safety & Trust Team</ThemedText>: eladio@caritos.com
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>General Support</ThemedText>: eladio@caritos.com
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>Response Time</ThemedText>: We aim to respond to all safety reports within 24-48 hours
          </ThemedText>

          <ThemedText style={styles.footerNote}>
            Thank you for being part of the Play Serve community. Together, we&apos;re making tennis 
            more accessible, enjoyable, and connected for players everywhere! 🎾
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
  lastUpdated: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
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
  footerNote: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    fontStyle: 'italic',
  },
});