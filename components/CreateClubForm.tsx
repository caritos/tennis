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
import { IOSTypography, IOSSpacing, IOSBorderRadius, IOSColors, IOSShadows, IOSStyles } from '@/constants/IOSDesign';
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
  zipCode: string;
}

interface FormErrors {
  name?: string;
  description?: string;
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
    zipCode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateZipCode = (zipCode: string): boolean => {
    // Accept 5-digit or 9-digit (with dash) zip codes
    const zipPattern = /^\d{5}(-\d{4})?$/;
    return zipPattern.test(zipCode);
  };

  const getLocationFromZipCode = (zipCode: string): string => {
    // Simple zip code to location mapping for common US zip codes
    // In production, this could use a proper geocoding service
    const zipToLocation: { [key: string]: string } = {
      // California
      '94102': 'San Francisco, CA',
      '94103': 'San Francisco, CA', 
      '94104': 'San Francisco, CA',
      '90210': 'Beverly Hills, CA',
      '90401': 'Santa Monica, CA',
      '94301': 'Palo Alto, CA',
      '95014': 'Cupertino, CA',
      // New York
      '10001': 'New York, NY',
      '10002': 'New York, NY',
      '10003': 'New York, NY',
      '10013': 'New York, NY',
      '11201': 'Brooklyn, NY',
      // Texas
      '78701': 'Austin, TX',
      '75201': 'Dallas, TX',
      '77002': 'Houston, TX',
      // Default pattern matching for common zip code patterns
    };

    // Direct lookup first
    if (zipToLocation[zipCode]) {
      return zipToLocation[zipCode];
    }

    // Pattern-based matching for common areas
    const zip5 = zipCode.substring(0, 5);
    
    if (zip5.startsWith('941') || zip5.startsWith('940')) {
      return 'San Francisco Bay Area, CA';
    }
    if (zip5.startsWith('902') || zip5.startsWith('903') || zip5.startsWith('904')) {
      return 'Los Angeles Area, CA';
    }
    if (zip5.startsWith('100') || zip5.startsWith('101') || zip5.startsWith('102')) {
      return 'New York, NY';
    }
    if (zip5.startsWith('787')) {
      return 'Austin, TX';
    }
    if (zip5.startsWith('752')) {
      return 'Dallas, TX';
    }
    if (zip5.startsWith('770')) {
      return 'Houston, TX';
    }

    // Fallback - just show the zip code
    return `Zip Code ${zipCode}`;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Club name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
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
      
      const derivedLocation = getLocationFromZipCode(formData.zipCode.trim());
      
      const clubData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: derivedLocation,
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
      paddingHorizontal: IOSSpacing.contentMargin,
      paddingVertical: IOSSpacing.medium,
      borderBottomWidth: 0, // Clean iOS look without border
    },
    backButton: {
      ...IOSStyles.backButton,
    },
    headerTitle: {
      ...IOSStyles.headerTitle,
      color: colors.text,
      flex: 1,
      marginRight: IOSSpacing.minimumTouchTarget, // Balance the back button
    },
    scrollContainer: {
      flex: 1,
    },
    form: {
      ...IOSStyles.contentContainer,
      paddingTop: IOSSpacing.comfortable,
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
      height: IOSSpacing.inputHeight + 4, // Slightly taller for better UX
    },
    inputError: {
      borderColor: IOSColors.destructive,
      borderWidth: 1.5,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: IOSSpacing.medium, // Proper top padding for multiline
    },
    errorText: {
      ...IOSStyles.errorText,
    },
    buttonContainer: {
      marginTop: IOSSpacing.extraLoose,
      marginBottom: IOSSpacing.comfortable,
    },
    button: {
      ...IOSStyles.primaryButton,
      width: '100%',
    },
    createButton: {
      backgroundColor: colors.tint,
    },
    createButtonDisabled: {
      backgroundColor: IOSColors.systemGray,
      ...IOSShadows.subtle, // Lighter shadow when disabled
    },
    buttonText: {
      ...IOSTypography.body,
      fontWeight: '600',
    },
    createButtonText: {
      color: '#ffffff',
    },
    generalError: {
      backgroundColor: IOSColors.destructive,
      padding: IOSSpacing.standard,
      borderRadius: IOSBorderRadius.medium,
      marginBottom: IOSSpacing.standard,
      ...IOSShadows.subtle,
    },
    generalErrorText: {
      ...IOSTypography.subheadline,
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: '500',
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
        <Text style={styles.headerTitle}>Create Club</Text>
        <View style={{ width: IOSSpacing.minimumTouchTarget }} />
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
              placeholderTextColor={colors.tabIconDefault + '80'}
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              accessibilityLabel="Club Name"
              accessibilityHint="Enter the name of your tennis club"
              returnKeyType="next"
              onSubmitEditing={() => {
                // Focus next field (description)
                // Will be handled by refs in a future update
              }}
              blurOnSubmit={false}
              autoCapitalize="words"
              autoCorrect={true}
            />
            {errors.name && (
              <Text 
                style={styles.errorText} 
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                {errors.name}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="A friendly community club for players of all levels..."
              placeholderTextColor={colors.tabIconDefault + '80'}
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              accessibilityLabel="Club Description"
              accessibilityHint="Describe your tennis club and what makes it special"
              returnKeyType="next"
              blurOnSubmit={false}
              autoCapitalize="sentences"
              autoCorrect={true}
            />
            {errors.description && (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                {errors.description}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={[styles.input, errors.zipCode && styles.inputError]}
              placeholder="94102"
              placeholderTextColor={colors.tabIconDefault + '80'}
              value={formData.zipCode}
              onChangeText={(text) => handleInputChange('zipCode', text)}
              keyboardType="number-pad"
              accessibilityLabel="Zip Code"
              accessibilityHint="Enter the zip code where your club is located"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              maxLength={10} // Support 5+4 format
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.zipCode && (
              <Text 
                style={styles.errorText}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                {errors.zipCode}
              </Text>
            )}
          </View>


          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.createButton,
                isSubmitting && styles.createButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel={isSubmitting ? "Creating Club" : "Create Club"}
              accessibilityHint={isSubmitting ? "Please wait while your club is being created" : "Tap to create your tennis club"}
              accessibilityState={{ disabled: isSubmitting }}
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