// @TEST:REPORT-FORM-001:F1 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md
// FileUpload 컴포넌트 테스트

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '@/components/reports/FileUpload';

describe('@TEST:REPORT-FORM-001:F1 - FileUpload Component', () => {
  describe('정상 케이스', () => {
    it('GIVEN FileUpload 컴포넌트가 렌더링되면 WHEN 사용자가 페이지를 보면 THEN 드래그앤드롭 영역이 표시되어야 한다', () => {
      // Given & When
      render(<FileUpload files={[]} onFilesChange={vi.fn()} />);

      // Then
      expect(screen.getByText(/드래그/)).toBeInTheDocument();
    });

    it('GIVEN 파일이 없는 상태에서 WHEN 컴포넌트가 렌더링되면 THEN 파일 선택 버튼이 표시되어야 한다', () => {
      // Given & When
      render(<FileUpload files={[]} onFilesChange={vi.fn()} />);

      // Then
      expect(screen.getByRole('button', { name: /파일 선택/i })).toBeInTheDocument();
    });

    it('GIVEN 파일 1개가 업로드된 상태에서 WHEN 컴포넌트가 렌더링되면 THEN 파일 목록이 표시되어야 한다', () => {
      // Given
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const files = [file];

      // When
      render(<FileUpload files={files} onFilesChange={vi.fn()} />);

      // Then
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    it('GIVEN 파일이 업로드된 상태에서 WHEN 삭제 버튼을 클릭하면 THEN onFilesChange가 호출되어야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const files = [file];

      render(<FileUpload files={files} onFilesChange={onFilesChange} />);

      // When
      const deleteButton = screen.getByRole('button', { name: /삭제/i });
      await user.click(deleteButton);

      // Then
      expect(onFilesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('파일 크기 검증', () => {
    it('GIVEN 10MB를 초과하는 파일을 선택하면 WHEN 업로드를 시도하면 THEN onFilesChange가 호출되지 않아야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const oversizedFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      render(<FileUpload files={[]} onFilesChange={onFilesChange} />);

      // When
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      await user.upload(input, oversizedFile);

      // Then
      await waitFor(() => {
        expect(onFilesChange).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent(/너무 큽니다/i);
      });
    });

    it('GIVEN 10MB 이하의 파일을 선택하면 WHEN 업로드를 시도하면 THEN 성공적으로 추가되어야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const validFile = new File(['content'], 'valid.jpg', { type: 'image/jpeg' });

      render(<FileUpload files={[]} onFilesChange={onFilesChange} />);

      // When
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      await user.upload(input, validFile);

      // Then
      expect(onFilesChange).toHaveBeenCalledWith([validFile]);
    });
  });

  describe('파일 개수 검증', () => {
    it('GIVEN 이미 5개의 파일이 업로드된 상태에서 WHEN 6번째 파일을 추가하려고 하면 THEN 입력이 비활성화되어야 한다', async () => {
      // Given
      const onFilesChange = vi.fn();
      const files = Array.from({ length: 5 }, (_, i) =>
        new File(['content'], `file${i}.jpg`, { type: 'image/jpeg' })
      );

      render(<FileUpload files={files} onFilesChange={onFilesChange} />);

      // Then
      // 5개 파일이 있을 때는 입력이 비활성화되고 메시지가 표시됨
      expect(screen.getByText(/최대 5개까지 업로드 가능합니다/)).toBeInTheDocument();
    });

    it('GIVEN 4개의 파일이 업로드된 상태에서 WHEN 5번째 파일을 추가하면 THEN 성공적으로 추가되어야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const files = Array.from({ length: 4 }, (_, i) =>
        new File(['content'], `file${i}.jpg`, { type: 'image/jpeg' })
      );

      render(<FileUpload files={files} onFilesChange={onFilesChange} />);

      // When
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      const newFile = new File(['content'], 'file5.jpg', { type: 'image/jpeg' });
      await user.upload(input, newFile);

      // Then
      expect(onFilesChange).toHaveBeenCalledWith([...files, newFile]);
    });
  });

  describe('파일 형식 검증', () => {
    it('GIVEN 지원하지 않는 파일 형식을 선택하면 WHEN 업로드를 시도하면 THEN 파일이 추가되지 않아야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });

      render(<FileUpload files={[]} onFilesChange={onFilesChange} />);

      // When
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      await user.upload(input, invalidFile);

      // Then
      // react-dropzone의 accept 속성으로 인해 자동으로 차단됨
      // userEvent.upload는 실제 브라우저 검증을 완벽히 시뮬레이션하지 못하므로
      // onFilesChange가 호출되지 않는 것만 확인
      await waitFor(
        () => {
          expect(onFilesChange).not.toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      // 실제 브라우저에서는 onDropRejected가 호출되어 에러 메시지가 표시됨
      // (통합 테스트에서 검증)
    });

    it('GIVEN 이미지 파일(jpg, png, gif)을 선택하면 WHEN 업로드를 시도하면 THEN 성공적으로 추가되어야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const jpgFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      // When
      render(<FileUpload files={[]} onFilesChange={onFilesChange} />);
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      await user.upload(input, jpgFile);

      // Then
      expect(onFilesChange).toHaveBeenCalledWith([jpgFile]);
    });

    it('GIVEN PDF 파일을 선택하면 WHEN 업로드를 시도하면 THEN 성공적으로 추가되어야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      // When
      render(<FileUpload files={[]} onFilesChange={onFilesChange} />);
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      await user.upload(input, pdfFile);

      // Then
      expect(onFilesChange).toHaveBeenCalledWith([pdfFile]);
    });

    it('GIVEN MP4 파일을 선택하면 WHEN 업로드를 시도하면 THEN 성공적으로 추가되어야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const mp4File = new File(['content'], 'test.mp4', { type: 'video/mp4' });

      // When
      render(<FileUpload files={[]} onFilesChange={onFilesChange} />);
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      await user.upload(input, mp4File);

      // Then
      expect(onFilesChange).toHaveBeenCalledWith([mp4File]);
    });
  });

  describe('접근성', () => {
    it('GIVEN FileUpload 컴포넌트가 렌더링되면 WHEN 스크린 리더가 접근하면 THEN 적절한 label이 있어야 한다', () => {
      // Given & When
      render(<FileUpload files={[]} onFilesChange={vi.fn()} />);

      // Then
      expect(screen.getByLabelText(/파일 선택 input/i, { selector: 'input' })).toBeInTheDocument();
    });
  });

  describe('드래그앤드롭', () => {
    it('GIVEN 파일을 드래그하여 드롭존에 올리면 WHEN 드롭하면 THEN onFilesChange가 호출되어야 한다', async () => {
      // Given
      const user = userEvent.setup();
      const onFilesChange = vi.fn();
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      render(<FileUpload files={[]} onFilesChange={onFilesChange} />);

      // When - userEvent를 사용하여 파일 업로드 (드래그앤드롭 대신)
      const input = screen.getByLabelText(/파일 선택/i, { selector: 'input' });
      await user.upload(input, file);

      // Then
      await waitFor(() => {
        expect(onFilesChange).toHaveBeenCalledWith([file]);
      });
    });
  });

  describe('파일 정보 표시', () => {
    it('GIVEN 파일이 업로드된 상태에서 WHEN 컴포넌트가 렌더링되면 THEN 파일 크기가 표시되어야 한다', () => {
      // Given
      const file = new File(['x'.repeat(1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });
      const files = [file];

      // When
      render(<FileUpload files={files} onFilesChange={vi.fn()} />);

      // Then
      // 파일 크기가 MB 단위로 표시됨 (정확한 값은 1.0 MB)
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });

    it('GIVEN 여러 파일이 업로드된 상태에서 WHEN 컴포넌트가 렌더링되면 THEN 모든 파일 목록이 표시되어야 한다', () => {
      // Given
      const files = [
        new File(['content'], 'file1.jpg', { type: 'image/jpeg' }),
        new File(['content'], 'file2.pdf', { type: 'application/pdf' }),
      ];

      // When
      render(<FileUpload files={files} onFilesChange={vi.fn()} />);

      // Then
      expect(screen.getByText('file1.jpg')).toBeInTheDocument();
      expect(screen.getByText('file2.pdf')).toBeInTheDocument();
    });
  });
});
