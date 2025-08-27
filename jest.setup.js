// Set test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Global polyfills for Jest environment
global.self = global;
global.WebSocket = class WebSocket {
  constructor() {}
  close() {}
  send() {}
};

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
    then: jest.fn((callback) => Promise.resolve({ data: null, error: null }).then(callback)),
  };
  
  // Make it thenable to act like a Promise
  return query;
};

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: {} }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
      updateUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => createChainableQuery()),
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: null }, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' }, session: {} }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
      updateUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => createChainableQuery()),
  })),
}));

jest.mock('@/contexts/AuthContext');

// Mock expo-router
jest.mock('expo-router', () => ({
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  Link: 'Link',
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    name: 'tennis',
    slug: 'tennis',
  },
  executionEnvironment: 'standalone',
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

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

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