import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/contexts/NotificationContext';

export default function ResetPasswordScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { showSuccess, showError } = useNotification();
  const _params = useLocalSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{password?: string; confirmPassword?: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔐 Reset Password: Checking session:', session ? 'Session exists' : 'No session');

    if (!session) {
      // Don't immediately error - the session might be created by the deep link handler
      console.log('⚠️ Reset Password: No session found, user may need to request a new reset link');
    }
  };

  useEffect(() => {
    // Check if we have a valid session from the reset link
    checkSession();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      showSuccess(
        'Password Reset',
        'Your password has been successfully reset. You can now sign in with your new password.'
      );
      
      // Sign out and redirect to sign in
      await supabase.auth.signOut();
      router.replace('/email-signin');
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      showError('Error', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Reset Password
            </ThemedText>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: colors.tint + '20' }]}>
              <Ionicons name="key-outline" size={40} color={colors.tint} />
            </View>
          </View>

          {/* Content */}
          <ThemedView style={styles.content}>
            <ThemedText style={styles.description}>
              Enter your new password below. Make sure it&apos;s at least 6 characters long.
            </ThemedText>

            {/* Password Input */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>New Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background,
                      borderColor: errors.password ? '#ff3b30' : colors.icon,
                      color: colors.text
                    }
                  ]}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.tabIconDefault}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors({...errors, password: undefined});
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.tabIconDefault}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
              )}
            </ThemedView>

            {/* Confirm Password Input */}
            <ThemedView style={styles.inputContainer}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background,
                      borderColor: errors.confirmPassword ? '#ff3b30' : colors.icon,
                      color: colors.text
                    }
                  ]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.tabIconDefault}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors({...errors, confirmPassword: undefined});
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.tabIconDefault}
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
              )}
            </ThemedView>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.tint },
                isLoading && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Reset password"
            >
              <ThemedText style={styles.submitButtonText}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </ThemedText>
            </TouchableOpacity>

            {/* Cancel Link */}
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => router.replace('/email-signin')}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Cancel and return to sign in"
            >
              <ThemedText style={[styles.cancelLinkText, { color: colors.tabIconDefault }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16, // iOS standard margins
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28, // iOS Title 1
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16, // iOS standard content margins
  },
  description: {
    fontSize: 17, // iOS Body
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24, // Better line height for iOS
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15, // iOS Body
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12, // iOS standard radius
    paddingHorizontal: 16, // iOS standard padding
    paddingVertical: 16,
    fontSize: 17, // iOS text input size
    paddingRight: 50,
    minHeight: 50, // iOS minimum input height
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -22, // Center vertically
    padding: 12,
    minHeight: 44, // iOS minimum touch target
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#ff3b30', // iOS system red
    fontSize: 13, // iOS Caption 1
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12, // iOS standard radius
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 12,
    minHeight: 50, // iOS minimum primary button height
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 17, // iOS Headline
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
  },
  cancelLinkText: {
    fontSize: 17, // iOS Headline
  },
});