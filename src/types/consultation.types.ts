// @CODE:CONSULT-001:DATA | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * 실시간 상담 시스템 타입 정의
 */

/**
 * 상담 상태
 */
export type ConsultationStatus = 'active' | 'completed' | 'cancelled';

/**
 * 첨부 파일 정보
 */
export interface Attachment {
  id: string;
  name: string;
  size: number; // bytes
  url: string; // Supabase Storage URL
  mime_type: string;
  uploaded_at: string;
}

/**
 * 상담 세션
 */
export interface Consultation {
  id: string;
  match_id: string;
  teacher_id: string;
  lawyer_id: string;
  status: ConsultationStatus;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 상담 메시지
 */
export interface ConsultationMessage {
  id: string;
  consultation_id: string;
  sender_id: string;
  content: string;
  attachments: Attachment[];
  is_read: boolean;
  read_at?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 메시지 전송 입력
 */
export interface SendMessageInput {
  consultationId: string;
  content: string;
  senderId: string;
  attachments?: Attachment[];
}

/**
 * 메시지 검증 결과
 */
export interface MessageValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 메시지 전송 결과
 */
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 메시지 저장 결과
 */
export interface SaveMessageResult {
  success: boolean;
  data?: ConsultationMessage;
  error?: string;
}

/**
 * 읽음 처리 결과
 */
export interface MarkAsReadResult {
  success: boolean;
  data?: {
    id: string;
    is_read: boolean;
    read_at: string;
  };
  error?: string;
}

/**
 * 구독 상태
 */
export type SubscriptionStatus = 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR';

/**
 * 구독 결과
 */
export interface SubscriptionResult {
  status: SubscriptionStatus;
  error?: string;
}

/**
 * 파일 검증 결과
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * 파일 업로드 입력
 */
export interface FileUploadInput {
  file: File;
  consultationId: string;
  uploaderId: string;
}

/**
 * 파일 업로드 결과
 */
export interface FileUploadResult {
  success: boolean;
  attachment?: Attachment;
  error?: string;
}

/**
 * 재전송 옵션
 */
export interface RetryOptions {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
}

/**
 * Realtime 메시지 페이로드
 */
export interface RealtimeMessagePayload {
  id: string;
  consultation_id: string;
  sender_id: string;
  content: string;
  attachments: Attachment[];
  created_at: string;
}

/**
 * 읽음 상태 업데이트 페이로드
 */
export interface ReadStatusPayload {
  message_id: string;
  is_read: boolean;
  read_at: string;
}

/**
 * 온라인 상태 (Presence)
 */
export interface PresenceState {
  user_id: string;
  online_at: string;
}
