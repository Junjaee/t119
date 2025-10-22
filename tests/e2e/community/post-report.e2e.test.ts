// @TEST:COMMUNITY-001 | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * E2E Test: 게시글 신고 (UR-005)
 *
 * @SPEC:COMMUNITY-001 UR-005
 * - 게시글 신고 기능
 * - 신고 사유 1-200자 제한
 * - 동일 사용자는 동일 게시글에 1회만 신고 가능 (C-007)
 * - 신고 횟수 3회 이상 시 자동 블라인드 처리 (ER-003)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

describe('COMMUNITY-001 E2E: 게시글 신고 (UR-005)', () => {
  let supabase: ReturnType<typeof createClient>;
  const createdReportIds: string[] = [];
  let testPostId: string;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 테스트용 게시글 ID 가져오기 (E2E 테스트 게시글 중 하나 사용)
    const { data } = await supabase
      .from('posts')
      .select('id')
      .like('title', 'E2E 테스트%')
      .limit(1)
      .single();

    if (data) {
      testPostId = data.id;
    }
  });

  afterAll(async () => {
    // 테스트 후 생성된 신고 정리
    if (createdReportIds.length > 0) {
      await supabase.from('post_reports').delete().in('id', createdReportIds);
    }
  });

  describe('신고 작성 성공', () => {
    it('유효한 데이터로 신고 작성이 성공해야 함', async () => {
      const testReport = {
        reporter_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        reason: '부적절한 내용이 포함되어 있습니다.',
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data.reason).toBe(testReport.reason);
      expect(data.post_id).toBe(testPostId);
      expect(data.status).toBe('pending'); // 기본 상태는 pending

      if (data?.id) {
        createdReportIds.push(data.id);
      }
    });

    it('최소 길이(1자) 신고 사유 작성이 가능해야 함', async () => {
      const testReport = {
        reporter_id: 'a0000000-0000-0000-0000-000000000002',
        post_id: testPostId,
        reason: '스',
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.reason.length).toBe(1);

      if (data?.id) {
        createdReportIds.push(data.id);
      }
    });

    it('최대 길이(200자) 신고 사유 작성이 가능해야 함', async () => {
      const testReport = {
        reporter_id: 'a0000000-0000-0000-0000-000000000003',
        post_id: testPostId,
        reason: '사'.repeat(200),
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.reason.length).toBe(200);

      if (data?.id) {
        createdReportIds.push(data.id);
      }
    });
  });

  describe('신고 사유 제약', () => {
    it('신고 사유가 빈 문자열일 때 실패해야 함', async () => {
      const testReport = {
        reporter_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        reason: '',
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('post_reports_reason_check');
    });

    it('신고 사유가 200자를 초과할 때 실패해야 함', async () => {
      const testReport = {
        reporter_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
        reason: '사'.repeat(201),
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('post_reports_reason_check');
    });

    it('신고 사유가 1-200자 범위일 때 성공해야 함', async () => {
      const testCases = [
        { length: 1, reason: '신' },
        { length: 100, reason: '신'.repeat(100) },
        { length: 200, reason: '신'.repeat(200) },
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const testReport = {
          reporter_id: `b000000${i}-0000-0000-0000-000000000004`, // Use unique reporter IDs
          post_id: testPostId,
          reason: testCase.reason,
        };

        const { data, error } = await supabase
          .from('post_reports')
          .insert(testReport)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data.reason.length).toBeGreaterThanOrEqual(1);
        expect(data.reason.length).toBeLessThanOrEqual(200);

        if (data?.id) {
          createdReportIds.push(data.id);
        }
      }
    });
  });

  describe('필수 필드 검증', () => {
    it('post_id가 없을 때 실패해야 함', async () => {
      const testReport = {
        reporter_id: 'a0000000-0000-0000-0000-000000000001',
        reason: '부적절한 내용입니다.',
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });

    it('reporter_id가 없을 때 실패해야 함', async () => {
      const testReport = {
        post_id: testPostId,
        reason: '부적절한 내용입니다.',
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });

    it('reason이 없을 때 실패해야 함', async () => {
      const testReport = {
        reporter_id: 'a0000000-0000-0000-0000-000000000001',
        post_id: testPostId,
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error?.message).toContain('null value');
    });
  });

  describe('신고 기본값 검증', () => {
    it('신고 작성 시 기본값이 올바르게 설정되어야 함', async () => {
      const testReport = {
        reporter_id: 'c0000007-0000-0000-0000-000000000000',
        post_id: testPostId,
        reason: '기본값 검증을 위한 신고입니다.',
      };

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 기본값 검증
      expect(data.status).toBe('pending'); // 기본 상태는 pending
      expect(data.created_at).toBeDefined();
      expect(data.resolved_at).toBeNull(); // 초기에는 resolved_at이 null

      if (data?.id) {
        createdReportIds.push(data.id);
      }
    });
  });

  describe('중복 신고 방지 (C-007)', () => {
    it('동일 사용자가 동일 게시글에 중복 신고할 수 없어야 함', async () => {
      const reporterId = 'd0000008-0000-0000-0000-000000000000';

      // 첫 번째 신고
      const { data: data1, error: error1 } = await supabase
        .from('post_reports')
        .insert({
          reporter_id: reporterId,
          post_id: testPostId,
          reason: '첫 번째 신고입니다.',
        })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(data1).toBeDefined();

      if (data1?.id) {
        createdReportIds.push(data1.id);
      }

      // 두 번째 신고 (같은 작성자, 같은 게시글) - 실패해야 함
      const { data: data2, error: error2 } = await supabase
        .from('post_reports')
        .insert({
          reporter_id: reporterId,
          post_id: testPostId,
          reason: '두 번째 신고입니다.',
        })
        .select()
        .single();

      // 중복 신고는 데이터베이스 unique constraint로 방지됨
      expect(error2).not.toBeNull();
      expect(error2?.code).toBe('23505'); // PostgreSQL unique violation
      expect(error2?.message).toContain('post_reports_post_id_reporter_id_key');
    });
  });

  describe('신고 목록 조회', () => {
    it('특정 게시글의 신고 목록이 조회되어야 함', async () => {
      const { data, error } = await supabase
        .from('post_reports')
        .select('*')
        .eq('post_id', testPostId)
        .order('created_at', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // 모든 신고가 같은 게시글에 속해야 함
      data!.forEach((report) => {
        expect(report.post_id).toBe(testPostId);
      });
    });

    it('신고 목록이 최신순으로 정렬되어야 함', async () => {
      const { data, error } = await supabase
        .from('post_reports')
        .select('*')
        .eq('post_id', testPostId)
        .order('created_at', { ascending: false })
        .limit(5);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      if (data && data.length > 1) {
        // 날짜가 내림차순으로 정렬되어 있어야 함
        for (let i = 0; i < data.length - 1; i++) {
          const current = new Date(data[i].created_at).getTime();
          const next = new Date(data[i + 1].created_at).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('신고 횟수 확인', () => {
    it('특정 게시글의 신고 횟수를 조회할 수 있어야 함', async () => {
      const { data, error, count } = await supabase
        .from('post_reports')
        .select('*', { count: 'exact', head: false })
        .eq('post_id', testPostId);

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);

      // ER-003: 신고 횟수 3회 이상 시 자동 블라인드 처리
      // 참고: 이 로직은 애플리케이션 또는 데이터베이스 트리거로 구현해야 함
      if (count && count >= 3) {
        // 게시글의 is_blinded 상태 확인 (향후 구현 시 테스트)
        const { data: post } = await supabase
          .from('posts')
          .select('is_blinded')
          .eq('id', testPostId)
          .single();

        // TODO: 신고 3회 이상 시 자동 블라인드 로직 구현 필요
        // expect(post?.is_blinded).toBe(true);
      }
    });
  });

  describe('신고 작성 성능', () => {
    it('신고 작성이 1초 이내에 완료되어야 함', async () => {
      const testReport = {
        reporter_id: 'e0000009-0000-0000-0000-000000000000',
        post_id: testPostId,
        reason: '성능 테스트 신고입니다.',
      };

      const startTime = performance.now();

      const { data, error } = await supabase
        .from('post_reports')
        .insert(testReport)
        .select()
        .single();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(duration).toBeLessThan(1000); // 1초 이내

      if (data?.id) {
        createdReportIds.push(data.id);
      }
    });
  });
});
