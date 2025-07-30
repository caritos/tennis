import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { EditProfileScreen, ProfileData } from '@/components/EditProfileScreen';
import { useAuth } from '@/contexts/AuthContext';
import { initializeDatabase } from '@/database/database';
import { supabase } from '@/lib/supabase';

export default function EditProfilePage() {
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const db = await initializeDatabase();
      const userData = await db.getFirstAsync(
        'SELECT full_name, phone, contact_preference, skill_level, playing_style, profile_visibility, match_history_visibility, allow_challenges, notification_preferences, profile_photo_uri FROM users WHERE id = ?',
        [user.id]
      ) as any;

      if (userData) {
        setInitialData({
          full_name: userData.full_name || user.user_metadata?.full_name || '',
          phone: userData.phone || user.user_metadata?.phone || '',
          contact_preference: userData.contact_preference || 'whatsapp',
          skill_level: userData.skill_level,
          playing_style: userData.playing_style,
          profile_visibility: userData.profile_visibility || 'public',
          match_history_visibility: userData.match_history_visibility || 'public',
          allow_challenges: userData.allow_challenges || 'everyone',
          notification_preferences: userData.notification_preferences,
          profile_photo_uri: userData.profile_photo_uri,
        });
      } else {
        // Fallback to auth metadata
        setInitialData({
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          contact_preference: 'whatsapp',
          profile_visibility: 'public',
          match_history_visibility: 'public',
          allow_challenges: 'everyone',
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Use auth metadata as fallback
      setInitialData({
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
        contact_preference: 'whatsapp',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    console.log('Back pressed - navigating to profile');
    router.back();
  };

  const handleSave = async (data: ProfileData) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    console.log('Saving profile data:', data);

    try {
      // Update local database first
      const db = await initializeDatabase();
      await db.runAsync(
        `UPDATE users SET 
          full_name = ?, 
          phone = ?, 
          contact_preference = ?,
          skill_level = ?,
          playing_style = ?,
          profile_visibility = ?,
          match_history_visibility = ?,
          allow_challenges = ?,
          notification_preferences = ?,
          profile_photo_uri = ?
        WHERE id = ?`,
        [
          data.full_name,
          data.phone || null,
          data.contact_preference,
          data.skill_level || null,
          data.playing_style || null,
          data.profile_visibility || 'public',
          data.match_history_visibility || 'public',
          data.allow_challenges || 'everyone',
          data.notification_preferences || null,
          data.profile_photo_uri || null,
          user.id,
        ]
      );

      console.log('Local database updated');

      // Also update Supabase if connected
      try {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: data.full_name,
            phone: data.phone || null,
            contact_preference: data.contact_preference,
            skill_level: data.skill_level || null,
            playing_style: data.playing_style || null,
            profile_visibility: data.profile_visibility || 'public',
            match_history_visibility: data.match_history_visibility || 'public',
            allow_challenges: data.allow_challenges || 'everyone',
            notification_preferences: data.notification_preferences || null,
            profile_photo_uri: data.profile_photo_uri || null,
          })
          .eq('id', user.id);

        if (error) {
          console.error('Supabase update error:', error);
          // Don't throw - local update was successful
        } else {
          console.log('Supabase profile updated');
        }
      } catch (supabaseError) {
        console.error('Failed to update Supabase:', supabaseError);
        // Continue - local update was successful
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          phone: data.phone,
        },
      });

      if (authError) {
        console.error('Failed to update auth metadata:', authError);
        // Don't throw - local update was successful
      } else {
        console.log('Auth metadata updated');
      }

      console.log('Profile update completed');
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  if (loading || !initialData) {
    return null; // Could show a loading spinner here
  }

  return (
    <EditProfileScreen
      onBack={handleBack}
      onSave={handleSave}
      initialData={initialData}
    />
  );
}