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

  describe('fetchLawyerDashboardData (기존 테스트 유지)', () => {
    it('병렬 데이터 페칭', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
      };

      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      mockSupabase.select.mockResolvedValue({
        data: [{ rating: 4.5 }],
        error: null,
      });

      const data = await fetchLawyerDashboardData('lawyer-1');

      expect(data.rating.average).toBeGreaterThanOrEqual(0);
    });
  });
});
