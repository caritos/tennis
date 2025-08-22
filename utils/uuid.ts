/**
 * UUID v4 generator utility
 * Generates RFC4122 compliant UUIDs that are compatible with PostgreSQL UUID type
 */

/**
 * Generate a UUID v4 string
 * @returns A properly formatted UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateUUID(): string {
  // Generate UUID v4 using crypto.getRandomValues
  const array = new Uint8Array(16);
  
  // Use React Native's built-in crypto if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Set version (4) and variant bits according to RFC4122
  array[6] = (array[6] & 0x0f) | 0x40;  // Version 4
  array[8] = (array[8] & 0x3f) | 0x80;  // Variant 10
  
  // Convert to hex string with hyphens
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Validate if a string is a valid UUID
 * @param uuid The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}