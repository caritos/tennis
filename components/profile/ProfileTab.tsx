import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface User {
  id?: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface ProfileTabProps {
  user: User | null;
  colors: any;
}

const ProfileTab = React.memo(function ProfileTab({ user, colors }: ProfileTabProps) {
  return (
    <ThemedView style={styles.section}>
      <View style={styles.userSection}>
        <View style={styles.userInfoContainer}>
          <View>
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            {user?.phone && (
              <ThemedText style={styles.userPhone}>{user.phone}</ThemedText>
            )}
          </View>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.tint }]}
            onPress={() => router.push('/edit-profile')}
          >
            <Ionicons name="pencil" size={16} color={colors.tint} />
            <ThemedText style={[styles.editButtonText, { color: colors.tint }]}>
              Edit Profile
            </ThemedText>
          </TouchableOpacity>
        </View>
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
  userSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  userPhone: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
});