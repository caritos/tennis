import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { NotificationBadge } from '@/components/NotificationBadge';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTotalBadgeCount } from '@/hooks/useClubBadges';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { badgeCount } = useTotalBadgeCount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Clubs',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 24, color }}>🎾</Text>
              {badgeCount > 0 && (
                <NotificationBadge 
                  count={badgeCount} 
                  size="small" 
                  style={{ 
                    position: 'absolute', 
                    top: -4, 
                    right: -4 
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 24, color }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
