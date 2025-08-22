import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { CalendarDatePicker } from './CalendarDatePicker';
import { matchInvitationService, CreateInvitationData } from '@/services/matchInvitationService';
import { useNotification } from '@/contexts/NotificationContext';

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
  const { showSuccess, showError } = useNotification();

  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  // Default to tomorrow's date in YYYY-MM-DD format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('Location TBD');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Validate required fields
    if (!selectedDate) {
      showError('Date Required', 'Please select a date for your match invitation.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate date format (selectedDate is already a string in YYYY-MM-DD format)
      const validDate = new Date(selectedDate + 'T00:00:00');
      if (isNaN(validDate.getTime())) {
        showError('Invalid Date', 'Please select a valid date for your match invitation.');
        return;
      }

      const invitationData: CreateInvitationData = {
        club_id: clubId,
        creator_id: creatorId,
        match_type: matchType,
        date: selectedDate, // Already in YYYY-MM-DD format
        time: time || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await matchInvitationService.createInvitation(invitationData);

      showSuccess(
        'Looking to Play Posted!',
        `Your ${matchType} invitation has been posted to the club.`
      );

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to create invitation:', error);
      showError(
        'Failed to Post',
        'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

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
        <ThemedView style={styles.formContainer}>
          {/* Match Type */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Match Type</ThemedText>
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
                onPress={() => setMatchType('singles')}
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
                <ThemedText style={styles.radioLabel}>Singles</ThemedText>
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
                onPress={() => setMatchType('doubles')}
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
                <ThemedText style={styles.radioLabel}>Doubles</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Date & Time</ThemedText>
            
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateContainer}>
                <ThemedText style={styles.inputLabel}>Date</ThemedText>
                <CalendarDatePicker
                  selectedDate={selectedDate}
                  onDateChange={(date) => {
                    // Ensure we never set selectedDate to undefined
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                />
              </View>

              <View style={styles.timeContainer}>
                <ThemedText style={styles.inputLabel}>Time (Optional)</ThemedText>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      borderColor: colors.tabIconDefault,
                      color: colors.text,
                      backgroundColor: colors.background,
                    },
                  ]}
                  value={time}
                  onChangeText={setTime}
                  placeholder="6:00 PM"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Location</ThemedText>
            <TextInput
              style={[
                styles.locationInput,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={location}
              onChangeText={setLocation}
              placeholder="Location TBD"
              placeholderTextColor={colors.tabIconDefault}
            />
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>Notes</ThemedText>
            <TextInput
              style={[
                styles.notesInput,
                {
                  borderColor: colors.tabIconDefault,
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Looking for competitive singles match. Intermediate level preferred."
              placeholderTextColor={colors.tabIconDefault}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ThemedView>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={[styles.footer, { borderTopColor: colors.tabIconDefault }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.tabIconDefault }]}
          onPress={onClose}
          disabled={isSubmitting}
        >
          <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
            Cancel
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.postButton,
            { backgroundColor: colors.tint },
            isSubmitting && { opacity: 0.6 }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.postButtonText}>
            {isSubmitting ? 'Posting...' : 'Post'}
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  dateTimeContainer: {
    gap: 16,
  },
  dateContainer: {
    flex: 1,
  },
  timeContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  locationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  postButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});