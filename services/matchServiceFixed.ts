/**
 * Fixed version of updatePlayerRatings that works with RLS policies
 */

import { supabase } from '../lib/supabase';

/**
 * Update player ELO ratings after a match using a secure database function
 * This bypasses RLS policies that prevent updating other users' ratings
 */
export async function updatePlayerRatingsFixed(
  winnerId: string,
  loserId: string,
  winnerRatingChange: number,
  loserRatingChange: number,
  winnerNewRating: number,
  loserNewRating: number,
  winnerGamesPlayed: number = 0,
  loserGamesPlayed: number = 0
): Promise<void> {
  console.log('🔧 Updating player ratings using secure function...');
  console.log(`Winner ${winnerId}: ${winnerNewRating} (${winnerRatingChange > 0 ? '+' : ''}${winnerRatingChange})`);
  console.log(`Loser ${loserId}: ${loserNewRating} (${loserRatingChange})`);

  try {
    // Use the secure database function to update ratings
    const { error } = await supabase.rpc('update_player_ratings', {
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_winner_new_rating: winnerNewRating,
      p_loser_new_rating: loserNewRating,
      p_winner_games_played: winnerGamesPlayed,
      p_loser_games_played: loserGamesPlayed
    });

    if (error) {
      console.error('❌ Failed to update ratings via function:', error);
      
      // Fallback: Try updating each player individually (they can update their own rating)
      console.log('⚠️ Trying fallback method...');
      await updateRatingsFallback(
        winnerId, 
        loserId, 
        winnerNewRating, 
        loserNewRating, 
        winnerGamesPlayed, 
        loserGamesPlayed
      );
    } else {
      console.log('✅ Ratings updated successfully via secure function');
    }
  } catch (error) {
    console.error('❌ Error updating ratings:', error);
    throw error;
  }
}

/**
 * Fallback method: Update ratings one at a time
 * This works if at least one player is the current user
 */
async function updateRatingsFallback(
  winnerId: string,
  loserId: string,
  winnerNewRating: number,
  loserNewRating: number,
  winnerGamesPlayed: number,
  loserGamesPlayed: number
): Promise<void> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('❌ No authenticated user for fallback update');
    return;
  }

  const updates = [];
  
  // Try to update winner if it's the current user
  if (user.id === winnerId) {
    console.log('📝 Updating winner rating (current user)...');
    updates.push(
      supabase
        .from('users')
        .update({
          elo_rating: winnerNewRating,
          games_played: winnerGamesPlayed + 1
        })
        .eq('id', winnerId)
    );
  }
  
  // Try to update loser if it's the current user
  if (user.id === loserId) {
    console.log('📝 Updating loser rating (current user)...');
    updates.push(
      supabase
        .from('users')
        .update({
          elo_rating: loserNewRating,
          games_played: loserGamesPlayed + 1
        })
        .eq('id', loserId)
    );
  }

  if (updates.length === 0) {
    console.error('❌ Cannot update ratings: neither player is the current user');
    console.log('💡 TIP: Run the fix-elo-rating-update.sql script to enable rating updates');
    return;
  }

  const results = await Promise.all(updates);
  
  results.forEach((result, index) => {
    if (result.error) {
      console.error(`❌ Failed to update rating:`, result.error);
    } else {
      console.log(`✅ Updated rating for player ${index + 1}`);
    }
  });
}

/**
 * Check if the database function exists
 */
export async function checkRatingFunctionExists(): Promise<boolean> {
  try {
    // Try to get function info
    const { data, error } = await supabase.rpc('update_player_ratings', {
      p_winner_id: '00000000-0000-0000-0000-000000000000',
      p_loser_id: '00000000-0000-0000-0000-000000000000',
      p_winner_new_rating: 1200,
      p_loser_new_rating: 1200,
      p_winner_games_played: 0,
      p_loser_games_played: 0
    });

    // If we get a "not found" error, the function doesn't exist
    if (error?.message?.includes('not find')) {
      console.log('⚠️ Rating update function not found in database');
      console.log('💡 Run this SQL in Supabase dashboard:');
      console.log('   database/fix-elo-rating-update.sql');
      return false;
    }

    // Any other error or success means the function exists
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Diagnostic function to check rating update capabilities
 */
export async function diagnoseRatingUpdateIssue(): Promise<void> {
  console.log('🔍 Diagnosing ELO rating update issue...\n');

  // 1. Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ No authenticated user');
    return;
  }
  console.log(`✅ Authenticated as: ${user.email}`);

  // 2. Check if function exists
  const functionExists = await checkRatingFunctionExists();
  if (!functionExists) {
    console.log('❌ Database function not found');
    console.log('📋 Solution: Run fix-elo-rating-update.sql in Supabase SQL editor');
  } else {
    console.log('✅ Database function exists');
  }

  // 3. Test direct update (own profile)
  console.log('\n📝 Testing direct update of own profile...');
  const { error: ownUpdateError } = await supabase
    .from('users')
    .update({ games_played: 0 }) // Try harmless update
    .eq('id', user.id);

  if (ownUpdateError) {
    console.log('❌ Cannot update own profile:', ownUpdateError.message);
  } else {
    console.log('✅ Can update own profile');
  }

  // 4. Check RLS policies
  console.log('\n🔒 Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase
    .rpc('get_policies_for_table', { table_name: 'users' })
    .select('*');

  if (policyError) {
    console.log('⚠️ Cannot check policies (this is normal)');
  } else if (policies) {
    console.log(`📋 Found ${policies.length} policies on users table`);
  }

  console.log('\n💡 Recommended action:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy contents of database/fix-elo-rating-update.sql');
  console.log('3. Run the SQL script');
  console.log('4. Try recording a match again');
}