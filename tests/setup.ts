// Test Setup
// Vitest global setup for all tests

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local for E2E tests (실제 Supabase 연결)
config({ path: path.resolve(process.cwd(), '.env.local') });

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock environment variables for unit tests (only if not already set from .env.local)
// E2E 테스트는 .env.local 값 사용, Unit 테스트는 Mock 값 사용
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-min-32-characters-long';
}
if (!process.env.JWT_ACCESS_TOKEN_EXPIRES_IN) {
  process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';
}
if (!process.env.JWT_REFRESH_TOKEN_EXPIRES_IN) {
  process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';
}
