// @TEST:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * 파일 업로드 테스트
 *
 * 테스트 범위:
 * - 파일 크기 검증
 * - 파일 타입 검증
 * - 첨부 파일 개수 제한
 * - Supabase Storage 업로드
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  FileUploadInput,
  FileValidationResult,
  FileUploadResult,
  Attachment,
} from '@/types/consultation.types';

describe('@TEST:CONSULT-001 - 파일 업로드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('파일 검증', () => {
    it('파일 크기가 5MB를 초과하면 검증 실패', async () => {
      // Given: 6MB 파일
      const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      // When: validateFile 호출
      const { validateFile } = await import('@/lib/services/file-service');
      const result: FileValidationResult = validateFile(largeFile);

      // Then: 검증 실패
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('허용되지 않은 파일 타입은 검증 실패', async () => {
      // Given: 실행 파일
      const file = new File(['test'], 'malware.exe', {
        type: 'application/x-msdownload',
      });

      // When: validateFile 호출
      const { validateFile } = await import('@/lib/services/file-service');
      const result: FileValidationResult = validateFile(file);

      // Then: 검증 실패
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('허용되지 않은');
    });

    it('이미지 파일은 검증 통과', async () => {
      // Given: 이미지 파일
      const file = new File(['test'], 'image.png', {
        type: 'image/png',
      });

      // When: validateFile 호출
      const { validateFile } = await import('@/lib/services/file-service');
      const result: FileValidationResult = validateFile(file);

      // Then: 검증 통과
      expect(result.isValid).toBe(true);
    });

    it('PDF 파일은 검증 통과', async () => {
      // Given: PDF 파일
      const file = new File(['test'], 'document.pdf', {
        type: 'application/pdf',
      });

      // When: validateFile 호출
      const { validateFile } = await import('@/lib/services/file-service');
      const result: FileValidationResult = validateFile(file);

      // Then: 검증 통과
      expect(result.isValid).toBe(true);
    });

    it('첨부 파일 개수가 5개를 초과하면 검증 실패', async () => {
      // Given: 6개 첨부 파일
      const existingAttachments: Attachment[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `attachment-${i}`,
          name: `file-${i}.png`,
          size: 1024,
          url: `https://example.com/file-${i}.png`,
          mime_type: 'image/png',
          uploaded_at: new Date().toISOString(),
        }));

      const newFile = new File(['test'], 'image.png', {
        type: 'image/png',
      });

      // When: validateAttachmentCount 호출
      const { validateAttachmentCount } = await import(
        '@/lib/services/file-service'
      );
      const result: FileValidationResult = validateAttachmentCount(
        existingAttachments.length,
        1
      );

      // Then: 검증 실패
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('5개');
    });
  });

  describe('파일 업로드', () => {
    it('유효한 파일을 Supabase Storage에 업로드', async () => {
      // Given: 유효한 파일
      const file = new File(['test content'], 'test.png', {
        type: 'image/png',
      });

      const input: FileUploadInput = {
        file,
        consultationId: 'test-consultation-id',
        uploaderId: 'test-uploader-id',
      };

      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: 'consultations/test-consultation-id/test.png',
        },
        error: null,
      });

      const mockGetPublicUrl = vi.fn().mockReturnValue({
        data: {
          publicUrl: 'https://example.com/test.png',
        },
      });

      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockUpload,
            getPublicUrl: mockGetPublicUrl,
          }),
        },
      };

      // When: uploadFile 호출
      const { uploadFile } = await import('@/lib/services/file-service');
      const result: FileUploadResult = await uploadFile(
        mockSupabase as any,
        input
      );

      // Then: 업로드 성공
      expect(result.success).toBe(true);
      expect(result.attachment).toBeDefined();
      expect(result.attachment?.url).toBe('https://example.com/test.png');
      expect(result.attachment?.name).toBe('test.png');
      expect(mockUpload).toHaveBeenCalled();
    });

    it('업로드 실패 시 에러 반환', async () => {
      // Given: 업로드 실패 Mock
      const file = new File(['test'], 'test.png', {
        type: 'image/png',
      });

      const input: FileUploadInput = {
        file,
        consultationId: 'test-consultation-id',
        uploaderId: 'test-uploader-id',
      };

      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Upload failed' },
            }),
          }),
        },
      };

      // When: uploadFile 호출
      const { uploadFile } = await import('@/lib/services/file-service');
      const result: FileUploadResult = await uploadFile(
        mockSupabase as any,
        input
      );

      // Then: 업로드 실패
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('파일 경로는 consultation ID를 포함해야 함', async () => {
      // Given: 유효한 파일
      const file = new File(['test'], 'test.png', {
        type: 'image/png',
      });

      const consultationId = 'consultation-123';
      const input: FileUploadInput = {
        file,
        consultationId,
        uploaderId: 'test-uploader-id',
      };

      const mockUpload = vi.fn().mockResolvedValue({
        data: {
          path: `consultations/${consultationId}/test.png`,
        },
        error: null,
      });

      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockUpload,
            getPublicUrl: vi.fn().mockReturnValue({
              data: { publicUrl: 'https://example.com/test.png' },
            }),
          }),
        },
      };

      // When: uploadFile 호출
      const { uploadFile } = await import('@/lib/services/file-service');
      await uploadFile(mockSupabase as any, input);

      // Then: 경로에 consultation ID 포함
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining(`consultations/${consultationId}`),
        file,
        expect.any(Object)
      );
    });
  });

  describe('성능 요구사항', () => {
    it('5MB 파일 업로드는 10초 이내 완료', async () => {
      // Given: 5MB 파일
      const file = new File(['a'.repeat(5 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      const input: FileUploadInput = {
        file,
        consultationId: 'test-consultation-id',
        uploaderId: 'test-uploader-id',
      };

      const mockSupabase = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({
              data: { path: 'test.pdf' },
              error: null,
            }),
            getPublicUrl: vi.fn().mockReturnValue({
              data: { publicUrl: 'https://example.com/test.pdf' },
            }),
          }),
        },
      };

      // When: 업로드 시간 측정
      const { uploadFile } = await import('@/lib/services/file-service');
      const startTime = Date.now();
      await uploadFile(mockSupabase as any, input);
      const endTime = Date.now();

      // Then: 10초 이내 완료
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000);
    });
  });
});
