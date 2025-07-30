import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initializeDatabase } from '@/database/database';

export default function DebugDatabaseScreen() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const db = await initializeDatabase();
        
        // Get all clubs
        const clubsData = await db.getAllAsync('SELECT * FROM clubs');
        console.log('DEBUG: All clubs in database:', clubsData);
        setClubs(clubsData || []);
        
        // Get all users
        const usersData = await db.getAllAsync('SELECT id, email, full_name FROM users');
        console.log('DEBUG: All users in database:', usersData);
        setUsers(usersData || []);
        
      } catch (err) {
        console.error('DEBUG: Database error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };
    
    checkDatabase();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Database Debug</Text>
        
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clubs ({clubs.length})</Text>
          {clubs.map((club, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.itemText}>ID: {club.id}</Text>
              <Text style={styles.itemText}>Name: {club.name}</Text>
              <Text style={styles.itemText}>Location: {club.location}</Text>
              <Text style={styles.itemText}>Lat: {club.lat}, Lng: {club.lng}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Users ({users.length})</Text>
          {users.map((user, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.itemText}>ID: {user.id}</Text>
              <Text style={styles.itemText}>Email: {user.email}</Text>
              <Text style={styles.itemText}>Name: {user.full_name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  itemText: {
    fontSize: 12,
    marginBottom: 2,
  },
  errorBox: {
    backgroundColor: '#ffeeee',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  errorText: {
    color: '#ff0000',
  },
});