import { initializeDatabase } from '@/database/database';
import { useAuth } from '@/contexts/AuthContext';

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
  private db: any = null;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB() {
    try {
      this.db = await initializeDatabase();
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize safety service database:', error);
    }
  }

  private async createTables() {
    if (!this.db) return;

    try {
      // Reports table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          reporter_id TEXT NOT NULL,
          reported_user_id TEXT NOT NULL,
          report_type TEXT NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate', 'fake_profile', 'other')),
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          reviewed_at DATETIME,
          reviewed_by TEXT,
          resolution TEXT,
          FOREIGN KEY (reporter_id) REFERENCES users (id),
          FOREIGN KEY (reported_user_id) REFERENCES users (id)
        );
      `);

      // Blocked users table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS blocked_users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          blocker_id TEXT NOT NULL,
          blocked_user_id TEXT NOT NULL,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (blocker_id) REFERENCES users (id),
          FOREIGN KEY (blocked_user_id) REFERENCES users (id),
          UNIQUE(blocker_id, blocked_user_id)
        );
      `);

      // Indexes for performance
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
        CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);
        CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
        CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
        CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_user_id);
      `);

      console.log('Safety service tables created successfully');
    } catch (error) {
      console.error('Failed to create safety service tables:', error);
    }
  }

  // Report Management
  async submitReport(reportData: {
    reporterId: string;
    reportedUserId: string;
    reportType: ReportData['reportType'];
    description: string;
  }): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO reports (reporter_id, reported_user_id, report_type, description)
         VALUES (?, ?, ?, ?)`,
        [reportData.reporterId, reportData.reportedUserId, reportData.reportType, reportData.description]
      );

      // In a real app, this would also:
      // 1. Send notification to moderation team
      // 2. Log safety event for analytics
      // 3. Check for patterns (multiple reports on same user)
      
      console.log('Report submitted successfully:', result.lastInsertRowId);
      return result.lastInsertRowId?.toString() || '';
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw new Error('Failed to submit report');
    }
  }

  async getUserReports(userId: string): Promise<ReportData[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync(
        `SELECT 
           r.*,
           u.full_name as reported_user_name
         FROM reports r
         LEFT JOIN users u ON r.reported_user_id = u.id
         WHERE r.reporter_id = ?
         ORDER BY r.created_at DESC`,
        [userId]
      );

      return result.map((row: any) => ({
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
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO blocked_users (blocker_id, blocked_user_id, reason)
         VALUES (?, ?, ?)`,
        [blockerId, blockedUserId, reason || null]
      );

      console.log('User blocked successfully');
    } catch (error) {
      console.error('Failed to block user:', error);
      throw new Error('Failed to block user');
    }
  }

  async unblockUser(blockerId: string, blockedUserId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        `DELETE FROM blocked_users 
         WHERE blocker_id = ? AND blocked_user_id = ?`,
        [blockerId, blockedUserId]
      );

      console.log('User unblocked successfully');
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw new Error('Failed to unblock user');
    }
  }

  async isUserBlocked(blockerId: string, blockedUserId: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const result = await this.db.getFirstAsync(
        `SELECT id FROM blocked_users 
         WHERE blocker_id = ? AND blocked_user_id = ?`,
        [blockerId, blockedUserId]
      );

      return !!result;
    } catch (error) {
      console.error('Failed to check if user is blocked:', error);
      return false;
    }
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync(
        `SELECT 
           bu.*,
           u.full_name as blocked_user_name
         FROM blocked_users bu
         LEFT JOIN users u ON bu.blocked_user_id = u.id
         WHERE bu.blocker_id = ?
         ORDER BY bu.created_at DESC`,
        [userId]
      );

      return result.map((row: any) => ({
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
    if (!this.db) return false;

    try {
      const result = await this.db.getFirstAsync(
        `SELECT id FROM blocked_users 
         WHERE blocker_id = ? AND blocked_user_id = ?`,
        [potentialBlockerId, userId]
      );

      return !!result;
    } catch (error) {
      console.error('Failed to check if blocked by user:', error);
      return false;
    }
  }

  // Utility function to filter out blocked users from lists
  async filterBlockedUsers(currentUserId: string, userIds: string[]): Promise<string[]> {
    if (!this.db || userIds.length === 0) return userIds;

    try {
      const placeholders = userIds.map(() => '?').join(',');
      const result = await this.db.getAllAsync(
        `SELECT blocked_user_id FROM blocked_users 
         WHERE blocker_id = ? AND blocked_user_id IN (${placeholders})
         UNION
         SELECT blocker_id FROM blocked_users 
         WHERE blocked_user_id = ? AND blocker_id IN (${placeholders})`,
        [currentUserId, ...userIds, currentUserId, ...userIds]
      );

      const blockedUserIds = new Set(result.map((row: any) => row.blocked_user_id || row.blocker_id));
      return userIds.filter(id => !blockedUserIds.has(id));
    } catch (error) {
      console.error('Failed to filter blocked users:', error);
      return userIds; // Return original list if filtering fails
    }
  }

  // Admin functions (for future moderation dashboard)
  async getPendingReports(): Promise<ReportData[]> {
    if (!this.db) return [];

    try {
      const result = await this.db.getAllAsync(
        `SELECT 
           r.*,
           reporter.full_name as reporter_name,
           reported.full_name as reported_user_name
         FROM reports r
         LEFT JOIN users reporter ON r.reporter_id = reporter.id
         LEFT JOIN users reported ON r.reported_user_id = reported.id
         WHERE r.status = 'pending'
         ORDER BY r.created_at ASC`
      );

      return result.map((row: any) => ({
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
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        `UPDATE reports 
         SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?, resolution = ?
         WHERE id = ?`,
        [status, reviewerId, resolution || null, reportId]
      );

      console.log('Report status updated successfully');
    } catch (error) {
      console.error('Failed to update report status:', error);
      throw new Error('Failed to update report status');
    }
  }
}

export const safetyService = new SafetyService();