// @TEST:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * MessageInput 컴포넌트 테스트
 *
 * 테스트 범위:
 * - 메시지 입력 및 전송
 * - 길이 제한 검증
 * - 파일 첨부 UI
 * - 전송 중 상태
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('@TEST:CONSULT-001 - MessageInput 컴포넌트', () => {
  it('메시지 입력란을 렌더링해야 한다', async () => {
    // Given: MessageInput 컴포넌트
    const onSend = vi.fn();

    // When: MessageInput 렌더링
    const { MessageInput } = await import('@/features/consultation/components/MessageInput');
    render(<MessageInput onSend={onSend} disabled={false} />);

    // Then: 입력란이 렌더링됨
    expect(screen.getByPlaceholderText(/메시지를 입력하세요/i)).toBeInTheDocument();
  });

  it('메시지를 입력하고 전송할 수 있다', async () => {
    // Given: MessageInput 컴포넌트
    const onSend = vi.fn();
    const user = userEvent.setup();

    const { MessageInput } = await import('@/features/consultation/components/MessageInput');
    render(<MessageInput onSend={onSend} disabled={false} />);

    // When: 메시지 입력 후 전송 버튼 클릭
    const input = screen.getByPlaceholderText(/메시지를 입력하세요/i);
    await user.type(input, '테스트 메시지');

    const sendButton = screen.getByRole('button', { name: /전송/i });
    await user.click(sendButton);

    // Then: onSend 콜백이 호출됨
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith('테스트 메시지', []);
    });
  });

  it('Enter 키로 메시지를 전송할 수 있다', async () => {
    // Given: MessageInput 컴포넌트
    const onSend = vi.fn();
    const user = userEvent.setup();

    const { MessageInput } = await import('@/features/consultation/components/MessageInput');
    render(<MessageInput onSend={onSend} disabled={false} />);

    // When: 메시지 입력 후 Enter 키 입력
    const input = screen.getByPlaceholderText(/메시지를 입력하세요/i);
    await user.type(input, '테스트 메시지{Enter}');

    // Then: onSend 콜백이 호출됨
    await waitFor(() => {
      expect(onSend).toHaveBeenCalled();
    });
  });

  it('빈 메시지는 전송할 수 없다', async () => {
    // Given: MessageInput 컴포넌트
    const onSend = vi.fn();
    const user = userEvent.setup();

    const { MessageInput } = await import('@/features/consultation/components/MessageInput');
    render(<MessageInput onSend={onSend} disabled={false} />);

    // When: 빈 메시지 전송 시도
    const sendButton = screen.getByRole('button', { name: /전송/i });
    await user.click(sendButton);

    // Then: onSend 콜백이 호출되지 않음
    expect(onSend).not.toHaveBeenCalled();
  });

  it('메시지 전송 후 입력란이 초기화되어야 한다', async () => {
    // Given: MessageInput 컴포넌트
    const onSend = vi.fn();
    const user = userEvent.setup();

    const { MessageInput } = await import('@/features/consultation/components/MessageInput');
    render(<MessageInput onSend={onSend} disabled={false} />);

    // When: 메시지 전송
    const input = screen.getByPlaceholderText(/메시지를 입력하세요/i) as HTMLTextAreaElement;
    await user.type(input, '테스트 메시지');
    await user.click(screen.getByRole('button', { name: /전송/i }));

    // Then: 입력란이 비워짐
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('disabled 상태일 때 전송 버튼이 비활성화되어야 한다', async () => {
    // Given: disabled=true인 MessageInput
    const onSend = vi.fn();

    const { MessageInput } = await import('@/features/consultation/components/MessageInput');
    render(<MessageInput onSend={onSend} disabled={true} />);

    // Then: 전송 버튼이 비활성화됨
    const sendButton = screen.getByRole('button', { name: /전송/i });
    expect(sendButton).toBeDisabled();
  });

  it('5000자 초과 메시지는 경고를 표시해야 한다', async () => {
    // Given: MessageInput 컴포넌트
    const onSend = vi.fn();

    const { MessageInput } = await import('@/features/consultation/components/MessageInput');
    render(<MessageInput onSend={onSend} disabled={false} />);

    // When: 5001자 입력 (직접 값 설정)
    const input = screen.getByPlaceholderText(/메시지를 입력하세요/i) as HTMLTextAreaElement;
    const longMessage = 'a'.repeat(5001);

    fireEvent.change(input, { target: { value: longMessage } });

    // Then: 경고 메시지 표시
    await waitFor(() => {
      expect(screen.getByText(/5000자를 초과/i)).toBeInTheDocument();
    });
  });
});
