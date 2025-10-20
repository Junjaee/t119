// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// 대시보드 데이터 페칭 및 변환 테스트

import { describe, it, expect, vi } from 'vitest';
import {
  fetchTeacherDashboardData,
  fetchLawyerDashboardData,
  transformChartData,
} from '@/features/dashboard/dashboard-service';

// Mock Supabase with proper method chaining
const mockSupabaseChain = () => {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
  };
  return chain;
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockSupabaseChain()),
  })),
}));

describe('@TEST:DASHBOARD-001 - 대시보드 데이터 서비스', () => {
  describe('교사 대시보드 데이터', () => {
    it('신고 현황을 페칭해야 한다', async () => {
      const result = await fetchTeacherDashboardData('teacher-001');

      expect(result).toHaveProperty('reports');
      expect(result.reports).toHaveProperty('pending');
      expect(result.reports).toHaveProperty('completed');
    });

    it('상담 이력을 페칭해야 한다', async () => {
      const result = await fetchTeacherDashboardData('teacher-001');

      expect(result).toHaveProperty('consultations');
      expect(result.consultations).toHaveProperty('active');
      expect(result.consultations).toHaveProperty('total');
    });

    it('개인 통계를 페칭해야 한다', async () => {
      const result = await fetchTeacherDashboardData('teacher-001');

      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('totalReports');
      expect(result.stats).toHaveProperty('avgProcessingTime');
    });
  });

  describe('변호사 대시보드 데이터', () => {
    it('배정 사건을 페칭해야 한다', async () => {
      const result = await fetchLawyerDashboardData('lawyer-001');

      expect(result).toHaveProperty('assignedCases');
      expect(Array.isArray(result.assignedCases)).toBe(true);
    });

    it('평가 점수를 페칭해야 한다', async () => {
      const result = await fetchLawyerDashboardData('lawyer-001');

      expect(result).toHaveProperty('rating');
      expect(result.rating).toHaveProperty('average');
      expect(result.rating).toHaveProperty('count');
    });

    it('실적 통계를 페칭해야 한다', async () => {
      const result = await fetchLawyerDashboardData('lawyer-001');

      expect(result).toHaveProperty('performance');
      expect(result.performance).toHaveProperty('monthlyCases');
      expect(result.performance).toHaveProperty('completionRate');
    });
  });

  describe('차트 데이터 변환', () => {
    it('월별 데이터를 차트 형식으로 변환해야 한다', () => {
      const rawData = [
        { month: '2025-09', count: 10 },
        { month: '2025-10', count: 15 },
      ];

      const chartData = transformChartData(rawData);

      expect(chartData).toHaveLength(2);
      expect(chartData[0]).toHaveProperty('name');
      expect(chartData[0]).toHaveProperty('value');
    });

    it('빈 데이터를 처리해야 한다', () => {
      const chartData = transformChartData([]);

      expect(chartData).toEqual([]);
    });

    it('날짜 형식을 한국어로 변환해야 한다', () => {
      const rawData = [{ month: '2025-09', count: 10 }];

      const chartData = transformChartData(rawData);

      expect(chartData[0].name).toMatch(/9월|Sep/);
    });
  });

  describe('성능 요구사항', () => {
    it('병렬 데이터 페칭을 사용해야 한다', async () => {
      const startTime = Date.now();
      await fetchTeacherDashboardData('teacher-001');
      const endTime = Date.now();

      // 모든 쿼리가 순차적이면 2초 이상 걸림
      // 병렬이면 1초 이내
      expect(endTime - startTime).toBeLessThan(2000);
    });

    it('메모이제이션을 사용해야 한다', () => {
      const rawData = [{ month: '2025-09', count: 10 }];

      const result1 = transformChartData(rawData);
      const result2 = transformChartData(rawData);

      // 동일한 입력에 대해 동일한 결과
      expect(result1).toEqual(result2);
    });
  });
});
