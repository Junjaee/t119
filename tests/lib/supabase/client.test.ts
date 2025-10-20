// @TEST:INFRA-001:CLIENT | SPEC: .moai/specs/SPEC-INFRA-001/spec.md

/**
 * Supabase Browser Client Tests
 *
 * @description
 * RED phase tests for Supabase browser client initialization and configuration.
 *
 * @spec SPEC-INFRA-001
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient, getClient, resetClient } from '@/lib/supabase/client';

describe('Supabase Browser Client', () => {
  beforeEach(() => {
    resetClient();
  });

  describe('createClient', () => {
    it('should create a Supabase client successfully', () => {
      const client = createClient();
      expect(client).toBeDefined();
      expect(client).toHaveProperty('auth');
      expect(client).toHaveProperty('from');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const client1 = createClient();
      const client2 = createClient();
      expect(client1).toBe(client2);
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => createClient()).toThrow(
        'Missing Supabase environment variables'
      );

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      resetClient();
      expect(() => createClient()).toThrow(
        'Missing Supabase environment variables'
      );

      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe('getClient', () => {
    it('should return undefined if client not initialized', () => {
      expect(getClient()).toBeUndefined();
    });

    it('should return client instance after initialization', () => {
      const client = createClient();
      expect(getClient()).toBe(client);
    });
  });

  describe('resetClient', () => {
    it('should reset client instance', () => {
      createClient();
      expect(getClient()).toBeDefined();

      resetClient();
      expect(getClient()).toBeUndefined();
    });
  });
});
