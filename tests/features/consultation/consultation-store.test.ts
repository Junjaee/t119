// @TEST:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * 상담 상태 관리 테스트 (Zustand Store)
 *
 * 테스트 범위:
 * - 메시지 상태 관리
 * - 입력 중 상태 표시
 * - 파일 첨부 상태
 * - 온라인 상태 (Presence)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ConsultationMessage } from '@/types/consultation.types';

describe('@TEST:CONSULT-001 - 상담 상태 관리 (Zustand)', () => {
  describe('메시지 상태 관리', () => {
    it('초기 상태에서 메시지 목록은 빈 배열이어야 한다', async () => {
      // When: useConsultationStore 훅 렌더링
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      // Then: 초기 메시지 목록은 빈 배열
      expect(result.current.messages).toEqual([]);
    });

    it('addMessage로 메시지를 추가할 수 있다', async () => {
      // Given: 새 메시지
      const newMessage: ConsultationMessage = {
        id: 'msg-001',
        consultation_id: 'consult-001',
        sender_id: 'user-001',
        content: '안녕하세요',
        attachments: [],
        is_read: false,
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // When: addMessage 호출
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.addMessage(newMessage);
      });

      // Then: 메시지가 추가됨
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].id).toBe('msg-001');
    });

    it('setMessages로 메시지 목록을 초기화할 수 있다', async () => {
      // Given: 메시지 목록
      const messages: ConsultationMessage[] = [
        {
          id: 'msg-001',
          consultation_id: 'consult-001',
          sender_id: 'user-001',
          content: '첫 번째 메시지',
          attachments: [],
          is_read: false,
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'msg-002',
          consultation_id: 'consult-001',
          sender_id: 'user-002',
          content: '두 번째 메시지',
          attachments: [],
          is_read: false,
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // When: setMessages 호출
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.setMessages(messages);
      });

      // Then: 메시지 목록이 설정됨
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].id).toBe('msg-001');
      expect(result.current.messages[1].id).toBe('msg-002');
    });

    it('clearMessages로 메시지 목록을 초기화할 수 있다', async () => {
      // Given: 기존 메시지가 있는 상태
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.addMessage({
          id: 'msg-001',
          consultation_id: 'consult-001',
          sender_id: 'user-001',
          content: '테스트',
          attachments: [],
          is_read: false,
          retry_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });

      // When: clearMessages 호출
      act(() => {
        result.current.clearMessages();
      });

      // Then: 메시지 목록이 비워짐
      expect(result.current.messages).toEqual([]);
    });
  });

  describe('입력 중 상태', () => {
    it('초기 상태에서 입력 중이 아니어야 한다', async () => {
      // When: useConsultationStore 훅 렌더링
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      // Then: 초기 입력 중 상태는 false
      expect(result.current.isTyping).toBe(false);
    });

    it('setIsTyping으로 입력 중 상태를 변경할 수 있다', async () => {
      // When: setIsTyping 호출
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.setIsTyping(true);
      });

      // Then: 입력 중 상태가 true
      expect(result.current.isTyping).toBe(true);

      // When: setIsTyping(false) 호출
      act(() => {
        result.current.setIsTyping(false);
      });

      // Then: 입력 중 상태가 false
      expect(result.current.isTyping).toBe(false);
    });
  });

  describe('파일 첨부 상태', () => {
    it('초기 상태에서 첨부 파일 목록은 빈 배열이어야 한다', async () => {
      // When: useConsultationStore 훅 렌더링
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      // Then: 초기 첨부 파일 목록은 빈 배열
      expect(result.current.attachments).toEqual([]);
    });

    it('addAttachment로 파일을 추가할 수 있다', async () => {
      // Given: 새 첨부 파일
      const attachment = {
        id: 'att-001',
        name: 'test.pdf',
        size: 1024,
        url: 'https://example.com/test.pdf',
        mime_type: 'application/pdf',
        uploaded_at: new Date().toISOString(),
      };

      // When: addAttachment 호출
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.addAttachment(attachment);
      });

      // Then: 첨부 파일이 추가됨
      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.attachments[0].id).toBe('att-001');
    });

    it('removeAttachment로 파일을 제거할 수 있다', async () => {
      // Given: 첨부 파일이 있는 상태
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.addAttachment({
          id: 'att-001',
          name: 'test.pdf',
          size: 1024,
          url: 'https://example.com/test.pdf',
          mime_type: 'application/pdf',
          uploaded_at: new Date().toISOString(),
        });
      });

      // When: removeAttachment 호출
      act(() => {
        result.current.removeAttachment('att-001');
      });

      // Then: 첨부 파일이 제거됨
      expect(result.current.attachments).toEqual([]);
    });

    it('clearAttachments로 모든 첨부 파일을 제거할 수 있다', async () => {
      // Given: 여러 첨부 파일이 있는 상태
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.addAttachment({
          id: 'att-001',
          name: 'test1.pdf',
          size: 1024,
          url: 'https://example.com/test1.pdf',
          mime_type: 'application/pdf',
          uploaded_at: new Date().toISOString(),
        });
        result.current.addAttachment({
          id: 'att-002',
          name: 'test2.pdf',
          size: 2048,
          url: 'https://example.com/test2.pdf',
          mime_type: 'application/pdf',
          uploaded_at: new Date().toISOString(),
        });
      });

      // When: clearAttachments 호출
      act(() => {
        result.current.clearAttachments();
      });

      // Then: 모든 첨부 파일이 제거됨
      expect(result.current.attachments).toEqual([]);
    });
  });

  describe('온라인 상태 (Presence)', () => {
    it('초기 상태에서 온라인 사용자 목록은 빈 배열이어야 한다', async () => {
      // When: useConsultationStore 훅 렌더링
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      // Then: 초기 온라인 사용자 목록은 빈 배열
      expect(result.current.onlineUsers).toEqual([]);
    });

    it('setOnlineUsers로 온라인 사용자 목록을 설정할 수 있다', async () => {
      // Given: 온라인 사용자 목록
      const onlineUsers = ['user-001', 'user-002'];

      // When: setOnlineUsers 호출
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.setOnlineUsers(onlineUsers);
      });

      // Then: 온라인 사용자 목록이 설정됨
      expect(result.current.onlineUsers).toEqual(onlineUsers);
    });

    it('isUserOnline으로 특정 사용자의 온라인 상태를 확인할 수 있다', async () => {
      // Given: 온라인 사용자 목록
      const { useConsultationStore } = await import('@/features/consultation/store/consultation-store');
      const { result } = renderHook(() => useConsultationStore());

      act(() => {
        result.current.setOnlineUsers(['user-001', 'user-002']);
      });

      // Then: 온라인 사용자는 true
      expect(result.current.isUserOnline('user-001')).toBe(true);
      expect(result.current.isUserOnline('user-002')).toBe(true);

      // Then: 오프라인 사용자는 false
      expect(result.current.isUserOnline('user-003')).toBe(false);
    });
  });
});
