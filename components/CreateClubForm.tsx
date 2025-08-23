import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { CompactStyles } from '@/constants/CompactStyles';
import { useAuth } from '@/contexts/AuthContext';
import { ClubService } from '@/services/clubService';
import { Club } from '@/lib/supabase';
import { useLocation } from '@/hooks/useLocation';

interface CreateClubFormProps {
  onSuccess: (club: Club) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  description: string;
  area: string;
  zipCode: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  area?: string;
  zipCode?: string;
  general?: string;
}

export function CreateClubForm({ onSuccess, onCancel }: CreateClubFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const { location } = useLocation();
  const clubService = new ClubService();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    area: '',
    zipCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateZipCode = (zipCode: string): boolean => {
    // Accept 5-digit or 9-digit (with dash) zip codes
    const zipPattern = /^\d{5}(-\d{4})?$/;
    return zipPattern.test(zipCode);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Club name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.area.trim()) {
      newErrors.area = 'Geographic area is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!validateZipCode(formData.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid zip code';
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
    if (!validateForm() || !user?.id) {
      if (!user?.id) {
        setErrors({ general: 'You must be signed in to create a club' });
      }
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Use actual user location if available, otherwise use NYC as default
      const lat = location?.latitude || 40.7128;
      const lng = location?.longitude || -74.0060;
      
      console.log('🏆 Creating club with location:', { lat, lng, userLocation: location });
      
      const clubData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.area.trim(),
        zipCode: formData.zipCode.trim(),
        lat,
        lng,
        creator_id: user.id,
      };

      const newClub = await clubService.createClub(clubData);
      onSuccess(newClub);
    } catch (error) {
      console.error('Failed to create club:', error);
      setErrors({ general: 'Failed to create club. Please try again.' });
    } finally {
      setIsSubmitting(false);
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
      borderBottomWidth: 0,  // Remove the border for cleaner look
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
    inputError: {
      borderColor: '#ff4444',
    },
    textArea: {
      height: 60,
      textAlignVertical: 'top',
    },
    errorText: {
      color: '#ff4444',
      fontSize: CompactStyles.errorText.fontSize,
      marginTop: CompactStyles.errorText.marginTop,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
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
    createButton: {
      backgroundColor: colors.tint,
    },
    createButtonDisabled: {
      backgroundColor: colors.tabIconDefault,
    },
    buttonText: {
      fontSize: CompactStyles.buttonText.fontSize,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    createButtonText: {
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
    locationIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 16,
    },
    locationText: {
      fontSize: 13,
      marginLeft: 8,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onCancel}
          testID="back-button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Tennis Club</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.form}>
          {errors.general && (
            <View style={styles.generalError} role="alert">
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Club Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Riverside Tennis Club"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              accessibilityLabel="Club Name"
            />
            {errors.name && <Text style={styles.errorText} role="alert">{errors.name}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="A friendly community club for players of all levels..."
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              accessibilityLabel="Description"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Geographic Area</Text>
            <TextInput
              style={[styles.input, errors.area && styles.inputError]}
              placeholder="San Francisco Bay Area"
              value={formData.area}
              onChangeText={(text) => handleInputChange('area', text)}
              accessibilityLabel="Geographic Area"
            />
            {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Zip Code (for discovery)</Text>
            <TextInput
              style={[styles.input, errors.zipCode && styles.inputError]}
              placeholder="94102"
              value={formData.zipCode}
              onChangeText={(text) => handleInputChange('zipCode', text)}
              keyboardType="numeric"
              accessibilityLabel="Zip Code"
            />
            {errors.zipCode && <Text style={styles.errorText}>{errors.zipCode}</Text>}
          </View>

          {/* Location indicator */}
          <View style={[styles.locationIndicator, { backgroundColor: colors.tint + '10', borderColor: colors.tint }]}>
            <Ionicons name="location" size={16} color={colors.tint} />
            <Text style={[styles.locationText, { color: colors.text }]}>
              {location 
                ? `Club will be created at your current location`
                : `Club will be created in New York (default location)`}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.createButton,
            isSubmitting && styles.createButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={[styles.buttonText, styles.createButtonText]}>Creating Club...</Text>
          ) : (
            <Text style={[styles.buttonText, styles.createButtonText]}>Create Club</Text>
          )}
        </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}