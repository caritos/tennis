import React from 'react';
import { router } from 'expo-router';
import { CreateClubForm } from '@/components/CreateClubForm';
import { Club } from '@/lib/supabase';

export default function CreateClubScreen() {
  const handleSuccess = (club: Club) => {
    console.log('Club created successfully:', club.name);
    // Navigate back to clubs tab and refresh
    router.replace('/(tabs)');
  };

  const handleCancel = () => {
    console.log('Create club cancelled');
    router.back();
  };

  return (
    <CreateClubForm 
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}