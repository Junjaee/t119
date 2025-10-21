// @CODE:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md | TEST: tests/features/consultation/consultation-store.test.ts
/**
 * 상담 상태 관리 (Zustand Store)
 *
 * 주요 기능:
 * - 메시지 목록 관리
 * - 입력 중 상태 관리
 * - 파일 첨부 상태 관리
 * - 온라인 상태 관리 (Presence)
 */

import { create } from 'zustand';
import type { ConsultationMessage, Attachment } from '@/types/consultation.types';

interface ConsultationState {
  // 메시지 상태
  messages: ConsultationMessage[];
  addMessage: (message: ConsultationMessage) => void;
  setMessages: (messages: ConsultationMessage[]) => void;
  clearMessages: () => void;

  // 입력 중 상태
  isTyping: boolean;
  setIsTyping: (isTyping: boolean) => void;

  // 파일 첨부 상태
  attachments: Attachment[];
  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (attachmentId: string) => void;
  clearAttachments: () => void;

  // 온라인 상태 (Presence)
  onlineUsers: string[];
  setOnlineUsers: (userIds: string[]) => void;
  isUserOnline: (userId: string) => boolean;
}

/**
 * 상담 상태 관리 훅
 *
 * @SPEC:CONSULT-001 - 상태 관리
 * - Zustand를 사용한 클라이언트 상태 관리
 * - 메시지, 첨부파일, 온라인 상태 추적
 */
export const useConsultationStore = create<ConsultationState>((set, get) => ({
  // 메시지 상태 초기값
  messages: [],

  /**
   * 메시지 추가
   *
   * @SPEC:CONSULT-001 - Event-driven Requirements
   * WHEN 새 메시지를 수신하면, 시스템은 메시지 목록에 추가해야 한다
   */
  addMessage: (message: ConsultationMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  /**
   * 메시지 목록 설정 (초기 로딩)
   *
   * @SPEC:CONSULT-001 - 성능 요구사항
   * 초기 메시지 로딩: 최근 50개 메시지 2초 이내
   */
  setMessages: (messages: ConsultationMessage[]) => {
    set({ messages });
  },

  /**
   * 메시지 목록 초기화
   */
  clearMessages: () => {
    set({ messages: [] });
  },

  // 입력 중 상태 초기값
  isTyping: false,

  /**
   * 입력 중 상태 설정
   *
   * @SPEC:CONSULT-001 - State-driven Requirements
   * WHILE 상대방이 입력 중일 때, 시스템은 "입력 중..." 표시를 보여줘야 한다
   */
  setIsTyping: (isTyping: boolean) => {
    set({ isTyping });
  },

  // 파일 첨부 상태 초기값
  attachments: [],

  /**
   * 첨부 파일 추가
   *
   * @SPEC:CONSULT-001 - Constraints
   * 첨부 파일 개수 ≤ 5개
   */
  addAttachment: (attachment: Attachment) => {
    set((state) => {
      // 최대 5개 제한
      if (state.attachments.length >= 5) {
        return state;
      }
      return {
        attachments: [...state.attachments, attachment],
      };
    });
  },

  /**
   * 첨부 파일 제거
   */
  removeAttachment: (attachmentId: string) => {
    set((state) => ({
      attachments: state.attachments.filter((att) => att.id !== attachmentId),
    }));
  },

  /**
   * 모든 첨부 파일 제거
   */
  clearAttachments: () => {
    set({ attachments: [] });
  },

  // 온라인 상태 초기값
  onlineUsers: [],

  /**
   * 온라인 사용자 목록 설정
   *
   * @SPEC:CONSULT-001 - Ubiquitous Requirements
   * 시스템은 상대방의 온라인 상태를 실시간으로 표시해야 한다
   */
  setOnlineUsers: (userIds: string[]) => {
    set({ onlineUsers: userIds });
  },

  /**
   * 특정 사용자의 온라인 상태 확인
   */
  isUserOnline: (userId: string) => {
    return get().onlineUsers.includes(userId);
  },
}));
