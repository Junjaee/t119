// @TEST:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * 재전송 로직 테스트
 *
 * 테스트 범위:
 * - 메시지 전송 실패 시 재전송
 * - 재전송 횟수 제한 (최대 3회)
 * - 지수 백오프
 * - 재전송 실패 후 에러 처리
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  SendMessageInput,
  RetryOptions,
} from '@/types/consultation.types';

describe('@TEST:CONSULT-001 - 재전송 로직', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('재전송 횟수 제한', () => {
    it('3회 재전송 후 실패 시 에러 반환', async () => {
      // Given: 항상 실패하는 전송 함수
      const mockSendMessage = vi.fn().mockRejectedValue(
        new Error('Network error')
      );

      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '테스트 메시지',
        senderId: 'test-sender-id',
      };

      const retryOptions: RetryOptions = {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 5000,
      };

      // When: sendMessageWithRetry 호출
      const { sendMessageWithRetry } = await import(
        '@/lib/services/retry-service'
      );
      const result = await sendMessageWithRetry(
        mockSendMessage,
        input,
        retryOptions
      );

      // Then: 4번 시도 (초기 1회 + 재전송 3회)
      expect(mockSendMessage).toHaveBeenCalledTimes(4);
      expect(result.success).toBe(false);
      expect(result.error).toContain('최대 재시도');
    });

    it('재전송 성공 시 즉시 반환', async () => {
      // Given: 2번째 시도에서 성공하는 전송 함수
      let attemptCount = 0;
      const mockSendMessage = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 2) {
          return Promise.resolve({
            success: true,
            messageId: 'test-message-id',
          });
        }
        return Promise.reject(new Error('Network error'));
      });

      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '테스트 메시지',
        senderId: 'test-sender-id',
      };

      const retryOptions: RetryOptions = {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 5000,
      };

      // When: sendMessageWithRetry 호출
      const { sendMessageWithRetry } = await import(
        '@/lib/services/retry-service'
      );
      const result = await sendMessageWithRetry(
        mockSendMessage,
        input,
        retryOptions
      );

      // Then: 2번만 시도
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });
  });

  describe('지수 백오프', () => {
    it('재전송 지연 시간이 지수적으로 증가', async () => {
      // Given: getRetryDelay 함수만 테스트
      const retryOptions: RetryOptions = {
        maxRetries: 3,
        baseDelay: 1000, // 1초
        maxDelay: 10000,
      };

      // When: getRetryDelay 호출
      const { getRetryDelay } = await import('@/lib/services/retry-service');

      // Then: 지연 시간이 지수적으로 증가
      expect(getRetryDelay(0, retryOptions)).toBe(1000); // 1초
      expect(getRetryDelay(1, retryOptions)).toBe(2000); // 2초
      expect(getRetryDelay(2, retryOptions)).toBe(4000); // 4초
      expect(getRetryDelay(3, retryOptions)).toBe(8000); // 8초
    });

    it('최대 지연 시간을 초과하지 않음', async () => {
      // Given: 항상 실패하는 전송 함수
      const mockSendMessage = vi.fn().mockRejectedValue(
        new Error('Network error')
      );

      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '테스트 메시지',
        senderId: 'test-sender-id',
      };

      const retryOptions: RetryOptions = {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 3000, // 최대 3초
      };

      // When: getRetryDelay 호출
      const { getRetryDelay } = await import('@/lib/services/retry-service');

      // Then: 지연 시간 확인
      expect(getRetryDelay(0, retryOptions)).toBe(1000); // 1초
      expect(getRetryDelay(1, retryOptions)).toBe(2000); // 2초
      expect(getRetryDelay(2, retryOptions)).toBe(3000); // 3초 (최대값)
      expect(getRetryDelay(3, retryOptions)).toBe(3000); // 3초 (최대값 유지)
      expect(getRetryDelay(4, retryOptions)).toBe(3000); // 3초 (최대값 유지)
    });
  });

  describe('재전송 카운트 저장', () => {
    it('재전송 시 retry_count 증가', async () => {
      // Given: 재전송이 필요한 메시지
      const messageId = 'test-message-id';
      let currentRetryCount = 0;

      // SELECT mock (retry_count 조회)
      const mockSelectSingle = vi.fn().mockImplementation(() => {
        return Promise.resolve({
          data: {
            retry_count: currentRetryCount,
          },
          error: null,
        });
      });

      const mockSelectEq = vi.fn().mockReturnValue({
        single: mockSelectSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockSelectEq,
      });

      // UPDATE mock (retry_count 증가)
      const mockUpdateSingle = vi.fn().mockImplementation(() => {
        currentRetryCount++;
        return Promise.resolve({
          data: {
            id: messageId,
            retry_count: currentRetryCount,
          },
          error: null,
        });
      });

      const mockUpdateSelect = vi.fn().mockReturnValue({
        single: mockUpdateSingle,
      });

      const mockUpdateEq = vi.fn().mockReturnValue({
        select: mockUpdateSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockUpdateEq,
      });

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (mockSelect.mock.calls.length <= mockUpdate.mock.calls.length) {
            return { select: mockSelect };
          } else {
            return { update: mockUpdate };
          }
        }),
      };

      // When: incrementRetryCount 호출 (3회)
      const { incrementRetryCount } = await import(
        '@/lib/services/retry-service'
      );

      await incrementRetryCount(mockSupabase as any, messageId);
      await incrementRetryCount(mockSupabase as any, messageId);
      await incrementRetryCount(mockSupabase as any, messageId);

      // Then: retry_count가 3
      expect(currentRetryCount).toBe(3);
    });

    it('retry_count가 3을 초과하면 재전송 거부', async () => {
      // Given: retry_count가 3인 메시지
      const messageId = 'test-message-id';

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: {
              id: messageId,
              retry_count: 3,
            },
            error: null,
          }),
        }),
      };

      // When: canRetry 호출
      const { canRetry } = await import('@/lib/services/retry-service');
      const result = await canRetry(mockSupabase as any, messageId);

      // Then: 재전송 불가
      expect(result).toBe(false);
    });
  });

  describe('SPEC 준수', () => {
    it('SPEC에 명시된 재전송 정책 준수', async () => {
      // Given: SPEC 정책
      const SPEC_MAX_RETRIES = 3;
      const SPEC_BASE_DELAY = 1000; // 1s → 2s → 4s

      // When: 재전송 옵션 생성
      const { createDefaultRetryOptions } = await import(
        '@/lib/services/retry-service'
      );
      const options = createDefaultRetryOptions();

      // Then: SPEC 준수
      expect(options.maxRetries).toBe(SPEC_MAX_RETRIES);
      expect(options.baseDelay).toBe(SPEC_BASE_DELAY);
    });
  });
});
