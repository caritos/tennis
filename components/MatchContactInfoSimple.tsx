import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface ContactInfo {
  name: string;
  phone?: string;
}

interface MatchContactInfoProps {
  contacts: ContactInfo[];
  title?: string;
}

const MatchContactInfoSimple: React.FC<MatchContactInfoProps> = ({
  contacts,
  title = "Contact Information"
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePhonePress = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const filteredContacts = contacts.filter(contact => contact.phone);

  if (filteredContacts.length === 0) {
    return null;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="call" size={16} color={colors.tint} />
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {title}
        </ThemedText>
      </View>
      <View style={styles.contactList}>
        {filteredContacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.contactItem, { borderColor: colors.border }]}
            onPress={() => handlePhonePress(contact.phone!)}
          >
            <View style={styles.contactInfo}>
              <ThemedText style={[styles.contactName, { color: colors.text }]}>
                {contact.name}
              </ThemedText>
              <ThemedText style={[styles.contactPhone, { color: colors.textSecondary }]}>
                {contact.phone}
              </ThemedText>
            </View>
            <Ionicons name="call" size={20} color={colors.tint} />
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
};

export default MatchContactInfoSimple;

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
});