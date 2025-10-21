// @CODE:CONSULT-001:UI | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md | TEST: tests/features/consultation/message-list.test.tsx
/**
 * MessageList 컴포넌트
 *
 * 주요 기능:
 * - 메시지 목록 렌더링
 * - 읽음/안읽음 상태 표시
 * - 시간 포맷팅
 * - 첨부 파일 표시
 */

'use client';

import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ConsultationMessage } from '@/types/consultation.types';

interface MessageListProps {
  messages: ConsultationMessage[];
  currentUserId: string;
}

/**
 * 메시지 목록 컴포넌트
 *
 * @SPEC:CONSULT-001 - State-driven Requirements
 * WHILE 사용자가 채팅방에 있을 때, 시스템은 실시간으로 새 메시지를 수신해야 한다
 */
export function MessageList({ messages, currentUserId }: MessageListProps) {
  // 빈 메시지 상태
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-lg">메시지가 없습니다</p>
        <p className="text-sm mt-2">첫 메시지를 보내보세요!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto">
      {messages.map((message) => {
        const isMine = message.sender_id === currentUserId;

        return (
          <div
            key={message.id}
            data-testid={`message-${message.id}`}
            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                isMine
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* 메시지 내용 */}
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {/* 첨부 파일 목록 */}
              {message.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center text-xs underline ${
                        isMine ? 'text-blue-100' : 'text-blue-600'
                      }`}
                    >
                      <span className="mr-1">📎</span>
                      <span>{attachment.name}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* 시간 및 읽음 상태 */}
              <div
                className={`flex items-center justify-end mt-1 text-xs ${
                  isMine ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                <span data-testid={`message-time-${message.id}`}>
                  {formatMessageTime(message.created_at)}
                </span>
                {isMine && message.is_read && (
                  <span className="ml-2">읽음</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 메시지 시간 포맷팅
 *
 * @param timestamp ISO 8601 형식 타임스탬프
 * @returns 포맷된 시간 (예: "오후 3:24")
 */
function formatMessageTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return format(date, 'a h:mm', { locale: ko });
  } catch {
    return '';
  }
}
