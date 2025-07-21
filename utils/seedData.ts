import { initializeDatabase } from '../database/database';

export async function seedSampleClubs(): Promise<void> {
  try {
    console.log('Initializing database...');
    const db = await initializeDatabase();
    console.log('Database initialized successfully');

    // Check if we already have clubs
    console.log('Checking existing clubs...');
    const existingClubs = await db.getAllAsync('SELECT COUNT(*) as count FROM clubs') as any[];
    console.log('Existing clubs count:', existingClubs?.[0]?.count || 0);
    
    // Always clear and reseed for debugging
    console.log('Clearing existing data...');
    // Temporarily disable foreign key constraints
    await db.runAsync('PRAGMA foreign_keys = OFF');
    await db.runAsync('DELETE FROM clubs');
    await db.runAsync('DELETE FROM users');
    console.log('Cleared existing data');

    // First, create sample users (needed for foreign key constraints)
    const sampleUsers = [
      {
        id: 'sample_user_1',
        full_name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1234567890',
        role: 'player',
      },
      {
        id: 'sample_user_2',
        full_name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1234567891',
        role: 'player',
      },
      {
        id: 'sample_user_3',
        full_name: 'Charlie Brown',
        email: 'charlie@example.com',
        phone: '+1234567892',
        role: 'player',
      },
      {
        id: 'sample_user_4',
        full_name: 'Diana Wilson',
        email: 'diana@example.com',
        phone: '+1234567893',
        role: 'player',
      },
      {
        id: 'sample_user_5',
        full_name: 'Erik Davis',
        email: 'erik@example.com',
        phone: '+1234567894',
        role: 'player',
      },
    ];

    // Insert sample users first
    console.log('Inserting sample users...');
    for (const user of sampleUsers) {
      await db.runAsync(
        `INSERT OR REPLACE INTO users (id, full_name, email, phone, role, created_at) 
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
          user.id,
          user.full_name,
          user.email,
          user.phone,
          user.role,
        ]
      );
    }

    console.log(`Seeded ${sampleUsers.length} sample users`);

    const sampleClubs = [
    // San Francisco Bay Area clubs (since you're in SF)
    {
      id: 'club_sample_1',
      name: 'Golden Gate Park Tennis Club',
      description: 'Beautiful tennis courts with Golden Gate Park views',
      location: 'San Francisco, CA',
      lat: 37.7694,
      lng: -122.4862,
      creator_id: 'sample_user_1',
    },
    {
      id: 'club_sample_2',
      name: 'Marina District Tennis',
      description: 'Waterfront tennis with Bay Bridge views',
      location: 'San Francisco, CA',
      lat: 37.8044,
      lng: -122.4324,
      creator_id: 'sample_user_2',
    },
    {
      id: 'club_sample_3',
      name: 'Mission Bay Tennis Center',
      description: 'Modern courts in the heart of Mission Bay',
      location: 'San Francisco, CA',
      lat: 37.7706,
      lng: -122.3894,
      creator_id: 'sample_user_3',
    },
    {
      id: 'club_sample_4',
      name: 'Palo Alto Tennis Club',
      description: 'Silicon Valley tennis community with tech professionals',
      location: 'Palo Alto, CA',
      lat: 37.4419,
      lng: -122.1430,
      creator_id: 'sample_user_4',
    },
    {
      id: 'club_sample_5',
      name: 'Berkeley Hills Tennis',
      description: 'East Bay tennis with stunning hill views',
      location: 'Berkeley, CA',
      lat: 37.8715,
      lng: -122.2730,
      creator_id: 'sample_user_5',
    },
  ];

    console.log('Inserting sample clubs...');
    for (const club of sampleClubs) {
      console.log(`Inserting club: ${club.name}`);
      await db.runAsync(
        `INSERT OR REPLACE INTO clubs (id, name, description, location, lat, lng, creator_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          club.id,
          club.name,
          club.description,
          club.location,
          club.lat,
          club.lng,
          club.creator_id,
        ]
      );
    }

    console.log(`Seeded ${sampleClubs.length} sample clubs`);
    
    // Re-enable foreign key constraints
    await db.runAsync('PRAGMA foreign_keys = ON');
    console.log('Re-enabled foreign key constraints');
    
    // Verify the clubs were inserted
    const finalClubCount = await db.getAllAsync('SELECT COUNT(*) as count FROM clubs') as any[];
    console.log('Final clubs count in database:', finalClubCount?.[0]?.count || 0);
  } catch (error) {
    console.error('Failed to seed clubs:', error);
  }
}