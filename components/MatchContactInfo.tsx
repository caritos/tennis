import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useNotification } from '@/contexts/NotificationContext';

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
  const { showError } = useNotification();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(null);

  const formatPhoneNumber = (phone: string) => {
    // Simple US phone number formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handlePhonePress = (contact: ContactInfo) => {
    if (!contact.phone) return;
    setSelectedContact(contact);
    setModalVisible(true);
  };

  const handleContactAction = async (action: 'whatsapp' | 'text' | 'call') => {
    if (!selectedContact?.phone) return;
    
    const phone = selectedContact.phone.replace(/\D/g, '');
    let url = '';
    
    switch (action) {
      case 'whatsapp':
        url = `whatsapp://send?phone=${phone}`;
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          showError('WhatsApp not installed', 'Please install WhatsApp to send messages.');
          setModalVisible(false);
          return;
        }
        break;
      case 'text':
        url = `sms:${selectedContact.phone}`;
        break;
      case 'call':
        url = `tel:${selectedContact.phone}`;
        break;
    }
    
    try {
      await Linking.openURL(url);
      setModalVisible(false);
    } catch (error) {
      showError('Unable to open app', 'Please try again or use a different contact method.');
    }
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
          onPress={() => handlePhonePress(contact)}
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

      {/* Contact Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Contact {selectedContact?.name}
              </ThemedText>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ThemedText style={[styles.modalSubtitle, { color: colors.tabIconDefault }]}>
              How would you like to contact {selectedContact?.name}?
            </ThemedText>

            <View style={styles.modalActions}>
              {(selectedContact?.contact_preference === 'whatsapp' || selectedContact?.contact_preference === 'text') && (
                <TouchableOpacity
                  style={[styles.modalActionButton, { borderColor: colors.tint }]}
                  onPress={() => handleContactAction('whatsapp')}
                >
                  <Ionicons name="logo-whatsapp" size={24} color={colors.tint} />
                  <ThemedText style={[styles.modalActionText, { color: colors.tint }]}>
                    WhatsApp
                  </ThemedText>
                </TouchableOpacity>
              )}

              {selectedContact?.contact_preference === 'text' && (
                <TouchableOpacity
                  style={[styles.modalActionButton, { borderColor: colors.tint }]}
                  onPress={() => handleContactAction('text')}
                >
                  <Ionicons name="chatbubble" size={24} color={colors.tint} />
                  <ThemedText style={[styles.modalActionText, { color: colors.tint }]}>
                    Text Message
                  </ThemedText>
                </TouchableOpacity>
              )}

              {selectedContact?.contact_preference === 'phone' && (
                <TouchableOpacity
                  style={[styles.modalActionButton, { borderColor: colors.tint }]}
                  onPress={() => handleContactAction('call')}
                >
                  <Ionicons name="call" size={24} color={colors.tint} />
                  <ThemedText style={[styles.modalActionText, { color: colors.tint }]}>
                    Call
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    gap: 12,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  modalActionText: {
    fontSize: 18,
    fontWeight: '600',
  },
});