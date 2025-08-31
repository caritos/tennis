import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { matchInvitationService, CreateInvitationData } from '@/services/matchInvitationService';
// Removed challenge-flow imports - components deleted
import { supabase } from '@/lib/supabase';
import { getClubMembers } from '@/services/clubService';

type TimeOption = 'today' | 'tomorrow' | 'weekend' | 'next_week' | 'flexible';

interface MatchInvitationFormProps {
  clubId: string;
  creatorId: string;
  onClose: () => void;
  onSuccess?: (invitationId: string) => void;
}

const MatchInvitationForm: React.FC<MatchInvitationFormProps> = ({
  clubId,
  creatorId,
  onClose,
  onSuccess,
}) => {
  console.log('🎾 MatchInvitationForm: Component starting to render...');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [selectedTiming, setSelectedTiming] = useState<TimeOption>('tomorrow');
  const [message, setMessage] = useState(''); // Renamed from notes to match MessageSection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteType, setInviteType] = useState<'open' | 'specific' | 'quick'>('open');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [_showPlayerSelection, _setShowPlayerSelection] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Helper function to convert timing option to date string
  const getDateFromTiming = (timing: TimeOption): string => {
    const today = new Date();
    let targetDate = new Date(today);
    
    switch (timing) {
      case 'today':
        // Keep today's date
        break;
      case 'tomorrow':
        targetDate.setDate(today.getDate() + 1);
        break;
      case 'weekend':
        // Next Saturday
        const daysUntilSaturday = (6 - today.getDay()) % 7 || 7;
        targetDate.setDate(today.getDate() + daysUntilSaturday);
        break;
      case 'next_week':
        // Next Monday (or today if it's Monday)
        const daysUntilNextWeek = 7 - today.getDay() + 1;
        targetDate.setDate(today.getDate() + daysUntilNextWeek);
        break;
      case 'flexible':
        // Default to tomorrow for flexible
        targetDate.setDate(today.getDate() + 1);
        break;
    }
    
    // Return in YYYY-MM-DD format
    return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      console.log('🎾 MatchInvitationForm: Starting invitation creation...');

      // Convert timing option to date string
      const selectedDate = getDateFromTiming(selectedTiming);
      console.log('🎾 MatchInvitationForm: Converted timing to date:', { selectedTiming, selectedDate });

      // Validate date format
      const validDate = new Date(selectedDate + 'T00:00:00');
      if (isNaN(validDate.getTime())) {
        console.error('❌ MatchInvitationForm: Invalid date:', selectedDate);
        return;
      }

      // Create invitation data based on invite type
      const invitationData: CreateInvitationData = {
        club_id: clubId,
        creator_id: creatorId,
        match_type: matchType,
        date: selectedDate,
        notes: message.trim() || undefined,
        // Add targeted_players for specific invitations
        ...(inviteType === 'specific' && selectedPlayers.length > 0 && {
          targeted_players: selectedPlayers
        }),
        // Add targeted_players for quick match (suggested players)
        ...(inviteType === 'quick' && suggestedPlayers.length > 0 && {
          targeted_players: suggestedPlayers.map(p => p.id)
        })
      };

      console.log('🎾 MatchInvitationForm: Creating invitation with data:', invitationData);

      const createdInvitation = await matchInvitationService.createInvitation(invitationData);

      console.log('✅ MatchInvitationForm: Invitation created successfully');

      // Create club notification for the invitation
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', creatorId)
          .single();

        const creatorName = userData?.full_name || 'A club member';
        // Fix timezone issue: ensure date is parsed in local timezone, not UTC
        const dateStr = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
        
        // Different notification message for targeted vs open invitations
        let notificationMessage;
        if (inviteType === 'specific' && selectedPlayers.length > 0) {
          // Get selected player names for the notification
          const selectedPlayerNames = clubMembers
            .filter(m => selectedPlayers.includes(m.id))
            .map(m => m.full_name)
            .join(', ');
          notificationMessage = `${creatorName} challenged ${selectedPlayerNames} to a ${matchType} match on ${dateStr}`;
        } else if (inviteType === 'quick' && suggestedPlayers.length > 0) {
          // Get suggested player names for quick match notification
          const suggestedPlayerNames = suggestedPlayers
            .map(p => p.full_name)
            .join(', ');
          notificationMessage = `${creatorName} is looking for a quick ${matchType} match with ${suggestedPlayerNames} on ${dateStr}`;
        } else {
          notificationMessage = `${creatorName} is looking for ${matchType === 'singles' ? 'a singles partner' : 'players for a doubles match'} on ${dateStr}`;
        }
        
        await matchInvitationService.createClubNotification(clubId, {
          type: (inviteType === 'specific' || inviteType === 'quick') ? 'challenge_created' : 'invitation_created',
          title: (inviteType === 'specific' || inviteType === 'quick') ? `New ${matchType} challenge` : `New ${matchType} invitation`,
          message: notificationMessage,
          invitation_id: createdInvitation.id,
          match_type: matchType,
          date: selectedDate, // Using converted date
          creator_name: creatorName
        });

        console.log('✅ MatchInvitationForm: Club notification created');
      } catch (notificationError) {
        console.warn('⚠️ MatchInvitationForm: Failed to create club notification:', notificationError);
        // Don't fail the whole process if notification creation fails
      }

      console.log('Match invitation posted successfully:', createdInvitation.id);

      if (onSuccess) {
        console.log('🔄 MatchInvitationForm: Calling onSuccess callback with invitation ID:', createdInvitation.id);
        onSuccess(createdInvitation.id);
      }
      
      console.log('🔄 MatchInvitationForm: Closing form');
      onClose();
    } catch (error) {
      console.error('❌ MatchInvitationForm: Failed to create invitation:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create match invitation. Please try again.');
      }
    } finally {
      console.log('🔄 MatchInvitationForm: Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  // Load club members when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const loadMembers = async () => {
      try {
        console.log('🎾 MatchInvitationForm: Loading club members for clubId:', clubId);
        const members = await getClubMembers(clubId);
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        // Filter out the current user
        const otherMembers = members.filter(m => m.id !== creatorId);
        setClubMembers(otherMembers);
        console.log('🎾 MatchInvitationForm: Loaded', otherMembers.length, 'club members');
        
        // If we have the current user's rating, we can use it for quick match
        const { data: currentUserData } = await supabase
          .from('users')
          .select('elo_rating')
          .eq('id', creatorId)
          .single();
          
        if (isMounted && currentUserData?.elo_rating) {
          setCurrentUserRating(currentUserData.elo_rating);
          console.log('🎾 MatchInvitationForm: User rating loaded:', currentUserData.elo_rating);
        }
      } catch (error) {
        if (isMounted) {
          console.error('🎾 MatchInvitationForm: Failed to load club members:', error);
          // Don't crash the component, just continue without members
          setClubMembers([]);
        }
      }
    };
    
    loadMembers();
    
    return () => {
      isMounted = false;
    };
  }, [clubId, creatorId]);

  const [currentUserRating, setCurrentUserRating] = useState<number | null>(null);

  // Toggle player selection
  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev => {
      const newSelection = prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId];
      
      // For singles, only allow 1 player selection
      // For doubles, allow up to 3 players
      const maxPlayers = matchType === 'singles' ? 1 : 3;
      return newSelection.slice(0, maxPlayers);
    });
  };

  // Filter members based on search query
  const filteredMembers = clubMembers.filter(member => {
    const searchLower = playerSearchQuery.toLowerCase();
    const nameLower = (member.full_name || '').toLowerCase();
    return nameLower.includes(searchLower);
  });

  // Get selected member details
  const selectedMemberDetails = clubMembers.filter(m => selectedPlayers.includes(m.id));

  // Get suggested players for quick match (similar skill level)
  const getSuggestedPlayers = () => {
    if (!currentUserRating || clubMembers.length === 0) return [];
    
    // Sort players by rating difference from current user
    const playersWithRating = clubMembers
      .filter(m => m.eloRating || m.elo_rating) // Some might have eloRating, some elo_rating
      .map(m => ({
        ...m,
        rating: m.eloRating || m.elo_rating || 1200,
        ratingDiff: Math.abs((m.eloRating || m.elo_rating || 1200) - currentUserRating)
      }))
      .sort((a, b) => a.ratingDiff - b.ratingDiff);
    
    // Return top suggestions based on match type
    const maxSuggestions = matchType === 'singles' ? 3 : 6;
    return playersWithRating.slice(0, maxSuggestions);
  };

  const suggestedPlayers = inviteType === 'quick' ? getSuggestedPlayers() : [];
  const scrollViewRef = useRef<ScrollView>(null);

  // Form validation
  const canSubmit = inviteType === 'open' || selectedPlayers.length > 0;

  // Function to scroll to bottom when text input is focused
  const handleTextInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  console.log('🎾 MatchInvitationForm: About to return JSX, canSubmit:', canSubmit);
  console.log('🎾 MatchInvitationForm: Creating KeyboardAvoidingView...');
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled
    >
      {console.log('🎾 MatchInvitationForm: KeyboardAvoidingView rendered, creating SafeAreaView...')}
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {console.log('🎾 MatchInvitationForm: SafeAreaView rendered, creating Header...')}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Looking to Play</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {console.log('🎾 MatchInvitationForm: Header rendered, checking for errors:', !!error)}
        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#ffebee', borderColor: '#f44336' }]}>
            <Ionicons name="alert-circle" size={20} color="#f44336" />
            <ThemedText style={[styles.errorText, { color: '#f44336' }]}>{error}</ThemedText>
            <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
              <Ionicons name="close" size={16} color="#f44336" />
            </TouchableOpacity>
          </View>
        )}
        {console.log('🎾 MatchInvitationForm: Error handling complete, creating ScrollView...')}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {console.log('🎾 MatchInvitationForm: ScrollView rendered, creating form container...')}
          <View style={styles.formContainer}>
          {console.log('🎾 MatchInvitationForm: Form container rendered, creating match type section...')}
          {/* Match Type - FIRST */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Match Type</ThemedText>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  { borderColor: colors.tabIconDefault },
                  matchType === 'singles' && { 
                    borderColor: colors.tint,
                    backgroundColor: colors.tint + '10'
                  }
                ]}
                onPress={() => {
                  setMatchType('singles');
                  // Reset player selection if switching from doubles to singles
                  if (selectedPlayers.length > 1) {
                    setSelectedPlayers(selectedPlayers.slice(0, 1));
                  }
                  // Reset to 'open' if Quick Match was selected but switching to singles
                  if (inviteType === 'quick') {
                    setInviteType('open');
                    setSelectedPlayers([]);
                  }
                }}
              >
                <View style={[
                  styles.radioCircle,
                  { borderColor: colors.tabIconDefault },
                  matchType === 'singles' && { borderColor: colors.tint }
                ]}>
                  {matchType === 'singles' && (
                    <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
                  )}
                </View>
                <ThemedText style={[styles.radioLabel, { color: colors.text }]}>Singles</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOption,
                  { borderColor: colors.tabIconDefault },
                  matchType === 'doubles' && { 
                    borderColor: colors.tint,
                    backgroundColor: colors.tint + '10'
                  }
                ]}
                onPress={() => {
                  setMatchType('doubles');
                  // Reset to 'open' if Quick Match was selected but switching to doubles
                  if (inviteType === 'quick') {
                    setInviteType('open');
                    setSelectedPlayers([]);
                  }
                }}
              >
                <View style={[
                  styles.radioCircle,
                  { borderColor: colors.tabIconDefault },
                  matchType === 'doubles' && { borderColor: colors.tint }
                ]}>
                  {matchType === 'doubles' && (
                    <View style={[styles.radioFill, { backgroundColor: colors.tint }]} />
                  )}
                </View>
                <ThemedText style={[styles.radioLabel, { color: colors.text }]}>Doubles</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Invite Type Selection - SECOND */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Who do you want to play with?
            </ThemedText>
            <View style={styles.inviteTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.inviteTypeButton,
                  inviteType === 'open' && { backgroundColor: colors.tint },
                  { borderColor: colors.tint }
                ]}
                onPress={() => {
                  setInviteType('open');
                  setSelectedPlayers([]);
                }}
              >
                <Ionicons 
                  name="people-outline" 
                  size={20} 
                  color={inviteType === 'open' ? '#fff' : colors.tint} 
                />
                <ThemedText style={[
                  styles.inviteTypeText,
                  { color: inviteType === 'open' ? '#fff' : colors.tint }
                ]}>
                  Anyone Available
                </ThemedText>
                <ThemedText style={[
                  styles.inviteTypeSubtext,
                  { color: inviteType === 'open' ? '#fff' : colors.textSecondary }
                ]}>
                  Post to entire club
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.inviteTypeButton,
                  inviteType === 'specific' && { backgroundColor: colors.tint },
                  { borderColor: colors.tint }
                ]}
                onPress={() => {
                  setInviteType('specific');
                  setSelectedPlayers([]);
                }}
              >
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={inviteType === 'specific' ? '#fff' : colors.tint} 
                />
                <ThemedText style={[
                  styles.inviteTypeText,
                  { color: inviteType === 'specific' ? '#fff' : colors.tint }
                ]}>
                  Specific Players
                </ThemedText>
                <ThemedText style={[
                  styles.inviteTypeSubtext,
                  { color: inviteType === 'specific' ? '#fff' : colors.textSecondary }
                ]}>
                  Challenge members directly
                </ThemedText>
              </TouchableOpacity>

              {/* Only show Quick Match for singles */}
              {matchType === 'singles' && (
                <TouchableOpacity
                  style={[
                    styles.inviteTypeButton,
                    inviteType === 'quick' && { backgroundColor: colors.tint },
                    { borderColor: colors.tint }
                  ]}
                  onPress={() => {
                    setInviteType('quick');
                    setSelectedPlayers([]);
                  }}
                >
                  <Ionicons 
                    name="flash-outline" 
                    size={20} 
                    color={inviteType === 'quick' ? '#fff' : colors.tint} 
                  />
                  <ThemedText style={[
                    styles.inviteTypeText,
                    { color: inviteType === 'quick' ? '#fff' : colors.tint }
                  ]}>
                    Quick Match
                  </ThemedText>
                  <ThemedText style={[
                    styles.inviteTypeSubtext,
                    { color: inviteType === 'quick' ? '#fff' : colors.textSecondary }
                  ]}>
                    Match with similar skill level
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Match Suggestions (shown when quick match selected) */}
          {inviteType === 'quick' && (
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Suggested Opponents
              </ThemedText>
              {!currentUserRating ? (
                <View style={[styles.infoBox, { backgroundColor: colors.textSecondary + '10', borderColor: colors.textSecondary + '30' }]}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                  <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                    Play a few matches first to establish your skill rating
                  </ThemedText>
                </View>
              ) : suggestedPlayers.length === 0 ? (
                <View style={[styles.infoBox, { backgroundColor: colors.textSecondary + '10', borderColor: colors.textSecondary + '30' }]}>
                  <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                    No players with similar skill level found
                  </ThemedText>
                </View>
              ) : (
                <View>
                  <ThemedText style={[styles.yourRatingText, { color: colors.textSecondary }]}>
                    Your rating: {currentUserRating}
                  </ThemedText>
                  <View style={styles.suggestedList}>
                    {suggestedPlayers.map((player: any) => (
                      <TouchableOpacity
                        key={player.id}
                        style={[
                          styles.suggestedPlayerItem,
                          selectedPlayers.includes(player.id) && { backgroundColor: colors.tint + '20' },
                          { borderColor: selectedPlayers.includes(player.id) ? colors.tint : colors.textSecondary + '30' }
                        ]}
                        onPress={() => togglePlayerSelection(player.id)}
                      >
                        <View style={styles.suggestedPlayerInfo}>
                          <ThemedText style={[styles.playerName, { color: colors.text }]}>
                            {player.full_name}
                          </ThemedText>
                          <View style={styles.ratingRow}>
                            <ThemedText style={[styles.playerRating, { color: colors.textSecondary }]}>
                              Rating: {player.rating}
                            </ThemedText>
                            <ThemedText style={[styles.ratingDiffText, { 
                              color: player.ratingDiff < 50 ? '#4CAF50' : 
                                     player.ratingDiff < 100 ? '#FF9800' : 
                                     colors.textSecondary 
                            }]}>
                              {player.ratingDiff < 50 ? '• Great match!' : 
                               player.ratingDiff < 100 ? '• Good match' : 
                               '• Challenge'}
                            </ThemedText>
                          </View>
                        </View>
                        <View style={[
                          styles.selectButton,
                          { backgroundColor: selectedPlayers.includes(player.id) ? colors.tint : 'transparent',
                            borderColor: colors.tint }
                        ]}>
                          <ThemedText style={[
                            styles.selectButtonText,
                            { color: selectedPlayers.includes(player.id) ? '#fff' : colors.tint }
                          ]}>
                            {selectedPlayers.includes(player.id) ? 'Selected' : 'Select'}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Player Selection (shown when specific players selected) - THIRD */}
          {inviteType === 'specific' && (
            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Select Players ({selectedPlayers.length}/{matchType === 'singles' ? 1 : 3})
              </ThemedText>
              
              {/* Search Input */}
              <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.textSecondary + '30' }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search players by name..."
                  placeholderTextColor={colors.textSecondary}
                  value={playerSearchQuery}
                  onChangeText={setPlayerSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {playerSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setPlayerSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected Players Display */}
              {selectedPlayers.length > 0 && (
                <View style={styles.selectedPlayersContainer}>
                  <ThemedText style={[styles.selectedLabel, { color: colors.textSecondary }]}>
                    Selected:
                  </ThemedText>
                  <View style={styles.selectedChips}>
                    {selectedMemberDetails.map(member => (
                      <View key={member.id} style={[styles.selectedChip, { backgroundColor: colors.tint }]}>
                        <ThemedText style={[styles.selectedChipText, { color: '#fff' }]}>
                          {member.full_name}
                        </ThemedText>
                        <TouchableOpacity onPress={() => togglePlayerSelection(member.id)}>
                          <Ionicons name="close-circle" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Player List */}
              <ScrollView 
                style={[styles.playerList, { borderColor: colors.textSecondary + '30' }]}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {filteredMembers.length === 0 ? (
                  <View style={styles.noResultsContainer}>
                    <ThemedText style={[styles.noResultsText, { color: colors.textSecondary }]}>
                      {playerSearchQuery ? 'No players found matching your search' : 'No club members available'}
                    </ThemedText>
                  </View>
                ) : (
                  filteredMembers.map(member => {
                    const isSelected = selectedPlayers.includes(member.id);
                    const isDisabled = !isSelected && selectedPlayers.length >= (matchType === 'singles' ? 1 : 3);
                    
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={[
                          styles.playerItem,
                          isSelected && { backgroundColor: colors.tint + '20' },
                          isDisabled && { opacity: 0.5 },
                          { borderColor: colors.textSecondary + '30' }
                        ]}
                        onPress={() => !isDisabled && togglePlayerSelection(member.id)}
                        disabled={isDisabled}
                      >
                        <View style={styles.playerInfo}>
                          <ThemedText style={[styles.playerName, { color: colors.text }]}>
                            {member.full_name}
                          </ThemedText>
                          <View style={styles.playerMeta}>
                            {member.eloRating && (
                              <ThemedText style={[styles.playerRating, { color: colors.textSecondary }]}>
                                Rating: {member.eloRating}
                              </ThemedText>
                            )}
                            {member.match_count > 0 && (
                              <ThemedText style={[styles.playerStats, { color: colors.textSecondary }]}>
                                • {member.match_count} matches
                              </ThemedText>
                            )}
                          </View>
                        </View>
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={isSelected ? colors.tint : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* Timing Options */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>When would you like to play?</ThemedText>
            <View style={styles.timingOptions}>
              {[
                { key: 'tomorrow', label: 'Tomorrow' },
                { key: 'weekend', label: 'This Weekend' },
                { key: 'next_week', label: 'Next Week' },
                { key: 'flexible', label: 'Flexible' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.timingOption,
                    { borderColor: colors.tabIconDefault, backgroundColor: colors.card },
                    selectedTiming === option.key && { 
                      borderColor: colors.tint,
                      backgroundColor: colors.tint + '20'
                    }
                  ]}
                  onPress={() => setSelectedTiming(option.key as TimeOption)}
                >
                  <ThemedText style={[
                    styles.timingOptionText,
                    { color: colors.text },
                    selectedTiming === option.key && { color: colors.tint }
                  ]}>
                    {option.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>



          {/* Message */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Add a message (optional)</ThemedText>
            <TextInput
              style={[styles.textArea, { borderColor: colors.tabIconDefault, color: colors.text, backgroundColor: colors.card }]}
              value={message}
              onChangeText={setMessage}
              onFocus={handleTextInputFocus}
              placeholder={matchType === 'singles' ? 'Let your opponent know your skill level, preferences, or any specific requests...' : 'Let everyone know your skill level, preferences, or any specific requests...'}
              placeholderTextColor={colors.tabIconDefault}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => {
                // Dismiss keyboard when Done is pressed
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }}
            />
          </View>

          {console.log('🎾 MatchInvitationForm: All sections rendered, creating submit button...')}
          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: canSubmit ? colors.tint : colors.textSecondary },
                !canSubmit && { opacity: 0.6 }
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </ThemedText>
            </TouchableOpacity>
          </View>
          {console.log('🎾 MatchInvitationForm: Submit button rendered, finishing form container...')}
          </View>
        {console.log('🎾 MatchInvitationForm: Form container complete, finishing ScrollView...')}
        </ScrollView>
      {console.log('🎾 MatchInvitationForm: ScrollView complete, finishing SafeAreaView...')}
      </SafeAreaView>
    {console.log('🎾 MatchInvitationForm: SafeAreaView complete, finishing KeyboardAvoidingView...')}
    </KeyboardAvoidingView>
  );
};

export default MatchInvitationForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 200, // Very large padding to ensure submit button is visible above keyboard
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inviteTypeContainer: {
    gap: 12,
  },
  inviteTypeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  inviteTypeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inviteTypeSubtext: {
    fontSize: 12,
  },
  playerList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  playerRating: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  selectedPlayersContainer: {
    marginBottom: 12,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  playerStats: {
    fontSize: 12,
  },
  noResultsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  submitContainer: {
    marginTop: 32,
    marginBottom: 50, // Much larger bottom margin
    paddingHorizontal: 20,
    paddingBottom: 20, // Additional bottom padding
  },
  submitButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  yourRatingText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  suggestedList: {
    gap: 8,
  },
  suggestedPlayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestedPlayerInfo: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  ratingDiffText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  timingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timingOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  timingOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
});