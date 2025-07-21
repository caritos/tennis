import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Redirect to welcome screen on app launch
    // TODO: Add authentication check here later
    // If user is already authenticated, go to (tabs)
    // If not authenticated, go to welcome
    router.replace('/welcome');
  }, []);

  // Return null since we're immediately redirecting
  return null;
}