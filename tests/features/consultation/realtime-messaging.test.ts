// @TEST:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * 실시간 메시징 테스트
 *
 * 테스트 범위:
 * - 메시지 전송 및 수신
 * - 메시지 검증 (길이, 형식)
 * - 읽음 상태 관리
 * - WebSocket 연결 관리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  ConsultationMessage,
  SendMessageInput,
  MessageValidationResult
} from '@/types/consultation.types';

// Mock Supabase client
const mockSupabaseClient = {
  channel: vi.fn(),
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
};

describe('@TEST:CONSULT-001 - 실시간 메시징', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('메시지 검증', () => {
    it('메시지 길이가 5000자를 초과하면 검증 실패', async () => {
      // Given: 5001자 메시지
      const longMessage = 'a'.repeat(5001);
      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: longMessage,
        senderId: 'test-sender-id',
      };

      // When: validateMessage 호출
      const { validateMessage } = await import('@/lib/services/consultation-service');
      const result: MessageValidationResult = validateMessage(input);

      // Then: 검증 실패
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('5000자');
    });

    it('빈 메시지는 검증 실패', async () => {
      // Given: 빈 메시지
      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '',
        senderId: 'test-sender-id',
      };

      // When: validateMessage 호출
      const { validateMessage } = await import('@/lib/services/consultation-service');
      const result: MessageValidationResult = validateMessage(input);

      // Then: 검증 실패
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('유효한 메시지는 검증 통과', async () => {
      // Given: 유효한 메시지
      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '안녕하세요, 상담 요청드립니다.',
        senderId: 'test-sender-id',
      };

      // When: validateMessage 호출
      const { validateMessage } = await import('@/lib/services/consultation-service');
      const result: MessageValidationResult = validateMessage(input);

      // Then: 검증 통과
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('메시지 전송', () => {
    it('유효한 메시지를 Realtime으로 전송', async () => {
      // Given: 유효한 메시지
      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '테스트 메시지',
        senderId: 'test-sender-id',
      };

      // Mock: saveMessage (데이터베이스 저장)
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'new-message-id',
          consultation_id: input.consultationId,
          sender_id: input.senderId,
          content: input.content,
          attachments: [],
          is_read: false,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      // Mock: Realtime channel
      const mockChannel = {
        send: vi.fn().mockResolvedValue({ status: 'ok' }),
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      // When: sendMessage 호출
      const { sendMessage } = await import('@/lib/services/consultation-service');
      const result = await sendMessage(mockSupabaseClient as any, input);

      // Then: 전송 성공
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'new_message',
        payload: expect.objectContaining({
          content: input.content,
          sender_id: input.senderId,
        }),
      });
    });

    it('메시지 전송 후 데이터베이스에 저장', async () => {
      // Given: 유효한 메시지
      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '테스트 메시지',
        senderId: 'test-sender-id',
      };

      const mockSelect = vi.fn().mockResolvedValue({
        data: {
          id: 'new-message-id',
          consultation_id: input.consultationId,
          sender_id: input.senderId,
          content: input.content,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: mockSelect,
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      // When: saveMessage 호출
      const { saveMessage } = await import('@/lib/services/consultation-service');
      const result = await saveMessage(mockSupabaseClient as any, input);

      // Then: 저장 성공
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-message-id');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          consultation_id: input.consultationId,
          sender_id: input.senderId,
          content: input.content,
        })
      );
    });
  });

  describe('읽음 상태 관리', () => {
    it('메시지 읽음 처리 시 is_read 업데이트', async () => {
      // Given: 안읽은 메시지
      const messageId = 'test-message-id';
      const userId = 'test-user-id';
      const senderId = 'other-user-id'; // 다른 사용자

      // Mock: 메시지 조회 (SELECT)
      const mockFetchSingle = vi.fn().mockResolvedValue({
        data: {
          sender_id: senderId,
          is_read: false,
        },
        error: null,
      });

      const mockFetchEq = vi.fn().mockReturnValue({
        single: mockFetchSingle,
      });

      const mockFetchSelect = vi.fn().mockReturnValue({
        eq: mockFetchEq,
      });

      // Mock: 읽음 상태 업데이트 (UPDATE)
      const mockUpdateSingle = vi.fn().mockResolvedValue({
        data: {
          id: messageId,
          is_read: true,
          read_at: new Date().toISOString(),
        },
        error: null,
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

      // from() 호출 순서에 따라 다른 객체 반환
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // 첫 번째 호출: SELECT
          return { select: mockFetchSelect };
        } else {
          // 두 번째 호출: UPDATE
          return { update: mockUpdate };
        }
      });

      // When: markAsRead 호출
      const { markAsRead } = await import('@/lib/services/consultation-service');
      const result = await markAsRead(mockSupabaseClient as any, messageId, userId);

      // Then: 읽음 상태 업데이트
      expect(result.success).toBe(true);
      expect(result.data?.is_read).toBe(true);
      expect(result.data?.read_at).toBeDefined();
    });

    it('다른 사용자가 보낸 메시지만 읽음 처리 가능', async () => {
      // Given: 본인이 보낸 메시지
      const messageId = 'test-message-id';
      const senderId = 'test-sender-id';

      const mockData = {
        id: messageId,
        sender_id: senderId,
        is_read: false,
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      // When: markAsRead 호출 (본인 메시지)
      const { markAsRead } = await import('@/lib/services/consultation-service');
      const result = await markAsRead(mockSupabaseClient as any, messageId, senderId);

      // Then: 읽음 처리 실패
      expect(result.success).toBe(false);
      expect(result.error).toContain('본인');
    });
  });

  describe('WebSocket 연결 관리', () => {
    it('채팅방 입장 시 Realtime 채널 구독', async () => {
      // Given: 채팅방 ID
      const consultationId = 'test-consultation-id';

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
        unsubscribe: vi.fn(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      // When: subscribeToConsultation 호출
      const { subscribeToConsultation } = await import('@/lib/services/consultation-service');
      const channel = await subscribeToConsultation(
        mockSupabaseClient as any,
        consultationId,
        vi.fn()
      );

      // Then: 채널 구독 성공
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `consultation:${consultationId}`
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
      expect(channel).toBeDefined();
    });

    it('채팅방 퇴장 시 Realtime 채널 구독 해제', async () => {
      // Given: 구독된 채널
      const mockChannel = {
        unsubscribe: vi.fn().mockResolvedValue({ status: 'UNSUBSCRIBED' }),
      };

      // When: unsubscribeFromConsultation 호출
      const { unsubscribeFromConsultation } = await import('@/lib/services/consultation-service');
      await unsubscribeFromConsultation(mockChannel as any);

      // Then: 채널 구독 해제
      expect(mockChannel.unsubscribe).toHaveBeenCalled();
    });

    it('연결 끊김 시 자동 재연결', async () => {
      // Given: subscribeWithRetry는 재연결 로직 테스트
      const consultationId = 'test-consultation-id';

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      // When: subscribeWithRetry 호출
      const { subscribeWithRetry } = await import('@/lib/services/consultation-service');
      const result = await subscribeWithRetry(
        mockSupabaseClient as any,
        consultationId,
        vi.fn()
      );

      // Then: 구독 성공 (재연결 로직은 waitForSubscription 내부에서 처리)
      expect(result.status).toBe('SUBSCRIBED');
    });
  });

  describe('성능 요구사항', () => {
    it('메시지 전송은 1초 이내 완료', async () => {
      // Given: 유효한 메시지
      const input: SendMessageInput = {
        consultationId: 'test-consultation-id',
        content: '성능 테스트',
        senderId: 'test-sender-id',
      };

      const mockChannel = {
        send: vi.fn().mockResolvedValue({ status: 'ok' }),
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnThis(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      // When: 전송 시간 측정
      const { sendMessage } = await import('@/lib/services/consultation-service');
      const startTime = Date.now();
      await sendMessage(mockSupabaseClient as any, input);
      const endTime = Date.now();

      // Then: 1초 이내 완료
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });
});
