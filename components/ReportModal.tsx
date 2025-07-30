import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type ReportType = 'spam' | 'harassment' | 'inappropriate' | 'fake_profile' | 'other';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  onSubmitReport: (reportData: {
    type: ReportType;
    description: string;
    reportedUserId: string;
  }) => Promise<void>;
}

const REPORT_TYPES: { key: ReportType; label: string; description: string }[] = [
  {
    key: 'spam',
    label: 'Spam or Unwanted Content',
    description: 'Excessive promotional content or irrelevant messages'
  },
  {
    key: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Abusive, threatening, or intimidating behavior'
  },
  {
    key: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines'
  },
  {
    key: 'fake_profile',
    label: 'Fake Profile',
    description: 'Impersonation or misleading identity'
  },
  {
    key: 'other',
    label: 'Other',
    description: 'Other safety or community guideline violations'
  }
];

export function ReportModal({
  visible,
  onClose,
  reportedUserId,
  reportedUserName,
  onSubmitReport
}: ReportModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Please select a report reason');
      return;
    }

    if (selectedType === 'other' && description.trim().length < 10) {
      Alert.alert('Please provide a detailed description for your report');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitReport({
        type: selectedType,
        description: description.trim(),
        reportedUserId
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. We will review your report within 24-48 hours.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to submit report. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setDescription('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.tabIconDefault + '30' }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Report User
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Report Target */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Reporting: {reportedUserName}
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
              Your report will be reviewed by our safety team. False reports may result in account restrictions.
            </ThemedText>
          </ThemedView>

          {/* Report Reasons */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Why are you reporting this user?
            </ThemedText>
            
            {REPORT_TYPES.map((reportType) => (
              <TouchableOpacity
                key={reportType.key}
                style={[
                  styles.reportOption,
                  {
                    borderColor: colors.tabIconDefault + '30',
                    backgroundColor: selectedType === reportType.key 
                      ? colors.tint + '15' 
                      : 'transparent'
                  }
                ]}
                onPress={() => setSelectedType(reportType.key)}
                disabled={isSubmitting}
              >
                <View style={styles.reportOptionContent}>
                  <View style={styles.reportOptionText}>
                    <ThemedText type="defaultSemiBold" style={styles.reportLabel}>
                      {reportType.label}
                    </ThemedText>
                    <ThemedText style={[styles.reportDescription, { color: colors.tabIconDefault }]}>
                      {reportType.description}
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.radioButton,
                    {
                      borderColor: colors.tint,
                      backgroundColor: selectedType === reportType.key ? colors.tint : 'transparent'
                    }
                  ]}>
                    {selectedType === reportType.key && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ThemedView>

          {/* Additional Details */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Additional Details {selectedType === 'other' && '(Required)'}
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: colors.tabIconDefault + '30',
                  color: colors.text,
                  backgroundColor: colors.background
                }
              ]}
              placeholder="Provide additional context about this report..."
              placeholderTextColor={colors.tabIconDefault}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              editable={!isSubmitting}
            />
            <ThemedText style={[styles.characterCount, { color: colors.tabIconDefault }]}>
              {description.length}/500 characters
            </ThemedText>
          </ThemedView>

          {/* Community Guidelines Link */}
          <ThemedView style={styles.section}>
            <TouchableOpacity
              style={styles.guidelinesLink}
              onPress={() => {
                // Navigate to community guidelines
                // This would be implemented based on your navigation setup
              }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
              <ThemedText style={[styles.guidelinesText, { color: colors.tint }]}>
                Review Community Guidelines
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>

        {/* Submit Button */}
        <ThemedView style={[styles.footer, { borderTopColor: colors.tabIconDefault + '30' }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: selectedType ? colors.tint : colors.tabIconDefault + '50',
                opacity: isSubmitting ? 0.6 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={!selectedType || isSubmitting}
          >
            <ThemedText style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  reportOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reportOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reportOptionText: {
    flex: 1,
    marginRight: 12,
  },
  reportLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  guidelinesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  guidelinesText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});