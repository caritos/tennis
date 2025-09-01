const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgkdbqloehxruoijylzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna2RicWxvZWh4cnVvaWp5bHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzg1MjksImV4cCI6MjA3MDg1NDUyOX0.Zj3iK3SjzEYwboTX4jZPi_jxyifpZGPq143LQCrnW9k'
);

async function testCurrentFunction() {
  console.log('🧪 Testing current record_complete_match function...');
  
  try {
    const { data, error } = await supabase.rpc('record_complete_match', {
      p_match_data: {
        club_id: '00000000-0000-0000-0000-000000000000',
        player1_id: '00000000-0000-0000-0000-000000000001', 
        scores: '6-4,6-2',
        match_type: 'singles',
        date: '2024-01-01',
        opponent2_name: 'Test Player'
      }
    });
    
    if (error) {
      console.log('❌ Function error:', error);
      if (error.message.includes('last_activity')) {
        console.log('💡 Schema issue: clubs table missing last_activity column');
        return false;
      }
      if (error.message.includes('not authorized')) {
        console.log('✅ Function exists and ran (expected auth error)');
        return true;
      }
    } else {
      console.log('✅ Function result:', data);
      return true;
    }
    
  } catch (error) {
    console.log('❌ Test error:', error);
    return false;
  }
}

testCurrentFunction();