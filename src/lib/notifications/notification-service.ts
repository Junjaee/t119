// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-005
import { createClient } from '@supabase/supabase-js';
import { emailService } from './email-service';
import { RealtimeService } from './realtime-service';
import { templateManager } from './template-manager';
import type {
  Notification,
  NotificationSettings,
  CreateNotificationInput,
  NotificationCategory,
  NotificationType,
} from '@/types/notification.types';

interface CreateNotificationResult {
  success: boolean;
  notifications?: Array<{
    id: string;
    type: NotificationType;
    status: 'sent' | 'failed';
    sent_at?: string;
  }>;
  error?: string;
}

interface NotificationListResult {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  unread_count: number;
}

export class NotificationService {
  private supabase: ReturnType<typeof createClient>;
  private realtimeService: RealtimeService;

  constructor(
    supabase: ReturnType<typeof createClient>,
    realtimeService: RealtimeService
  ) {
    this.supabase = supabase;
    this.realtimeService = realtimeService;
  }

  /**
   * Create notification and send via specified channels
   */
  async createNotification(
    input: CreateNotificationInput
  ): Promise<CreateNotificationResult> {
    try {
      // Get user notification settings
      const settings = await this.getUserSettings(input.user_id);

      // Check if user has enabled notifications for this category
      if (!this.shouldSendNotification(input.category, settings)) {
        return {
          success: false,
          error: 'User has disabled notifications for this category',
        };
      }

      // Filter channels based on user preferences
      const enabledChannels = this.getEnabledChannels(input.channels, settings);

      if (enabledChannels.length === 0) {
        return {
          success: false,
          error: 'All channels disabled by user preferences',
        };
      }

      const results: Array<{
        id: string;
        type: NotificationType;
        status: 'sent' | 'failed';
        sent_at?: string;
      }> = [];

      // Send notifications via enabled channels
      for (const channel of enabledChannels) {
        const result = await this.sendViaChannel({
          channel,
          userId: input.user_id,
          category: input.category,
          title: input.title,
          content: input.content,
          linkUrl: input.link_url,
        });

        results.push(result);
      }

      return {
        success: true,
        notifications: results,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      is_read?: boolean;
      category?: NotificationCategory;
    } = {}
  ): Promise<NotificationListResult> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100); // Max 100
    const offset = (page - 1) * limit;

    // Build query
    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.is_read !== undefined) {
      query = query.eq('is_read', options.is_read);
    }

    if (options.category) {
      query = query.eq('category', options.category);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    // Get unread count
    const { count: unreadCount } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return {
      notifications: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
      unread_count: unreadCount || 0,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark as read: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) {
      throw new Error(`Failed to mark all as read: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return true;
  }

  /**
   * Private: Get user notification settings
   */
  private async getUserSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await this.supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return default settings if not found
      return {
        id: '',
        user_id: userId,
        email_enabled: true,
        realtime_enabled: true,
        sms_enabled: false,
        counselor_assigned: true,
        new_message: true,
        status_changed: true,
        reminder: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  }

  /**
   * Private: Check if notification should be sent based on category
   */
  private shouldSendNotification(
    category: NotificationCategory,
    settings: NotificationSettings
  ): boolean {
    return settings[category] === true;
  }

  /**
   * Private: Filter channels based on user preferences
   */
  private getEnabledChannels(
    requestedChannels: NotificationType[],
    settings: NotificationSettings
  ): NotificationType[] {
    return requestedChannels.filter((channel) => {
      if (channel === 'email') return settings.email_enabled;
      if (channel === 'realtime') return settings.realtime_enabled;
      if (channel === 'sms') return settings.sms_enabled;
      return false;
    });
  }

  /**
   * Private: Send notification via specific channel
   */
  private async sendViaChannel(params: {
    channel: NotificationType;
    userId: string;
    category: NotificationCategory;
    title: string;
    content: string;
    linkUrl?: string;
  }): Promise<{
    id: string;
    type: NotificationType;
    status: 'sent' | 'failed';
    sent_at?: string;
  }> {
    // Insert notification record
    const { data: notification, error: dbError } = await this.supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.channel,
        category: params.category,
        title: params.title,
        content: params.content,
        link_url: params.linkUrl,
      })
      .select()
      .single();

    if (dbError || !notification) {
      return {
        id: '',
        type: params.channel,
        status: 'failed',
      };
    }

    // Send via channel
    let sent = false;

    if (params.channel === 'email') {
      sent = await this.sendEmail(params);
    } else if (params.channel === 'realtime') {
      sent = await this.sendRealtime(params);
    }

    // Update notification record
    if (sent) {
      await this.supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notification.id);
    } else {
      await this.supabase
        .from('notifications')
        .update({ failed_count: 1 })
        .eq('id', notification.id);
    }

    return {
      id: notification.id,
      type: params.channel,
      status: sent ? 'sent' : 'failed',
      sent_at: sent ? new Date().toISOString() : undefined,
    };
  }

  /**
   * Private: Send email notification
   */
  private async sendEmail(params: {
    userId: string;
    category: NotificationCategory;
    title: string;
    content: string;
    linkUrl?: string;
  }): Promise<boolean> {
    // Get user email
    const { data: user } = await this.supabase.auth.admin.getUserById(params.userId);
    if (!user?.user?.email) return false;

    // Render template (placeholder - actual template data would come from params)
    const rendered = templateManager.renderTemplate(params.category, {
      // Template variables would be passed from caller
    });

    if (!rendered) {
      // Fallback to simple email
      const result = await emailService.sendEmailWithRateLimit(params.userId, {
        to: user.user.email,
        subject: params.title,
        html: `<p>${params.content}</p>`,
        text: params.content,
      });

      return result.success;
    }

    const result = await emailService.sendEmailWithRateLimit(params.userId, {
      to: user.user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return result.success;
  }

  /**
   * Private: Send realtime notification
   */
  private async sendRealtime(params: {
    userId: string;
    category: NotificationCategory;
    title: string;
    content: string;
    linkUrl?: string;
  }): Promise<boolean> {
    const result = await this.realtimeService.sendRealtimeNotification({
      userId: params.userId,
      title: params.title,
      content: params.content,
      category: params.category,
      linkUrl: params.linkUrl,
    });

    return result.success;
  }
}
