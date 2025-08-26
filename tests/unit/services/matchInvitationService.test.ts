import { matchInvitationService, CreateInvitationData } from '../../../services/matchInvitationService';
import { supabase } from '../../../lib/supabase';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

describe('MatchInvitationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  describe('createInvitation', () => {
    it('should create a match invitation with correct data structure', async () => {
      const mockInvitation = {
        id: 'test-id',
        club_id: 'test-club-id',
        creator_id: 'test-user-id',
        match_type: 'singles',
        date: '2025-08-26',
        status: 'active',
        created_at: new Date().toISOString(),
      };

      mockSupabaseChain.single.mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const invitationData: CreateInvitationData = {
        club_id: 'test-club-id',
        creator_id: 'test-user-id',
        match_type: 'singles',
        date: '2025-08-26',
        time: '10:00',
        location: 'Court 1',
        notes: 'Let\'s play!',
      };

      const result = await matchInvitationService.createInvitation(invitationData);

      expect(supabase.from).toHaveBeenCalledWith('match_invitations');
      expect(mockSupabaseChain.insert).toHaveBeenCalled();
      expect(mockSupabaseChain.select).toHaveBeenCalled();
      expect(mockSupabaseChain.single).toHaveBeenCalled();
      expect(result).toEqual(mockInvitation);
    });

    it('should handle database errors during creation', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const invitationData: CreateInvitationData = {
        club_id: 'test-club-id',
        creator_id: 'test-user-id',
        match_type: 'singles',
        date: '2025-08-26',
      };

      await expect(
        matchInvitationService.createInvitation(invitationData)
      ).rejects.toThrow('Failed to create match invitation: Database error');
    });
  });

  describe('getClubInvitations', () => {
    it('should retrieve invitations for a club', async () => {
      const mockInvitations = [
        {
          id: 'inv-1',
          club_id: 'test-club-id',
          creator_id: 'user-1',
          match_type: 'singles',
          date: '2025-08-26',
          status: 'active',
          users: { full_name: 'John Doe' }
        }
      ];

      mockSupabaseChain.order = jest.fn().mockResolvedValue({
        data: mockInvitations,
        error: null,
      });

      const result = await matchInvitationService.getClubInvitations('test-club-id');

      expect(supabase.from).toHaveBeenCalledWith('match_invitations');
      expect(mockSupabaseChain.select).toHaveBeenCalled();
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('club_id', 'test-club-id');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('status', 'active');
      expect(result).toHaveLength(1);
      expect(result[0].creator_name).toBe('John Doe');
    });
  });

  describe('respondToInvitation', () => {
    it('should create a response to an invitation', async () => {
      const mockResponse = {
        id: 'response-1',
        invitation_id: 'inv-1',
        user_id: 'user-2',
        status: 'interested',
        message: 'Count me in!',
        created_at: new Date().toISOString(),
      };

      mockSupabaseChain.single.mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await matchInvitationService.respondToInvitation(
        'inv-1',
        'user-2',
        'interested',
        'Count me in!'
      );

      expect(supabase.from).toHaveBeenCalledWith('invitation_responses');
      expect(mockSupabaseChain.insert).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});