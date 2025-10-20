// @CODE:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md | TEST: tests/features/consultation/realtime-messaging.test.ts
/**
 * 실시간 상담 메시징 서비스
 *
 * 주요 기능:
 * - 메시지 검증 및 전송
 * - 메시지 저장 및 조회
 * - 읽음 상태 관리
 * - Realtime 채널 구독/해제
 * - 재연결 로직
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SendMessageInput,
  MessageValidationResult,
  SendMessageResult,
  SaveMessageResult,
  MarkAsReadResult,
  RealtimeMessagePayload,
} from '@/types/consultation.types';

// 제약사항 상수
const MAX_MESSAGE_LENGTH = 5000;

// Re-export from realtime-subscription module
export {
  subscribeToConsultation,
  unsubscribeFromConsultation,
  subscribeWithRetry,
} from './realtime-subscription';

/**
 * 메시지 검증
 *
 * @SPEC:CONSULT-001 - 제약사항
 * - 메시지 길이 ≤ 5000자
 * - 빈 메시지 거부
 */
export function validateMessage(
  input: SendMessageInput
): MessageValidationResult {
  // 빈 메시지 검증
  if (!input.content || input.content.trim().length === 0) {
    return {
      isValid: false,
      error: '메시지 내용을 입력해주세요.',
    };
  }

  // 길이 검증
  if (input.content.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `메시지는 ${MAX_MESSAGE_LENGTH}자를 초과할 수 없습니다.`,
    };
  }

  return { isValid: true };
}

/**
 * 메시지 전송 (Realtime)
 *
 * @SPEC:CONSULT-001 - Event-driven Requirements
 * WHEN 사용자가 메시지를 전송하면, 시스템은 즉시 WebSocket으로 전송해야 한다
 */
export async function sendMessage(
  supabase: SupabaseClient,
  input: SendMessageInput
): Promise<SendMessageResult> {
  try {
    // 메시지 검증
    const validation = validateMessage(input);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // 먼저 데이터베이스에 저장
    const saveResult = await saveMessage(supabase, input);
    if (!saveResult.success || !saveResult.data) {
      return {
        success: false,
        error: saveResult.error || '메시지 저장에 실패했습니다.',
      };
    }

    // Realtime으로 전송
    const channel = supabase.channel(`consultation:${input.consultationId}`);

    const payload: RealtimeMessagePayload = {
      id: saveResult.data.id,
      consultation_id: input.consultationId,
      sender_id: input.senderId,
      content: input.content,
      attachments: input.attachments || [],
      created_at: saveResult.data.created_at,
    };

    await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload,
    });

    return {
      success: true,
      messageId: saveResult.data.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '메시지 전송에 실패했습니다.',
    };
  }
}

/**
 * 메시지 데이터베이스 저장
 *
 * @SPEC:CONSULT-001 - Ubiquitous Requirements
 * 시스템은 모든 메시지를 데이터베이스에 영구 저장해야 한다
 */
export async function saveMessage(
  supabase: SupabaseClient,
  input: SendMessageInput
): Promise<SaveMessageResult> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        consultation_id: input.consultationId,
        sender_id: input.senderId,
        content: input.content,
        attachments: input.attachments || [],
        is_read: false,
        retry_count: 0,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '메시지 저장에 실패했습니다.',
    };
  }
}

/**
 * 메시지 읽음 처리
 *
 * @SPEC:CONSULT-001 - Event-driven Requirements
 * WHEN 상대방이 메시지를 읽으면, 시스템은 읽음 상태를 업데이트하고 발신자에게 알려야 한다
 */
export async function markAsRead(
  supabase: SupabaseClient,
  messageId: string,
  userId: string
): Promise<MarkAsReadResult> {
  try {
    // 메시지 조회 (본인 메시지인지 확인)
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('sender_id, is_read')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      };
    }

    // 본인이 보낸 메시지는 읽음 처리 불가
    if (message.sender_id === userId) {
      return {
        success: false,
        error: '본인이 보낸 메시지는 읽음 처리할 수 없습니다.',
      };
    }

    // 이미 읽은 메시지
    if (message.is_read) {
      return {
        success: true,
        data: {
          id: messageId,
          is_read: true,
          read_at: new Date().toISOString(),
        },
      };
    }

    // 읽음 상태 업데이트
    const { data, error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select('id, is_read, read_at')
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '읽음 처리에 실패했습니다.',
    };
  }
}

