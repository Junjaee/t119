// @TEST:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * MessageList 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 메시지 목록 렌더링
 * - 읽음/안읽음 상태 표시
 * - 시간 포맷팅
 * - 첨부 파일 표시
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ConsultationMessage } from '@/types/consultation.types';

describe('@TEST:CONSULT-001 - MessageList 컴포넌트', () => {
  it('메시지가 없을 때 빈 상태를 표시해야 한다', async () => {
    // Given: 빈 메시지 목록
    const messages: ConsultationMessage[] = [];
    const currentUserId = 'user-001';

    // When: MessageList 렌더링
    const { MessageList } = await import('@/features/consultation/components/MessageList');
    render(<MessageList messages={messages} currentUserId={currentUserId} />);

    // Then: 빈 상태 메시지 표시
    expect(screen.getByText(/메시지가 없습니다/i)).toBeInTheDocument();
  });

  it('메시지 목록을 렌더링해야 한다', async () => {
    // Given: 메시지 목록
    const messages: ConsultationMessage[] = [
      {
        id: 'msg-001',
        consultation_id: 'consult-001',
        sender_id: 'user-001',
        content: '첫 번째 메시지',
        attachments: [],
        is_read: true,
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
    const currentUserId = 'user-001';

    // When: MessageList 렌더링
    const { MessageList } = await import('@/features/consultation/components/MessageList');
    render(<MessageList messages={messages} currentUserId={currentUserId} />);

    // Then: 메시지 내용이 렌더링됨
    expect(screen.getByText('첫 번째 메시지')).toBeInTheDocument();
    expect(screen.getByText('두 번째 메시지')).toBeInTheDocument();
  });

  it('본인이 보낸 메시지는 오른쪽에 정렬되어야 한다', async () => {
    // Given: 본인이 보낸 메시지
    const messages: ConsultationMessage[] = [
      {
        id: 'msg-001',
        consultation_id: 'consult-001',
        sender_id: 'user-001',
        content: '본인 메시지',
        attachments: [],
        is_read: true,
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    const currentUserId = 'user-001';

    // When: MessageList 렌더링
    const { MessageList } = await import('@/features/consultation/components/MessageList');
    const { container } = render(
      <MessageList messages={messages} currentUserId={currentUserId} />
    );

    // Then: 오른쪽 정렬 클래스가 적용됨
    const messageElement = container.querySelector('[data-testid="message-msg-001"]');
    expect(messageElement).toHaveClass('justify-end');
  });

  it('상대방이 보낸 메시지는 왼쪽에 정렬되어야 한다', async () => {
    // Given: 상대방이 보낸 메시지
    const messages: ConsultationMessage[] = [
      {
        id: 'msg-001',
        consultation_id: 'consult-001',
        sender_id: 'user-002',
        content: '상대방 메시지',
        attachments: [],
        is_read: false,
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    const currentUserId = 'user-001';

    // When: MessageList 렌더링
    const { MessageList } = await import('@/features/consultation/components/MessageList');
    const { container } = render(
      <MessageList messages={messages} currentUserId={currentUserId} />
    );

    // Then: 왼쪽 정렬 클래스가 적용됨
    const messageElement = container.querySelector('[data-testid="message-msg-001"]');
    expect(messageElement).toHaveClass('justify-start');
  });

  it('읽음 상태를 표시해야 한다', async () => {
    // Given: 읽은 메시지와 안읽은 메시지
    const messages: ConsultationMessage[] = [
      {
        id: 'msg-001',
        consultation_id: 'consult-001',
        sender_id: 'user-001',
        content: '읽은 메시지',
        attachments: [],
        is_read: true,
        read_at: new Date().toISOString(),
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'msg-002',
        consultation_id: 'consult-001',
        sender_id: 'user-001',
        content: '안읽은 메시지',
        attachments: [],
        is_read: false,
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    const currentUserId = 'user-001';

    // When: MessageList 렌더링
    const { MessageList } = await import('@/features/consultation/components/MessageList');
    render(<MessageList messages={messages} currentUserId={currentUserId} />);

    // Then: 읽음 상태 표시
    expect(screen.getByText(/읽음/i)).toBeInTheDocument();
  });

  it('첨부 파일이 있으면 파일 목록을 표시해야 한다', async () => {
    // Given: 첨부 파일이 있는 메시지
    const messages: ConsultationMessage[] = [
      {
        id: 'msg-001',
        consultation_id: 'consult-001',
        sender_id: 'user-001',
        content: '파일 첨부 메시지',
        attachments: [
          {
            id: 'att-001',
            name: 'document.pdf',
            size: 1024,
            url: 'https://example.com/document.pdf',
            mime_type: 'application/pdf',
            uploaded_at: new Date().toISOString(),
          },
        ],
        is_read: false,
        retry_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    const currentUserId = 'user-001';

    // When: MessageList 렌더링
    const { MessageList } = await import('@/features/consultation/components/MessageList');
    render(<MessageList messages={messages} currentUserId={currentUserId} />);

    // Then: 첨부 파일명 표시
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('메시지 전송 시간을 포맷하여 표시해야 한다', async () => {
    // Given: 메시지
    const now = new Date();
    const messages: ConsultationMessage[] = [
      {
        id: 'msg-001',
        consultation_id: 'consult-001',
        sender_id: 'user-001',
        content: '테스트 메시지',
        attachments: [],
        is_read: false,
        retry_count: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];
    const currentUserId = 'user-001';

    // When: MessageList 렌더링
    const { MessageList } = await import('@/features/consultation/components/MessageList');
    const { container } = render(
      <MessageList messages={messages} currentUserId={currentUserId} />
    );

    // Then: 시간 포맷팅 (예: "오후 3:24")
    const timeElement = container.querySelector('[data-testid="message-time-msg-001"]');
    expect(timeElement).toBeInTheDocument();
    expect(timeElement?.textContent).toMatch(/오전|오후/);
  });
});
