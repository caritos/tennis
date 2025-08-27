import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { matchInvitationService, CreateInvitationData } from '@/services/matchInvitationService';
import TimingOptions from './challenge-flow/TimingOptions';
import MatchTypeSelection from './challenge-flow/MatchTypeSelection';
import MessageSection from './challenge-flow/MessageSection';
import FormActions from './challenge-flow/FormActions';
import { supabase } from '@/lib/supabase';

type TimeOption = 'today' | 'tomorrow' | 'weekend' | 'next_week' | 'flexible';

interface MatchInvitationFormProps {
  clubId: string;
  creatorId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const MatchInvitationForm: React.FC<MatchInvitationFormProps> = ({
  clubId,
  creatorId,
  onClose,
  onSuccess,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [selectedTiming, setSelectedTiming] = useState<TimeOption>('tomorrow');
  const [message, setMessage] = useState(''); // Renamed from notes to match MessageSection
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      const invitationData: CreateInvitationData = {
        club_id: clubId,
        creator_id: creatorId,
        match_type: matchType,
        date: selectedDate, // Converted from timing option
        notes: message.trim() || undefined, // Using message instead of notes
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
        await matchInvitationService.createClubNotification(clubId, {
          type: 'invitation_created',
          title: `New ${matchType} invitation`,
          message: `${creatorName} is looking for ${matchType === 'singles' ? 'a singles partner' : 'players for a doubles match'} on ${dateStr}`,
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

      console.log('Match invitation posted successfully:', invitationId);

      if (onSuccess) {
        console.log('🔄 MatchInvitationForm: Calling onSuccess callback');
        onSuccess();
      }
      
      console.log('🔄 MatchInvitationForm: Closing form');
      onClose();
    } catch (error) {
      console.error('❌ MatchInvitationForm: Failed to create invitation:', error);
      // Error logged for debugging
    } finally {
      console.log('🔄 MatchInvitationForm: Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  // Form validation
  const canSubmit = true; // Always allow submission for invitations

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Looking to Play</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Match Type */}
          <MatchTypeSelection
            matchType={matchType}
            onMatchTypeChange={setMatchType}
            colors={colors}
          />

          {/* Timing Options */}
          <TimingOptions
            selectedTime={selectedTiming}
            onTimeChange={setSelectedTiming}
            colors={colors}
          />



          {/* Message */}
          <MessageSection
            message={message}
            matchType={matchType}
            onMessageChange={setMessage}
            colors={colors}
          />

          {/* Form Actions */}
          <FormActions
            matchType={matchType}
            canSubmit={canSubmit}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitButtonText="Post"
            submittingText="Posting..."
            colors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MatchInvitationForm;

const styles = StyleSheet.create({
  container: {
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
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
});