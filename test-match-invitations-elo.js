const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgkdbqloehxruoijylzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna2RicWxvZWh4cnVvaWp5bHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzg1MjksImV4cCI6MjA3MDg1NDUyOX0.Zj3iK3SjzEYwboTX4jZPi_jxyifpZGPq143LQCrnW9k'
);

async function testMatchInvitationsElo() {
  console.log('🎾 Testing get_club_match_invitations ELO data...');
  
  try {
    // Use a real club ID - you can get this from your app
    const clubId = 'fe6709d3-9d7d-42a6-8d1c-e11b9eaf3aed'; // Three Village Tennis from screenshot
    
    const { data, error } = await supabase.rpc('get_club_match_invitations', {
      p_club_id: clubId,
      p_user_id: undefined
    });
    
    if (error) {
      console.error('❌ Function error:', error);
      return;
    }
    
    console.log(`✅ Got ${data?.length || 0} invitations`);
    
    if (data && data.length > 0) {
      const firstInvitation = data[0];
      console.log('📊 First invitation data:');
      console.log('  - ID:', firstInvitation.id);
      console.log('  - Creator:', firstInvitation.creator_full_name);
      console.log('  - Creator ELO:', firstInvitation.creator_elo_rating);
      console.log('  - Creator Games:', firstInvitation.creator_games_played);
      console.log('  - All fields:', Object.keys(firstInvitation));
      
      if (!firstInvitation.creator_elo_rating) {
        console.log('❌ creator_elo_rating is missing from function response!');
      } else {
        console.log('✅ creator_elo_rating is available:', firstInvitation.creator_elo_rating);
      }
    } else {
      console.log('ℹ️ No invitations found for testing');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testMatchInvitationsElo();