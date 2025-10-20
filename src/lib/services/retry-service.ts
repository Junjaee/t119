// @CODE:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md | TEST: tests/features/consultation/retry-logic.test.ts
/**
 * 재전송 로직 서비스
 *
 * 주요 기능:
 * - 메시지 전송 실패 시 자동 재전송
 * - 지수 백오프 (Exponential Backoff)
 * - 재전송 횟수 제한 (최대 3회)
 * - 재전송 카운트 저장
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SendMessageInput,
  SendMessageResult,
  RetryOptions,
} from '@/types/consultation.types';

/**
 * SPEC 기본값
 *
 * @SPEC:CONSULT-001 - 제약사항
 * - 재전송 횟수: 최대 3회
 * - 지수 백오프: 1s → 2s → 4s
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000, // 1초
  maxDelay: 8000, // 8초 (1 + 2 + 4)
};

/**
 * 기본 재전송 옵션 생성
 */
export function createDefaultRetryOptions(): RetryOptions {
  return { ...DEFAULT_RETRY_OPTIONS };
}

/**
 * 재전송 지연 시간 계산 (지수 백오프)
 *
 * @SPEC:CONSULT-001 - Event-driven Requirements
 * 지수 백오프로 재전송 (1s → 2s → 4s)
 */
export function getRetryDelay(
  attemptNumber: number,
  options: RetryOptions
): number {
  const delay = options.baseDelay * Math.pow(2, attemptNumber);
  return Math.min(delay, options.maxDelay);
}

/**
 * 재전송 가능 여부 확인
 *
 * @SPEC:CONSULT-001 - 제약사항
 * retry_count ≤ 3
 */
export async function canRetry(
  supabase: SupabaseClient,
  messageId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('retry_count')
      .eq('id', messageId)
      .single();

    if (error) {
      return false;
    }

    return data.retry_count < DEFAULT_RETRY_OPTIONS.maxRetries;
  } catch {
    return false;
  }
}

/**
 * 재전송 카운트 증가
 */
export async function incrementRetryCount(
  supabase: SupabaseClient,
  messageId: string
): Promise<{ success: boolean; retryCount?: number; error?: string }> {
  try {
    // 현재 retry_count 조회
    const { data: currentMessage, error: fetchError } = await supabase
      .from('messages')
      .select('retry_count')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      };
    }

    const newRetryCount = (currentMessage.retry_count || 0) + 1;

    // retry_count 증가
    const { data, error } = await supabase
      .from('messages')
      .update({
        retry_count: newRetryCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select('id, retry_count')
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      retryCount: data.retry_count,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '재전송 카운트 증가 실패',
    };
  }
}

/**
 * 재전송 로직이 포함된 메시지 전송
 *
 * @SPEC:CONSULT-001 - Event-driven Requirements
 * WHEN 메시지 전송이 실패하면, 시스템은 최대 3회까지 재전송을 시도해야 한다
 */
export async function sendMessageWithRetry(
  sendFunction: (input: SendMessageInput) => Promise<SendMessageResult>,
  input: SendMessageInput,
  options: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<SendMessageResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      // 메시지 전송 시도
      const result = await sendFunction(input);

      if (result.success) {
        return result;
      }

      // 전송 실패
      lastError = new Error(result.error || 'Unknown error');

      // 최대 재전송 횟수 도달
      if (attempt >= options.maxRetries) {
        break;
      }

      // 지수 백오프 대기
      const delay = getRetryDelay(attempt, options);
      await sleep(delay);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // 최대 재전송 횟수 도달
      if (attempt >= options.maxRetries) {
        break;
      }

      // 지수 백오프 대기
      const delay = getRetryDelay(attempt, options);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: `최대 재시도 횟수(${options.maxRetries}회)를 초과했습니다. ${
      lastError?.message || ''
    }`,
  };
}

/**
 * 실패한 메시지 재전송
 *
 * @SPEC:CONSULT-001 - 재전송 로직
 */
export async function retryFailedMessage(
  supabase: SupabaseClient,
  sendFunction: (input: SendMessageInput) => Promise<SendMessageResult>,
  messageId: string
): Promise<SendMessageResult> {
  try {
    // 재전송 가능 여부 확인
    const canRetryMessage = await canRetry(supabase, messageId);
    if (!canRetryMessage) {
      return {
        success: false,
        error: '재전송 횟수를 초과했습니다.',
      };
    }

    // 메시지 조회
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      };
    }

    // 재전송 카운트 증가
    await incrementRetryCount(supabase, messageId);

    // 재전송 시도
    const input: SendMessageInput = {
      consultationId: message.consultation_id,
      content: message.content,
      senderId: message.sender_id,
      attachments: message.attachments || [],
    };

    return await sendFunction(input);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '재전송에 실패했습니다.',
    };
  }
}

/**
 * 지연 유틸리티
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
