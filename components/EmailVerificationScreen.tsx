import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface EmailVerificationScreenProps {
  email: string;
  onResend: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
  isResending?: boolean;
  message?: string;
}

export function EmailVerificationScreen({
  email,
  onResend,
  onRefresh,
  onSignOut,
  isResending = false,
  message = ''
}: EmailVerificationScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            📧 Verify Your Email
          </ThemedText>
        </View>

        {/* Message */}
        <View style={styles.messageSection}>
          <ThemedText type="default" style={[styles.message, { color: colors.text }]}>
            We've sent a verification link to:
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={[styles.email, { color: colors.tint }]}>
            {email}
          </ThemedText>
          <ThemedText type="default" style={[styles.instructions, { color: colors.tabIconDefault }]}>
            Please check your inbox and click the verification link, then tap "I've Verified My Email" below.
          </ThemedText>
        </View>

        {/* Status Message */}
        {message && (
          <View style={[
            styles.statusMessage, 
            { 
              backgroundColor: message.includes('Failed') || message.includes('Error') ? '#ff444420' : '#00cc0020',
              borderColor: message.includes('Failed') || message.includes('Error') ? '#ff4444' : '#00cc00'
            }
          ]}>
            <ThemedText style={[
              styles.statusText,
              { color: message.includes('Failed') || message.includes('Error') ? '#ff4444' : '#00cc00' }
            ]}>
              {message}
            </ThemedText>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={onRefresh}
          >
            <ThemedText style={styles.primaryButtonText}>
              I've Verified My Email
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.secondaryButton, 
              { borderColor: colors.tabIconDefault }
            ]}
            onPress={onResend}
            disabled={isResending}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={onSignOut}
          >
            <ThemedText style={[styles.textButtonText, { color: colors.tabIconDefault }]}>
              Sign out and use different email
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: colors.tabIconDefault }]}>
            Didn't receive the email? Check your spam folder or try resending.
          </ThemedText>
          <ThemedText style={[styles.footerText, { color: colors.tabIconDefault, marginTop: 8 }]}>
            After clicking the verification link in your email, return here and tap "I've Verified My Email".
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusMessage: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  actions: {
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  textButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});