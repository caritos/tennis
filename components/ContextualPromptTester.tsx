import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { ContextualPrompt } from './ContextualPrompt';
import { 
  ContextualPromptData, 
  ContextualPromptType,
  PromptPriority 
} from '@/types/contextualPrompts';

/**
 * Development component for testing contextual prompts
 * Remove this from production builds
 */
export const ContextualPromptTester: React.FC = () => {
  const [currentTestPrompt, setCurrentTestPrompt] = useState<ContextualPromptData | null>(null);

  // Sample prompts for testing
  const testPrompts: Record<string, ContextualPromptData> = {
    welcomeNewUser: {
      id: 'test_welcome',
      type: 'welcome_new_user',
      title: 'Welcome to Play Serve! 👋',
      subtitle: 'Join a club to start playing tennis',
      priority: 'low',
      icon: '🎾',
      actionButton: {
        label: 'Explore Clubs',
        action: () => console.log('Explore clubs pressed'),
        variant: 'primary'
      },
      dismissible: true
    },
    
    pendingChallenges: {
      id: 'test_challenges',
      type: 'pending_challenges',
      title: 'You have 3 pending challenges',
      subtitle: 'Respond to keep the game moving',
      priority: 'high',
      icon: '🎾',
      actionButton: {
        label: 'View Challenges',
        action: () => console.log('View challenges pressed'),
        variant: 'primary'
      },
      dismissible: true
    },

    activeInvitations: {
      id: 'test_invitations',
      type: 'active_invitations',
      title: '5 players looking to play',
      subtitle: 'Join a match today',
      priority: 'high',
      icon: '🏃‍♂️',
      actionButton: {
        label: 'See Invitations',
        action: () => console.log('See invitations pressed'),
        variant: 'primary'
      },
      dismissible: true
    },

    unrecordedMatches: {
      id: 'test_unrecorded',
      type: 'unrecorded_matches',
      title: '2 matches need scores recorded',
      subtitle: 'Record scores to update rankings',
      priority: 'urgent',
      icon: '📊',
      actionButton: {
        label: 'Record Scores',
        action: () => console.log('Record scores pressed'),
        variant: 'primary'
      },
      dismissible: false
    },

    recordFirstMatch: {
      id: 'test_first_match',
      type: 'record_first_match',
      title: 'Ready to play your first match?',
      subtitle: 'Tap a club to find players and record your first game',
      priority: 'medium',
      icon: '🚀',
      actionButton: {
        label: 'Find Players',
        action: () => console.log('Find players pressed'),
        variant: 'secondary'
      },
      dismissible: true
    },

    rankingUpdate: {
      id: 'test_ranking',
      type: 'ranking_update',
      title: '📈 Your ranking improved!',
      subtitle: '#5 → #3',
      priority: 'medium',
      icon: '📈',
      actionButton: {
        label: 'View Rankings',
        action: () => console.log('View rankings pressed'),
        variant: 'secondary'
      },
      dismissible: true,
      autoHideAfter: 10000
    }
  };

  const handleTestPrompt = (promptKey: string) => {
    setCurrentTestPrompt(testPrompts[promptKey]);
  };

  const handleDismissTest = (promptId: string) => {
    console.log('Test prompt dismissed:', promptId);
    setCurrentTestPrompt(null);
  };

  const clearPrompt = () => {
    setCurrentTestPrompt(null);
  };

  if (!__DEV__) {
    return null; // Don't show in production
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>🧪 Contextual Prompt Tester</ThemedText>
      
      {/* Current Test Prompt */}
      {currentTestPrompt && (
        <View style={styles.currentPromptSection}>
          <ThemedText style={styles.sectionTitle}>Current Test Prompt:</ThemedText>
          <ContextualPrompt 
            prompt={currentTestPrompt}
            onDismiss={handleDismissTest}
          />
          <TouchableOpacity style={styles.clearButton} onPress={clearPrompt}>
            <Text style={styles.clearButtonText}>Clear Prompt</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Test Buttons */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Test Prompt Types:</ThemedText>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.buttonRow}>
            {Object.entries(testPrompts).map(([key, prompt]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.testButton,
                  { 
                    backgroundColor: getPriorityColor(prompt.priority),
                    opacity: currentTestPrompt?.id === prompt.id ? 0.5 : 1
                  }
                ]}
                onPress={() => handleTestPrompt(key)}
                disabled={currentTestPrompt?.id === prompt.id}
              >
                <Text style={styles.testButtonIcon}>{prompt.icon}</Text>
                <Text style={styles.testButtonText}>
                  {formatPromptName(key)}
                </Text>
                <Text style={styles.testButtonPriority}>
                  {prompt.priority.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <ThemedText style={styles.infoText}>
          Tap a button to test different contextual prompt states. 
          Prompts will appear above this section.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

// Helper functions
function getPriorityColor(priority: PromptPriority): string {
  switch (priority) {
    case 'urgent': return '#FF3B30';
    case 'high': return '#FF6B35';
    case 'medium': return '#007AFF';
    case 'low': return '#8E8E93';
    default: return '#007AFF';
  }
}

function formatPromptName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  currentPromptSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 12,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
    maxWidth: 120,
  },
  testButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  testButtonPriority: {
    color: 'white',
    fontSize: 10,
    opacity: 0.8,
  },
  infoSection: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});