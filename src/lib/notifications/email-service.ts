// @CODE:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TEST: tests/lib/notifications/email-service.test.ts | TAG: TAG-003
import { Resend } from 'resend';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
}

export class EmailService {
  private resend: Resend;
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private readonly MAX_SUBJECT_LENGTH = 200;
  private readonly RETRY_DELAYS = [1000, 3000, 10000]; // 1s, 3s, 10s
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX = 5; // 5 emails per minute
  private rateLimitMap = new Map<string, number[]>(); // userId -> timestamps

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  /**
   * Send email without retry logic
   */
  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    // Validation
    const validationError = this.validatePayload(payload);
    if (validationError) {
      return { success: false, error: validationError };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'T119 <noreply@t119.kr>',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email with exponential backoff retry logic (max 3 attempts)
   */
  async sendEmailWithRetry(payload: EmailPayload): Promise<EmailResult> {
    let retryCount = 0;

    for (let attempt = 0; attempt < 3; attempt++) {
      // Apply delay before retry (skip on first attempt)
      if (attempt > 0) {
        await this.delay(this.RETRY_DELAYS[attempt - 1]);
        retryCount++;
      }

      const result = await this.sendEmail(payload);

      if (result.success) {
        return { ...result, retryCount };
      }

      // If validation error, don't retry
      if (this.isValidationError(result.error)) {
        return { ...result, retryCount };
      }
    }

    return {
      success: false,
      error: 'Max retry attempts reached',
      retryCount: 3,
    };
  }

  /**
   * Send email with rate limiting (5 emails per minute per user)
   */
  async sendEmailWithRateLimit(
    userId: string,
    payload: EmailPayload
  ): Promise<EmailResult> {
    const now = Date.now();
    const userTimestamps = this.rateLimitMap.get(userId) || [];

    // Remove timestamps older than 1 minute
    const recentTimestamps = userTimestamps.filter(
      (ts) => now - ts < this.RATE_LIMIT_WINDOW
    );

    // Check rate limit
    if (recentTimestamps.length >= this.RATE_LIMIT_MAX) {
      return {
        success: false,
        error: 'Rate limit exceeded (max 5 emails per minute)',
      };
    }

    // Send email
    const result = await this.sendEmailWithRetry(payload);

    // Update rate limit tracker on success
    if (result.success) {
      recentTimestamps.push(now);
      this.rateLimitMap.set(userId, recentTimestamps);
    }

    return result;
  }

  /**
   * Render template with variable substitution and XSS prevention
   */
  renderTemplate(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = this.escapeHtml(value);
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), escapedValue);
    }

    return result;
  }

  /**
   * Private: Validate email payload
   */
  private validatePayload(payload: EmailPayload): string | null {
    if (!this.EMAIL_REGEX.test(payload.to)) {
      return 'Invalid email address format';
    }

    if (payload.subject.length > this.MAX_SUBJECT_LENGTH) {
      return `Subject too long (max ${this.MAX_SUBJECT_LENGTH} characters)`;
    }

    return null;
  }

  /**
   * Private: Check if error is a validation error (no retry needed)
   */
  private isValidationError(error?: string): boolean {
    if (!error) return false;
    return (
      error.includes('Invalid email') ||
      error.includes('too long') ||
      error.includes('format')
    );
  }

  /**
   * Private: Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
   * Cleanup: Clear old rate limit entries (call periodically)
   */
  clearOldRateLimitEntries(): void {
    const now = Date.now();
    for (const [userId, timestamps] of this.rateLimitMap.entries()) {
      const recentTimestamps = timestamps.filter(
        (ts) => now - ts < this.RATE_LIMIT_WINDOW
      );
      if (recentTimestamps.length === 0) {
        this.rateLimitMap.delete(userId);
      } else {
        this.rateLimitMap.set(userId, recentTimestamps);
      }
    }
  }
}

// Singleton instance with API key from environment
export const emailService = new EmailService(
  process.env.RESEND_API_KEY || 'test_api_key'
);
