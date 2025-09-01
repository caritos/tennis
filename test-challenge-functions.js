const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgkdbqloehxruoijylzw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna2RicWxvZWh4cnVvaWp5bHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzg1MjksImV4cCI6MjA3MDg1NDUyOX0.Zj3iK3SjzEYwboTX4jZPi_jxyifpZGPq143LQCrnW9k'
);

async function testChallengeFunction(functionName, testParams) {
  try {
    const { data, error } = await supabase.rpc(functionName, testParams);
    
    if (error) {
      if (error.code === '42883') {
        return { exists: false, error: 'Function does not exist' };
      }
      return { exists: true, error: error.message };
    }
    
    return { exists: true, data };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function main() {
  console.log('🎾 Testing Challenge Functions');
  console.log('==============================');
  
  const challengeFunctions = [
    {
      name: 'create_challenge_notifications',
      params: {
        p_challenge_id: '00000000-0000-0000-0000-000000000000',
        p_initiator_user_id: '00000000-0000-0000-0000-000000000001',
        p_notification_type: 'challenge_created'
      }
    },
    {
      name: 'create_complete_challenge',
      params: {
        p_challenge_data: {
          club_id: '00000000-0000-0000-0000-000000000000',
          challenger_id: '00000000-0000-0000-0000-000000000001',
          challenged_id: '00000000-0000-0000-0000-000000000002',
          match_type: 'singles',
          message: 'Test challenge'
        }
      }
    }
  ];
  
  for (const func of challengeFunctions) {
    const result = await testChallengeFunction(func.name, func.params);
    const status = result.exists ? '✅' : '❌';
    console.log(`${status} ${func.name}: ${result.exists ? 'EXISTS' : 'MISSING'}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
}

main();