// @CODE:CONSULT-001:UI | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md | TEST: tests/features/consultation/message-input.test.tsx
/**
 * MessageInput 컴포넌트
 *
 * 주요 기능:
 * - 메시지 입력 및 전송
 * - 길이 제한 검증 (5000자)
 * - 파일 첨부 UI
 * - 전송 중 상태 표시
 */

'use client';

import React, { useState, useCallback, KeyboardEvent } from 'react';
import type { Attachment } from '@/types/consultation.types';

interface MessageInputProps {
  onSend: (content: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

const MAX_MESSAGE_LENGTH = 5000;

/**
 * 메시지 입력 컴포넌트
 *
 * @SPEC:CONSULT-001 - Constraints
 * 메시지 길이 ≤ 5000자
 */
export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  /**
   * 메시지 전송
   */
  const handleSend = useCallback(() => {
    // 빈 메시지 전송 방지
    if (!content.trim()) {
      return;
    }

    // 길이 제한 검증
    if (content.length > MAX_MESSAGE_LENGTH) {
      return;
    }

    // 전송
    onSend(content.trim(), attachments);

    // 입력란 초기화
    setContent('');
    setAttachments([]);
  }, [content, attachments, onSend]);

  /**
   * Enter 키 핸들러
   *
   * @SPEC:CONSULT-001 - UX
   * Enter: 전송, Shift+Enter: 줄바꿈
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // 길이 초과 여부
  const isOverLimit = content.length > MAX_MESSAGE_LENGTH;
  const canSend = content.trim().length > 0 && !isOverLimit && !disabled;

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* 길이 제한 경고 */}
      {isOverLimit && (
        <div className="mb-2 text-sm text-red-600">
          메시지는 5000자를 초과할 수 없습니다. (현재: {content.length}자)
        </div>
      )}

      {/* 첨부 파일 목록 */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center bg-gray-100 rounded px-2 py-1 text-sm"
            >
              <span className="mr-1">📎</span>
              <span className="text-gray-700">{attachment.name}</span>
              <button
                onClick={() =>
                  setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
                }
                className="ml-2 text-gray-500 hover:text-red-600"
                aria-label="첨부 파일 제거"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex items-end space-x-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          disabled={disabled}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`px-4 py-2 rounded-lg font-medium ${
            canSend
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          aria-label="전송"
        >
          전송
        </button>
      </div>

      {/* 글자 수 표시 */}
      <div className="mt-1 text-xs text-gray-500 text-right">
        {content.length} / {MAX_MESSAGE_LENGTH}
      </div>
    </div>
  );
}
