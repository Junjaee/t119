// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-006
import type { NotificationCategory } from '@/types/notification.types';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
  variables: string[];
}

interface TemplateData {
  [key: string]: string;
}

export class TemplateManager {
  private templates: Map<NotificationCategory, EmailTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  /**
   * Get template by category
   */
  getTemplate(category: NotificationCategory): EmailTemplate | null {
    return this.templates.get(category) || null;
  }

  /**
   * Render template with data
   */
  renderTemplate(
    category: NotificationCategory,
    data: TemplateData
  ): { subject: string; html: string; text: string } | null {
    const template = this.getTemplate(category);
    if (!template) {
      return null;
    }

    return {
      subject: this.substituteVariables(template.subject, data),
      html: this.substituteVariables(template.html, data),
      text: this.substituteVariables(template.text, data),
    };
  }

  /**
   * Private: Substitute variables in template string
   */
  private substituteVariables(template: string, data: TemplateData): string {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      const escapedValue = this.escapeHtml(value);
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), escapedValue);
    }

    return result;
  }

  /**
   * Private: Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
  }

  /**
   * Private: Initialize built-in templates
   */
  private initializeTemplates(): void {
    // Counselor Assigned Template
    this.templates.set('counselor_assigned', {
      subject: '[T119] 변호사가 배정되었습니다',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6; font-size: 24px; margin-bottom: 20px;">변호사가 배정되었습니다</h1>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            안녕하세요. T119입니다.<br>
            귀하의 상담을 담당할 변호사가 배정되었습니다.
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>변호사명:</strong> {counselor_name}</p>
            <p style="margin: 5px 0;"><strong>연락처:</strong> {counselor_phone}</p>
            <p style="margin: 5px 0;"><strong>상담 일시:</strong> {scheduled_at}</p>
          </div>
          <a href="{consultation_link}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">상담 상세보기</a>
        </div>
      `,
      text: `변호사가 배정되었습니다\n\n안녕하세요. T119입니다.\n귀하의 상담을 담당할 변호사가 배정되었습니다.\n\n변호사명: {counselor_name}\n연락처: {counselor_phone}\n상담 일시: {scheduled_at}\n\n상담 상세보기: {consultation_link}`,
      variables: ['counselor_name', 'counselor_phone', 'scheduled_at', 'consultation_link'],
    });

    // New Message Template
    this.templates.set('new_message', {
      subject: '[T119] 새로운 메시지가 도착했습니다',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981; font-size: 24px; margin-bottom: 20px;">새로운 메시지</h1>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            {sender_name}님으로부터 메시지가 도착했습니다.
          </p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0;">{message_preview}</p>
          </div>
          <a href="{message_link}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">메시지 확인하기</a>
        </div>
      `,
      text: `새로운 메시지\n\n{sender_name}님으로부터 메시지가 도착했습니다.\n\n{message_preview}\n\n메시지 확인하기: {message_link}`,
      variables: ['sender_name', 'message_preview', 'message_link'],
    });

    // Status Changed Template
    this.templates.set('status_changed', {
      subject: '[T119] 사건 상태가 변경되었습니다',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px;">사건 상태 변경</h1>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            사건 상태가 변경되었습니다.
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>이전 상태:</strong> {old_status}</p>
            <p style="margin: 5px 0;"><strong>현재 상태:</strong> {new_status}</p>
          </div>
          <a href="{case_link}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">사건 상세보기</a>
        </div>
      `,
      text: `사건 상태 변경\n\n사건 상태가 변경되었습니다.\n\n이전 상태: {old_status}\n현재 상태: {new_status}\n\n사건 상세보기: {case_link}`,
      variables: ['old_status', 'new_status', 'case_link'],
    });

    // Reminder Template
    this.templates.set('reminder', {
      subject: '[T119] 상담 일정 리마인더',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 20px;">상담 리마인더</h1>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            {time_left} 후 상담이 시작됩니다.
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>일시:</strong> {scheduled_at}</p>
            <p style="margin: 5px 0;"><strong>장소:</strong> {location}</p>
          </div>
          <a href="{consultation_link}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">상담 상세보기</a>
        </div>
      `,
      text: `상담 리마인더\n\n{time_left} 후 상담이 시작됩니다.\n\n일시: {scheduled_at}\n장소: {location}\n\n상담 상세보기: {consultation_link}`,
      variables: ['time_left', 'scheduled_at', 'location', 'consultation_link'],
    });
  }
}

// Singleton instance
export const templateManager = new TemplateManager();
