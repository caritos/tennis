const React = require('react');
const { render: rtlRender } = require('@testing-library/react-native');

// Mock all the common dependencies that tests frequently need
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}));

jest.mock('@/constants/Colors', () => ({
  __esModule: true,
  default: {
    light: {
      background: '#ffffff',
      text: '#000000',
      tint: '#007AFF',
      tabIconDefault: '#8E8E93',
      tabIconSelected: '#007AFF',
    },
    dark: {
      background: '#000000',
      text: '#ffffff',
      tint: '#0A84FF',
      tabIconDefault: '#8E8E93',
      tabIconSelected: '#0A84FF',
    },
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock themed components with proper test support
jest.mock('@/components/ThemedText', () => ({
  ThemedText: 'Text',
}));

jest.mock('@/components/ThemedView', () => ({
  ThemedView: 'View',
}));

// Mock navigation and routing
jest.mock('expo-router', () => ({
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
  Link: 'TouchableOpacity',
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

// Mock error handling utilities
jest.mock('@/utils/errorHandling', () => ({
  logError: jest.fn(),
  getAuthErrorMessage: jest.fn((error) => error?.message || 'Unknown error'),
}));

// Wrapper component for providing context if needed
const AllTheProviders = ({ children }) => children;

// Test utilities
const createMockMatch = (overrides = {}) => ({
  id: 'mock-match-id',
  club_id: 'mock-club-id',
  player1_id: 'mock-player-1',
  player2_id: 'mock-player-2',
  opponent2_name: 'Mock Opponent',
  scores: '6-4,6-3',
  match_type: 'singles',
  date: '2024-01-15',
  notes: null,
  created_at: '2024-01-15T10:00:00Z',
  ...overrides,
});

const createMockClub = (overrides = {}) => ({
  id: 'mock-club-id',
  name: 'Mock Tennis Club',
  description: 'A mock club for testing',
  location: 'Mock City, MC',
  member_count: 10,
  latitude: 40.7128,
  longitude: -74.0060,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'mock-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+1234567890',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Test database helpers
const mockAsyncStorageForTest = () => {
  const mockStorage = {};
  
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  AsyncStorage.getItem.mockImplementation((key) => 
    Promise.resolve(mockStorage[key] || null)
  );
  
  AsyncStorage.setItem.mockImplementation((key, value) => {
    mockStorage[key] = value;
    return Promise.resolve();
  });
  
  AsyncStorage.removeItem.mockImplementation((key) => {
    delete mockStorage[key];
    return Promise.resolve();
  });
  
  AsyncStorage.clear.mockImplementation(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    return Promise.resolve();
  });
  
  return mockStorage;
};

// Custom render function that includes providers
const customRender = (ui, options) => 
  rtlRender(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
module.exports = {
  ...require('@testing-library/react-native'),
  render: customRender,
  createMockMatch,
  createMockClub,
  createMockUser,
  mockAsyncStorageForTest,
};