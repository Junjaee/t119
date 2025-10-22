// @TEST:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-004
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealtimeService } from '@/lib/notifications/realtime-service';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Mock Supabase client
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  send: vi.fn(),
} as unknown as RealtimeChannel;

const mockSupabase = {
  channel: vi.fn(() => mockChannel),
  removeChannel: vi.fn(),
};

describe('TAG-004: Realtime Service', () => {
  let realtimeService: RealtimeService;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - mock supabase client
    realtimeService = new RealtimeService(mockSupabase);
  });

  afterEach(() => {
    realtimeService.disconnect();
  });

  describe('sendRealtimeNotification', () => {
    it('should send realtime notification successfully', async () => {
      mockChannel.send.mockResolvedValueOnce('ok');

      const result = await realtimeService.sendRealtimeNotification({
        userId: 'user_123',
        title: 'Test Notification',
        content: 'Test content',
        category: 'new_message',
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.channel).toHaveBeenCalledWith('notifications:user_123');
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'notification',
        payload: {
          title: 'Test Notification',
          content: 'Test content',
          category: 'new_message',
        },
      });
    });

    it('should return error on send failure', async () => {
      mockChannel.send.mockResolvedValueOnce('error');

      const result = await realtimeService.sendRealtimeNotification({
        userId: 'user_123',
        title: 'Test',
        content: 'Test',
        category: 'new_message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to send');
    });

    it('should handle network errors', async () => {
      mockChannel.send.mockRejectedValueOnce(new Error('Network error'));

      const result = await realtimeService.sendRealtimeNotification({
        userId: 'user_123',
        title: 'Test',
        content: 'Test',
        category: 'new_message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('WebSocket reconnection', () => {
    it('should reconnect with exponential backoff (1s, 5s, 15s, 30s)', async () => {
      const reconnectAttempts: number[] = [];
      let lastTime = Date.now();

      // Mock subscribe to track reconnection timing
      mockChannel.subscribe.mockImplementation((callback) => {
        const currentTime = Date.now();
        if (reconnectAttempts.length > 0) {
          reconnectAttempts.push(currentTime - lastTime);
        }
        lastTime = currentTime;

        // Simulate connection failure for first 3 attempts
        if (reconnectAttempts.length < 3) {
          callback('CHANNEL_ERROR');
        } else {
          callback('SUBSCRIBED');
        }
      });

      await realtimeService.connect('user_123');

      // Should have 3 retry intervals recorded
      expect(reconnectAttempts).toHaveLength(3);
      expect(reconnectAttempts[0]).toBeGreaterThanOrEqual(1000);
      expect(reconnectAttempts[0]).toBeLessThan(1500);
      expect(reconnectAttempts[1]).toBeGreaterThanOrEqual(5000);
      expect(reconnectAttempts[1]).toBeLessThan(5500);
      expect(reconnectAttempts[2]).toBeGreaterThanOrEqual(15000);
      expect(reconnectAttempts[2]).toBeLessThan(15500);
    }, 30000); // 30s timeout

    it('should give up after 30 seconds and fallback to polling', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('CHANNEL_ERROR');
      });

      const startTime = Date.now();
      await realtimeService.connect('user_123');
      const duration = Date.now() - startTime;

      // Should stop trying after 30s
      expect(duration).toBeGreaterThanOrEqual(30000);
      expect(duration).toBeLessThan(32000);
      expect(realtimeService.isPollingMode()).toBe(true);
    }, 35000); // 35s timeout
  });

  describe('connection state management', () => {
    it('should track connection state (disconnected -> connecting -> connected)', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        setTimeout(() => callback('SUBSCRIBED'), 10);
      });

      expect(realtimeService.getConnectionState()).toBe('disconnected');

      const connectPromise = realtimeService.connect('user_123');
      expect(realtimeService.getConnectionState()).toBe('connecting');

      await connectPromise;
      expect(realtimeService.getConnectionState()).toBe('connected');
    });

    it('should transition to error state on connection failure', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('CHANNEL_ERROR');
      });

      await realtimeService.connect('user_123');
      expect(realtimeService.getConnectionState()).toBe('error');
    });

    it('should allow manual disconnect', async () => {
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED');
      });

      await realtimeService.connect('user_123');
      expect(realtimeService.getConnectionState()).toBe('connected');

      realtimeService.disconnect();
      expect(realtimeService.getConnectionState()).toBe('disconnected');
      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('polling fallback', () => {
    it('should start polling when WebSocket fails', async () => {
      const pollingSpy = vi.spyOn(realtimeService as any, 'startPolling');
      mockChannel.subscribe.mockImplementation((callback) => {
        callback('CHANNEL_ERROR');
      });

      await realtimeService.connect('user_123');

      // After 30s of failed reconnections, should start polling
      expect(pollingSpy).toHaveBeenCalledWith('user_123');
    }, 35000);

    it('should stop polling when WebSocket reconnects', async () => {
      // @ts-ignore - access private property for testing
      realtimeService.pollingMode = true;
      // @ts-ignore
      realtimeService.pollingInterval = setInterval(() => {}, 1000);

      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED');
      });

      await realtimeService.connect('user_123');

      expect(realtimeService.isPollingMode()).toBe(false);
      // @ts-ignore
      expect(realtimeService.pollingInterval).toBeUndefined();
    });
  });

  describe('message queue', () => {
    it('should queue messages when disconnected', async () => {
      const result = await realtimeService.sendRealtimeNotification({
        userId: 'user_123',
        title: 'Queued Message',
        content: 'Test',
        category: 'new_message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('queued');
      // @ts-ignore
      expect(realtimeService.messageQueue.length).toBe(1);
    });

    it('should flush queue when connection is established', async () => {
      // Queue a message while disconnected
      await realtimeService.sendRealtimeNotification({
        userId: 'user_123',
        title: 'Queued',
        content: 'Test',
        category: 'new_message',
      });

      mockChannel.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED');
      });
      mockChannel.send.mockResolvedValue('ok');

      // Connect - should flush queue
      await realtimeService.connect('user_123');

      // Wait for queue processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // @ts-ignore
      expect(realtimeService.messageQueue.length).toBe(0);
      expect(mockChannel.send).toHaveBeenCalled();
    });
  });
});
