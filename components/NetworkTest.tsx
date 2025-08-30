import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export function NetworkTest() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testNetwork = async () => {
    setLoading(true);
    setResult('Testing network...');
    
    try {
      // Test 1: Basic fetch to a known endpoint
      const response1 = await fetch('https://httpbin.org/get');
      if (response1.ok) {
        setResult(prev => prev + '\n✅ Basic network: OK');
      } else {
        setResult(prev => prev + '\n❌ Basic network: Failed');
      }
      
      // Test 2: Supabase URL
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (supabaseUrl) {
        const response2 = await fetch(`${supabaseUrl}/health`);
        setResult(prev => prev + `\n✅ Supabase URL reachable: ${response2.status}`);
      } else {
        setResult(prev => prev + '\n❌ Supabase URL not configured');
      }
      
    } catch (error: any) {
      setResult(prev => prev + `\n❌ Network error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Network Test</ThemedText>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.tint }]}
        onPress={testNetwork}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Network'}
        </ThemedText>
      </TouchableOpacity>
      
      {result && (
        <ThemedView style={[styles.results, { borderColor: colors.tabIconDefault }]}>
          <ThemedText style={styles.resultText}>{result}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
});