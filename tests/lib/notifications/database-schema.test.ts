// @TEST:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-002
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('TAG-002: Database Schema - Notifications Tables', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'notification-test@test.com',
      password: 'testpass123',
      email_confirm: true,
    });

    if (authError) throw authError;
    testUserId = authData.user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('notifications').delete().eq('user_id', testUserId);
    await supabase.from('notification_settings').delete().eq('user_id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  describe('notifications table', () => {
    it('should create notification with valid data', async () => {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'email',
          category: 'counselor_assigned',
          title: 'Test Notification',
          content: 'Test content',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.is_read).toBe(false);
      expect(data.failed_count).toBe(0);
    });

    it('should enforce type constraint (email, realtime, sms only)', async () => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'invalid_type',
          category: 'counselor_assigned',
          title: 'Test',
          content: 'Test',
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });

    it('should enforce category constraint', async () => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'email',
          category: 'invalid_category',
          title: 'Test',
          content: 'Test',
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });

    it('should enforce title length constraint (max 100 chars)', async () => {
      const longTitle = 'a'.repeat(101);
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'email',
          category: 'counselor_assigned',
          title: longTitle,
          content: 'Test',
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });

    it('should enforce content length constraint (max 500 chars)', async () => {
      const longContent = 'a'.repeat(501);
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'email',
          category: 'counselor_assigned',
          title: 'Test',
          content: longContent,
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });

    it('should enforce failed_count constraint (max 3)', async () => {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'email',
          category: 'counselor_assigned',
          title: 'Test',
          content: 'Test',
          failed_count: 4,
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });

    it('should cascade delete notifications when user is deleted', async () => {
      // Create temp user
      const { data: tempUser } = await supabase.auth.admin.createUser({
        email: 'temp-notification@test.com',
        password: 'testpass123',
        email_confirm: true,
      });

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: tempUser!.user.id,
          type: 'email',
          category: 'counselor_assigned',
          title: 'Test',
          content: 'Test',
        });

      // Delete user
      await supabase.auth.admin.deleteUser(tempUser!.user.id);

      // Check notification is deleted
      const { data } = await supabase
        .from('notifications')
        .select()
        .eq('user_id', tempUser!.user.id);

      expect(data).toHaveLength(0);
    });
  });

  describe('notification_settings table', () => {
    it('should create notification settings with default values', async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .insert({ user_id: testUserId })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.email_enabled).toBe(true);
      expect(data.realtime_enabled).toBe(true);
      expect(data.sms_enabled).toBe(false);
      expect(data.counselor_assigned).toBe(true);
      expect(data.new_message).toBe(true);
      expect(data.status_changed).toBe(true);
      expect(data.reminder).toBe(true);
    });

    it('should enforce unique user_id constraint', async () => {
      // First insert
      await supabase
        .from('notification_settings')
        .insert({ user_id: testUserId });

      // Second insert (should fail)
      const { error } = await supabase
        .from('notification_settings')
        .insert({ user_id: testUserId });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('duplicate key value');
    });

    it('should cascade delete settings when user is deleted', async () => {
      // Create temp user
      const { data: tempUser } = await supabase.auth.admin.createUser({
        email: 'temp-settings@test.com',
        password: 'testpass123',
        email_confirm: true,
      });

      // Create settings
      await supabase
        .from('notification_settings')
        .insert({ user_id: tempUser!.user.id });

      // Delete user
      await supabase.auth.admin.deleteUser(tempUser!.user.id);

      // Check settings is deleted
      const { data } = await supabase
        .from('notification_settings')
        .select()
        .eq('user_id', tempUser!.user.id);

      expect(data).toHaveLength(0);
    });
  });

  describe('email_templates table', () => {
    it('should have seeded templates', async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThanOrEqual(4);

      const templateKeys = data.map((t) => t.template_key);
      expect(templateKeys).toContain('counselor_assigned');
      expect(templateKeys).toContain('new_message');
      expect(templateKeys).toContain('status_changed');
      expect(templateKeys).toContain('reminder');
    });

    it('should enforce unique template_key constraint', async () => {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          template_key: 'counselor_assigned',
          subject: 'Duplicate',
          html_content: '<p>Test</p>',
          plain_text: 'Test',
          variables: ['test'],
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('duplicate key value');
    });

    it('should enforce template_key constraint (valid keys only)', async () => {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          template_key: 'invalid_key',
          subject: 'Test',
          html_content: '<p>Test</p>',
          plain_text: 'Test',
          variables: ['test'],
        });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });
  });

  describe('RLS Policies', () => {
    it('should allow users to read only their own notifications', async () => {
      // Create notification
      const { data: notification } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'email',
          category: 'counselor_assigned',
          title: 'RLS Test',
          content: 'Test',
        })
        .select()
        .single();

      // Query as the user (using user JWT)
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Set auth context (simulate user login)
      await userClient.auth.signInWithPassword({
        email: 'notification-test@test.com',
        password: 'testpass123',
      });

      const { data, error } = await userClient
        .from('notifications')
        .select()
        .eq('id', notification!.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(notification!.id);

      await userClient.auth.signOut();
    });

    it('should allow users to update only their own notifications', async () => {
      // Create notification
      const { data: notification } = await supabase
        .from('notifications')
        .insert({
          user_id: testUserId,
          type: 'email',
          category: 'counselor_assigned',
          title: 'RLS Update Test',
          content: 'Test',
        })
        .select()
        .single();

      // Update as the user
      const userClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await userClient.auth.signInWithPassword({
        email: 'notification-test@test.com',
        password: 'testpass123',
      });

      const { data, error } = await userClient
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification!.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.is_read).toBe(true);

      await userClient.auth.signOut();
    });
  });
});
