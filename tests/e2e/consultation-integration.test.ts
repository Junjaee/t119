// @TEST:CONSULT-001 | SPEC: .moai/specs/SPEC-CONSULT-001/spec.md
/**
 * E2E 통합 테스트: 실시간 상담 시스템
 *
 * 이 테스트는 실제 Supabase 연결을 사용하여 다음을 검증합니다:
 * - 메시지 전송 및 수신
 * - Realtime 구독 및 해제
 * - 파일 업로드
 * - 읽음 상태 관리
 *
 * 실행 전 요구사항:
 * 1. .env.local 파일에 Supabase URL 및 Key 설정
 * 2. Supabase 데이터베이스에 스키마 생성 (supabase/migrations/001_create_consultation_tables.sql)
 * 3. 테스트용 사용자 및 상담 데이터 존재
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  sendMessage,
  markAsRead,
  validateMessage,
} from '@/lib/services/consultation-service';
import {
  subscribeToConsultation,
  unsubscribeFromConsultation,
} from '@/lib/services/realtime-subscription';
import { uploadFile } from '@/lib/services/file-service';
import type { RealtimeChannel } from '@supabase/supabase-js';

describe('E2E: 실시간 상담 시스템', () => {
  let supabase: ReturnType<typeof createBrowserClient>;
  let testConsultationId: string;
  let testTeacherId: string;
  let testLawyerId: string;
  let channel: RealtimeChannel | null = null;

  beforeAll(async () => {
    // Supabase 클라이언트 초기화
    supabase = createBrowserClient();

    // 환경변수 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    }

    // 테스트용 데이터 조회 (실제 데이터베이스에서)
    // Note: 테스트 실행 전 수동으로 생성해야 함
    const { data: consultations, error } = await supabase
      .from('consultations')
      .select('id, teacher_id, lawyer_id')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error || !consultations) {
      console.warn(
        '⚠️ 테스트용 active 상담 데이터가 없습니다. 스킵합니다.'
      );
      console.warn('   Supabase에서 샘플 데이터를 생성해주세요.');
      return;
    }

    testConsultationId = consultations.id;
    testTeacherId = consultations.teacher_id;
    testLawyerId = consultations.lawyer_id;
  });

  afterAll(async () => {
    // Realtime 구독 해제
    if (channel) {
      await unsubscribeFromConsultation(channel);
    }
  });

  describe('메시지 전송 및 수신', () => {
    it('메시지를 전송하고 데이터베이스에 저장되어야 한다', async () => {
      if (!testConsultationId || !testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const result = await sendMessage(supabase, {
        consultationId: testConsultationId,
        senderId: testTeacherId,
        content: 'E2E 테스트 메시지입니다.',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();

      // 데이터베이스에서 메시지 확인
      if (result.messageId) {
        const { data: message } = await supabase
          .from('messages')
          .select('*')
          .eq('id', result.messageId)
          .single();

        expect(message).toBeDefined();
        expect(message?.content).toBe('E2E 테스트 메시지입니다.');
        expect(message?.sender_id).toBe(testTeacherId);
      }
    });

    it('5000자를 초과하는 메시지는 거부되어야 한다', async () => {
      const longMessage = 'a'.repeat(5001);

      const validation = validateMessage({
        consultationId: testConsultationId || 'test',
        senderId: testTeacherId || 'test',
        content: longMessage,
      });

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('5000자');
    });

    it('빈 메시지는 거부되어야 한다', async () => {
      const validation = validateMessage({
        consultationId: testConsultationId || 'test',
        senderId: testTeacherId || 'test',
        content: '   ',
      });

      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('입력해주세요');
    });
  });

  describe('Realtime 구독 및 메시지 수신', () => {
    it('Realtime 채널을 구독하고 새 메시지를 수신해야 한다', async () => {
      if (!testConsultationId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      return new Promise<void>(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('메시지 수신 타임아웃 (10초)'));
        }, 10000);

        // Realtime 구독
        channel = await subscribeToConsultation(
          supabase,
          testConsultationId,
          (payload) => {
            try {
              expect(payload).toBeDefined();
              expect(payload.content).toBeDefined();
              expect(payload.sender_id).toBeDefined();
              clearTimeout(timeout);
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              reject(error);
            }
          }
        );

        // 1초 후 메시지 전송 (구독 대기)
        setTimeout(async () => {
          await sendMessage(supabase, {
            consultationId: testConsultationId,
            senderId: testTeacherId,
            content: 'Realtime 테스트 메시지',
          });
        }, 1000);
      });
    });
  });

  describe('읽음 상태 관리', () => {
    it('메시지를 읽음 처리하면 read_at이 업데이트되어야 한다', async () => {
      if (!testConsultationId || !testTeacherId || !testLawyerId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      // 1. 교사가 메시지 전송
      const sendResult = await sendMessage(supabase, {
        consultationId: testConsultationId,
        senderId: testTeacherId,
        content: '읽음 테스트 메시지',
      });

      expect(sendResult.success).toBe(true);
      expect(sendResult.messageId).toBeDefined();

      if (!sendResult.messageId) return;

      // 2. 변호사가 메시지 읽음 처리
      const readResult = await markAsRead(
        supabase,
        sendResult.messageId,
        testLawyerId
      );

      expect(readResult.success).toBe(true);
      expect(readResult.data?.is_read).toBe(true);
      expect(readResult.data?.read_at).toBeDefined();
    });

    it('본인이 보낸 메시지는 읽음 처리할 수 없어야 한다', async () => {
      if (!testConsultationId || !testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      // 1. 교사가 메시지 전송
      const sendResult = await sendMessage(supabase, {
        consultationId: testConsultationId,
        senderId: testTeacherId,
        content: '본인 메시지 테스트',
      });

      if (!sendResult.messageId) return;

      // 2. 교사가 본인 메시지 읽음 처리 시도
      const readResult = await markAsRead(
        supabase,
        sendResult.messageId,
        testTeacherId // 본인
      );

      expect(readResult.success).toBe(false);
      expect(readResult.error).toContain('본인');
    });
  });

  describe('파일 업로드', () => {
    it.skip('5MB 이하 PDF 파일을 업로드할 수 있어야 한다', async () => {
      // Note: 실제 파일 업로드는 Supabase Storage 설정 필요
      // 이 테스트는 Storage 버킷 생성 후 활성화

      if (!testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const file = new File(['테스트 내용'], 'test.pdf', {
        type: 'application/pdf',
      });

      const result = await uploadFile(supabase, file, testTeacherId);

      expect(result.success).toBe(true);
      expect(result.attachment?.url).toBeDefined();
      expect(result.attachment?.name).toBe('test.pdf');
    });

    it('5MB를 초과하는 파일은 거부되어야 한다', async () => {
      const largeContent = new Uint8Array(5 * 1024 * 1024 + 1); // 5MB + 1 byte
      const largeFile = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });

      const result = await uploadFile(
        supabase,
        largeFile,
        testTeacherId || 'test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('5MB');
    });

    it('허용되지 않은 MIME 타입은 거부되어야 한다', async () => {
      const file = new File(['내용'], 'test.exe', {
        type: 'application/x-msdownload',
      });

      const result = await uploadFile(
        supabase,
        file,
        testTeacherId || 'test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('파일 형식');
    });
  });

  describe('데이터베이스 제약조건 검증', () => {
    it('consultations 테이블이 존재해야 한다', async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('messages 테이블이 존재해야 한다', async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('메시지 길이는 5000자를 초과할 수 없어야 한다', async () => {
      if (!testConsultationId || !testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const longMessage = 'a'.repeat(5001);

      // 데이터베이스에 직접 삽입 시도 (CHECK 제약 위반)
      const { error } = await supabase.from('messages').insert({
        consultation_id: testConsultationId,
        sender_id: testTeacherId,
        content: longMessage,
      });

      expect(error).toBeDefined();
      expect(error?.message).toContain('check');
    });
  });
});
