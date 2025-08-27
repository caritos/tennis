import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IOSTypography, IOSSpacing, IOSBorderRadius, IOSColors, IOSShadows, IOSStyles } from '@/constants/IOSDesign';
import { ClubRankings, RankedPlayer } from '@/components/ClubRankings';
import { getClubLeaderboard } from '@/services/matchService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ChallengeFlowModalSimple from '@/components/ChallengeFlowModalSimple';

export default function ClubRankingsScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  const [clubName, setClubName] = useState('');
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadRankings();
  }, [id]);

  const loadRankings = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid club ID');
      setIsLoading(false);
      return;
    }

    try {
      // Get club details from Supabase
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('name')
        .eq('id', id)
        .single();
      
      if (clubError || !clubData) {
        setError('Club not found');
        setIsLoading(false);
        return;
      }
      
      setClubName(clubData.name);
      
      // Get member count from Supabase
      const { count: memberCount, error: countError } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', id);
      
      if (countError) {
        console.error('Failed to get member count:', countError);
      }
      
      setMemberCount(memberCount || 0);
      
      // Get full rankings
      const leaderboard = await getClubLeaderboard(id);
      setRankings(leaderboard);
      
    } catch (err) {
      console.error('Failed to load rankings:', err);
      setError('Failed to load rankings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleChallengePlayer = (playerId: string, playerName: string) => {
    setChallengeTarget({ id: playerId, name: playerName });
    setShowChallengeModal(true);
  };

  const handleChallengeSuccess = () => {
    // Refresh rankings to show any updates
    loadRankings();
  };


  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>Loading rankings...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity onPress={handleBack} style={[styles.button, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {clubName} Rankings
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>


      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          <ClubRankings
            rankings={rankings}
            memberCount={memberCount}
            currentUserId={user?.id}
            onPlayerPress={undefined}
            onChallengePress={handleChallengePlayer}
            showAll={true}
          />
        </ThemedView>
      </ScrollView>

      {/* Challenge Modal */}
      <ChallengeFlowModalSimple
        clubId={id as string}
        targetPlayerId={challengeTarget?.id}
        targetPlayerName={challengeTarget?.name}
        isVisible={showChallengeModal}
        onClose={() => {
          setShowChallengeModal(false);
          setChallengeTarget(null);
        }}
        onSuccess={handleChallengeSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOSSpacing.contentMargin,
    paddingVertical: IOSSpacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: IOSColors.systemGray5,
  },
  backButton: {
    ...IOSStyles.backButton,
  },
  headerTitle: {
    ...IOSStyles.headerTitle,
    flex: 1,
    marginHorizontal: IOSSpacing.standard,
  },
  headerSpacer: {
    width: IOSSpacing.minimumTouchTarget,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    ...IOSStyles.contentContainer,
    paddingVertical: IOSSpacing.standard,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...IOSStyles.loadingText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...IOSStyles.contentContainer,
  },
  errorText: {
    ...IOSTypography.body,
    marginBottom: IOSSpacing.comfortable,
    textAlign: 'center',
  },
  button: {
    ...IOSStyles.primaryButton,
  },
  buttonText: {
    color: 'white',
    ...IOSTypography.body,
    fontWeight: '600',
  },
});