// @TEST:NOTIFICATION-001 | SPEC: SPEC-NOTIFICATION-001.md | TAG: TAG-003
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '@/lib/notifications/email-service';

// Mock Resend
vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn(),
      },
    })),
  };
});

describe('TAG-003: Email Service', () => {
  let emailService: EmailService;
  let mockSend: any;

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService('test_api_key');
    // @ts-ignore - accessing private property for testing
    mockSend = emailService.resend.emails.send;
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email_123');
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith({
        from: 'T119 <noreply@t119.kr>',
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });
    });

    it('should return error on send failure', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { message: 'Send failed' },
      });

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Send failed');
    });

    it('should handle network errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'));

      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should validate email address format', async () => {
      const result = await emailService.sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should enforce subject length constraint', async () => {
      const longSubject = 'a'.repeat(201);
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: longSubject,
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Subject too long');
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('sendEmailWithRetry', () => {
    it('should retry on failure with exponential backoff', async () => {
      // Fail first 2 attempts, succeed on 3rd
      mockSend
        .mockResolvedValueOnce({ data: null, error: { message: 'Fail 1' } })
        .mockResolvedValueOnce({ data: null, error: { message: 'Fail 2' } })
        .mockResolvedValueOnce({ data: { id: 'email_123' }, error: null });

      const startTime = Date.now();
      const result = await emailService.sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email_123');
      expect(result.retryCount).toBe(2);
      expect(mockSend).toHaveBeenCalledTimes(3);

      // Verify exponential backoff timing (1s + 3s = ~4s minimum)
      expect(duration).toBeGreaterThanOrEqual(4000);
      expect(duration).toBeLessThan(6000);
    });

    it('should fail after max retries (3 attempts)', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Persistent failure' },
      });

      const result = await emailService.sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.retryCount).toBe(3);
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    it('should succeed on first try without retry', async () => {
      mockSend.mockResolvedValueOnce({
        data: { id: 'email_123' },
        error: null,
      });

      const startTime = Date.now();
      const result = await emailService.sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
        text: 'Test',
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(0);
      expect(mockSend).toHaveBeenCalledTimes(1);

      // Should complete quickly without retry delays
      expect(duration).toBeLessThan(1000);
    });

    it('should use correct backoff intervals (1s, 3s, 10s)', async () => {
      const intervals: number[] = [];
      let lastTime: number;
      let callCount = 0;

      mockSend.mockImplementation(async () => {
        const currentTime = Date.now();
        if (callCount === 0) {
          // First call - record start time
          lastTime = currentTime;
        } else {
          // Subsequent calls - record interval
          intervals.push(currentTime - lastTime);
          lastTime = currentTime;
        }
        callCount++;
        return { data: null, error: { message: 'Retry test' } };
      });

      await emailService.sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });

      expect(intervals).toHaveLength(2);
      // 1st retry after ~1s
      expect(intervals[0]).toBeGreaterThanOrEqual(1000);
      expect(intervals[0]).toBeLessThan(1500);
      // 2nd retry after ~3s
      expect(intervals[1]).toBeGreaterThanOrEqual(3000);
      expect(intervals[1]).toBeLessThan(3500);
    });
  });

  describe('renderTemplate', () => {
    it('should substitute variables in template', () => {
      const template = 'Hello {name}, your code is {code}';
      const variables = { name: 'John', code: '1234' };

      const result = emailService.renderTemplate(template, variables);

      expect(result).toBe('Hello John, your code is 1234');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {name}, your code is {code}';
      const variables = { name: 'John' };

      const result = emailService.renderTemplate(template, variables);

      expect(result).toBe('Hello John, your code is {code}');
    });

    it('should escape HTML in variables to prevent XSS', () => {
      const template = 'Message: {message}';
      const variables = { message: '<script>alert("XSS")</script>' };

      const result = emailService.renderTemplate(template, variables);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limit (5 emails per minute per user)', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const userId = 'user_123';
      const results: boolean[] = [];

      // Send 6 emails rapidly
      for (let i = 0; i < 6; i++) {
        const result = await emailService.sendEmailWithRateLimit(
          userId,
          {
            to: 'test@example.com',
            subject: `Test ${i}`,
            html: '<p>Test</p>',
            text: 'Test',
          }
        );
        results.push(result.success);
      }

      // First 5 should succeed, 6th should be rate limited
      expect(results.slice(0, 5)).toEqual([true, true, true, true, true]);
      expect(results[5]).toBe(false);
    });
  });
});
