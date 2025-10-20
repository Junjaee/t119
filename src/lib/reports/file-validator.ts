// @CODE:REPORT-001 | SPEC: .moai/specs/SPEC-REPORT-001/spec.md
// 파일 검증 유틸리티

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REPORT = 5;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/haansoft-hwp',
  'application/x-hwp',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 파일 크기 검증
 * @param fileSize - 파일 크기 (bytes)
 * @returns 검증 결과
 */
export function validateFileSize(fileSize: number): FileValidationResult {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${MAX_FILE_SIZE / (1024 * 1024)}MB를 초과할 수 없습니다`,
    };
  }

  return { valid: true };
}

/**
 * 파일 타입 검증
 * @param mimeType - MIME 타입
 * @returns 검증 결과
 */
export function validateFileType(mimeType: string): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다. (jpg, png, pdf, docx, hwp, txt, zip만 허용)',
    };
  }

  return { valid: true };
}

/**
 * 파일 개수 검증
 * @param currentCount - 현재 업로드된 파일 개수
 * @returns 검증 결과
 */
export function validateFileCount(currentCount: number): FileValidationResult {
  if (currentCount >= MAX_FILES_PER_REPORT) {
    return {
      valid: false,
      error: `최대 ${MAX_FILES_PER_REPORT}개 파일만 업로드 가능합니다`,
    };
  }

  return { valid: true };
}

/**
 * 파일 전체 검증
 * @param file - File 객체 (브라우저) 또는 파일 정보 (서버)
 * @param currentFileCount - 현재 업로드된 파일 개수
 * @returns 검증 결과
 */
export function validateFile(
  file: { size: number; type: string },
  currentFileCount: number = 0
): FileValidationResult {
  // 파일 개수 검증
  const countResult = validateFileCount(currentFileCount);
  if (!countResult.valid) {
    return countResult;
  }

  // 파일 크기 검증
  const sizeResult = validateFileSize(file.size);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  // 파일 타입 검증
  const typeResult = validateFileType(file.type);
  if (!typeResult.valid) {
    return typeResult;
  }

  return { valid: true };
}
