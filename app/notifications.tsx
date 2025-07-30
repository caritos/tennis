import React from 'react';
import { Stack } from 'expo-router';
import { NotificationScreen } from '@/components/NotificationScreen';

export default function NotificationsPage() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Notifications',
          headerShown: false, // NotificationScreen has its own header
        }} 
      />
      <NotificationScreen />
    </>
  );
}