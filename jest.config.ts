import type { Config } from 'jest';

// ─── Jest Configuration ─────────────────────────────────────────────────────
// We use ts-jest for all test projects. ESM-only node_modules that can't be
// transformed are handled by mocking them at the jest.config level via
// moduleNameMapper, which is the most reliable cross-platform approach.

const config: Config = {
  projects: [
    // ── Unit Tests ───────────────────────────────────────────────────────────
    // Pure logic tests — no DOM, no HTTP, no auth dependencies needed.
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Stub out ESM-only packages that would otherwise break Jest's CJS runtime
        '^@auth/prisma-adapter$': '<rootDir>/src/__tests__/__mocks__/prisma-adapter.ts',
      },
    },

    // ── Integration Tests ────────────────────────────────────────────────────
    // Calls Next.js route handlers directly in-process using a mocked Prisma.
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      transform: { '^.+\\.tsx?$': ['ts-jest', {}] },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Intercept auth at the module level so no OAuth / adapter code runs
        '^@auth/prisma-adapter$': '<rootDir>/src/__tests__/__mocks__/prisma-adapter.ts',
        // Redirect getServerSession to our controllable mock
        '^next-auth$': '<rootDir>/src/__tests__/__mocks__/next-auth.ts',
      },
    },

    // ── Component Tests ──────────────────────────────────────────────────────
    // Renders React components into a virtual DOM; MSW intercepts fetch calls.
    {
      displayName: 'component',
      testEnvironment: 'jest-environment-jsdom',
      testEnvironmentOptions: { customExportConditions: [''] },
      testMatch: ['<rootDir>/src/__tests__/components/**/*.test.tsx'],
      // Polyfills run first so MSW globals (Request, Response, etc.) are ready
      setupFiles: ['<rootDir>/jest.polyfills.ts'],
      // jest-dom matchers + clearAllMocks
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      transform: {
        // Handle .ts, .tsx, and .mjs files; react-jsx removes the React import requirement
        '^.+\\.m?[tj]sx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.css$': 'identity-obj-proxy',
        '^@auth/prisma-adapter$': '<rootDir>/src/__tests__/__mocks__/prisma-adapter.ts',
        '^next-auth$': '<rootDir>/src/__tests__/__mocks__/next-auth.ts',
        // MSW's "rettime" dependency ships .mjs only — map to the CJS build
        '^rettime$': '<rootDir>/src/__tests__/__mocks__/rettime.ts',
      },
      transformIgnorePatterns: [
        // Allow ts-jest to transform @mswjs packages (they ship src TS files via their exports map)
        '/node_modules/(?!(@mswjs))',
      ],
    },
  ],

  // ── Coverage ────────────────────────────────────────────────────────────────
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/layout.tsx',
    '!src/types/**',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
  // Force Jest to exit after all tests complete — prevents React Query's
  // internal timers from keeping the process alive.
  forceExit: true,
};

export default config;
