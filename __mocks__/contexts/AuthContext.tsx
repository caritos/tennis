import React from 'react';

// Mock AuthContext
export const AuthContext = React.createContext({});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const mockValue = {
    user: null,
    isLoading: false,
    isFirstTimeUser: false,
    isOnboardingComplete: true,
    signUp: jest.fn(() => Promise.resolve({ error: null })),
    signIn: jest.fn(() => Promise.resolve({ error: null })),
    signOut: jest.fn(() => Promise.resolve()),
    updateProfile: jest.fn(() => Promise.resolve({ error: null })),
  };

  return React.createElement(AuthContext.Provider, { value: mockValue }, children);
};

export const useAuth = jest.fn(() => ({
  user: null,
  isLoading: false,
  isFirstTimeUser: false,
  isOnboardingComplete: true,
  signUp: jest.fn(() => Promise.resolve({ error: null })),
  signIn: jest.fn(() => Promise.resolve({ error: null })),
  signOut: jest.fn(() => Promise.resolve()),
  updateProfile: jest.fn(() => Promise.resolve({ error: null })),
}));