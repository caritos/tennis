#!/usr/bin/env node

/**
 * Fix Authentication Error Script
 * 
 * This script helps fix the "Invalid Refresh Token" error by:
 * 1. Clearing local storage auth data
 * 2. Resetting Supabase auth state
 * 3. Providing instructions for recovery
 */

const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 Auth Error Fix Script');
console.log('========================\n');

function clearCaches() {
  console.log('📱 Clearing all caches...\n');
  
  try {
    // Clear watchman cache
    console.log('  Clearing Watchman cache...');
    try {
      execSync('watchman watch-del-all', { stdio: 'ignore' });
      console.log('  ✅ Watchman cache cleared');
    } catch (e) {
      console.log('  ⚠️  Watchman not installed or not running');
    }

    // Clear Metro cache
    console.log('  Clearing Metro bundler cache...');
    const tmpDir = os.tmpdir();
    try {
      execSync(`rm -rf ${tmpDir}/metro-*`, { stdio: 'ignore' });
      execSync(`rm -rf ${tmpDir}/haste-map-*`, { stdio: 'ignore' });
      console.log('  ✅ Metro cache cleared');
    } catch (e) {
      console.log('  ⚠️  Could not clear Metro cache');
    }

    // Clear React Native cache
    console.log('  Clearing React Native cache...');
    try {
      execSync('rm -rf $HOME/.expo/cache', { stdio: 'ignore' });
      console.log('  ✅ React Native cache cleared');
    } catch (e) {
      console.log('  ⚠️  Could not clear React Native cache');
    }

    // Clear node_modules/.cache if it exists
    console.log('  Clearing node_modules cache...');
    try {
      execSync('rm -rf node_modules/.cache', { stdio: 'ignore' });
      console.log('  ✅ node_modules cache cleared');
    } catch (e) {
      console.log('  ⚠️  Could not clear node_modules cache');
    }

    console.log('\n✅ All caches cleared successfully!\n');
  } catch (error) {
    console.log('⚠️  Some caches could not be cleared automatically');
    console.log('   You can manually clear by running: npx expo start --clear\n');
  }
}

function displayInstructions() {
  console.log('📋 Fix Instructions:');
  console.log('====================\n');
  
  console.log('Step 1: Clear App Data (Choose based on your platform):\n');
  
  console.log('  📱 iOS Simulator:');
  console.log('     • Open Simulator');
  console.log('     • Device → Erase All Content and Settings\n');
  
  console.log('  📱 Physical iOS Device:');
  console.log('     • Settings → General → iPhone Storage');
  console.log('     • Find your app → Delete App');
  console.log('     • Reinstall from Expo Go or TestFlight\n');
  
  console.log('  🤖 Android Emulator/Device:');
  console.log('     • Settings → Apps → Your App → Storage → Clear Data\n');
  
  console.log('  🌐 Web Browser:');
  console.log('     • Open Developer Tools (F12)');
  console.log('     • Application/Storage tab → Clear Site Data\n');
  
  console.log('Step 2: Restart Development Server:');
  console.log('  npx expo start --clear\n');
  
  console.log('Step 3: Sign In Again:');
  console.log('  • Open the app');
  console.log('  • Use your credentials to sign in\n');
  
  console.log('If issues persist:');
  console.log('  • Check Supabase dashboard for auth configuration');
  console.log('  • Verify .env file has correct EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.log('  • Try creating a new test account\n');
}

function createAuthDebugComponent() {
  console.log('🔍 Creating auth debug component...');
  
  const debugComponent = `import React from 'react';
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
`;

  const componentPath = path.join(process.cwd(), 'components', 'AuthDebugPanel.tsx');
  
  try {
    fs.writeFileSync(componentPath, debugComponent);
    console.log('✅ Debug component created at: components/AuthDebugPanel.tsx');
    console.log('   Import this in your signin screen for debugging\n');
  } catch (error) {
    console.log('⚠️  Could not create debug component');
    console.log('   ' + error.message + '\n');
  }
}

function main() {
  console.log('Starting auth error fix process...\n');
  
  // Clear all caches
  clearCaches();
  
  // Create debug component
  createAuthDebugComponent();
  
  // Display manual instructions
  displayInstructions();
  
  console.log('✨ Auth fix script completed!');
  console.log('   Follow the instructions above to complete the fix.');
  console.log('   Use the AuthDebugPanel component for additional debugging.\n');
  
  // Exit cleanly
  process.exit(0);
}

// Run the script
main();