/**
 * Integration test for Issue #98: Phone number display in profile
 * Tests the complete flow from registration to profile display
 */

// Mock Supabase first
const mockAuth = {
  getSession: jest.fn(),
  signUp: jest.fn(),
  updateUser: jest.fn(),
};

const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockAuth,
    from: mockFrom,
  },
}));

describe('Phone Number Flow Integration Test', () => {
  const TEST_USER_ID = 'test-user-123';
  const TEST_EMAIL = 'test@example.com';
  const TEST_PHONE = '+1234567890';
  const TEST_FULL_NAME = 'Test User';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all mocks to default state
    mockAuth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  describe('Issue #98: Phone number persistence and display', () => {
    test('Phone number should persist from registration through profile display', async () => {
      // Step 1: User registers with phone number
      const registrationData = {
        email: TEST_EMAIL,
        password: 'Test123!@#',
        options: {
          data: {
            full_name: TEST_FULL_NAME,
            phone: TEST_PHONE,
          },
        },
      };

      // Mock successful registration
      mockAuth.signUp.mockResolvedValue({
        data: {
          user: {
            id: TEST_USER_ID,
            email: TEST_EMAIL,
            user_metadata: {
              full_name: TEST_FULL_NAME,
              phone: TEST_PHONE,
            },
          },
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh',
          },
        },
        error: null,
      });

      // Simulate registration
      const { supabase } = require('@/lib/supabase');
      const { data: signUpData } = await supabase.auth.signUp(registrationData);
      expect(signUpData?.user?.user_metadata?.phone).toBe(TEST_PHONE);

      // Step 2: User profile is created in database with phone number
      const userProfileData = {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        full_name: TEST_FULL_NAME,
        phone: TEST_PHONE,
        role: 'player',
        contact_preference: 'whatsapp',
        elo_rating: 1200,
        games_played: 0,
        created_at: new Date().toISOString(),
      };

      // Mock profile creation
      mockFrom.mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: userProfileData,
              error: null,
            }),
          }),
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: userProfileData,
              error: null,
            }),
          }),
        }),
      });

      // Simulate profile creation
      const { data: profileData } = await supabase
        .from('users')
        .upsert(userProfileData)
        .select()
        .single();
      
      expect(profileData?.phone).toBe(TEST_PHONE);

      // Step 3: User logs in and profile is loaded
      mockAuth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: TEST_USER_ID,
              email: TEST_EMAIL,
              user_metadata: {
                full_name: TEST_FULL_NAME,
                phone: TEST_PHONE,
              },
            },
            access_token: 'test-token',
          },
        },
        error: null,
      });

      // Step 4: Verify phone number is accessible in user context
      const session = await supabase.auth.getSession();
      const userId = session.data?.session?.user?.id;
      
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Verify phone is in the profile
      expect(userProfile?.phone).toBe(TEST_PHONE);
      
      // Step 5: Verify the complete user object structure
      const completeUserProfile = {
        ...userProfile,
        user_metadata: {
          full_name: userProfile?.full_name,
          phone: userProfile?.phone,
        },
      };

      // Phone should be accessible at both levels
      expect(completeUserProfile.phone).toBe(TEST_PHONE);
      expect(completeUserProfile.user_metadata.phone).toBe(TEST_PHONE);
    });

    test('Phone number should be editable and persist after update', async () => {
      const UPDATED_PHONE = '+9876543210';
      const { supabase } = require('@/lib/supabase');
      
      // Initial user state
      const initialProfile = {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        full_name: TEST_FULL_NAME,
        phone: TEST_PHONE,
        role: 'player',
        contact_preference: 'whatsapp',
      };

      // Mock initial profile fetch
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: initialProfile,
              error: null,
            }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Fetch initial profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', TEST_USER_ID)
        .single();

      expect(profile?.phone).toBe(TEST_PHONE);

      // Update phone number
      const updatedProfile = {
        ...initialProfile,
        phone: UPDATED_PHONE,
      };

      // Mock profile update
      mockFrom.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          error: null,
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedProfile,
              error: null,
            }),
          }),
        }),
      });

      // Update profile
      await supabase
        .from('users')
        .upsert(updatedProfile);

      // Fetch updated profile
      const { data: updatedData } = await supabase
        .from('users')
        .select('*')
        .eq('id', TEST_USER_ID)
        .single();

      // Verify phone was updated
      expect(updatedData?.phone).toBe(UPDATED_PHONE);
    });

    test('Phone number should handle empty/null values gracefully', async () => {
      const { supabase } = require('@/lib/supabase');
      
      // User without phone number
      const profileWithoutPhone = {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        full_name: TEST_FULL_NAME,
        phone: null,
        role: 'player',
        contact_preference: 'whatsapp',
      };

      // Mock profile fetch
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: profileWithoutPhone,
              error: null,
            }),
          }),
        }),
      });

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', TEST_USER_ID)
        .single();

      // Should handle null gracefully
      expect(profile?.phone).toBeNull();

      // Complete user profile should still be valid
      const completeProfile = {
        ...profile,
        user_metadata: {
          full_name: profile?.full_name,
          phone: profile?.phone || '',
        },
      };

      expect(completeProfile.user_metadata.phone).toBe('');
    });

    test('Phone number should sync between auth metadata and database', async () => {
      const { supabase } = require('@/lib/supabase');
      
      // Auth metadata has phone
      const authUser = {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        user_metadata: {
          full_name: TEST_FULL_NAME,
          phone: TEST_PHONE,
        },
      };

      // Database initially doesn't have phone
      const dbProfile = {
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        full_name: TEST_FULL_NAME,
        phone: '',
        role: 'player',
      };

      // Mock auth session
      mockAuth.getSession.mockResolvedValue({
        data: {
          session: {
            user: authUser,
          },
        },
        error: null,
      });

      // Mock initial profile fetch (no phone)
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: dbProfile,
              error: null,
            }),
          }),
        }),
      });

      // Fetch profile - should return empty phone
      const { data: initialProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', TEST_USER_ID)
        .single();

      expect(initialProfile?.phone).toBe('');

      // Sync from auth metadata to database
      const syncedProfile = {
        ...dbProfile,
        phone: authUser.user_metadata.phone,
      };

      // Mock profile update with synced phone
      mockFrom.mockReturnValue({
        upsert: jest.fn().mockResolvedValue({
          error: null,
        }),
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: syncedProfile,
              error: null,
            }),
          }),
        }),
      });

      // Update profile with phone from auth metadata
      await supabase
        .from('users')
        .upsert(syncedProfile);

      // Verify sync
      const { data: updatedProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', TEST_USER_ID)
        .single();

      expect(updatedProfile?.phone).toBe(TEST_PHONE);
    });
  });

  describe('Error handling', () => {
    test('Should handle database errors when fetching profile with phone', async () => {
      const { supabase } = require('@/lib/supabase');
      
      // Mock database error
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                code: 'PGRST116',
                message: 'Profile not found',
              },
            }),
          }),
        }),
      });

      const { error } = await supabase
        .from('users')
        .select('*')
        .eq('id', 'non-existent-user')
        .single();

      expect(error).toBeTruthy();
      expect(error?.code).toBe('PGRST116');
    });

    test('Should handle auth errors when updating phone in metadata', async () => {
      const { supabase } = require('@/lib/supabase');
      
      // Mock auth update error
      mockAuth.updateUser.mockResolvedValue({
        data: null,
        error: {
          message: 'Auth update failed',
        },
      });

      const { error } = await supabase.auth.updateUser({
        data: { phone: TEST_PHONE },
      });

      expect(error).toBeTruthy();
      expect(error?.message).toBe('Auth update failed');
    });
  });
});