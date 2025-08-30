import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/hooks/useLocation';

const { width } = Dimensions.get('window');

export const OnboardingReEngagement: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { steps, isOnboardingComplete, getProgress, markStepCompleted } = useOnboarding();
  const { user } = useAuth();
  const { hasLocationPermission: _hasLocationPermission } = useLocation();

  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const progress = getProgress();
  const hasIncompleteSteps = progress.completed < progress.total;

  useEffect(() => {
    // DISABLED: No longer showing forceful setup modal
    // Users can use the app fully without additional setup
    // All essential data is collected during signup
    setVisible(false);
  }, [user, hasIncompleteSteps, dismissed, isOnboardingComplete]);

  const getIncompleteSteps = () => {
    return steps.filter(step => !step.completed);
  };

  const handleCompleteStep = async (stepId: string) => {
    switch (stepId) {
      case 'location_setup':
        // Navigate to location permission in onboarding
        setVisible(false);
        router.push('/onboarding');
        break;
      case 'club_joining':
        // Navigate to clubs tab
        setVisible(false);
        router.push('/(tabs)');
        break;
      case 'first_match_guidance':
        // Navigate to match recording
        setVisible(false);
        router.push('/record-match');
        break;
      default:
        await markStepCompleted(stepId);
        break;
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  const handleResumeOnboarding = () => {
    setVisible(false);
    router.push('/onboarding');
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'location_setup':
        return 'location';
      case 'club_discovery':
        return 'search';
      case 'club_joining':
        return 'people';
      case 'first_match_guidance':
        return 'trophy';
      default:
        return 'checkmark-circle';
    }
  };

  const getStepDescription = (stepId: string) => {
    switch (stepId) {
      case 'location_setup':
        return 'Find tennis clubs near you';
      case 'club_discovery':
        return 'Explore clubs in your area';
      case 'club_joining':
        return 'Join a club to start playing';
      case 'first_match_guidance':
        return 'Learn how to record matches';
      default:
        return 'Complete this step';
    }
  };

  const incompleteSteps = getIncompleteSteps();

  if (!visible || incompleteSteps.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons name="rocket" size={32} color={colors.tint} />
              </View>
              
              <ThemedText type="title" style={styles.title}>
                Let&apos;s finish setting up!
              </ThemedText>
              
              <ThemedText style={styles.subtitle}>
                Complete these steps to get the most out of Tennis Club
              </ThemedText>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <ThemedText style={styles.progressLabel}>Progress</ThemedText>
                <ThemedText style={styles.progressText}>
                  {progress.completed} of {progress.total} completed
                </ThemedText>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: colors.tabIconDefault + '30' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.tint,
                      width: `${progress.percentage}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.stepsSection}>
              <ThemedText style={styles.stepsTitle}>Remaining steps:</ThemedText>
              
              {incompleteSteps.map((step) => (
                <TouchableOpacity
                  key={step.id}
                  style={[styles.stepItem, { borderColor: colors.tabIconDefault + '30' }]}
                  onPress={() => handleCompleteStep(step.id)}
                >
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepIcon, { backgroundColor: colors.tint + '20' }]}>
                      <Ionicons
                        name={getStepIcon(step.id) as any}
                        size={20}
                        color={colors.tint}
                      />
                    </View>
                    <View style={styles.stepText}>
                      <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
                      <ThemedText style={styles.stepDescription}>
                        {getStepDescription(step.id)}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color={colors.tabIconDefault} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.benefits}>
              <ThemedText style={styles.benefitsTitle}>Why complete setup?</ThemedText>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="people" size={16} color="#4ECDC4" />
                  <ThemedText style={styles.benefitText}>
                    Find tennis partners nearby
                  </ThemedText>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="trophy" size={16} color="#4ECDC4" />
                  <ThemedText style={styles.benefitText}>
                    Track your ranking progress
                  </ThemedText>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="flash" size={16} color="#4ECDC4" />
                  <ThemedText style={styles.benefitText}>
                    Get match notifications
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.tint }]}
              onPress={handleResumeOnboarding}
            >
              <ThemedText style={styles.primaryButtonText}>Continue Setup</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }]}
              onPress={handleDismiss}
            >
              <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
                Maybe later
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: Math.min(width - 40, 400),
    maxHeight: '80%',
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 24,
  },
  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  stepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  benefits: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.8,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OnboardingReEngagement;