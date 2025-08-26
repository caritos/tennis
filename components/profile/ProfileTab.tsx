import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';

interface User {
  id?: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}

interface ProfileTabProps {
  user: User | null;
  colors: any;
  onUserUpdate?: (updatedUser: User) => void;
}

const ProfileTab = React.memo(function ProfileTab({ user, colors, onUserUpdate }: ProfileTabProps) {
  // Initialize with empty strings to avoid timing issues
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Always update state when user data changes, including initial load
  useEffect(() => {
    if (user) {
      const newFullName = user.user_metadata?.full_name || (user as any).full_name || '';
      const newPhone = user.phone || user.user_metadata?.phone || '';
      
      setFullName(newFullName);
      setPhone(newPhone);
      setHasChanges(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id || !hasChanges) return;

    setIsSaving(true);
    try {
      // Update users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
        })
        .eq('id', user.id);

      if (dbError) {
        console.error('Database update error:', dbError);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        return;
      }

      // Update auth metadata for full name
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      });

      if (authError) {
        console.error('Auth update error:', authError);
      }

      setHasChanges(false);
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Notify parent of user update if callback provided
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          user_metadata: { ...user.user_metadata, full_name: fullName.trim() },
          phone: phone.trim(),
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFullNameChange = (text: string) => {
    setFullName(text);
    setHasChanges(text.trim() !== (user?.user_metadata?.full_name || ''));
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    const originalPhone = user?.phone || user?.user_metadata?.phone || '';
    setHasChanges(text.trim() !== originalPhone);
  };

  // Don't render form until user data is loaded
  if (!user) {
    return (
      <ThemedView style={styles.section}>
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.section}>
      <View style={styles.formContainer}>
        {/* Full Name */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.fieldLabel}>Full Name</ThemedText>
          <TextInput
            style={[styles.textInput, { 
              borderColor: colors.tabIconDefault + '40',
              color: colors.text,
              backgroundColor: colors.background 
            }]}
            value={fullName}
            onChangeText={handleFullNameChange}
            placeholder="Enter your full name"
            placeholderTextColor={colors.tabIconDefault}
          />
        </View>

        {/* Email (read-only) */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.fieldLabel}>Email</ThemedText>
          <View style={[styles.readOnlyField, { backgroundColor: colors.tabIconDefault + '10' }]}>
            <ThemedText style={[styles.readOnlyText, { color: colors.tabIconDefault }]}>
              {user?.email}
            </ThemedText>
          </View>
        </View>

        {/* Phone */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
          <TextInput
            style={[styles.textInput, { 
              borderColor: colors.tabIconDefault + '40',
              color: colors.text,
              backgroundColor: colors.background 
            }]}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.tabIconDefault}
            keyboardType="phone-pad"
          />
        </View>

        {/* Save Button */}
        {hasChanges && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <ThemedText style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
});

export default ProfileTab;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  formContainer: {
    gap: 20,
  },
  fieldContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  readOnlyField: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  readOnlyText: {
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
  },
});