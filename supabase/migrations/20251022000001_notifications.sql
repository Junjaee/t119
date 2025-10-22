-- @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-002
-- Migration: Notification System Tables
-- Created: 2025-10-22

-- =====================================================
-- 1. notifications table
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'realtime', 'sms')),
  category TEXT NOT NULL CHECK (category IN ('counselor_assigned', 'new_message', 'status_changed', 'reminder')),
  title TEXT NOT NULL CHECK (length(title) <= 100),
  content TEXT NOT NULL CHECK (length(content) <= 500),
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0 AND failed_count <= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only system can insert notifications (via service role)
CREATE POLICY notifications_insert_system ON notifications
  FOR INSERT
  WITH CHECK (true);  -- Service role bypasses RLS

-- =====================================================
-- 2. notification_settings table
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  realtime_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  counselor_assigned BOOLEAN NOT NULL DEFAULT true,
  new_message BOOLEAN NOT NULL DEFAULT true,
  status_changed BOOLEAN NOT NULL DEFAULT true,
  reminder BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookup
CREATE UNIQUE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- RLS Policies
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read their own settings
CREATE POLICY notification_settings_select_own ON notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own settings
CREATE POLICY notification_settings_update_own ON notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY notification_settings_insert_own ON notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. email_templates table
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE CHECK (template_key IN ('counselor_assigned', 'new_message', 'status_changed', 'reminder')),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  plain_text TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for template lookup
CREATE UNIQUE INDEX idx_email_templates_key ON email_templates(template_key);

-- RLS Policies (read-only for all authenticated users)
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_select_all ON email_templates
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can modify templates
CREATE POLICY email_templates_modify_system ON email_templates
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 4. Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Seed default email templates
-- =====================================================
INSERT INTO email_templates (template_key, subject, html_content, plain_text, variables)
VALUES
  (
    'counselor_assigned',
    '[T119] 변호사가 배정되었습니다',
    '<h1>변호사가 배정되었습니다</h1><p>변호사명: {counselor_name}</p><p>연락처: {counselor_phone}</p><p>상담 일시: {scheduled_at}</p>',
    '변호사가 배정되었습니다\n변호사명: {counselor_name}\n연락처: {counselor_phone}\n상담 일시: {scheduled_at}',
    ARRAY['counselor_name', 'counselor_phone', 'scheduled_at', 'consultation_link']
  ),
  (
    'new_message',
    '[T119] 새로운 메시지가 도착했습니다',
    '<h1>새로운 메시지</h1><p>{sender_name}님으로부터 메시지가 도착했습니다.</p><p>{message_preview}</p>',
    '새로운 메시지\n{sender_name}님으로부터 메시지가 도착했습니다.\n{message_preview}',
    ARRAY['sender_name', 'message_preview', 'message_link']
  ),
  (
    'status_changed',
    '[T119] 사건 상태가 변경되었습니다',
    '<h1>사건 상태 변경</h1><p>사건 상태가 {old_status}에서 {new_status}로 변경되었습니다.</p>',
    '사건 상태 변경\n사건 상태가 {old_status}에서 {new_status}로 변경되었습니다.',
    ARRAY['old_status', 'new_status', 'case_link']
  ),
  (
    'reminder',
    '[T119] 상담 일정 리마인더',
    '<h1>상담 리마인더</h1><p>{time_left} 후 상담이 시작됩니다.</p><p>일시: {scheduled_at}</p><p>장소: {location}</p>',
    '상담 리마인더\n{time_left} 후 상담이 시작됩니다.\n일시: {scheduled_at}\n장소: {location}',
    ARRAY['time_left', 'scheduled_at', 'location', 'consultation_link']
  )
ON CONFLICT (template_key) DO NOTHING;

-- =====================================================
-- 6. Function: Auto-delete notifications older than 30 days
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Comments for documentation
-- =====================================================
COMMENT ON TABLE notifications IS 'Stores all notification records (email, realtime, sms)';
COMMENT ON TABLE notification_settings IS 'User-specific notification preferences';
COMMENT ON TABLE email_templates IS 'Email template definitions with variable substitution';
COMMENT ON COLUMN notifications.failed_count IS 'Retry count for failed notifications (max 3)';
COMMENT ON COLUMN notification_settings.user_id IS 'One-to-one relationship with users';
