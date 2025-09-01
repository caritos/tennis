const { createClient } = require('@supabase/supabase-js');

// Test deployment of the match function
const supabase = createClient(
  'https://dgkdbqloehxruoijylzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna2RicWxvZWh4cnVvaWp5bHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzg1MjksImV4cCI6MjA3MDg1NDUyOX0.Zj3iK3SjzEYwboTX4jZPi_jxyifpZGPq143LQCrnW9k'
);

async function testFunction() {
  console.log('🧪 Testing if record_complete_match function exists...');
  
  try {
    // Test with minimal data to see if function exists
    const { data, error } = await supabase.rpc('record_complete_match', {
      p_match_data: {
        club_id: '00000000-0000-0000-0000-000000000000',
        player1_id: '00000000-0000-0000-0000-000000000001',
        scores: '6-4',
        match_type: 'singles',
        date: '2024-01-01'
      }
    });
    
    if (error) {
      if (error.code === '42883') {
        console.log('❌ Function does not exist - needs to be deployed');
        return false;
      }
      console.log('✅ Function exists (got expected error):', error.message);
      return true;
    }
    
    console.log('✅ Function test result:', data);
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testFunction();