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
import { CompactStyles } from '@/constants/CompactStyles';
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
      paddingHorizontal: CompactStyles.header.paddingHorizontal,
      paddingVertical: CompactStyles.header.paddingVertical,
      borderBottomWidth: 0,
      borderBottomColor: colors.tabIconDefault + '20',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'center',
      marginRight: 40, // Balance the back button
    },
    scrollContainer: {
      flex: 1,
    },
    form: {
      padding: CompactStyles.scrollContent.paddingHorizontal,
    },
    sectionHeader: {
      marginBottom: 20,
      alignItems: 'center',
    },
    clubIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.tint + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.tabIconDefault,
      textAlign: 'center',
      marginTop: 4,
    },
    fieldContainer: {
      marginBottom: CompactStyles.inputGroup.marginBottom,
    },
    label: {
      fontSize: CompactStyles.label.fontSize,
      fontWeight: '500',
      color: colors.text,
      marginBottom: CompactStyles.label.marginBottom,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.tabIconDefault + '40',
      borderRadius: CompactStyles.input.borderRadius,
      paddingHorizontal: CompactStyles.input.paddingHorizontal,
      paddingVertical: CompactStyles.input.paddingVertical,
      fontSize: CompactStyles.input.fontSize,
      color: colors.text,
      backgroundColor: colors.background,
    },
    inputFocused: {
      borderColor: colors.tint,
      borderWidth: 2,
    },
    inputError: {
      borderColor: '#ff4444',
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    errorText: {
      color: '#ff4444',
      fontSize: CompactStyles.errorText.fontSize,
      marginTop: CompactStyles.errorText.marginTop,
    },
    characterCount: {
      fontSize: 12,
      color: colors.tabIconDefault,
      textAlign: 'right',
      marginTop: 4,
    },
    characterCountNearLimit: {
      color: '#FF9800',
    },
    characterCountOverLimit: {
      color: '#ff4444',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 32,
      marginBottom: 20,
    },
    button: {
      flex: 1,
      paddingVertical: CompactStyles.button.paddingVertical,
      borderRadius: CompactStyles.button.borderRadius,
      alignItems: 'center',
      marginHorizontal: CompactStyles.smallMargin,
    },
    cancelButton: {
      backgroundColor: colors.tabIconDefault + '20',
    },
    saveButton: {
      backgroundColor: colors.tint,
    },
    saveButtonDisabled: {
      backgroundColor: colors.tabIconDefault,
    },
    buttonText: {
      fontSize: CompactStyles.buttonText.fontSize,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: '#ffffff',
    },
    generalError: {
      backgroundColor: '#ff4444',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    generalErrorText: {
      color: '#ffffff',
      fontSize: 14,
      textAlign: 'center',
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tabIconDefault + '10',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    locationText: {
      fontSize: 14,
      color: colors.tabIconDefault,
      marginLeft: 8,
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
        <View style={{ width: 40 }} />
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