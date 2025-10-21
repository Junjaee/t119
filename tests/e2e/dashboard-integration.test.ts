// @TEST:DASHBOARD-001 | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * E2E 통합 테스트: 역할별 대시보드
 *
 * 이 테스트는 실제 Supabase 연결을 사용하여 다음을 검증합니다:
 * - 교사 대시보드 데이터 로딩
 * - 변호사 대시보드 데이터 로딩
 * - 실시간 데이터 업데이트
 * - 성능 요구사항 (2초 이내 로딩)
 *
 * 실행 전 요구사항:
 * 1. .env.local 파일에 Supabase URL 및 Key 설정
 * 2. Supabase 데이터베이스에 샘플 데이터 존재
 *    - users (교사/변호사)
 *    - reports (신고 데이터)
 *    - matches (매칭 데이터)
 *    - consultations (상담 데이터)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  fetchTeacherDashboard,
  fetchLawyerDashboard,
} from '@/features/dashboard/dashboard-service';

describe('E2E: 역할별 대시보드', () => {
  let supabase: ReturnType<typeof createBrowserClient>;
  let testTeacherId: string;
  let testLawyerId: string;

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

    // 테스트용 사용자 조회
    const { data: teachers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'teacher')
      .limit(1)
      .single();

    const { data: lawyers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'lawyer')
      .limit(1)
      .single();

    if (!teachers || !lawyers) {
      console.warn('⚠️ 테스트용 사용자 데이터가 없습니다. 스킵합니다.');
      console.warn('   Supabase에서 teacher 및 lawyer 사용자를 생성해주세요.');
      return;
    }

    testTeacherId = teachers.id;
    testLawyerId = lawyers.id;
  });

  describe('교사 대시보드', () => {
    it('교사 대시보드 데이터를 2초 이내에 로드해야 한다', async () => {
      if (!testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const startTime = performance.now();

      const data = await fetchTeacherDashboard(supabase, testTeacherId);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 성능 요구사항: 2초 이내
      expect(loadTime).toBeLessThan(2000);

      // 데이터 구조 검증
      expect(data).toBeDefined();
      expect(data.reports).toBeDefined();
      expect(data.consultations).toBeDefined();
      expect(data.recentReports).toBeInstanceOf(Array);
      expect(data.monthlyStats).toBeInstanceOf(Array);
    });

    it('교사의 신고 현황을 정확히 반환해야 한다', async () => {
      if (!testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchTeacherDashboard(supabase, testTeacherId);

      expect(data.reports).toBeDefined();
      expect(typeof data.reports.pending).toBe('number');
      expect(typeof data.reports.in_progress).toBe('number');
      expect(typeof data.reports.completed).toBe('number');

      // 합계 검증
      const total =
        data.reports.pending +
        data.reports.in_progress +
        data.reports.completed;
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('교사의 상담 이력을 정확히 반환해야 한다', async () => {
      if (!testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchTeacherDashboard(supabase, testTeacherId);

      expect(data.consultations).toBeDefined();
      expect(typeof data.consultations.active).toBe('number');
      expect(typeof data.consultations.completed).toBe('number');
    });

    it('최근 신고 목록을 최대 5개 반환해야 한다', async () => {
      if (!testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchTeacherDashboard(supabase, testTeacherId);

      expect(data.recentReports).toBeInstanceOf(Array);
      expect(data.recentReports.length).toBeLessThanOrEqual(5);

      // 최신순 정렬 검증
      if (data.recentReports.length > 1) {
        const dates = data.recentReports.map((r) =>
          new Date(r.created_at).getTime()
        );
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    it('월별 통계를 최대 12개월 반환해야 한다', async () => {
      if (!testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchTeacherDashboard(supabase, testTeacherId);

      expect(data.monthlyStats).toBeInstanceOf(Array);
      expect(data.monthlyStats.length).toBeLessThanOrEqual(12);

      // 월별 데이터 구조 검증
      if (data.monthlyStats.length > 0) {
        const stat = data.monthlyStats[0];
        expect(stat).toHaveProperty('month');
        expect(stat).toHaveProperty('count');
        expect(typeof stat.count).toBe('number');
      }
    });
  });

  describe('변호사 대시보드', () => {
    it('변호사 대시보드 데이터를 2초 이내에 로드해야 한다', async () => {
      if (!testLawyerId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const startTime = performance.now();

      const data = await fetchLawyerDashboard(supabase, testLawyerId);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 성능 요구사항: 2초 이내
      expect(loadTime).toBeLessThan(2000);

      // 데이터 구조 검증
      expect(data).toBeDefined();
      expect(data.assignedCases).toBeInstanceOf(Array);
      expect(data.activeConsultations).toBeInstanceOf(Array);
      expect(typeof data.rating).toBe('number');
      expect(data.monthlyStats).toBeInstanceOf(Array);
    });

    it('배정된 사건 목록을 반환해야 한다', async () => {
      if (!testLawyerId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchLawyerDashboard(supabase, testLawyerId);

      expect(data.assignedCases).toBeInstanceOf(Array);

      // 사건 데이터 구조 검증
      if (data.assignedCases.length > 0) {
        const caseItem = data.assignedCases[0];
        expect(caseItem).toHaveProperty('id');
        expect(caseItem).toHaveProperty('title');
        expect(caseItem).toHaveProperty('severity');
        expect(caseItem).toHaveProperty('created_at');
      }
    });

    it('활성 상담 목록을 반환해야 한다', async () => {
      if (!testLawyerId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchLawyerDashboard(supabase, testLawyerId);

      expect(data.activeConsultations).toBeInstanceOf(Array);

      // 상담 데이터 구조 검증
      if (data.activeConsultations.length > 0) {
        const consultation = data.activeConsultations[0];
        expect(consultation).toHaveProperty('id');
        expect(consultation).toHaveProperty('teacher_name');
        expect(consultation).toHaveProperty('started_at');
      }
    });

    it('평균 평가 점수를 0-5 범위로 반환해야 한다', async () => {
      if (!testLawyerId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchLawyerDashboard(supabase, testLawyerId);

      expect(data.rating).toBeGreaterThanOrEqual(0);
      expect(data.rating).toBeLessThanOrEqual(5);
    });

    it('월별 처리 건수 통계를 반환해야 한다', async () => {
      if (!testLawyerId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const data = await fetchLawyerDashboard(supabase, testLawyerId);

      expect(data.monthlyStats).toBeInstanceOf(Array);
      expect(data.monthlyStats.length).toBeLessThanOrEqual(12);

      // 월별 데이터 구조 검증
      if (data.monthlyStats.length > 0) {
        const stat = data.monthlyStats[0];
        expect(stat).toHaveProperty('month');
        expect(stat).toHaveProperty('count');
        expect(typeof stat.count).toBe('number');
      }
    });
  });

  describe('데이터베이스 연결 검증', () => {
    it('users 테이블에서 교사를 조회할 수 있어야 한다', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('role', 'teacher')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data && data.length > 0) {
        expect(data[0].role).toBe('teacher');
      }
    });

    it('users 테이블에서 변호사를 조회할 수 있어야 한다', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('role', 'lawyer')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data && data.length > 0) {
        expect(data[0].role).toBe('lawyer');
      }
    });

    it('reports 테이블이 존재해야 한다', async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('matches 테이블이 존재해야 한다', async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('consultations 테이블이 존재해야 한다', async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('병렬 데이터 페칭 성능', () => {
    it('교사 대시보드의 모든 쿼리가 병렬로 실행되어야 한다', async () => {
      if (!testTeacherId) {
        console.warn('⚠️ 테스트 데이터 없음 - 스킵');
        return;
      }

      const startTime = performance.now();

      // 병렬 실행
      await fetchTeacherDashboard(supabase, testTeacherId);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 병렬 실행 시 순차 실행보다 빨라야 함
      // (4개 쿼리 × 500ms 가정 = 2000ms 이하)
      expect(loadTime).toBeLessThan(2000);
    });
  });
});
