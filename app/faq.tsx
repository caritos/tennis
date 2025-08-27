import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getLegacyFAQData, type LegacyFAQItem } from '@/data/faq';

// Use shared FAQ data
const faqData: LegacyFAQItem[] = getLegacyFAQData();

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
      <ThemedView style={[styles.header, { borderBottomColor: colors.icon + '20' }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>FAQ</ThemedText>
        <ThemedView style={styles.headerSpacer} />
      </ThemedView>
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {categories.map((category) => (
          <ThemedView key={category} style={styles.categorySection}>
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
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <ThemedView style={styles.questionRow}>
                      <ThemedText style={styles.question}>
                        {item.question}
                      </ThemedText>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={colors.icon}
                      />
                    </ThemedView>
                    
                    {isExpanded && (
                      <ThemedText style={styles.answer}>
                        {item.answer}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                );
              })}
          </ThemedView>
        ))}
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
  categorySection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  categoryTitle: {
    fontSize: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 50,
  },
  question: {
    fontSize: 17,
    fontWeight: '500',
    flex: 1,
    marginRight: 16,
    lineHeight: 24,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 8,
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
