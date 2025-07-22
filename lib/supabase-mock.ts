// Mock Supabase client for development when network issues occur
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_USER_KEY = 'mock_user';

export const supabaseMock = {
  auth: {
    signUp: async ({ email, password, options }: any) => {
      console.log('Mock: Signing up user:', email);
      const user = {
        id: `mock-${Date.now()}`,
        email,
        user_metadata: options?.data || {},
      };
      await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
      return { data: { user }, error: null };
    },
    
    signInWithPassword: async ({ email, password }: any) => {
      console.log('Mock: Signing in user:', email);
      const storedUser = await AsyncStorage.getItem(MOCK_USER_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return { data: { user, session: { user } }, error: null };
      }
      return { data: null, error: new Error('Invalid login credentials') };
    },
    
    signOut: async () => {
      console.log('Mock: Signing out');
      await AsyncStorage.removeItem(MOCK_USER_KEY);
      return { error: null };
    },
    
    getSession: async () => {
      const storedUser = await AsyncStorage.getItem(MOCK_USER_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return { data: { session: { user } }, error: null };
      }
      return { data: { session: null }, error: null };
    },
    
    onAuthStateChange: (callback: any) => {
      // Mock implementation
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },
  
  from: (table: string) => ({
    insert: async (data: any) => {
      console.log(`Mock: Inserting into ${table}:`, data);
      return { error: null };
    },
  }),
};