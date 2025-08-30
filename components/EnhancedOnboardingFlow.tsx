import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';

const { width: _width } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface StepScreenProps {
  onNext: () => void;
  onSkip?: () => void;
}

// Welcome Step
const WelcomeStep: React.FC<StepScreenProps> = ({ onNext }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  return (
    <View style={[styles.stepContainer, { backgroundColor: colors.background }]}>
      <View style={styles.welcomeContent}>
        <View style={[styles.welcomeIcon, { backgroundColor: colors.tint + '20' }]}>
          <Ionicons name="tennisball" size={64} color={colors.tint} />
        </View>
        
        <ThemedText type="title" style={styles.welcomeTitle}>
          Welcome to Play Serve!
        </ThemedText>
        
        <ThemedText style={styles.welcomeSubtitle}>
          Hi {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! 👋
        </ThemedText>
        
        <ThemedText style={styles.welcomeDescription}>
          Let&apos;s get you set up to find tennis partners, record matches, and climb the rankings in your local clubs.
        </ThemedText>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color={colors.tint} />
            <ThemedText style={styles.featureText}>Find tennis partners nearby</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trophy" size={24} color={colors.tint} />
            <ThemedText style={styles.featureText}>Track matches & rankings</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash" size={24} color={colors.tint} />
            <ThemedText style={styles.featureText}>Challenge other players</ThemedText>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        onPress={onNext}
      >
        <ThemedText style={styles.primaryButtonText}>Let&apos;s Play Tennis!</ThemedText>
        <Ionicons name="tennisball" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

// Location Permission Step - REMOVED (location is auto-requested now)
/*
const LocationStep: React.FC<StepScreenProps> = ({ onNext, onSkip }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { location, requestLocationPermission, hasLocationPermission } = useLocation();
  const { markStepCompleted } = useOnboarding();
  const [requesting, setRequesting] = useState(false);

  const handleRequestLocation = async () => {
    setRequesting(true);
    try {
      await requestLocationPermission();
      await markStepCompleted('location_setup');
      onNext();
    } catch (error) {
      console.error('Failed to request location permission:', error);
    } finally {
      setRequesting(false);
    }
  };

  const handleSkip = async () => {
    await markStepCompleted('location_setup');
    onSkip?.();
  };

  useEffect(() => {
    if (hasLocationPermission && location) {
      markStepCompleted('location_setup');
      onNext();
    }
  }, [hasLocationPermission, location]);

  return (
    <View style={[styles.stepContainer, { backgroundColor: colors.background }]}>
      <View style={styles.stepContent}>
        <View style={[styles.stepIcon, { backgroundColor: colors.tint + '20' }]}>
          <Ionicons name="location" size={48} color={colors.tint} />
        </View>
        
        <ThemedText type="title" style={styles.stepTitle}>
          Find Clubs Near You
        </ThemedText>
        
        <ThemedText style={styles.stepDescription}>
          We&apos;ll use your location to show tennis clubs in your area and help you connect with local players.
        </ThemedText>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
            <ThemedText style={styles.benefitText}>Discover nearby tennis clubs</ThemedText>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
            <ThemedText style={styles.benefitText}>See distance to each club</ThemedText>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
            <ThemedText style={styles.benefitText}>Find matches happening nearby</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.privacyNote}>
          Your location is only used to find nearby clubs and is never shared with other players.
        </ThemedText>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
          onPress={handleRequestLocation}
          disabled={requesting}
        >
          {requesting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="location" size={20} color="white" />
              <ThemedText style={styles.primaryButtonText}>Enable Location</ThemedText>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }]}
          onPress={handleSkip}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
            Skip for now
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
*/

// First Match Guidance Step - MOVED to club detail page as contextual messaging
/*
const FirstMatchStep: React.FC<StepScreenProps> = ({ onNext }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { markStepCompleted } = useOnboarding();

  const handleRecordFirstMatch = async () => {
    await markStepCompleted('first_match_guidance');
    router.push('/record-match');
  };

  const handleFinish = async () => {
    await markStepCompleted('first_match_guidance');
    onNext();
  };

  return (
    <View style={[styles.stepContainer, { backgroundColor: colors.background }]}>
      <View style={styles.stepContent}>
        <View style={[styles.stepIcon, { backgroundColor: colors.tint + '20' }]}>
          <Ionicons name="trophy" size={48} color={colors.tint} />
        </View>
        
        <ThemedText type="title" style={styles.stepTitle}>
          Ready to Play Tennis!
        </ThemedText>
        
        <ThemedText style={styles.stepDescription}>
          You&apos;re all set! Here&apos;s how to make the most of Tennis Club:
        </ThemedText>

        <View style={styles.guidanceList}>
          <View style={styles.guidanceItem}>
            <View style={[styles.guidanceNumber, { backgroundColor: colors.tint }]}>
              <Text style={styles.guidanceNumberText}>1</Text>
            </View>
            <View style={styles.guidanceContent}>
              <ThemedText style={styles.guidanceTitle}>Record Your First Match</ThemedText>
              <ThemedText style={styles.guidanceDesc}>
                After playing, record the score to start building your ranking
              </ThemedText>
            </View>
          </View>

          <View style={styles.guidanceItem}>
            <View style={[styles.guidanceNumber, { backgroundColor: colors.tint }]}>
              <Text style={styles.guidanceNumberText}>2</Text>
            </View>
            <View style={styles.guidanceContent}>
              <ThemedText style={styles.guidanceTitle}>Challenge Players</ThemedText>
              <ThemedText style={styles.guidanceDesc}>
                Tap on any player in the rankings to send them a challenge
              </ThemedText>
            </View>
          </View>

          <View style={styles.guidanceItem}>
            <View style={[styles.guidanceNumber, { backgroundColor: colors.tint }]}>
              <Text style={styles.guidanceNumberText}>3</Text>
            </View>
            <View style={styles.guidanceContent}>
              <ThemedText style={styles.guidanceTitle}>Looking to Play</ThemedText>
              <ThemedText style={styles.guidanceDesc}>
                Post when you want to play and others can join your match
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
          onPress={handleRecordFirstMatch}
        >
          <Ionicons name="add" size={20} color="white" />
          <ThemedText style={styles.primaryButtonText}>Record First Match</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.tabIconDefault }]}
          onPress={handleFinish}
        >
          <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
            I&apos;ll do this later
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
*/

export const EnhancedOnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { _steps, _currentStep, _markStepCompleted, getProgress } = useOnboarding();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const progress = getProgress();

  const onboardingSteps = [
    { id: 'welcome', component: WelcomeStep },
  ];

  const handleNext = () => {
    if (currentStepIndex < onboardingSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (currentStepIndex < onboardingSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const CurrentStepComponent = onboardingSteps[currentStepIndex].component;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.tabIconDefault + '30' }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.tint,
                width: `${(progress.completed / progress.total) * 100}%`,
              },
            ]}
          />
        </View>
        <ThemedText style={styles.progressText}>
          {progress.completed} of {progress.total} steps completed
        </ThemedText>
      </View>

      {/* Current Step */}
      <CurrentStepComponent onNext={handleNext} onSkip={handleSkip} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  stepIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
    opacity: 0.8,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  welcomeDescription: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
    opacity: 0.8,
  },
  featureList: {
    width: '100%',
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 17,
    marginLeft: 16,
    flex: 1,
  },
  benefitsList: {
    width: '100%',
    paddingHorizontal: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 24,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  guidanceList: {
    width: '100%',
    paddingHorizontal: 20,
  },
  guidanceItem: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  guidanceNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  guidanceNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guidanceContent: {
    flex: 1,
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  guidanceDesc: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  stepButtons: {
    paddingBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    minHeight: 50,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 50,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },
});

export default EnhancedOnboardingFlow;