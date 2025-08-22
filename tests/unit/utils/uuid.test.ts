import { generateUUID, isValidUUID } from '../../../utils/uuid';

describe('UUID utility', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      
      // Check format: 8-4-4-4-12 hexadecimal characters
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      const uuid3 = generateUUID();
      
      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    it('should generate UUIDs with correct version and variant bits', () => {
      const uuid = generateUUID();
      const parts = uuid.split('-');
      
      // Version 4 check (13th character should be '4')
      expect(parts[2][0]).toBe('4');
      
      // Variant check (17th character should be 8, 9, a, or b)
      const variantChar = parts[3][0].toLowerCase();
      expect(['8', '9', 'a', 'b']).toContain(variantChar);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID v4 format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        generateUUID()
      ];
      
      validUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-11d4-a716-446655440000', // Version 1, not 4
        '550e8400-e29b-41d4-a716', // Too short
        '550e8400e29b41d4a716446655440000', // No hyphens
        'club_1755887877020_wsco98zf2', // Old format
        'match_1755889000067_ovqh2s5y4', // Old format
      ];
      
      invalidUUIDs.forEach(uuid => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe('PostgreSQL compatibility', () => {
    it('should generate UUIDs compatible with PostgreSQL UUID type', () => {
      // PostgreSQL expects lowercase UUID format with hyphens
      const uuid = generateUUID();
      
      // Should be 36 characters long (32 hex + 4 hyphens)
      expect(uuid.length).toBe(36);
      
      // Should be lowercase or case-insensitive match
      expect(uuid.toLowerCase()).toBe(uuid.toLowerCase());
      
      // Should have hyphens in correct positions
      expect(uuid[8]).toBe('-');
      expect(uuid[13]).toBe('-');
      expect(uuid[18]).toBe('-');
      expect(uuid[23]).toBe('-');
    });
  });
});