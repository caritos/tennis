// Jest setup for React Native and other dependencies
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
    details: {}
  })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: null,
      accuracy: 5,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    },
    timestamp: Date.now()
  })),
}));


// Mock Supabase with chainable methods
const createChainableQuery = () => {
  const query = {
    insert: jest.fn(() => query),
    update: jest.fn(() => query),
    delete: jest.fn(() => query),
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    neq: jest.fn(() => query),
    gt: jest.fn(() => query),
    gte: jest.fn(() => query),
    lt: jest.fn(() => query),
    lte: jest.fn(() => query),
    in: jest.fn(() => query),
    contains: jest.fn(() => query),
    order: jest.fn(() => query),
    limit: jest.fn(() => query),
    range: jest.fn(() => query),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
    upsert: jest.fn(() => query),
    or: jest.fn(() => query),
    is: jest.fn(() => query),
    filter: jest.fn(() => query),
    match: jest.fn(() => query),
  };
  return query;
};

jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: {} }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => createChainableQuery()),
  },
}));

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};