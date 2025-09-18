module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{ts,tsx}',
    '<rootDir>/tests/e2e/integration/**/*.test.{ts,tsx}',
    '<rootDir>/tests/e2e/offline-queue/**/*.test.{ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
    '<rootDir>/tests/e2e/flows/',
    '<rootDir>/tests/e2e/screenshots/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|isows)'
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/__tests__/**'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
  // Separate test environments
  projects: [
    {
      displayName: 'unit',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/tests/unit/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|isows|@testing-library/react-native)'
      ],
    },
    {
      displayName: 'integration',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/tests/e2e/integration/**/*.test.{ts,tsx}', '<rootDir>/tests/e2e/offline-queue/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: [
        '<rootDir>/jest.setup.js',
        '<rootDir>/tests/setup/testUtils.js',
        '<rootDir>/tests/setup/testDatabase.ts'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@supabase/.*|isows|@testing-library/react-native)'
      ],
    }
  ]
};