// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TEST: tests/lib/notifications/realtime-service.test.ts | TAG: TAG-004
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { NotificationCategory } from '@/types/notification.types';

interface RealtimeNotificationPayload {
  userId: string;
  title: string;
  content: string;
  category: NotificationCategory;
  linkUrl?: string;
}

interface RealtimeResult {
  success: boolean;
  error?: string;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export class RealtimeService {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private readonly RECONNECT_DELAYS = [1000, 5000, 15000, 30000]; // 1s, 5s, 15s, 30s
  private readonly MAX_RECONNECT_TIME = 30000; // 30 seconds total
  private pollingMode = false;
  private pollingInterval?: NodeJS.Timeout;
  private messageQueue: RealtimeNotificationPayload[] = [];
  private currentUserId: string | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Connect to realtime channel with automatic reconnection
   */
  async connect(userId: string): Promise<void> {
    this.currentUserId = userId;
    this.connectionState = 'connecting';

    const startTime = Date.now();
    let attemptDelay = 0;

    while (Date.now() - startTime < this.MAX_RECONNECT_TIME) {
      try {
        // Wait for reconnect delay
        if (attemptDelay > 0) {
          await this.delay(attemptDelay);
        }

        // Create channel
        this.channel = this.supabase.channel(`notifications:${userId}`);

        // Attempt connection
        const connected = await new Promise<boolean>((resolve) => {
          this.channel!.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve(true);
            } else if (status === 'CHANNEL_ERROR') {
              resolve(false);
            }
          });
        });

        if (connected) {
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          this.pollingMode = false;
          this.clearPolling();
          await this.flushMessageQueue();
          return;
        }

        // Connection failed, increment attempt and get next delay
        if (this.reconnectAttempts < this.RECONNECT_DELAYS.length) {
          attemptDelay = this.RECONNECT_DELAYS[this.reconnectAttempts];
          this.reconnectAttempts++;
        }
      } catch (error) {
        console.error('WebSocket connection error:', error);
      }
    }

    // Failed to connect after 30 seconds - fallback to polling
    this.connectionState = 'error';
    this.startPolling(userId);
  }

  /**
   * Disconnect from realtime channel
   */
  disconnect(): void {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.connectionState = 'disconnected';
    this.clearPolling();
    this.currentUserId = null;
  }

  /**
   * Send realtime notification via WebSocket broadcast
   */
  async sendRealtimeNotification(
    payload: RealtimeNotificationPayload
  ): Promise<RealtimeResult> {
    // If not connected, queue message
    if (this.connectionState !== 'connected') {
      this.messageQueue.push(payload);
      return {
        success: false,
        error: 'Not connected - message queued for retry',
      };
    }

    if (!this.channel) {
      return {
        success: false,
        error: 'Channel not initialized',
      };
    }

    try {
      const result = await this.channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          title: payload.title,
          content: payload.content,
          category: payload.category,
          linkUrl: payload.linkUrl,
        },
      });

      if (result === 'ok') {
        return { success: true };
      }

      return {
        success: false,
        error: 'Failed to send notification',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if in polling mode
   */
  isPollingMode(): boolean {
    return this.pollingMode;
  }

  /**
   * Private: Start polling fallback mode
   */
  private startPolling(userId: string): void {
    this.pollingMode = true;
    this.pollingInterval = setInterval(async () => {
      // Poll for new notifications every 30 seconds
      try {
        // Attempt to reconnect via WebSocket
        const reconnected = await this.attemptReconnect(userId);
        if (reconnected) {
          this.clearPolling();
          this.pollingMode = false;
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // 30s polling interval
  }

  /**
   * Private: Attempt to reconnect to WebSocket
   */
  private async attemptReconnect(userId: string): Promise<boolean> {
    try {
      this.channel = this.supabase.channel(`notifications:${userId}`);

      const connected = await new Promise<boolean>((resolve) => {
        this.channel!.subscribe((status) => {
          resolve(status === 'SUBSCRIBED');
        });
      });

      if (connected) {
        this.connectionState = 'connected';
        await this.flushMessageQueue();
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Private: Clear polling interval
   */
  private clearPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = undefined;
    }
  }

  /**
   * Private: Flush queued messages after reconnection
   */
  private async flushMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      await this.sendRealtimeNotification(message);
    }
  }

  /**
   * Private: Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
