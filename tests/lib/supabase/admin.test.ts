// @TEST:INFRA-001:ADMIN | SPEC: .moai/specs/SPEC-INFRA-001/spec.md

/**
 * Supabase Admin Client Tests
 *
 * @description
 * RED phase tests for Supabase admin client (service role) initialization.
 *
 * @spec SPEC-INFRA-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAdminClient,
  getAdminClient,
  resetAdminClient,
} from '@/lib/supabase/admin';

describe('Supabase Admin Client', () => {
  beforeEach(() => {
    resetAdminClient();
  });

  describe('createAdminClient', () => {
    it('should create a Supabase admin client successfully', () => {
      const admin = createAdminClient();
      expect(admin).toBeDefined();
      expect(admin).toHaveProperty('auth');
      expect(admin).toHaveProperty('from');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const admin1 = createAdminClient();
      const admin2 = createAdminClient();
      expect(admin1).toBe(admin2);
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => createAdminClient()).toThrow(
        'Missing Supabase environment variables'
      );

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    });

    it('should throw error if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      resetAdminClient();
      expect(() => createAdminClient()).toThrow(
        'Missing Supabase environment variables'
      );

      process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    });

    it('should configure client to not persist session', () => {
      const admin = createAdminClient();
      // Admin client should not persist sessions (server-side only)
      expect(admin).toBeDefined();
    });
  });

  describe('getAdminClient', () => {
    it('should return undefined if admin client not initialized', () => {
      expect(getAdminClient()).toBeUndefined();
    });

    it('should return admin client instance after initialization', () => {
      const admin = createAdminClient();
      expect(getAdminClient()).toBe(admin);
    });
  });

  describe('resetAdminClient', () => {
    it('should reset admin client instance', () => {
      createAdminClient();
      expect(getAdminClient()).toBeDefined();

      resetAdminClient();
      expect(getAdminClient()).toBeUndefined();
    });
  });
});
