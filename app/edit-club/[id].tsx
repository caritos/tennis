import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { EditClubForm } from '@/components/EditClubForm';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function EditClubScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [club, setClub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClubData();
  }, [id, user]);

  const loadClubData = async () => {
    if (!id || typeof id !== 'string' || !user?.id) {
      setError('Invalid club ID or not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      console.log('📝 Loading club data for editing:', id);
      
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();

      if (clubError) {
        console.error('❌ Failed to load club:', clubError);
        setError('Club not found');
        setIsLoading(false);
        return;
      }

      if (!clubData) {
        setError('Club not found');
        setIsLoading(false);
        return;
      }

      // Check if the current user is the club creator
      if (clubData.creator_id !== user.id) {
        setError('You can only edit clubs that you created');
        setIsLoading(false);
        return;
      }

      setClub(clubData);
      console.log('✅ Club data loaded:', clubData.name);
      
    } catch (err) {
      console.error('❌ Error loading club:', err);
      setError('Failed to load club data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleSuccess = (updatedClub: any) => {
    console.log('✅ Club updated successfully, navigating back');
    // The club details page will refresh when we navigate back
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading club details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !club) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            {error || 'Club not found'}
          </ThemedText>
          <ThemedText 
            style={[styles.backLink, { color: colors.tint }]}
            onPress={handleClose}
          >
            ← Go Back
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <EditClubForm
      club={club}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#ff4444',
  },
  backLink: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});