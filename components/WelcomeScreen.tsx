import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onTermsPress?: () => void;
  onPrivacyPress?: () => void;
}

export function WelcomeScreen({ 
  onGetStarted, 
  onSignIn, 
  onTermsPress, 
  onPrivacyPress 
}: WelcomeScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isPressed, setIsPressed] = useState(false);

  const handleGetStarted = () => {
    console.log('🔘 BUTTON: Get Started pressed');
    if (isPressed) {
      console.log('⚠️ Button press ignored - double-tap prevention');
      return; // Prevent double-tap
    }
    setIsPressed(true);
    
    try {
      onGetStarted();
    } catch (error) {
      console.error('Error in onGetStarted:', error);
    } finally {
      // Reset after a short delay
      setTimeout(() => setIsPressed(false), 300);
    }
  };

  const handleSignIn = () => {
    console.log('🔘 BUTTON: Sign In pressed');
    try {
      onSignIn();
    } catch (error) {
      console.error('Error in onSignIn:', error);
    }
  };

  const handleTermsPress = () => {
    console.log('🔘 BUTTON: Terms of Service pressed');
    try {
      onTermsPress?.();
    } catch (error) {
      console.error('Error in onTermsPress:', error);
    }
  };

  const handlePrivacyPress = () => {
    console.log('🔘 BUTTON: Privacy Policy pressed');
    try {
      onPrivacyPress?.();
    } catch (error) {
      console.error('Error in onPrivacyPress:', error);
    }
  };

  return (
    <ThemedView 
      style={[styles.container, { backgroundColor: colors.background }]}
      testID="welcome-screen-container"
    >
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.content} testID="welcome-main-content">
        {/* Header with Tennis Emoji and App Title */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.appTitle}>
            🎾 Play Serve
          </ThemedText>
        </View>

        {/* Value Proposition */}
        <View style={styles.valueProposition}>
          <ThemedText type="subtitle" style={styles.tagline}>
            Connect with tennis players in your area
          </ThemedText>
          
          <View style={styles.features}>
            <ThemedText type="default" style={[styles.feature, { color: colors.tabIconDefault }]}>
              🏟️ Join local tennis clubs
            </ThemedText>
            <ThemedText type="default" style={[styles.feature, { color: colors.tabIconDefault }]}>
              📊 Track your matches and stats
            </ThemedText>
            <ThemedText type="default" style={[styles.feature, { color: colors.tabIconDefault }]}>
              👥 Find playing partners nearby
            </ThemedText>
          </View>
          
          <ThemedText type="default" style={[styles.description, { color: colors.tabIconDefault }]}>
            Join a community of tennis enthusiasts. Create clubs, organize matches, and track your progress with fellow players in your area.
          </ThemedText>
        </View>

        {/* Main Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={handleGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            accessibilityHint="Start the sign up process to create a new tennis club account"
            activeOpacity={0.8}
            testID="get-started-button"
          >
            <ThemedText style={styles.primaryButtonText}>
              Get Started
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.signInContainer}>
            <ThemedText style={[styles.signInPrompt, { color: colors.tabIconDefault }]}>
              Already have an account?
            </ThemedText>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSignIn}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
              accessibilityHint="Sign in to your existing tennis club account"
              activeOpacity={0.8}
              testID="sign-in-button"
            >
              <ThemedText style={[styles.secondaryButtonText, { color: colors.tint }]}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleTermsPress}
            accessibilityRole="button"
            accessibilityLabel="Terms of Service"
            style={styles.footerLink}
            testID="terms-of-service-link"
          >
            <ThemedText style={[styles.footerLinkText, { color: colors.tabIconDefault }]}>
              Terms of Service
            </ThemedText>
          </TouchableOpacity>
          
          <ThemedText style={[styles.footerSeparator, { color: colors.tabIconDefault }]}>
            {' | '}
          </ThemedText>
          
          <TouchableOpacity
            onPress={handlePrivacyPress}
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy"
            style={styles.footerLink}
            testID="privacy-policy-link"
          >
            <ThemedText style={[styles.footerLinkText, { color: colors.tabIconDefault }]}>
              Privacy Policy
            </ThemedText>
          </TouchableOpacity>
        </View>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  valueProposition: {
    alignItems: 'center',
    marginBottom: 60,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  features: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feature: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInPrompt: {
    fontSize: 16,
    marginBottom: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  footerLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footerSeparator: {
    fontSize: 14,
  },
});