import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers';

// Create the server with default handlers
export const server = setupServer(...handlers);

// Start before all tests in this suite
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset between tests to avoid handler leakage
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
