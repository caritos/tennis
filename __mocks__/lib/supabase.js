// Mock for @/lib/supabase
const createChainableMock = () => {
  const mock = {
    data: null,
    error: null,
    count: null,
  };

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

  return chainable;
};

const authMock = {
  signUp: jest.fn(() => Promise.resolve({ data: null, error: null })),
  signInWithPassword: jest.fn(() => Promise.resolve({ data: null, error: null })),
  signInWithOAuth: jest.fn(() => Promise.resolve({ data: null, error: null })),
  signInWithOtp: jest.fn(() => Promise.resolve({ data: null, error: null })),
  signOut: jest.fn(() => Promise.resolve({ error: null })),
  getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
  getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
  refreshSession: jest.fn(() => Promise.resolve({ data: null, error: null })),
  updateUser: jest.fn(() => Promise.resolve({ data: null, error: null })),
  onAuthStateChange: jest.fn((callback) => {
    return {
      data: { subscription: { unsubscribe: jest.fn() } },
    };
  }),
};

const realtimeMock = {
  channel: jest.fn(() => ({
    on: jest.fn(() => realtimeMock.channel()),
    subscribe: jest.fn((callback) => {
      if (callback) callback('SUBSCRIBED');
      return realtimeMock.channel();
    }),
    unsubscribe: jest.fn(() => Promise.resolve()),
  })),
  removeChannel: jest.fn(() => Promise.resolve()),
};

const storageMock = {
  from: jest.fn(() => ({
    upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
    download: jest.fn(() => Promise.resolve({ data: null, error: null })),
    remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
    list: jest.fn(() => Promise.resolve({ data: [], error: null })),
    getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file' } })),
  })),
};

export const supabase = {
  auth: authMock,
  from: jest.fn(() => createChainableMock()),
  realtime: realtimeMock,
  storage: storageMock,
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
};