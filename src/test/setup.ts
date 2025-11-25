import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest'; 

afterEach(() => {
  cleanup();
});

afterEach(() => {
  vi.clearAllMocks();
});

vi.stubGlobal('import.meta', {
  env: {
    PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
    FOOTBALL_DATA_API_KEY: 'mock-football-key',
    OPENROUTER_API_KEY: 'mock-ai-key',
  }
});

