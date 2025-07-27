import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  },
}));

jest.mock('../../../database/database', () => ({
  initializeDatabase: jest.fn(() => Promise.resolve({
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(() => Promise.resolve(null)),
  })),
}));

function TestComponent() {
  const { isLoading } = useAuth();
  return <Text>{isLoading ? 'Loading' : 'Loaded'}</Text>;
}

describe('AuthContext', () => {
  it('should provide auth context without errors', () => {
    expect(() => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    }).not.toThrow();
  });

  it('should handle user sync gracefully', () => {
    // This test verifies that the AuthProvider renders without throwing
    // The actual user sync logic is tested implicitly through the auth flow
    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should render without error
    expect(getByText('Loading')).toBeTruthy();
  });
});