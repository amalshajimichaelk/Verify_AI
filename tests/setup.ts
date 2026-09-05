import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock process.env for tests
process.env.DEMO_MODE = 'true';
process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
process.env.DATABASE_URL = 'postgres://mock:mock@localhost:5432/mock';
