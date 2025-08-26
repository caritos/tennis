import { supabase } from '@/lib/supabase';
import { generateUUID } from '@/utils/uuid';

export interface ReportData {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportType: 'spam' | 'harassment' | 'inappropriate' | 'fake_profile' | 'other';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  resolution?: string;
}

export interface BlockedUser {
  id: string;
  blockerId: string;
  blockedUserId: string;
  reason?: string;
  createdAt: string;
}

class SafetyService {
  // No local database needed - all operations go through Supabase

  // Report Management
  async submitReport(reportData: {
    reporterId: string;
    reportedUserId: string;
    reportType: ReportData['reportType'];
    description: string;
    matchId?: string;
    invitationId?: string;
    challengeId?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reportData.reporterId,
          reported_user_id: reportData.reportedUserId,
          report_type: reportData.reportType,
          description: reportData.description,
          match_id: reportData.matchId,
          invitation_id: reportData.invitationId,
          challenge_id: reportData.challengeId
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to submit report:', error);
        throw new Error('Failed to submit report');
      }

      // In a real app, this would also:
      // 1. Send notification to moderation team
      // 2. Log safety event for analytics
      // 3. Check for patterns (multiple reports on same user)
      
      console.log('Report submitted successfully:', data.id);
      return data.id;
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw new Error('Failed to submit report');
    }
  }

  async getUserReports(userId: string): Promise<ReportData[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reported_user:users!reports_reported_user_id_fkey(full_name)
        `)
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get user reports:', error);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        reporterId: row.reporter_id,
        reportedUserId: row.reported_user_id,
        reportType: row.report_type,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        resolution: row.resolution,
      }));
    } catch (error) {
      console.error('Failed to get user reports:', error);
      return [];
    }
  }

  // Block Management
  async blockUser(blockerId: string, blockedUserId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .upsert({
          blocker_id: blockerId,
          blocked_user_id: blockedUserId,
          reason: reason || null
        }, {
          onConflict: 'blocker_id,blocked_user_id'
        });

      if (error) {
        console.error('Failed to block user:', error);
        throw new Error('Failed to block user');
      }

      console.log('User blocked successfully');
    } catch (error) {
      console.error('Failed to block user:', error);
      throw new Error('Failed to block user');
    }
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_user_id', blockedUserId);

      if (error) {
        console.error('Failed to unblock user:', error);
        throw new Error('Failed to unblock user');
      }

      console.log('User unblocked successfully');
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw new Error('Failed to unblock user');
    }
  }

  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_user_id', blockedUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Failed to check if user is blocked:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Failed to check if user is blocked:', error);
      return false;
    }
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          *,
          blocked_user:users!blocked_users_blocked_user_id_fkey(full_name)
        `)
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get blocked users:', error);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        blockerId: row.blocker_id,
        blockedUserId: row.blocked_user_id,
        reason: row.reason,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      return [];
    }
  }

  // Check if user is blocked by another user (for filtering content)
  async isBlockedBy(userId: string, potentialBlockerId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', potentialBlockerId)
        .eq('blocked_user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Failed to check if blocked by user:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Failed to check if blocked by user:', error);
      return false;
    }
  }

  // Utility function to filter out blocked users from lists
  async filterBlockedUsers(currentUserId: string, userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return userIds;

    try {
      // Get users who blocked current user or are blocked by current user
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_user_id')
        .or(`blocker_id.eq.${currentUserId},blocked_user_id.eq.${currentUserId}`);

      if (error) {
        console.error('Failed to filter blocked users:', error);
        return userIds;
      }

      const blockedUserIds = new Set<string>();
      data.forEach((row: any) => {
        if (row.blocker_id === currentUserId) {
          blockedUserIds.add(row.blocked_user_id);
        } else if (row.blocked_user_id === currentUserId) {
          blockedUserIds.add(row.blocker_id);
        }
      });

      return userIds.filter(id => !blockedUserIds.has(id));
    } catch (error) {
      console.error('Failed to filter blocked users:', error);
      return userIds; // Return original list if filtering fails
    }
  }

  // Admin functions (for future moderation dashboard)
  async getPendingReports(): Promise<ReportData[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:users!reports_reporter_id_fkey(full_name),
          reported_user:users!reports_reported_user_id_fkey(full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to get pending reports:', error);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        reporterId: row.reporter_id,
        reportedUserId: row.reported_user_id,
        reportType: row.report_type,
        description: row.description,
        status: row.status,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at,
        reviewedBy: row.reviewed_by,
        resolution: row.resolution,
      }));
    } catch (error) {
      console.error('Failed to get pending reports:', error);
      return [];
    }
  }

  async updateReportStatus(
    reportId: string, 
    status: ReportData['status'], 
    reviewerId: string, 
    resolution?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          resolution: resolution || null
        })
        .eq('id', reportId);

      if (error) {
        console.error('Failed to update report status:', error);
        throw new Error('Failed to update report status');
      }

      console.log('Report status updated successfully');
    } catch (error) {
      console.error('Failed to update report status:', error);
      throw new Error('Failed to update report status');
    }
  }
}

export const safetyService = new SafetyService();