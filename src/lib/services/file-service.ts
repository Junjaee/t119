// @CODE:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md | TEST: tests/features/consultation/file-upload.test.ts
/**
 * 파일 업로드 서비스
 *
 * 주요 기능:
 * - 파일 크기 및 타입 검증
 * - Supabase Storage 업로드
 * - 첨부 파일 개수 제한
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  FileUploadInput,
  FileValidationResult,
  FileUploadResult,
  Attachment,
} from '@/types/consultation.types';

// 제약사항 상수
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ATTACHMENTS = 5;

// 허용된 MIME 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

/**
 * 파일 검증
 *
 * @SPEC:CONSULT-001 - 제약사항
 * - 파일 크기 ≤ 5MB
 * - 허용된 MIME 타입만 업로드 가능
 */
export function validateFile(file: File): FileValidationResult {
  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `파일 크기는 5MB를 초과할 수 없습니다. (현재: ${formatFileSize(
        file.size
      )})`,
    };
  }

  // MIME 타입 검증
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `허용되지 않은 파일 형식입니다. (허용: 이미지, PDF)`,
    };
  }

  return { isValid: true };
}

/**
 * 첨부 파일 개수 검증
 *
 * @SPEC:CONSULT-001 - 제약사항
 * 첨부 파일 개수 ≤ 5개
 */
export function validateAttachmentCount(
  existingCount: number,
  newCount: number
): FileValidationResult {
  const totalCount = existingCount + newCount;

  if (totalCount > MAX_ATTACHMENTS) {
    return {
      isValid: false,
      error: `첨부 파일은 최대 5개까지만 가능합니다. (현재: ${existingCount}개)`,
    };
  }

  return { isValid: true };
}

/**
 * 파일 업로드
 *
 * @SPEC:CONSULT-001 - Event-driven Requirements
 * WHEN 사용자가 파일을 첨부하면, 시스템은 Supabase Storage에 업로드하고 URL을 메시지에 포함해야 한다
 */
export async function uploadFile(
  supabase: SupabaseClient,
  input: FileUploadInput
): Promise<FileUploadResult> {
  try {
    // 파일 검증
    const validation = validateFile(input.file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // 파일 경로 생성: consultations/{consultationId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedFilename = sanitizeFilename(input.file.name);
    const filePath = `consultations/${input.consultationId}/${timestamp}_${sanitizedFilename}`;

    // Supabase Storage 업로드
    const { data, error } = await supabase.storage
      .from('consultation-files')
      .upload(filePath, input.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Public URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from('consultation-files').getPublicUrl(data.path);

    // Attachment 객체 생성
    const attachment: Attachment = {
      id: generateAttachmentId(),
      name: input.file.name,
      size: input.file.size,
      url: publicUrl,
      mime_type: input.file.type,
      uploaded_at: new Date().toISOString(),
    };

    return {
      success: true,
      attachment,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '파일 업로드에 실패했습니다.',
    };
  }
}

/**
 * 파일명 정리 (보안)
 *
 * @SPEC:CONSULT-001 - 보안 요구사항
 * XSS 및 경로 탐색 공격 방지
 */
function sanitizeFilename(filename: string): string {
  // 경로 구분자 제거
  let sanitized = filename.replace(/[\/\\]/g, '_');

  // 특수 문자 제거
  sanitized = sanitized.replace(/[^\w\s.-]/g, '');

  // 연속된 점 제거 (경로 탐색 방지)
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // 최대 길이 제한
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const nameWithoutExt = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${nameWithoutExt}.${ext}`;
  }

  return sanitized;
}

/**
 * 첨부 파일 ID 생성
 */
function generateAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 파일 크기 포맷
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
