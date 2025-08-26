// Chainable Supabase mock for testing
const createChainableMock = () => {
  const mock = {
    data: null,
    error: null,
    count: null,
  };

  // All methods return the same chainable object
  const chainable = {
    select: jest.fn(() => chainable),
    insert: jest.fn(() => chainable),
    update: jest.fn(() => chainable),
    upsert: jest.fn(() => chainable),
    delete: jest.fn(() => chainable),
    eq: jest.fn(() => chainable),
    neq: jest.fn(() => chainable),
    gt: jest.fn(() => chainable),
    gte: jest.fn(() => chainable),
    lt: jest.fn(() => chainable),
    lte: jest.fn(() => chainable),
    like: jest.fn(() => chainable),
    ilike: jest.fn(() => chainable),
    is: jest.fn(() => chainable),
    in: jest.fn(() => chainable),
    contains: jest.fn(() => chainable),
    containedBy: jest.fn(() => chainable),
    range: jest.fn(() => chainable),
    overlaps: jest.fn(() => chainable),
    match: jest.fn(() => chainable),
    not: jest.fn(() => chainable),
    or: jest.fn(() => chainable),
    filter: jest.fn(() => chainable),
    single: jest.fn(() => Promise.resolve(mock)),
    maybeSingle: jest.fn(() => Promise.resolve(mock)),
    limit: jest.fn(() => chainable),
    order: jest.fn(() => chainable),
    then: jest.fn((resolve) => Promise.resolve(mock).then(resolve)),
    catch: jest.fn(() => chainable),
    finally: jest.fn(() => chainable),
  };

  // Make it thenable
  chainable[Symbol.toStringTag] = 'Promise';

  return chainable;
};

const createAuthMock = () => {
  const authMock = {
    user: null,
    session: null,
  };

  return {
    signUp: jest.fn(() => Promise.resolve({ data: authMock, error: null })),
    signInWithPassword: jest.fn(() => Promise.resolve({ data: authMock, error: null })),
    signInWithOAuth: jest.fn(() => Promise.resolve({ data: authMock, error: null })),
    signInWithOtp: jest.fn(() => Promise.resolve({ data: authMock, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getSession: jest.fn(() => Promise.resolve({ data: { session: authMock.session }, error: null })),
    getUser: jest.fn(() => Promise.resolve({ data: { user: authMock.user }, error: null })),
    refreshSession: jest.fn(() => Promise.resolve({ data: authMock, error: null })),
    updateUser: jest.fn(() => Promise.resolve({ data: authMock, error: null })),
    onAuthStateChange: jest.fn((callback) => {
      // Return unsubscribe function
      return {
        data: { subscription: { unsubscribe: jest.fn() } },
      };
    }),
  };
};

const createRealtimeMock = () => {
  const channelMock = {
    on: jest.fn(() => channelMock),
    subscribe: jest.fn((callback) => {
      if (callback) callback('SUBSCRIBED');
      return channelMock;
    }),
    unsubscribe: jest.fn(() => Promise.resolve()),
  };

  return {
    channel: jest.fn(() => channelMock),
    removeChannel: jest.fn(() => Promise.resolve()),
  };
};

const createStorageMock = () => {
  return {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
      download: jest.fn(() => Promise.resolve({ data: null, error: null })),
      remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file' } })),
    })),
  };
};

class SupabaseClient {
  constructor(url, key, options = {}) {
    this.supabaseUrl = url;
    this.supabaseKey = key;
    this.auth = createAuthMock();
    this.realtime = createRealtimeMock();
    this.storage = createStorageMock();
    this.from = jest.fn(() => createChainableMock());
    this.rpc = jest.fn(() => Promise.resolve({ data: null, error: null }));
  }
}

export const createClient = jest.fn((url, key, options) => {
  return new SupabaseClient(url, key, options);
});

export default {
  createClient,
};