import { SQLiteDatabase } from 'expo-sqlite';

interface QueryCache {
  [key: string]: {
    result: any;
    timestamp: number;
    ttl: number;
  };
}

export class QueryOptimizer {
  private cache: QueryCache = {};
  private db: SQLiteDatabase;

  constructor(database: SQLiteDatabase) {
    this.db = database;
  }

  // Create indexes for frequently queried columns
  async createPerformanceIndexes() {
    try {
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_matches_player ON matches(player1_id, player2_id)',
        'CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date DESC)',
        'CREATE INDEX IF NOT EXISTS idx_matches_club ON matches(club_id)',
        'CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id)',
        'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read)',
      ];

      for (const index of indexes) {
        await this.db.execAsync(index);
      }
      console.log('✅ Performance indexes created successfully');
    } catch (error) {
      console.warn('⚠️ Failed to create some performance indexes:', error);
      // Don't throw - indexes are optional for functionality
    }
  }

  // Cached query execution
  async cachedQuery<T>(
    sql: string,
    params: any[] = [],
    ttlSeconds: number = 60
  ): Promise<T[]> {
    const cacheKey = `${sql}-${JSON.stringify(params)}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result;
    }

    const result = await this.db.getAllAsync(sql, params);
    
    this.cache[cacheKey] = {
      result,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };

    // Cleanup old cache entries
    this.cleanupCache();

    return result as T[];
  }

  // Batch insert optimization
  async batchInsert(table: string, records: any[]) {
    if (records.length === 0) return;

    const columns = Object.keys(records[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    await this.db.execAsync('BEGIN TRANSACTION');
    
    try {
      for (const record of records) {
        const values = columns.map(col => record[col]);
        await this.db.runAsync(sql, values);
      }
      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      throw error;
    }
  }

  // Query plan analysis
  async analyzeQuery(sql: string): Promise<string[]> {
    const result = await this.db.getAllAsync(`EXPLAIN QUERY PLAN ${sql}`);
    return result.map((row: any) => row.detail);
  }

  private cleanupCache() {
    const now = Date.now();
    for (const key in this.cache) {
      const entry = this.cache[key];
      if (now - entry.timestamp > entry.ttl) {
        delete this.cache[key];
      }
    }
  }

  // Clear cache
  clearCache() {
    this.cache = {};
  }
}

export default QueryOptimizer;