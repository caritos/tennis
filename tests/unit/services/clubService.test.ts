import clubService, { CreateClubData } from '@/services/clubService';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/utils/uuid', () => ({
  generateUUID: () => 'test-club-id-123',
}));

describe('ClubService - Table Name Verification', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockDelete = jest.fn();
  const mockSingle = jest.fn();
  const mockEq = jest.fn();
  const mockNeq = jest.fn();
  const mockAuth = {
    getUser: jest.fn(),
    getSession: jest.fn()
  };
  const mockRpc = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock chain
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      delete: mockDelete
    });
    
    mockInsert.mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: mockSingle
      })
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
      count: jest.fn()
    });
    
    mockDelete.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: mockEq
      })
    });
    
    mockEq.mockReturnValue({
      single: mockSingle,
      eq: mockEq,
      neq: mockNeq
    });
    
    mockNeq.mockReturnThis();
    
    mockSingle.mockResolvedValue({
      data: { id: 'test-id' },
      error: null
    });
    
    // Mock auth
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null
    });
    
    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id', role: 'authenticated' } } },
      error: null
    });
    
    // Mock RPC
    mockRpc.mockResolvedValue({
      data: { count: 1 },
      error: null
    });
    
    // Apply mocks
    mockSupabase.from = mockFrom;
    mockSupabase.auth = mockAuth as any;
    mockSupabase.rpc = mockRpc;
  });

  describe('Table name verification for club_members', () => {
    it('should use "club_members" table when creating a club', async () => {
      const clubData: CreateClubData = {
        name: 'Test Club',
        description: 'Test Description',
        location: 'Test Location',
        lat: 40.7128,
        lng: -74.0060,
        creator_id: 'test-user-id'
      };

      // Mock successful responses
      mockSingle.mockResolvedValueOnce({ data: { id: 'test-user-id' }, error: null }); // User check
      mockSingle.mockResolvedValueOnce({ 
        data: { 
          id: 'test-club-id-123',
          name: 'Test Club',
          description: 'Test Description',
          location: 'Test Location',
          lat: 40.7128,
          lng: -74.0060,
          creator_id: 'test-user-id',
          created_at: new Date().toISOString()
        }, 
        error: null 
      }); // Club creation
      
      mockInsert.mockReturnValueOnce({ error: null }); // Member insert

      await clubService.createClub(clubData);

      // Verify that club_members table is used, not club_memberships
      const fromCalls = mockFrom.mock.calls;
      const tableCalls = fromCalls.map(call => call[0]);
      
      expect(tableCalls).toContain('club_members');
      expect(tableCalls).not.toContain('club_memberships');
    });

    it('should use "club_members" table when joining a club', async () => {
      mockInsert.mockReturnValueOnce({ error: null });

      await clubService.joinClub('test-club-id', 'test-user-id');

      // Verify correct table name
      expect(mockFrom).toHaveBeenCalledWith('club_members');
      expect(mockFrom).not.toHaveBeenCalledWith('club_memberships');
    });

    it('should use "club_members" table when leaving a club', async () => {
      mockDelete.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      await clubService.leaveClub('test-club-id', 'test-user-id');

      // Verify correct table name
      expect(mockFrom).toHaveBeenCalledWith('club_members');
      expect(mockFrom).not.toHaveBeenCalledWith('club_memberships');
    });

    it('should use "club_members" table when getting user clubs', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: [{
            clubs: {
              id: 'test-club-id',
              name: 'Test Club',
              description: 'Test Description',
              location: 'Test Location',
              lat: 40.7128,
              lng: -74.0060,
              creator_id: 'test-user-id',
              created_at: new Date().toISOString()
            }
          }],
          error: null
        })
      });

      await clubService.getUserClubs('test-user-id');

      // Verify correct table name
      expect(mockFrom).toHaveBeenCalledWith('club_members');
      expect(mockFrom).not.toHaveBeenCalledWith('club_memberships');
    });

    it('should use "club_members" table when checking membership', async () => {
      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { club_id: 'test-club-id' }, error: null })
          })
        })
      });

      await clubService.isClubMember('test-club-id', 'test-user-id');

      // Verify correct table name
      expect(mockFrom).toHaveBeenCalledWith('club_members');
      expect(mockFrom).not.toHaveBeenCalledWith('club_memberships');
    });
  });

  describe('Error detection for wrong table names', () => {
    it('should fail if attempting to use club_memberships table', () => {
      // This test ensures that if someone accidentally changes the table name back,
      // the test will catch it
      const tableNames = [];
      mockFrom.mockImplementation((tableName) => {
        tableNames.push(tableName);
        return {
          insert: mockInsert,
          select: mockSelect,
          delete: mockDelete
        };
      });

      // Run a function that uses the table
      clubService.getUserClubs('test-user-id').catch(() => {});

      // Verify no calls to the old table name
      expect(tableNames).not.toContain('club_memberships');
      expect(tableNames.some(name => name === 'club_members')).toBeTruthy();
    });
  });

  describe('Integration with Supabase error responses', () => {
    it('should handle table not found errors appropriately', async () => {
      // Simulate the error we encountered in issue #122
      const tableNotFoundError = {
        code: 'PGRST205',
        details: null,
        hint: "Perhaps you meant the table 'public.club_members'",
        message: "Could not find the table 'public.club_memberships' in the schema cache"
      };

      mockSelect.mockReturnValueOnce({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: tableNotFoundError
        })
      });

      await expect(clubService.getUserClubs('test-user-id')).rejects.toThrow();

      // Verify we're using the correct table name
      expect(mockFrom).toHaveBeenCalledWith('club_members');
    });
  });
});

describe('ClubService - Full functionality tests', () => {
  const mockSupabase = supabase as jest.Mocked<typeof supabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup more complete mocks for full functionality tests
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'test-user-id' },
                error: null
              })
            })
          })
        } as any;
      }
      
      if (table === 'clubs') {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'test-club-id-123',
                  name: 'Test Club',
                  description: 'Test Description',
                  location: 'Test Location',
                  lat: 40.7128,
                  lng: -74.0060,
                  creator_id: 'test-user-id',
                  created_at: new Date().toISOString()
                },
                error: null
              })
            })
          }),
          select: jest.fn().mockResolvedValue({
            data: [{
              id: 'test-club-1',
              name: 'Club 1',
              lat: 40.7128,
              lng: -74.0060
            }],
            error: null
          })
        } as any;
      }
      
      if (table === 'club_members') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null })
            })
          }),
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{
                clubs: {
                  id: 'test-club-id',
                  name: 'Test Club'
                }
              }],
              error: null
            })
          })
        } as any;
      }

      return {} as any;
    });

    mockSupabase.auth = {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id', role: 'authenticated' } } },
        error: null
      })
    } as any;

    mockSupabase.rpc = jest.fn().mockResolvedValue({
      data: { count: 1 },
      error: null
    });
  });

  it('should successfully create a club and add creator as member', async () => {
    const clubData: CreateClubData = {
      name: 'Test Club',
      description: 'Test Description',
      location: 'Test Location',
      lat: 40.7128,
      lng: -74.0060,
      creator_id: 'test-user-id'
    };

    const result = await clubService.createClub(clubData);

    expect(result).toBeTruthy();
    expect(result.id).toBe('test-club-id-123');
    expect(result.name).toBe('Test Club');

    // Verify tables used
    const fromCalls = (mockSupabase.from as jest.Mock).mock.calls.map(call => call[0]);
    expect(fromCalls).toEqual(['users', 'clubs', 'club_members']);
  });
});