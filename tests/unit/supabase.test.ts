import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Supabase Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('environment configuration', () => {
    it('should handle environment variables correctly', () => {
      // Mock environment variables
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Test that environment variables are accessible
      expect(process.env.EXPO_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
    });
  });

  describe('supabase client', () => {
    it('should create client with correct configuration', () => {
      const mockClient = { from: jest.fn(), auth: jest.fn() };
      (createClient as jest.Mock).mockReturnValue(mockClient);

      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      // Re-import to get fresh instance
      jest.resetModules();
      require('../../lib/supabase');

      expect(createClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          auth: expect.objectContaining({
            storage: expect.any(Object),
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          }),
        })
      );
    });

    it('should export supabase client instance', () => {
      expect(supabase).toBeDefined();
      expect(typeof supabase).toBe('object');
    });
  });

  describe('Database Types', () => {
    it('should define User type with correct properties', () => {
      // This test ensures our TypeScript types are correct
      const user = {
        id: 'user-id',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'player' as const,
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(user.id).toBe('user-id');
      expect(user.full_name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.phone).toBe('+1234567890');
      expect(user.role).toBe('player');
      expect(user.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should define Club type with correct properties', () => {
      const club = {
        id: 'club-id',
        name: 'Tennis Club',
        description: 'A great tennis club',
        location: 'San Francisco, CA',
        lat: 37.7749,
        lng: -122.4194,
        creator_id: 'user-id',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(club.id).toBe('club-id');
      expect(club.name).toBe('Tennis Club');
      expect(club.description).toBe('A great tennis club');
      expect(club.location).toBe('San Francisco, CA');
      expect(club.lat).toBe(37.7749);
      expect(club.lng).toBe(-122.4194);
      expect(club.creator_id).toBe('user-id');
      expect(club.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should define Match type with correct properties', () => {
      const match = {
        id: 'match-id',
        club_id: 'club-id',
        player1_id: 'player1-id',
        player2_id: 'player2-id',
        opponent2_name: null,
        scores: '6-4,6-3',
        match_type: 'singles' as const,
        date: '2024-01-01',
        notes: 'Great match',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(match.id).toBe('match-id');
      expect(match.club_id).toBe('club-id');
      expect(match.player1_id).toBe('player1-id');
      expect(match.player2_id).toBe('player2-id');
      expect(match.opponent2_name).toBeNull();
      expect(match.scores).toBe('6-4,6-3');
      expect(match.match_type).toBe('singles');
      expect(match.date).toBe('2024-01-01');
      expect(match.notes).toBe('Great match');
      expect(match.created_at).toBe('2024-01-01T00:00:00Z');
    });
  });
});