import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Platform 
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from 'expo-checkbox';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { initializeDatabase } from '@/database/database';
import { getAuthErrorMessage, logError } from '@/utils/errorHandling';

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBack = () => {
    console.log('Back pressed - navigating to welcome');
    // Use replace to ensure we go back to welcome page
    router.replace('/welcome');
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!password) {
      setError('Please enter a password');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    console.log('=== EMAIL SIGNUP STARTING ===');
    setIsLoading(true);
    setError(null);
    
    try {
      // Sign up with Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim() || null,
          }
        }
      });
      
      if (signUpError) {
        logError('email-signup', signUpError);
        throw new Error(getAuthErrorMessage(signUpError));
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user account');
      }
      
      if (!authData.session) {
        console.warn('User created but no session returned - this may require email verification');
      }
      
      // Store user data in Supabase database with retry logic
      let profileError = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        const { error } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            role: 'player'
          });
        
        profileError = error;
        
        if (!error) {
          console.log('User profile created successfully in Supabase');
          break;
        }
        
        // If it's a foreign key constraint error, wait and retry
        if (error.code === '23503' && retryCount < maxRetries - 1) {
          console.log(`Foreign key constraint error, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          retryCount++;
        } else {
          console.error('Failed to create user profile:', error);
          break;
        }
      }
      
      if (profileError) {
        console.error('Final error creating user profile:', profileError);
        // Continue anyway as auth was successful
      }
      
      // Also store in local SQLite for offline support
      const db = await initializeDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          authData.user.id,
          fullName.trim(),
          email.trim(),
          phone.trim() || null,
          'player'
        ]
      );
      
      console.log('User created successfully:', authData.user.id);
      console.log('=== WAITING FOR AUTH STATE UPDATE ===');
      
      // Wait for auth state to update in the context before navigating
      await new Promise(resolve => {
        const checkAuthUpdate = () => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id === authData.user?.id) {
              console.log('=== AUTH STATE CONFIRMED - NAVIGATING TO INDEX ===');
              resolve(true);
            } else {
              console.log('Auth state not updated yet, checking again...');
              setTimeout(checkAuthUpdate, 100);
            }
          });
        };
        checkAuthUpdate();
      });
      
      // Navigate to index route, which will handle routing to tabs after auth is ready
      router.replace('/');
      setIsLoading(false);
      
    } catch (error: any) {
      console.error('Failed to sign up:', error);
      setError(error.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const handleSignInPress = () => {
    console.log('Sign in pressed - navigating to sign in');
    router.push('/signin');
  };

  const handleTermsPress = () => {
    console.log('Terms of Service pressed');
    router.push('/terms-of-service');
  };

  const handlePrivacyPress = () => {
    console.log('Privacy Policy pressed');
    router.push('/privacy-policy');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="back-button"
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <ThemedText type="title" style={styles.headerTitle}>
            Sign Up
          </ThemedText>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#FFEBEE', borderColor: '#F44336' }]}>
            <Ionicons name="alert-circle" size={20} color="#F44336" />
            <ThemedText style={[styles.errorText, { color: '#F44336' }]}>{error}</ThemedText>
            <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
              <Ionicons name="close" size={16} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}

        <ThemedView style={styles.content}>
          {/* App Title and Message */}
          <View style={styles.titleSection}>
            <ThemedText type="title" style={styles.appTitle}>
              🎾 Play Serve
            </ThemedText>
            <ThemedText type="default" style={[styles.subtitle, { color: colors.tabIconDefault }]}>
              Join the tennis community!
            </ThemedText>
          </View>

          {/* Sign Up Form */}
          <ScrollView 
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Full Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.tabIconDefault,
                      color: colors.text
                    }
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.tabIconDefault}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                  testID="fullname-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Email</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.tabIconDefault,
                      color: colors.text
                    }
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  testID="email-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Phone (Optional)</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.tabIconDefault,
                      color: colors.text
                    }
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  editable={!isLoading}
                  testID="phone-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Password</ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.tabIconDefault,
                        color: colors.text
                      }
                    ]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.tabIconDefault}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    testID="password-input"
                    autoFocus={false}
                    blurOnSubmit={false}
                    textContentType="none"
                    autoComplete="off"
                    passwordRules=""
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={colors.tabIconDefault} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.tabIconDefault,
                        color: colors.text
                      }
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.tabIconDefault}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    testID="confirm-password-input"
                    textContentType="none"
                    autoComplete="off"
                    passwordRules=""
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={colors.tabIconDefault} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  value={agreeToTerms}
                  onValueChange={setAgreeToTerms}
                  color={agreeToTerms ? colors.tint : colors.tabIconDefault}
                  disabled={isLoading}
                  testID="terms-checkbox"
                />
                <View style={styles.termsTextContainer}>
                  <ThemedText style={[styles.termsText, { color: colors.text }]}>
                    I agree to the{' '}
                  </ThemedText>
                  <TouchableOpacity onPress={handleTermsPress} disabled={isLoading}>
                    <ThemedText style={[styles.termsLink, { color: colors.tint }]}>
                      Terms of Service
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={[styles.termsText, { color: colors.text }]}>
                    {' '}and{' '}
                  </ThemedText>
                  <TouchableOpacity onPress={handlePrivacyPress} disabled={isLoading}>
                    <ThemedText style={[styles.termsLink, { color: colors.tint }]}>
                      Privacy Policy
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.signUpButton,
                  { backgroundColor: colors.tint },
                  isLoading && styles.disabledButton
                ]}
                onPress={handleSignUp}
                disabled={isLoading}
                testID="signup-button"
              >
                <ThemedText style={[styles.signUpButtonText, { color: '#fff' }]}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </ThemedText>
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.signInSection}>
                <ThemedText style={[styles.signInPrompt, { color: colors.tabIconDefault }]}>
                  Already have an account?{' '}
                </ThemedText>
                <TouchableOpacity
                  onPress={handleSignInPress}
                  disabled={isLoading}
                  testID="signin-link"
                >
                  <ThemedText style={[styles.signInLink, { color: colors.tint }]}>
                    Sign In
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  errorDismiss: {
    padding: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding at bottom to prevent clipping
    minHeight: '100%', // Ensure content fills available space
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 45,
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 8,
    padding: 8,
    zIndex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 12,
    flex: 1,
  },
  termsText: {
    fontSize: 14,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 40, // Increased bottom margin
    marginTop: 16,    // Added top margin
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signInSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  signInPrompt: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});