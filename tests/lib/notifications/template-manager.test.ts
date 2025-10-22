// @TEST:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-006
import { describe, it, expect } from 'vitest';
import { TemplateManager } from '@/lib/notifications/template-manager';

describe('TAG-006: Template Manager', () => {
  const templateManager = new TemplateManager();

  describe('getTemplate', () => {
    it('should return counselor_assigned template', () => {
      const template = templateManager.getTemplate('counselor_assigned');

      expect(template).not.toBeNull();
      expect(template!.subject).toContain('변호사가 배정');
      expect(template!.variables).toContain('counselor_name');
      expect(template!.variables).toContain('counselor_phone');
    });

    it('should return new_message template', () => {
      const template = templateManager.getTemplate('new_message');

      expect(template).not.toBeNull();
      expect(template!.subject).toContain('새로운 메시지');
      expect(template!.variables).toContain('sender_name');
      expect(template!.variables).toContain('message_preview');
    });

    it('should return status_changed template', () => {
      const template = templateManager.getTemplate('status_changed');

      expect(template).not.toBeNull();
      expect(template!.subject).toContain('사건 상태');
      expect(template!.variables).toContain('old_status');
      expect(template!.variables).toContain('new_status');
    });

    it('should return reminder template', () => {
      const template = templateManager.getTemplate('reminder');

      expect(template).not.toBeNull();
      expect(template!.subject).toContain('리마인더');
      expect(template!.variables).toContain('time_left');
      expect(template!.variables).toContain('scheduled_at');
    });
  });

  describe('renderTemplate', () => {
    it('should render counselor_assigned template with data', () => {
      const result = templateManager.renderTemplate('counselor_assigned', {
        counselor_name: '김변호사',
        counselor_phone: '010-1234-5678',
        scheduled_at: '2025-10-25 14:00',
        consultation_link: 'https://t119.kr/consult/123',
      });

      expect(result).not.toBeNull();
      expect(result!.subject).toContain('변호사가 배정');
      expect(result!.html).toContain('김변호사');
      expect(result!.html).toContain('010-1234-5678');
      expect(result!.text).toContain('김변호사');
    });

    it('should render new_message template with data', () => {
      const result = templateManager.renderTemplate('new_message', {
        sender_name: '이변호사',
        message_preview: '상담 일정을 확인해주세요.',
        message_link: 'https://t119.kr/messages/456',
      });

      expect(result).not.toBeNull();
      expect(result!.subject).toContain('새로운 메시지');
      expect(result!.html).toContain('이변호사');
      expect(result!.html).toContain('상담 일정을 확인해주세요');
    });

    it('should escape HTML in variables to prevent XSS', () => {
      const result = templateManager.renderTemplate('new_message', {
        sender_name: '<script>alert("XSS")</script>',
        message_preview: 'Normal text',
        message_link: 'https://t119.kr/messages/789',
      });

      expect(result).not.toBeNull();
      expect(result!.html).not.toContain('<script>');
      expect(result!.html).toContain('&lt;script&gt;');
    });

    it('should handle missing template gracefully', () => {
      // @ts-ignore - testing invalid category
      const result = templateManager.renderTemplate('invalid_category', {
        test: 'data',
      });

      expect(result).toBeNull();
    });
  });
});
