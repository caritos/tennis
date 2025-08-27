import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function RecordInvitationMatchScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    // Redirect to the main record match screen
    // The MatchRecordingForm component can handle both regular matches and invitation matches
    router.replace(`/record-match?invitationId=${id}`);
  }, [id, router]);

  return null; // This screen just redirects
}