import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { EditProfileScreen, ProfileData } from '@/components/EditProfileScreen';
import { useAuth } from '@/contexts/AuthContext';
// import { initializeDatabase } from '@/database/database'; // Removed - using Supabase
import { supabase } from '@/lib/supabase';

export default function EditProfilePage() {
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Get user data from Supabase
      const { data: userData, error } = await supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      if (userData && !error) {
        setInitialData({
          full_name: userData.full_name || user.user_metadata?.full_name || '',
          phone: userData.phone || user.user_metadata?.phone || '',
        });
      } else {
        // Fallback to auth metadata
        setInitialData({
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Use auth metadata as fallback
      setInitialData({
        full_name: user.user_metadata?.full_name || '',
        phone: user.user_metadata?.phone || '',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, [user]);

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
      // Update Supabase profile
      const { error } = await supabase
        .from('users')
        .update({
          phone: data.phone || '',
        })
        .eq('id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      } else {
        console.log('Supabase profile updated');
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          phone: data.phone,
        },
      });

      if (authError) {
        console.error('Failed to update auth metadata:', authError);
        // Don't throw - main update was successful
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