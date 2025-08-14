import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "How do I join a tennis club?",
    answer: "Browse available clubs in the Clubs tab, tap on a club to view details, then tap 'Join This Club' to become a member. You'll need to be signed in to join clubs."
  },
  {
    category: "Getting Started",
    question: "Do I need to pay to use Play Serve?",
    answer: "Play Serve is free to use! There are no subscription fees or hidden charges. Individual clubs may have their own membership fees, which are separate from the app."
  },
  {
    category: "Getting Started",
    question: "Can I join multiple clubs?",
    answer: "Yes! You can join as many clubs as you'd like. This is great if you play at different locations or want to connect with various tennis communities."
  },
  
  // Finding and Playing Matches
  {
    category: "Finding and Playing Matches",
    question: "How do I find someone to play with?",
    answer: "There are several ways:\n• Check 'Open Invites' in your club to see who's looking for matches\n• Use 'Schedule a Match' to create your own invite\n• View club rankings to find players at your skill level\n• Connect with players after recording matches together"
  },
  {
    category: "Finding and Playing Matches",
    question: "What's the difference between 'Record Match' and 'Schedule a Match'?",
    answer: "• 'Record Match': For logging a match you've already played\n• 'Schedule a Match': For posting an open invite to find players for future matches"
  },
  {
    category: "Finding and Playing Matches",
    question: "How do open invites work?",
    answer: "When you schedule a match, it creates an open invite visible to all club members. Other players can accept your invite, and you'll be notified when someone wants to play. Invites expire after 7 days."
  },
  {
    category: "Finding and Playing Matches",
    question: "Can I play singles and doubles?",
    answer: "Yes! Play Serve supports both singles and doubles matches. When recording or scheduling a match, you can specify the format you want to play."
  },
  
  // Rankings and Scoring
  {
    category: "Rankings and Scoring",
    question: "How do rankings work?",
    answer: "Rankings use a point-based system similar to professional tennis. You earn points for wins, with more points awarded for beating higher-ranked opponents. Rankings are calculated separately for each club you're in."
  },
  {
    category: "Rankings and Scoring",
    question: "What happens to my ranking if I don't play for a while?",
    answer: "Rankings are based on your recent match history. If you're inactive for an extended period, your ranking points may decrease, encouraging active participation in the community."
  },
  {
    category: "Rankings and Scoring",
    question: "Are singles and doubles ranked separately?",
    answer: "Currently, rankings combine both singles and doubles results. Your overall performance across all match types determines your club ranking."
  },
  {
    category: "Rankings and Scoring",
    question: "What are provisional rankings?",
    answer: "New players start with provisional rankings (shown with *) until they've played enough matches. This helps establish an accurate skill level. Provisional players may see larger ranking changes initially."
  },
  
  // Community Guidelines
  {
    category: "Community Guidelines",
    question: "What are the community standards?",
    answer: "• Be respectful to all players\n• Show up for scheduled matches\n• Record scores honestly\n• Maintain good sportsmanship\n• Keep club facilities clean\n• Follow individual club rules"
  },
  {
    category: "Community Guidelines",
    question: "What if someone doesn't show up for a scheduled match?",
    answer: "If a player repeatedly no-shows, report this to club administrators. Clubs may have their own policies for handling no-shows."
  },
  {
    category: "Community Guidelines",
    question: "Can I dispute a match result?",
    answer: "If there's a disagreement about scores, try to resolve it with the other player first. For persistent issues, contact your club administrator for assistance."
  },
  
  // Privacy and Safety
  {
    category: "Privacy and Safety",
    question: "Who can see my profile information?",
    answer: "• Your name and stats are visible to members of clubs you've joined\n• Your email and phone remain private\n• Match history is visible to club members\n• You control what information you add to your profile"
  },
  {
    category: "Privacy and Safety",
    question: "Is my location tracked?",
    answer: "Location is only used when you explicitly allow it to find nearby clubs. We don't track or store your location continuously."
  },
  {
    category: "Privacy and Safety",
    question: "How do I report inappropriate behavior?",
    answer: "Contact your club administrator for club-specific issues. For app-wide concerns or serious violations, email support@playserve.tennis"
  },
  
  // Technical Support
  {
    category: "Technical Support",
    question: "The app isn't working properly. What should I do?",
    answer: "Try these steps:\n1. Force close and restart the app\n2. Check your internet connection\n3. Update to the latest app version\n4. Sign out and sign back in\n\nIf issues persist, email support@playserve.tennis"
  },
  {
    category: "Technical Support",
    question: "How do I delete my account?",
    answer: "To delete your account, email support@playserve.tennis from your registered email address. Note that this will permanently remove all your data, including match history and rankings."
  },
  {
    category: "Technical Support",
    question: "Can I use Play Serve on multiple devices?",
    answer: "Yes! Sign in with the same account on any device to access your profile, clubs, and match history."
  }
];

export default function FAQScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const categories = [...new Set(faqData.map(item => item.category))];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.icon + '20' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>FAQ</ThemedText>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <ThemedText type="subtitle" style={styles.categoryTitle}>
              {category}
            </ThemedText>
            
            {faqData
              .filter(item => item.category === category)
              .map((item, index) => {
                const globalIndex = faqData.indexOf(item);
                const isExpanded = expandedItems.has(globalIndex);
                
                return (
                  <TouchableOpacity
                    key={globalIndex}
                    onPress={() => toggleItem(globalIndex)}
                    style={[styles.faqItem, { borderColor: colors.icon + '20' }]}
                  >
                    <View style={styles.questionRow}>
                      <ThemedText style={styles.question}>
                        {item.question}
                      </ThemedText>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.icon}
                      />
                    </View>
                    
                    {isExpanded && (
                      <ThemedText style={styles.answer}>
                        {item.answer}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
          </View>
        ))}
        
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Still have questions?
          </ThemedText>
          <ThemedText style={[styles.footerEmail, { color: colors.tint }]}>
            support@playserve.tennis
          </ThemedText>
        </View>
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
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  categorySection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 16,
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  footerEmail: {
    fontSize: 16,
    fontWeight: '500',
  },
});