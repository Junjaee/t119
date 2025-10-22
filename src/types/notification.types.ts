// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md
// Notification System TypeScript Types

export type NotificationType = 'email' | 'realtime' | 'sms';

export type NotificationCategory =
  | 'counselor_assigned'
  | 'new_message'
  | 'status_changed'
  | 'reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  content: string;
  link_url?: string;
  is_read: boolean;
  sent_at?: string;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  realtime_enabled: boolean;
  sms_enabled: boolean;
  counselor_assigned: boolean;
  new_message: boolean;
  status_changed: boolean;
  reminder: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  template_key: NotificationCategory;
  subject: string;
  html_content: string;
  plain_text: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  category: NotificationCategory;
  title: string;
  content: string;
  link_url?: string;
  channels: NotificationType[];
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  unread_count: number;
}

export interface NotificationSettingsUpdateInput {
  email_enabled?: boolean;
  realtime_enabled?: boolean;
  sms_enabled?: boolean;
  counselor_assigned?: boolean;
  new_message?: boolean;
  status_changed?: boolean;
  reminder?: boolean;
}
