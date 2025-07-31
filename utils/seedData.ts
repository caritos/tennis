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
    
    // Only seed if we don't have clubs already
    if (existingClubs?.[0]?.count > 0) {
      console.log('Clubs already exist, skipping seeding');
      return;
    }
    
    console.log('Seeding new data...');
    // Temporarily disable foreign key constraints for this connection
    await db.runAsync('PRAGMA foreign_keys = OFF');
    console.log('Disabled foreign key constraints for seeding');

    // Clear any existing data first (if needed)
    await db.runAsync('DELETE FROM club_members');
    await db.runAsync('DELETE FROM clubs');
    await db.runAsync('DELETE FROM users');
    console.log('Cleared existing data');

    // First, create sample users (needed for foreign key constraints)
    const sampleUsers = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        full_name: 'Test User',
        email: 'testuser@example.com',
        phone: '+1234567899',
        role: 'player',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        full_name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1234567890',
        role: 'player',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        full_name: 'Bob Smith',
        email: 'bob@example.com',
        phone: '+1234567891',
        role: 'player',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        full_name: 'Charlie Brown',
        email: 'charlie@example.com',
        phone: '+1234567892',
        role: 'player',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440014',
        full_name: 'Diana Wilson',
        email: 'diana@example.com',
        phone: '+1234567893',
        role: 'player',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440015',
        full_name: 'Erik Davis',
        email: 'erik@example.com',
        phone: '+1234567894',
        role: 'player',
      },
    ];

    // Insert sample users first
    console.log('Inserting sample users...');
    for (const user of sampleUsers) {
      try {
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
        console.log(`✓ Inserted user: ${user.full_name}`);
      } catch (userError) {
        console.error(`✗ Failed to insert user ${user.full_name}:`, userError);
        throw userError;
      }
    }

    console.log(`Seeded ${sampleUsers.length} sample users`);

    const sampleClubs = [
    // Florida clubs
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Miami Beach Tennis Club',
      description: 'Oceanfront tennis with beautiful beach views',
      location: 'Miami Beach, FL',
      lat: 25.7907,
      lng: -80.1300,
      creator_id: '550e8400-e29b-41d4-a716-446655440011',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Orlando Tennis Academy',
      description: 'Premier tennis facility near theme parks',
      location: 'Orlando, FL',
      lat: 28.5383,
      lng: -81.3792,
      creator_id: '550e8400-e29b-41d4-a716-446655440012',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Tampa Bay Racquet Club',
      description: 'Year-round tennis in the sunshine state',
      location: 'Tampa, FL',
      lat: 27.9506,
      lng: -82.4572,
      creator_id: '550e8400-e29b-41d4-a716-446655440013',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440009',
      name: 'Jacksonville Tennis Center',
      description: 'North Florida\'s premier tennis destination',
      location: 'Jacksonville, FL',
      lat: 30.3322,
      lng: -81.6557,
      creator_id: '550e8400-e29b-41d4-a716-446655440014',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Fort Lauderdale Tennis Club',
      description: 'Tropical tennis paradise',
      location: 'Fort Lauderdale, FL',
      lat: 26.1224,
      lng: -80.1373,
      creator_id: '550e8400-e29b-41d4-a716-446655440015',
    },
    // San Francisco Bay Area clubs (keep original ones too)
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Golden Gate Park Tennis Club',
      description: 'Beautiful tennis courts with Golden Gate Park views',
      location: 'San Francisco, CA',
      lat: 37.7694,
      lng: -122.4862,
      creator_id: '550e8400-e29b-41d4-a716-446655440011',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Marina District Tennis',
      description: 'Waterfront tennis with Bay Bridge views',
      location: 'San Francisco, CA',
      lat: 37.8044,
      lng: -122.4324,
      creator_id: '550e8400-e29b-41d4-a716-446655440012',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Mission Bay Tennis Center',
      description: 'Modern courts in the heart of Mission Bay',
      location: 'San Francisco, CA',
      lat: 37.7706,
      lng: -122.3894,
      creator_id: '550e8400-e29b-41d4-a716-446655440013',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Palo Alto Tennis Club',
      description: 'Silicon Valley tennis community with tech professionals',
      location: 'Palo Alto, CA',
      lat: 37.4419,
      lng: -122.1430,
      creator_id: '550e8400-e29b-41d4-a716-446655440014',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Berkeley Hills Tennis',
      description: 'East Bay tennis with stunning hill views',
      location: 'Berkeley, CA',
      lat: 37.8715,
      lng: -122.2730,
      creator_id: '550e8400-e29b-41d4-a716-446655440015',
    },
  ];

    console.log('Inserting sample clubs...');
    for (const club of sampleClubs) {
      try {
        console.log(`Inserting club: ${club.name} (creator: ${club.creator_id})`);
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
        console.log(`✓ Successfully inserted club: ${club.name}`);
      } catch (clubError) {
        console.error(`✗ Failed to insert club ${club.name}:`, clubError);
        // Check if user exists
        const userExists = await db.getAllAsync('SELECT id FROM users WHERE id = ?', [club.creator_id]);
        console.log(`User ${club.creator_id} exists:`, userExists.length > 0);
        throw clubError;
      }
    }

    console.log(`Seeded ${sampleClubs.length} sample clubs`);
    
    // Verify the clubs were inserted before re-enabling constraints
    const finalClubCount = await db.getAllAsync('SELECT COUNT(*) as count FROM clubs') as any[];
    console.log('Final clubs count in database:', finalClubCount?.[0]?.count || 0);
    
    // Re-enable foreign key constraints
    await db.runAsync('PRAGMA foreign_keys = ON');
    console.log('Re-enabled foreign key constraints');
  } catch (error) {
    console.error('Failed to seed clubs:', error);
  }
}