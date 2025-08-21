import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  terms?: string;
  general?: string;
}

interface FormFieldsProps {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  errors: FormErrors;
  isE2EEnvironment: boolean;
  colors: any;
  onFullNameChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onConfirmPasswordChange: (text: string) => void;
  onPhoneChange: (text: string) => void;
  onClearError: (field: keyof FormErrors) => void;
}

export default function FormFields({
  fullName,
  email,
  password,
  confirmPassword,
  phone,
  errors,
  isE2EEnvironment,
  colors,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onPhoneChange,
  onClearError,
}: FormFieldsProps) {
  return (
    <>
      {/* Full Name */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Full Name</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: errors.fullName ? '#FF6B6B' : colors.tabIconDefault 
            }
          ]}
          placeholder="John Smith"
          placeholderTextColor={colors.tabIconDefault}
          value={fullName}
          onFocus={() => {
            console.log('📝 FULL NAME FOCUSED');
          }}
          onChangeText={(text) => {
            console.log('📝 FULL NAME CHANGED:', text, 'length:', text.length);
            onFullNameChange(text);
            onClearError('fullName');
          }}
          onEndEditing={(e) => {
            console.log('📝 Full Name onEndEditing:', e.nativeEvent.text);
            onFullNameChange(e.nativeEvent.text);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          accessibilityLabel="Full Name"
          testID="full-name-input"
        />
        {errors.fullName && (
          <ThemedText style={styles.errorText} accessibilityRole="alert" testID="full-name-error">
            {errors.fullName}
          </ThemedText>
        )}
      </View>

      {/* Email */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Email Address</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: errors.email ? '#FF6B6B' : colors.tabIconDefault 
            }
          ]}
          placeholder="john@example.com"
          placeholderTextColor={colors.tabIconDefault}
          value={email}
          onFocus={() => {
            console.log('📝 EMAIL FOCUSED');
          }}
          onChangeText={(text) => {
            console.log('📝 EMAIL CHANGED:', text, 'length:', text.length);
            onEmailChange(text);
            onClearError('email');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Email Address"
          testID="email-input"
        />
        {errors.email && (
          <ThemedText style={styles.errorText} accessibilityRole="alert" testID="email-error">
            {errors.email}
          </ThemedText>
        )}
      </View>

      {/* Password */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Password</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: errors.password ? '#FF6B6B' : colors.tabIconDefault 
            }
          ]}
          placeholder="••••••••••••"
          placeholderTextColor={colors.tabIconDefault}
          value={password}
          onChangeText={(text) => {
            onPasswordChange(text);
            onClearError('password');
          }}
          secureTextEntry={!isE2EEnvironment}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="none"
          keyboardType="default"
          spellCheck={false}
          accessibilityLabel="Password"
          testID="password-input"
        />
        {errors.password && (
          <ThemedText style={styles.errorText} accessibilityRole="alert" testID="password-error">
            {errors.password}
          </ThemedText>
        )}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Confirm Password</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: errors.confirmPassword ? '#FF6B6B' : colors.tabIconDefault 
            }
          ]}
          placeholder="••••••••••••"
          placeholderTextColor={colors.tabIconDefault}
          value={confirmPassword}
          onChangeText={(text) => {
            onConfirmPasswordChange(text);
            onClearError('confirmPassword');
          }}
          secureTextEntry={!isE2EEnvironment}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="none"
          keyboardType="default"
          spellCheck={false}
          accessibilityLabel="Confirm Password"
          testID="confirm-password-input"
        />
        {errors.confirmPassword && (
          <ThemedText style={styles.errorText} accessibilityRole="alert" testID="confirm-password-error">
            {errors.confirmPassword}
          </ThemedText>
        )}
      </View>

      {/* Phone Number */}
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Phone Number (Optional)</ThemedText>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.background, 
              color: colors.text,
              borderColor: errors.phone ? '#FF6B6B' : colors.tabIconDefault 
            }
          ]}
          placeholder="(555) 123-4567"
          placeholderTextColor={colors.tabIconDefault}
          value={phone}
          onChangeText={(text) => {
            onPhoneChange(text);
            onClearError('phone');
          }}
          keyboardType="phone-pad"
          autoCorrect={false}
          accessibilityLabel="Phone Number (Optional)"
          testID="phone-input"
        />
        <ThemedText style={[styles.helpText, { color: colors.tabIconDefault }]}>
          For match coordination and contact sharing
        </ThemedText>
        {errors.phone && (
          <ThemedText style={styles.errorText} accessibilityRole="alert" testID="phone-error">
            {errors.phone}
          </ThemedText>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  helpText: {
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 2,
  },
});