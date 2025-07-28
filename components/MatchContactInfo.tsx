import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ContactInfo {
  name: string;
  phone?: string;
  contact_preference: string;
}

interface MatchContactInfoProps {
  challenger: ContactInfo;
  challenged: ContactInfo;
}

const MatchContactInfo: React.FC<MatchContactInfoProps> = ({
  challenger,
  challenged,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatPhoneNumber = (phone: string) => {
    // Simple US phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handlePhonePress = (phone: string, name: string, preference: string) => {
    if (!phone) return;

    const options = [];
    
    if (preference === 'whatsapp' || preference === 'text') {
      options.push({
        text: 'WhatsApp',
        onPress: () => {
          const whatsappUrl = `whatsapp://send?phone=${phone.replace(/\D/g, '')}`;
          Linking.canOpenURL(whatsappUrl).then((supported) => {
            if (supported) {
              Linking.openURL(whatsappUrl);
            } else {
              Alert.alert('WhatsApp not installed', 'Please install WhatsApp to send messages.');
            }
          });
        },
      });
    }

    if (preference === 'text') {
      options.push({
        text: 'Text Message',
        onPress: () => {
          const smsUrl = `sms:${phone}`;
          Linking.openURL(smsUrl);
        },
      });
    }

    if (preference === 'phone') {
      options.push({
        text: 'Call',
        onPress: () => {
          const phoneUrl = `tel:${phone}`;
          Linking.openURL(phoneUrl);
        },
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      `Contact ${name}`,
      `How would you like to contact ${name}?`,
      options
    );
  };

  const getContactIcon = (preference: string) => {
    switch (preference) {
      case 'whatsapp':
        return 'logo-whatsapp';
      case 'text':
        return 'chatbubble';
      case 'phone':
        return 'call';
      default:
        return 'call';
    }
  };

  const renderContactCard = (contact: ContactInfo, isChallenger: boolean) => (
    <View style={[styles.contactCard, { borderColor: colors.tabIconDefault + '30' }]}>
      <View style={styles.contactHeader}>
        <View style={[styles.contactAvatar, { backgroundColor: colors.tint + '20' }]}>
          <ThemedText style={[styles.contactInitial, { color: colors.tint }]}>
            {contact.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.contactInfo}>
          <ThemedText style={styles.contactName}>{contact.name}</ThemedText>
          <ThemedText style={[styles.contactRole, { color: colors.tabIconDefault }]}>
            {isChallenger ? 'Challenger' : 'Challenged'}
          </ThemedText>
        </View>
      </View>

      {contact.phone && (
        <TouchableOpacity
          style={[styles.contactButton, { borderColor: colors.tint }]}
          onPress={() => handlePhonePress(contact.phone!, contact.name, contact.contact_preference)}
        >
          <Ionicons 
            name={getContactIcon(contact.contact_preference) as any} 
            size={18} 
            color={colors.tint} 
          />
          <ThemedText style={[styles.contactButtonText, { color: colors.tint }]}>
            {formatPhoneNumber(contact.phone)}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
        <ThemedText style={styles.title}>Match Confirmed!</ThemedText>
      </View>

      <ThemedText style={[styles.subtitle, { color: colors.tabIconDefault }]}>
        Contact information has been shared between players.
      </ThemedText>

      <View style={styles.contactsContainer}>
        {renderContactCard(challenger, true)}
        {renderContactCard(challenged, false)}
      </View>

      <View style={[styles.reminderCard, { backgroundColor: colors.tabIconDefault + '10' }]}>
        <Ionicons name="information-circle" size={20} color={colors.tabIconDefault} />
        <ThemedText style={[styles.reminderText, { color: colors.tabIconDefault }]}>
          Community Reminder: Please honor your commitment. No-shows and unsportsmanlike behavior can be reported.
        </ThemedText>
      </View>
    </ThemedView>
  );
};

export default MatchContactInfo;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  contactsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  contactCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'transparent',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInitial: {
    fontSize: 20,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  reminderText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});