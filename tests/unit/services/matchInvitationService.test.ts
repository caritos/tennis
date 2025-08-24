import { matchInvitationService } from '../../../services/matchInvitationService';
import { supabase } from '../../../lib/supabase';

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockSupabaseChain = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
};

const mockInvitation = {
  id: 'invitation-1',
  matchId: 'match-1',
  inviterId: 'user-1',
  inviteeId: 'user-2',
  status: 'pending',
  message: 'Let\'s play tennis!',
  createdAt: '2024-01-15T10:00:00Z',
};

const mockMatch = {
  id: 'match-1',
  clubId: 'club-1',
  player1Id: 'user-1',
  player2Id: null,
  scheduledAt: '2024-01-20T14:00:00Z',
  matchType: 'singles',
};

describe('matchInvitationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue(mockSupabaseChain);
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('createInvitation', () => {
    it('creates a match invitation successfully', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const result = await matchInvitationService.createInvitation({
        matchId: 'match-1',
        inviteeId: 'user-2',
        message: 'Let\'s play tennis!',
      });

      expect(supabase.from).toHaveBeenCalledWith('match_invitations');
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith({
        matchId: 'match-1',
        inviterId: 'user-1',
        inviteeId: 'user-2',
        message: 'Let\'s play tennis!',
        status: 'pending',
      });
      expect(result).toEqual(mockInvitation);
    });

    it('throws error when user is not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        matchInvitationService.createInvitation({
          matchId: 'match-1',
          inviteeId: 'user-2',
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('handles database errors', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        matchInvitationService.createInvitation({
          matchId: 'match-1',
          inviteeId: 'user-2',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('acceptInvitation', () => {
    it('accepts an invitation successfully', async () => {
      const acceptedInvitation = { ...mockInvitation, status: 'accepted' };
      
      mockSupabaseChain.single.mockResolvedValue({
        data: acceptedInvitation,
        error: null,
      });

      const result = await matchInvitationService.acceptInvitation('invitation-1');

      expect(supabase.from).toHaveBeenCalledWith('match_invitations');
      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        status: 'accepted',
        respondedAt: expect.any(String),
      });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'invitation-1');
      expect(result).toEqual(acceptedInvitation);
    });

    it('handles acceptance errors', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: { message: 'Failed to accept invitation' },
      });

      await expect(
        matchInvitationService.acceptInvitation('invitation-1')
      ).rejects.toThrow('Failed to accept invitation');
    });
  });

  describe('declineInvitation', () => {
    it('declines an invitation successfully', async () => {
      const declinedInvitation = { ...mockInvitation, status: 'declined' };
      
      mockSupabaseChain.single.mockResolvedValue({
        data: declinedInvitation,
        error: null,
      });

      const result = await matchInvitationService.declineInvitation('invitation-1', 'Not available');

      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        status: 'declined',
        declineReason: 'Not available',
        respondedAt: expect.any(String),
      });
      expect(result).toEqual(declinedInvitation);
    });

    it('declines without reason', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: { ...mockInvitation, status: 'declined' },
        error: null,
      });

      await matchInvitationService.declineInvitation('invitation-1');

      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        status: 'declined',
        declineReason: null,
        respondedAt: expect.any(String),
      });
    });
  });

  describe('getUserInvitations', () => {
    const mockInvitations = [
      { ...mockInvitation, id: 'inv-1' },
      { ...mockInvitation, id: 'inv-2', status: 'accepted' },
    ];

    it('gets received invitations', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: mockInvitations,
        error: null,
      });

      const result = await matchInvitationService.getUserInvitations('received');

      expect(mockSupabaseChain.select).toHaveBeenCalledWith(`
        *,
        match:matches(*),
        inviter:users!inviterId(id, name, email)
      `);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('inviteeId', 'user-1');
      expect(result).toEqual(mockInvitations);
    });

    it('gets sent invitations', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: mockInvitations,
        error: null,
      });

      const result = await matchInvitationService.getUserInvitations('sent');

      expect(mockSupabaseChain.select).toHaveBeenCalledWith(`
        *,
        match:matches(*),
        invitee:users!inviteeId(id, name, email)
      `);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('inviterId', 'user-1');
      expect(result).toEqual(mockInvitations);
    });

    it('filters by status', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: [mockInvitations[0]],
        error: null,
      });

      await matchInvitationService.getUserInvitations('received', 'pending');

      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('handles database errors', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        matchInvitationService.getUserInvitations('received')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getInvitationById', () => {
    it('gets invitation by ID', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: mockInvitation,
        error: null,
      });

      const result = await matchInvitationService.getInvitationById('invitation-1');

      expect(mockSupabaseChain.select).toHaveBeenCalledWith(`
        *,
        match:matches(*),
        inviter:users!inviterId(id, name, email),
        invitee:users!inviteeId(id, name, email)
      `);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'invitation-1');
      expect(result).toEqual(mockInvitation);
    });

    it('returns null when invitation not found', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await matchInvitationService.getInvitationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('cancelInvitation', () => {
    it('cancels an invitation successfully', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: { ...mockInvitation, status: 'cancelled' },
        error: null,
      });

      const result = await matchInvitationService.cancelInvitation('invitation-1');

      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        status: 'cancelled',
        cancelledAt: expect.any(String),
      });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'invitation-1');
    });

    it('only allows inviter to cancel', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: null,
        error: null,
      });

      // Get invitation first to check ownership
      const getChain = { ...mockSupabaseChain };
      getChain.single.mockResolvedValue({
        data: { ...mockInvitation, inviterId: 'other-user' },
        error: null,
      });

      await expect(
        matchInvitationService.cancelInvitation('invitation-1')
      ).rejects.toThrow('Not authorized to cancel this invitation');
    });
  });

  describe('getMatchInvitations', () => {
    it('gets all invitations for a match', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: [mockInvitation],
        error: null,
      });

      const result = await matchInvitationService.getMatchInvitations('match-1');

      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('matchId', 'match-1');
      expect(result).toEqual([mockInvitation]);
    });
  });

  describe('hasUserRespondedToInvitation', () => {
    it('returns true when user has responded', async () => {
      mockSupabaseChain.maybeSingle.mockResolvedValue({
        data: { ...mockInvitation, status: 'accepted' },
        error: null,
      });

      const result = await matchInvitationService.hasUserRespondedToInvitation(
        'invitation-1',
        'user-2'
      );

      expect(result).toBe(true);
    });

    it('returns false when user has not responded', async () => {
      mockSupabaseChain.maybeSingle.mockResolvedValue({
        data: { ...mockInvitation, status: 'pending' },
        error: null,
      });

      const result = await matchInvitationService.hasUserRespondedToInvitation(
        'invitation-1',
        'user-2'
      );

      expect(result).toBe(false);
    });

    it('returns false when invitation not found', async () => {
      mockSupabaseChain.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await matchInvitationService.hasUserRespondedToInvitation(
        'nonexistent',
        'user-2'
      );

      expect(result).toBe(false);
    });
  });

  describe('getPendingInvitationsCount', () => {
    it('returns count of pending invitations', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: { count: 5 },
        error: null,
      });

      const result = await matchInvitationService.getPendingInvitationsCount();

      expect(mockSupabaseChain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('inviteeId', 'user-1');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('status', 'pending');
      expect(result).toBe(5);
    });

    it('returns 0 when no pending invitations', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: { count: 0 },
        error: null,
      });

      const result = await matchInvitationService.getPendingInvitationsCount();

      expect(result).toBe(0);
    });
  });

  describe('expireOldInvitations', () => {
    it('expires old pending invitations', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: { count: 3 },
        error: null,
      });

      const result = await matchInvitationService.expireOldInvitations();

      expect(mockSupabaseChain.update).toHaveBeenCalledWith({
        status: 'expired',
        expiredAt: expect.any(String),
      });
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('status', 'pending');
      expect(result).toBe(3);
    });

    it('handles no expired invitations', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: { count: 0 },
        error: null,
      });

      const result = await matchInvitationService.expireOldInvitations();

      expect(result).toBe(0);
    });
  });

  describe('error handling', () => {
    it('handles network errors gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(
        matchInvitationService.createInvitation({
          matchId: 'match-1',
          inviteeId: 'user-2',
        })
      ).rejects.toThrow('Network error');
    });

    it('handles malformed responses', async () => {
      mockSupabaseChain.single.mockResolvedValue({
        data: undefined,
        error: null,
      });

      await expect(
        matchInvitationService.getInvitationById('invitation-1')
      ).resolves.toBeNull();
    });
  });
});