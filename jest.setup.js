import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} />;
  },
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    anonymousUser: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    phq4Assessment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    moodLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userInteraction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    gamificationData: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    mentalHealthResource: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/sata_test';
process.env.WHATSAPP_ACCOUNT_SID = 'test_sid';
process.env.WHATSAPP_AUTH_TOKEN = 'test_token';
process.env.SCHEDULER_API_KEY = 'test_scheduler_key';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window objects for browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    anonymousId: 'test-anonymous-id',
    language: 'en',
    createdAt: new Date(),
    lastActive: new Date(),
  }),
  createMockAssessment: () => ({
    id: 'test-assessment-id',
    userId: 'test-user-id',
    depressionScore: 5,
    anxietyScore: 4,
    totalScore: 9,
    severityLevel: 'moderate',
    language: 'en',
    createdAt: new Date(),
  }),
  createMockMoodLog: () => ({
    id: 'test-mood-log-id',
    userId: 'test-user-id',
    moodScore: 7,
    emotions: ['happy', 'calm'],
    notes: 'Feeling good today',
    triggers: [],
    sentimentScore: 0.8,
    sentimentLabel: 'positive',
    language: 'en',
    createdAt: new Date(),
  }),
};
