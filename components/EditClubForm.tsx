import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IOSTypography, IOSSpacing, IOSBorderRadius, IOSColors, IOSShadows, IOSStyles } from '@/constants/IOSDesign';
import { supabase } from '@/lib/supabase';

interface EditClubFormProps {
  club: {
    id: string;
    name: string;
    description: string;
    location: string;
  };
  onClose: () => void;
  onSuccess: (updatedClub: any) => void;
}

interface FormData {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  general?: string;
}

export function EditClubForm({ club, onClose, onSuccess }: EditClubFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [formData, setFormData] = useState<FormData>({
    name: club.name,
    description: club.description,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Club name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Club name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Club name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🏆 Updating club:', club.id, 'with data:', formData);
      
      const { data: updatedClub, error } = await supabase
        .from('clubs')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', club.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update club:', error);
        
        if (error.code === '23505' && error.message.includes('name')) {
          setErrors({ name: 'A club with this name already exists in your area' });
        } else {
          setErrors({ general: 'Failed to update club. Please try again.' });
        }
        return;
      }

      console.log('✅ Club updated successfully:', updatedClub);
      
      Alert.alert(
        'Club Updated',
        `Your club "${formData.name.trim()}" has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess(updatedClub);
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Update club error:', error);
      setErrors({ general: 'Failed to update club. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    const hasChanges = 
      formData.name.trim() !== club.name ||
      formData.description.trim() !== club.description;

    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: IOSSpacing.contentMargin,
      paddingVertical: IOSSpacing.medium,
      borderBottomWidth: 0,
    },
    backButton: {
      ...IOSStyles.backButton,
    },
    headerTitle: {
      ...IOSStyles.headerTitle,
      color: colors.text,
      flex: 1,
      marginRight: IOSSpacing.minimumTouchTarget,
    },
    scrollContainer: {
      flex: 1,
    },
    form: {
      ...IOSStyles.contentContainer,
      paddingTop: IOSSpacing.comfortable,
    },
    sectionHeader: {
      marginBottom: IOSSpacing.comfortable,
      alignItems: 'center',
    },
    clubIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: IOSSpacing.medium,
    },
    sectionTitle: {
      ...IOSTypography.callout,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    sectionSubtitle: {
      ...IOSTypography.footnote,
      color: colors.tabIconDefault,
      textAlign: 'center',
      marginTop: IOSSpacing.extraTight,
    },
    fieldContainer: {
      ...IOSStyles.section,
    },
    label: {
      ...IOSTypography.subheadline,
      fontWeight: '600',
      color: colors.text,
      marginBottom: IOSSpacing.tight,
    },
    input: {
      ...IOSStyles.textInput,
      borderColor: colors.tabIconDefault + '30',
      color: colors.text,
      backgroundColor: colors.background,
      height: IOSSpacing.inputHeight + 4,
    },
    inputFocused: {
      borderColor: colors.tint,
      borderWidth: 2,
    },
    inputError: {
      borderColor: IOSColors.destructive,
      borderWidth: 1.5,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
      paddingTop: IOSSpacing.medium,
    },
    errorText: {
      ...IOSStyles.errorText,
    },
    characterCount: {
      ...IOSTypography.caption1,
      color: colors.tabIconDefault,
      textAlign: 'right',
      marginTop: IOSSpacing.extraTight,
    },
    characterCountNearLimit: {
      color: IOSColors.systemOrange,
    },
    characterCountOverLimit: {
      color: IOSColors.destructive,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: IOSSpacing.extraLoose,
      marginBottom: IOSSpacing.comfortable,
      gap: IOSSpacing.medium,
    },
    button: {
      ...IOSStyles.primaryButton,
      flex: 1,
    },
    cancelButton: {
      backgroundColor: IOSColors.systemGray5,
      ...IOSShadows.subtle,
    },
    saveButton: {
      backgroundColor: colors.tint,
    },
    saveButtonDisabled: {
      backgroundColor: IOSColors.systemGray,
    },
    buttonText: {
      ...IOSTypography.body,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: '#ffffff',
    },
    generalError: {
      backgroundColor: IOSColors.destructive,
      padding: IOSSpacing.medium,
      borderRadius: IOSBorderRadius.medium,
      marginBottom: IOSSpacing.standard,
      ...IOSShadows.subtle,
    },
    generalErrorText: {
      ...IOSTypography.footnote,
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: '500',
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: IOSColors.systemGray6,
      padding: IOSSpacing.medium,
      borderRadius: IOSBorderRadius.medium,
      marginBottom: IOSSpacing.comfortable,
    },
    locationText: {
      ...IOSTypography.footnote,
      color: colors.tabIconDefault,
      marginLeft: IOSSpacing.tight,
      flex: 1,
    },
  });

  const nameCharacterCount = formData.name.length;
  const descriptionCharacterCount = formData.description.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleCancel}
          testID="cancel-button"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Club</Text>
        <View style={{ width: IOSSpacing.minimumTouchTarget }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.form}>
          {/* Club Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.clubIcon}>
              <Ionicons name="tennisball" size={30} color={colors.tint} />
            </View>
            <Text style={styles.sectionTitle}>Edit Club Details</Text>
            <Text style={styles.sectionSubtitle}>
              Update your club&apos;s name and description
            </Text>
          </View>

          {/* Location Info (Read-only) */}
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color={colors.tabIconDefault} />
            <Text style={styles.locationText}>
              Location: {club.location} (cannot be changed)
            </Text>
          </View>

          {/* General Error */}
          {errors.general && (
            <View style={styles.generalError} role="alert">
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          )}

          {/* Club Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Club Name *</Text>
            <TextInput
              style={[
                styles.input,
                errors.name && styles.inputError,
              ]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter club name"
              placeholderTextColor={colors.tabIconDefault + '60'}
              maxLength={50}
              autoCapitalize="words"
              testID="club-name-input"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
            <Text style={[
              styles.characterCount,
              nameCharacterCount > 45 && styles.characterCountNearLimit,
              nameCharacterCount >= 50 && styles.characterCountOverLimit,
            ]}>
              {nameCharacterCount}/50
            </Text>
          </View>

          {/* Club Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.description && styles.inputError,
              ]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe your club, its members, and what makes it special..."
              placeholderTextColor={colors.tabIconDefault + '60'}
              multiline
              maxLength={500}
              autoCapitalize="sentences"
              testID="club-description-input"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
            <Text style={[
              styles.characterCount,
              descriptionCharacterCount > 450 && styles.characterCountNearLimit,
              descriptionCharacterCount >= 500 && styles.characterCountOverLimit,
            ]}>
              {descriptionCharacterCount}/500
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              testID="cancel-button"
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                isSubmitting ? styles.saveButtonDisabled : styles.saveButton
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              testID="save-button"
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}