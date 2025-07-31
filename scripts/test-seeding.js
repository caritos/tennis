// Quick test script to verify seeding works
const { seedSampleClubs } = require('../utils/seedData.ts');

async function testSeeding() {
  console.log('Testing seeding function...');
  try {
    await seedSampleClubs();
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

testSeeding();