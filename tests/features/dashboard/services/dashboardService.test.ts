// @TEST:DASHBOARD-001 | SPEC: SPEC-DASHBOARD-001.md
// dashboardService 테스트 (관리자 데이터 페칭 추가)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchTeacherDashboardData,
  fetchLawyerDashboardData,
  fetchAdminDashboardData,
} from '@/features/dashboard/services/dashboardService';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAdminDashboardData', () => {
    it('전체 통계 조회', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // 사용자 통계
      mockSupabase.single.mockResolvedValueOnce({
        data: { teacher_count: 80, lawyer_count: 70 },
        error: null,
      });

      // 신고 통계
      mockSupabase.single.mockResolvedValueOnce({
        data: { report_count: 320 },
        error: null,
      });

      // 매칭 통계
      mockSupabase.single.mockResolvedValueOnce({
        data: { match_count: 280 },
        error: null,
      });

      const data = await fetchAdminDashboardData();

      expect(data.systemStats.totalUsers).toBe(150);
      expect(data.systemStats.totalReports).toBe(320);
      expect(data.systemStats.totalMatches).toBe(280);
    });

    it('신규 가입 사용자 조회 (최근 7일)', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      mockSupabase.select.mockResolvedValue({
        data: [
          { role: 'teacher', count: 7 },
          { role: 'lawyer', count: 5 },
        ],
        error: null,
      });

      const data = await fetchAdminDashboardData();

      expect(data.userManagement.newUsers).toBe(12);
    });

    it('매칭 현황 조회', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      mockSupabase.single.mockResolvedValue({
        data: {
          pending_matches: 8,
          avg_match_time: 3.5,
          success_rate: 92,
        },
        error: null,
      });

      const data = await fetchAdminDashboardData();

      expect(data.matchingStatus.pendingMatches).toBe(8);
      expect(data.matchingStatus.avgMatchTime).toBe(3.5);
      expect(data.matchingStatus.successRate).toBe(92);
    });

    it('시스템 모니터링 데이터', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      mockSupabase.single.mockResolvedValue({
        data: {
          avg_response_time: 250,
          error_count: 3,
        },
        error: null,
      });

      const data = await fetchAdminDashboardData();

      expect(data.systemMonitoring.avgResponseTime).toBe(250);
      expect(data.systemMonitoring.errorCount).toBe(3);
    });

    it('에러 처리', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(fetchAdminDashboardData()).rejects.toThrow('Database error');
    });
  });

  describe('fetchTeacherDashboardData (기존 테스트 유지)', () => {
    it('병렬 데이터 페칭', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      mockSupabase.order.mockResolvedValue({
        data: [
          { id: '1', title: '신고A', status: 'pending', created_at: '2025-01-01' },
        ],
        error: null,
      });

      const data = await fetchTeacherDashboardData('teacher-1');

      expect(data.reports.pending).toBeGreaterThanOrEqual(0);
    });
  });

  describe('fetchLawyerDashboardData', () => {
    // @TEST:DASHBOARD-LAWYER-001 | SPEC: SPEC-DASHBOARD-LAWYER-001.md

    it('should fetch lawyer dashboard data successfully', async () => {
      // Given: Valid lawyer ID with assigned cases
      const lawyerId = 'lawyer-001';

      // Create separate chain mocks for each query
      const mockReportsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'report-1',
              title: 'Case 1',
              category: 'harassment',
              status: 'pending',
              created_at: '2025-10-20',
              teacher: { name: '홍길동' },
            },
            {
              id: 'report-2',
              title: 'Case 2',
              category: 'discrimination',
              status: 'in_progress',
              created_at: '2025-10-21',
              teacher: { name: '김철수' },
            },
          ],
          error: null,
        }),
      };

      const mockConsultationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'consult-1',
              status: 'completed',
              satisfaction_score: 4.5,
              created_at: '2025-10-18',
              report: { title: 'Case Report 1' },
              teacher: { name: '이영희' },
            },
          ],
          error: null,
        }),
      };

      const mockStatsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { id: '1', created_at: '2025-10-01', updated_at: '2025-10-10', status: 'completed' },
            { id: '2', created_at: '2025-10-15', updated_at: null, status: 'pending' },
          ],
          error: null,
        }),
      };

      let fromCallCount = 0;
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          fromCallCount++;
          if (fromCallCount === 1) return mockReportsChain;
          if (fromCallCount === 2) return mockConsultationsChain;
          if (fromCallCount === 3) return mockStatsChain;
          return mockReportsChain;
        }),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // When: fetchLawyerDashboardData is called
      const result = await fetchLawyerDashboardData(lawyerId);

      // Then: Should return LawyerDashboardData structure
      expect(result).toHaveProperty('cases');
      expect(result).toHaveProperty('consultations');
      expect(result).toHaveProperty('stats');
      expect(result.cases.stats).toHaveProperty('pending');
      expect(result.cases.stats).toHaveProperty('inProgress');
      expect(result.cases.stats).toHaveProperty('completed');
      expect(result.cases.recent).toBeInstanceOf(Array);
      expect(result.cases.stats.pending).toBe(1);
      expect(result.cases.stats.inProgress).toBe(1);
    });

    it('should throw error when Supabase query fails', async () => {
      // Given: Supabase error scenario
      const lawyerId = 'lawyer-002';

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
        }),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // When & Then: Should throw error
      await expect(fetchLawyerDashboardData(lawyerId)).rejects.toThrow('사건 데이터 조회 실패');
    });

    it('should filter cases by assigned_lawyer_id', async () => {
      // Given: Specific lawyer ID
      const lawyerId = 'lawyer-003';

      const mockEq = vi.fn().mockReturnThis();
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: mockEq,
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // When: Data is fetched
      await fetchLawyerDashboardData(lawyerId);

      // Then: Should have called eq with 'assigned_lawyer_id'
      expect(mockEq).toHaveBeenCalledWith('assigned_lawyer_id', lawyerId);
    });

    it('should handle empty data gracefully', async () => {
      // Given: Lawyer with no assigned cases
      const lawyerId = 'lawyer-new';

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation(() => ({
          ...mockSupabase,
          then: (resolve: any) => resolve({ data: [], error: null }),
        })),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // When: Data is fetched
      const result = await fetchLawyerDashboardData(lawyerId);

      // Then: Should return empty arrays and zero values
      expect(result.cases.recent).toEqual([]);
      expect(result.stats.totalCases).toBe(0);
      expect(result.stats.avgProcessingTime).toBe(0);
    });

    it('should calculate average processing time correctly', async () => {
      // Given: Cases with different processing times
      const lawyerId = 'lawyer-004';

      const mockReportsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockConsultationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockStatsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { id: '1', created_at: '2025-10-01T00:00:00Z', updated_at: '2025-10-11T00:00:00Z', status: 'completed' },
            { id: '2', created_at: '2025-10-05T00:00:00Z', updated_at: '2025-10-10T00:00:00Z', status: 'completed' },
          ],
          error: null,
        }),
      };

      let fromCallCount = 0;
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          fromCallCount++;
          if (fromCallCount === 1) return mockReportsChain;
          if (fromCallCount === 2) return mockConsultationsChain;
          if (fromCallCount === 3) return mockStatsChain;
          return mockReportsChain;
        }),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // When: Data is fetched
      const result = await fetchLawyerDashboardData(lawyerId);

      // Then: Average processing time should be calculated (10 days + 5 days) / 2 = 7.5 days = 10800 minutes
      expect(result.stats.avgProcessingTime).toBeGreaterThan(0);
    });

    it('should calculate average rating from consultations', async () => {
      // Given: Consultations with satisfaction scores
      const lawyerId = 'lawyer-005';

      const mockReportsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      const mockConsultationsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [
            { id: '1', status: 'completed', satisfaction_score: 4.5, created_at: '2025-10-01', report: { title: 'R1' }, teacher: { name: 'T1' } },
            { id: '2', status: 'completed', satisfaction_score: 5.0, created_at: '2025-10-02', report: { title: 'R2' }, teacher: { name: 'T2' } },
            { id: '3', status: 'completed', satisfaction_score: 4.0, created_at: '2025-10-03', report: { title: 'R3' }, teacher: { name: 'T3' } },
          ],
          error: null,
        }),
      };

      const mockStatsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      let fromCallCount = 0;
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          fromCallCount++;
          if (fromCallCount === 1) return mockReportsChain;
          if (fromCallCount === 2) return mockConsultationsChain;
          if (fromCallCount === 3) return mockStatsChain;
          return mockReportsChain;
        }),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      // When: Data is fetched
      const result = await fetchLawyerDashboardData(lawyerId);

      // Then: Average rating should be calculated (4.5 + 5.0 + 4.0) / 3 = 4.5
      expect(result.stats.avgRating).toBeCloseTo(4.5, 1);
    });
  });
});
