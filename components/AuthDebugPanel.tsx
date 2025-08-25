import React from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

export function AuthDebugPanel() {
  const clearAuthState = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local storage if web
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      Alert.alert('Success', 'Auth state cleared. Please restart the app.');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to clear auth state: ' + error.message);
    }
  };
  
  const testAuthConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        Alert.alert('Auth Error', error.message);
      } else if (data.session) {
        Alert.alert('Success', 'Auth is working! User: ' + data.session.user.email);
      } else {
        Alert.alert('Info', 'No active session. Please sign in.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Connection test failed: ' + error.message);
    }
  };
  
  const forceTokenRefresh = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        Alert.alert('Refresh Error', error.message);
      } else if (data.session) {
        Alert.alert('Success', 'Token refreshed successfully!');
      } else {
        Alert.alert('Info', 'No session to refresh.');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Refresh failed: ' + error.message);
    }
  };
  
  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Auth Debug Panel</Text>
      
      <View style={styles.button}>
        <Button title="Test Auth Connection" onPress={testAuthConnection} />
      </View>
      
      <View style={styles.button}>
        <Button title="Force Token Refresh" onPress={forceTokenRefresh} />
      </View>
      
      <View style={styles.button}>
        <Button title="Clear Auth State" onPress={clearAuthState} color="red" />
      </View>
      
      <Text style={styles.note}>
        Use these tools to debug auth issues
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    marginTop: 20,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    marginVertical: 5,
  },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
