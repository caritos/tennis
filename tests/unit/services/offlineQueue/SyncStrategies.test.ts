// Unit tests for SyncStrategies
import { supabase } from '../../../../lib/supabase';
import { 
  matchSyncStrategies, 
  clubSyncStrategies, 
  userSyncStrategies, 
  challengeSyncStrategies,
  getAllSyncStrategies 
} from '../../../../services/offlineQueue/SyncStrategies';
import { QueueOperation } from '../../../../services/offlineQueue/types';

// Mock Supabase
jest.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('SyncStrategies', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock chain
    const mockQuery = {
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    
    mockSupabase.from.mockReturnValue(mockQuery as any);
  });

  describe('Match Sync Strategies', () => {
    const createMatchStrategy = matchSyncStrategies.find(s => s.operation === 'create_match')!;
    const updateMatchStrategy = matchSyncStrategies.find(s => s.operation === 'update_match')!;
    const deleteMatchStrategy = matchSyncStrategies.find(s => s.operation === 'delete_match')!;

    describe('create_match strategy', () => {
      it('should validate required fields', () => {
        expect(createMatchStrategy.validate!({
          club_id: 'club123',
          scores: '6-4,6-3',
          match_type: 'singles'
        })).toBe(true);

        expect(createMatchStrategy.validate!({
          club_id: '',
          scores: '6-4,6-3',
          match_type: 'singles'
        })).toBe(false);

        expect(createMatchStrategy.validate!({
          club_id: 'club123',
          scores: '',
          match_type: 'singles'
        })).toBe(false);
      });

      it('should transform payload by adding created_at', () => {
        const payload = {
          club_id: 'club123',
          scores: '6-4,6-3',
          match_type: 'singles' as const
        };

        const transformed = createMatchStrategy.transform!(payload);
        expect(transformed).toHaveProperty('created_at');
        expect(transformed.club_id).toBe('club123');
      });

      it('should successfully create match in Supabase', async () => {
        const mockData = { id: 'match123', club_id: 'club123' };
        const mockChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'CREATE',
          entity: 'match',
          operation: 'create_match',
          payload: {
            club_id: 'club123',
            player1_id: 'player1',
            scores: '6-4,6-3',
            match_type: 'singles',
            date: '2025-01-01'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await createMatchStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(mockSupabase.from).toHaveBeenCalledWith('matches');
        expect(mockChain.insert).toHaveBeenCalled();
      });

      it('should handle Supabase errors', async () => {
        const mockChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Database error' }
          }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'CREATE',
          entity: 'match',
          operation: 'create_match',
          payload: {
            club_id: 'club123',
            player1_id: 'player1',
            scores: '6-4,6-3',
            match_type: 'singles',
            date: '2025-01-01'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await createMatchStrategy.execute(operation);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Database error');
        expect(result.shouldRetry).toBe(true);
      });
    });

    describe('update_match strategy', () => {
      it('should validate required id field', () => {
        expect(updateMatchStrategy.validate!({
          id: 'match123',
          scores: '6-4,6-3'
        })).toBe(true);

        expect(updateMatchStrategy.validate!({
          scores: '6-4,6-3'
        })).toBe(false);
      });

      it('should successfully update match in Supabase', async () => {
        const mockData = { id: 'match123', scores: '6-4,6-3' };
        const mockChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'UPDATE',
          entity: 'match',
          operation: 'update_match',
          payload: {
            id: 'match123',
            scores: '6-4,6-3',
            notes: 'Updated notes'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await updateMatchStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(mockChain.update).toHaveBeenCalledWith(
          expect.objectContaining({
            scores: '6-4,6-3',
            notes: 'Updated notes',
            updated_at: expect.any(String)
          })
        );
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'match123');
      });
    });

    describe('delete_match strategy', () => {
      it('should validate required id field', () => {
        expect(deleteMatchStrategy.validate!({ id: 'match123' })).toBe(true);
        expect(deleteMatchStrategy.validate!({})).toBe(false);
      });

      it('should successfully delete match from Supabase', async () => {
        const mockChain = {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'DELETE',
          entity: 'match',
          operation: 'delete_match',
          payload: { id: 'match123' },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await deleteMatchStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(mockChain.delete).toHaveBeenCalled();
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'match123');
      });
    });
  });

  describe('Club Sync Strategies', () => {
    const joinClubStrategy = clubSyncStrategies.find(s => s.operation === 'join_club')!;
    const leaveClubStrategy = clubSyncStrategies.find(s => s.operation === 'leave_club')!;

    describe('join_club strategy', () => {
      it('should validate required fields', () => {
        expect(joinClubStrategy.validate!({
          club_id: 'club123',
          user_id: 'user123'
        })).toBe(true);

        expect(joinClubStrategy.validate!({
          club_id: 'club123'
        })).toBe(false);

        expect(joinClubStrategy.validate!({
          user_id: 'user123'
        })).toBe(false);
      });

      it('should successfully join club in Supabase', async () => {
        const mockData = { id: 'membership123', club_id: 'club123', user_id: 'user123' };
        const mockChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'CREATE',
          entity: 'club',
          operation: 'join_club',
          payload: {
            club_id: 'club123',
            user_id: 'user123'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await joinClubStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(mockSupabase.from).toHaveBeenCalledWith('club_members');
        expect(mockChain.insert).toHaveBeenCalledWith({
          club_id: 'club123',
          user_id: 'user123',
          joined_at: expect.any(String),
          role: 'member',
        });
      });
    });

    describe('leave_club strategy', () => {
      it('should successfully leave club in Supabase', async () => {
        const mockChain = {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
        
        // Mock chained eq calls
        mockChain.eq.mockReturnValueOnce(mockChain);
        mockChain.eq.mockResolvedValueOnce({ error: null });
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'DELETE',
          entity: 'club',
          operation: 'leave_club',
          payload: {
            club_id: 'club123',
            user_id: 'user123'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await leaveClubStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('club_members');
        expect(mockChain.eq).toHaveBeenCalledWith('club_id', 'club123');
        expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user123');
      });
    });
  });

  describe('User Sync Strategies', () => {
    const updateProfileStrategy = userSyncStrategies.find(s => s.operation === 'update_profile')!;

    describe('update_profile strategy', () => {
      it('should validate required id field', () => {
        expect(updateProfileStrategy.validate!({ id: 'user123' })).toBe(true);
        expect(updateProfileStrategy.validate!({})).toBe(false);
      });

      it('should successfully update profile in Supabase', async () => {
        const mockData = { id: 'user123', name: 'Updated Name' };
        const mockChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'UPDATE',
          entity: 'user',
          operation: 'update_profile',
          payload: {
            id: 'user123',
            name: 'Updated Name',
            email: 'newemail@example.com'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await updateProfileStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(mockSupabase.from).toHaveBeenCalledWith('users');
        expect(mockChain.update).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Name',
            email: 'newemail@example.com',
            updated_at: expect.any(String)
          })
        );
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'user123');
      });
    });
  });

  describe('Challenge Sync Strategies', () => {
    const createChallengeStrategy = challengeSyncStrategies.find(s => s.operation === 'create_challenge')!;
    const respondChallengeStrategy = challengeSyncStrategies.find(s => s.operation === 'respond_challenge')!;

    describe('create_challenge strategy', () => {
      it('should validate required fields', () => {
        expect(createChallengeStrategy.validate!({
          challenger_id: 'user1',
          challenged_id: 'user2',
          club_id: 'club123'
        })).toBe(true);

        expect(createChallengeStrategy.validate!({
          challenger_id: 'user1',
          challenged_id: 'user2'
        })).toBe(false);
      });

      it('should successfully create challenge in Supabase', async () => {
        const mockData = { 
          id: 'challenge123', 
          challenger_id: 'user1', 
          challenged_id: 'user2',
          status: 'pending'
        };
        const mockChain = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'CREATE',
          entity: 'challenge',
          operation: 'create_challenge',
          payload: {
            challenger_id: 'user1',
            challenged_id: 'user2',
            club_id: 'club123',
            message: 'Let\'s play!'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await createChallengeStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(mockSupabase.from).toHaveBeenCalledWith('challenges');
        expect(mockChain.insert).toHaveBeenCalledWith({
          challenger_id: 'user1',
          challenged_id: 'user2',
          club_id: 'club123',
          message: 'Let\'s play!',
          created_at: expect.any(String),
          status: 'pending',
        });
      });
    });

    describe('respond_challenge strategy', () => {
      it('should validate required fields', () => {
        expect(respondChallengeStrategy.validate!({
          challenge_id: 'challenge123',
          response: 'accepted'
        })).toBe(true);

        expect(respondChallengeStrategy.validate!({
          challenge_id: 'challenge123'
        })).toBe(false);

        expect(respondChallengeStrategy.validate!({
          response: 'accepted'
        })).toBe(false);
      });

      it('should successfully respond to challenge in Supabase', async () => {
        const mockData = { 
          id: 'challenge123', 
          status: 'accepted',
          responded_at: expect.any(String)
        };
        const mockChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        };
        
        mockSupabase.from.mockReturnValue(mockChain as any);

        const operation: QueueOperation = {
          id: 'op123',
          type: 'UPDATE',
          entity: 'challenge',
          operation: 'respond_challenge',
          payload: {
            challenge_id: 'challenge123',
            response: 'accepted',
            responded_at: '2025-01-01T12:00:00Z'
          },
          status: 'PROCESSING',
          retryCount: 0,
          maxRetries: 5,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const result = await respondChallengeStrategy.execute(operation);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockData);
        expect(mockSupabase.from).toHaveBeenCalledWith('challenges');
        expect(mockChain.update).toHaveBeenCalledWith({
          status: 'accepted',
          responded_at: '2025-01-01T12:00:00Z',
        });
        expect(mockChain.eq).toHaveBeenCalledWith('id', 'challenge123');
      });
    });
  });

  describe('getAllSyncStrategies', () => {
    it('should return all strategies combined', () => {
      const allStrategies = getAllSyncStrategies();
      
      expect(allStrategies).toHaveLength(
        matchSyncStrategies.length + 
        clubSyncStrategies.length + 
        userSyncStrategies.length + 
        challengeSyncStrategies.length
      );

      // Check that we have strategies for all main operations
      const operationNames = allStrategies.map(s => s.operation);
      expect(operationNames).toContain('create_match');
      expect(operationNames).toContain('update_match');
      expect(operationNames).toContain('delete_match');
      expect(operationNames).toContain('join_club');
      expect(operationNames).toContain('leave_club');
      expect(operationNames).toContain('update_profile');
      expect(operationNames).toContain('create_challenge');
      expect(operationNames).toContain('respond_challenge');
    });

    it('should have unique entity:operation combinations', () => {
      const allStrategies = getAllSyncStrategies();
      const combinations = allStrategies.map(s => `${s.entity}:${s.operation}`);
      const uniqueCombinations = [...new Set(combinations)];
      
      expect(combinations).toHaveLength(uniqueCombinations.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockChain = {
        insert: jest.fn().mockRejectedValue(new Error('Network error')),
      };
      
      mockSupabase.from.mockReturnValue(mockChain as any);

      const operation: QueueOperation = {
        id: 'op123',
        type: 'CREATE',
        entity: 'match',
        operation: 'create_match',
        payload: {
          club_id: 'club123',
          player1_id: 'player1',
          scores: '6-4,6-3',
          match_type: 'singles',
          date: '2025-01-01'
        },
        status: 'PROCESSING',
        retryCount: 0,
        maxRetries: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const createMatchStrategy = matchSyncStrategies.find(s => s.operation === 'create_match')!;
      const result = await createMatchStrategy.execute(operation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.shouldRetry).toBe(true);
    });

    it('should handle unexpected data types gracefully', async () => {
      const createMatchStrategy = matchSyncStrategies.find(s => s.operation === 'create_match')!;
      
      const operation: QueueOperation = {
        id: 'op123',
        type: 'CREATE',
        entity: 'match',
        operation: 'create_match',
        payload: null, // Invalid payload
        status: 'PROCESSING',
        retryCount: 0,
        maxRetries: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await createMatchStrategy.execute(operation);

      expect(result.success).toBe(false);
      expect(result.shouldRetry).toBe(true);
    });
  });
});