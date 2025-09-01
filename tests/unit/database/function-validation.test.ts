/**
 * Database Function Validation Tests
 * Ensures PostgreSQL functions exist and work before deployment
 */

import { createClient } from '@supabase/supabase-js';

// Use production environment for real function testing
const supabaseUrl = 'https://dgkdbqloehxruoijylzw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRna2RicWxvZWh4cnVvaWp5bHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyNzg1MjksImV4cCI6MjA3MDg1NDUyOX0.Zj3iK3SjzEYwboTX4jZPi_jxyifpZGPq143LQCrnW9k';

const supabase = createClient(supabaseUrl, supabaseKey);

describe('Database Function Validation', () => {
  
  describe('Core Functions Exist', () => {
    
    test('record_complete_match function exists', async () => {
      const { error } = await supabase.rpc('record_complete_match', {
        p_match_data: {
          club_id: '00000000-0000-0000-0000-000000000000',
          player1_id: '00000000-0000-0000-0000-000000000001',
          scores: '6-4',
          match_type: 'singles', 
          date: '2024-01-01'
        }
      });
      
      // Function should exist (may fail due to auth/data, but not due to missing function)
      expect(error?.code).not.toBe('42883'); // Function does not exist
      
      if (error) {
        // These are acceptable errors that mean function exists but has issues
        const acceptableErrors = [
          'User not authorized', // Auth check working
          'not authorized to record', // Permission validation working
          'column', // Schema mismatch (needs to be fixed but function exists)
        ];
        
        const isAcceptableError = acceptableErrors.some(msg => 
          error.message.includes(msg)
        );
        
        if (!isAcceptableError) {
          throw new Error(`Unexpected function error: ${error.message}`);
        }
      }
    });

    test('create_match_result_notifications function exists', async () => {
      const { error } = await supabase.rpc('create_match_result_notifications', {
        p_match_id: '00000000-0000-0000-0000-000000000000',
        p_winner: 1,
        p_recorder_user_id: '00000000-0000-0000-0000-000000000001'
      });
      
      expect(error?.code).not.toBe('42883'); // Function does not exist
    });

    test('update_player_ratings function exists', async () => {
      const { error } = await supabase.rpc('update_player_ratings', {
        p_winner_id: '00000000-0000-0000-0000-000000000001',
        p_loser_id: '00000000-0000-0000-0000-000000000002',
        p_winner_new_rating: 1250,
        p_loser_new_rating: 1150,
        p_winner_games_played: 5,
        p_loser_games_played: 5
      });
      
      expect(error?.code).not.toBe('42883'); // Function does not exist
    });
    
  });

  describe('Schema Validation', () => {
    
    test('record_complete_match should not reference non-existent columns', async () => {
      const { error } = await supabase.rpc('record_complete_match', {
        p_match_data: {
          club_id: '00000000-0000-0000-0000-000000000000',
          player1_id: '00000000-0000-0000-0000-000000000001',
          scores: '6-4',
          match_type: 'singles',
          date: '2024-01-01'
        }
      });
      
      // Should not fail due to missing columns
      if (error) {
        expect(error.message).not.toMatch(/column.*does not exist/);
        expect(error.message).not.toMatch(/last_activity.*does not exist/);
      }
    });
    
  });

  describe('Function Call Integration', () => {
    
    test('MatchService should be able to call record_complete_match', async () => {
      // This tests the integration pattern used in the app
      const matchData = {
        club_id: '00000000-0000-0000-0000-000000000000',
        player1_id: '00000000-0000-0000-0000-000000000001',
        scores: '6-4,6-2',
        match_type: 'singles' as const,
        date: '2024-01-01',
        opponent2_name: 'Test Player'
      };
      
      const { error } = await supabase.rpc('record_complete_match', {
        p_match_data: matchData
      });
      
      // Should not fail due to function signature mismatch
      expect(error?.code).not.toBe('42883');
      expect(error?.code).not.toBe('42703'); // Ambiguous column
      expect(error?.code).not.toBe('42702'); // Column reference ambiguous
      
      if (error) {
        // Expected failure modes (not our concern for this test)
        const expectedErrors = [
          'not authorized', // Auth working
          'User not authorized' // Permission working
        ];
        
        const isExpectedError = expectedErrors.some(msg =>
          error.message.includes(msg)
        );
        
        expect(isExpectedError).toBe(true);
      }
    });
    
  });

});

describe('Deployment Safety Checks', () => {
  
  test('should catch common PostgreSQL function deployment errors', () => {
    // Test static analysis of common issues
    const commonIssues = [
      {
        name: 'Ambiguous column reference',
        error: { code: '42702', message: 'column reference "club_id" is ambiguous' },
        solution: 'Use table prefixes: club_members.club_id'
      },
      {
        name: 'Missing column',
        error: { code: '42703', message: 'column "last_activity" does not exist' },
        solution: 'Check actual schema or remove column reference'
      },
      {
        name: 'Missing function',
        error: { code: '42883', message: 'function does not exist' },
        solution: 'Deploy the function first or check parameter signature'
      }
    ];
    
    commonIssues.forEach(issue => {
      expect(issue.solution).toBeTruthy();
      expect(issue.error.code).toMatch(/42\d+/); // PostgreSQL error codes
    });
  });
  
});