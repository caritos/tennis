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
        'SELECT full_name, phone, contact_preference FROM users WHERE id = ?',
        [user.id]
      ) as any;

      if (userData) {
        setInitialData({
          full_name: userData.full_name || user.user_metadata?.full_name || '',
          phone: userData.phone || user.user_metadata?.phone || '',
          contact_preference: userData.contact_preference || 'whatsapp',
        });
      } else {
        // Fallback to auth metadata
        setInitialData({
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          contact_preference: 'whatsapp',
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
          contact_preference = ?
        WHERE id = ?`,
        [
          data.full_name,
          data.phone || null,
          data.contact_preference,
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