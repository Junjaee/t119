// @TEST:MATCH-001 | SPEC: .moai/specs/SPEC-MATCH-001/spec.md
// 변호사 주도 매칭 시스템 서비스 테스트

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchingService } from '@/lib/services/matching-service';
import {
  AvailableReportsQuery,
  CreateConsultationRequest,
  ConsultationStatus,
} from '@/lib/types/matching';
import { ReportCategory, ReportStatus } from '@/types/report.types';

// Supabase 클라이언트 모킹
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MatchingService();
  });

  describe('getAvailableReports', () => {
    it('미배정 신고 목록을 성공적으로 조회해야 한다', async () => {
      const mockReports = [
        {
          id: 'report-1',
          title: '학부모 민원 테스트',
          category: ReportCategory.PARENT,
          incident_date: '2025-10-15',
          created_at: '2025-10-15T10:00:00Z',
          users: {
            name: '홍길동',
            nickname: '익명교사123',
          },
        },
        {
          id: 'report-2',
          title: '학생 문제 테스트',
          category: ReportCategory.STUDENT,
          incident_date: '2025-10-16',
          created_at: '2025-10-16T10:00:00Z',
          users: {
            name: '김철수',
            nickname: '익명교사456',
          },
        },
      ];

      const mockData = {
        data: mockReports,
        count: 2,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue(mockData),
              }),
            }),
          }),
        }),
      });

      const query: AvailableReportsQuery = {
        page: 1,
        limit: 20,
      };

      const result = await service.getAvailableReports(query);

      expect(result.reports).toHaveLength(2);
      expect(result.reports[0].id).toBe('report-1');
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total_pages).toBe(1);
    });

    it('카테고리 필터링이 동작해야 한다', async () => {
      const mockReports = [
        {
          id: 'report-1',
          title: '학부모 민원 테스트',
          category: ReportCategory.PARENT,
          incident_date: '2025-10-15',
          created_at: '2025-10-15T10:00:00Z',
          users: {
            name: '홍길동',
            nickname: '익명교사123',
          },
        },
      ];

      const mockData = {
        data: mockReports,
        count: 1,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue(mockData),
                }),
              }),
            }),
          }),
        }),
      });

      const query: AvailableReportsQuery = {
        category: ReportCategory.PARENT,
        page: 1,
        limit: 20,
      };

      const result = await service.getAvailableReports(query);

      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].category).toBe(ReportCategory.PARENT);
    });

    it('정렬 옵션이 동작해야 한다', async () => {
      const mockReports = [
        {
          id: 'report-2',
          title: '최신 신고',
          category: ReportCategory.STUDENT,
          incident_date: '2025-10-16',
          created_at: '2025-10-16T10:00:00Z',
          users: {
            name: '김철수',
            nickname: '익명교사456',
          },
        },
        {
          id: 'report-1',
          title: '이전 신고',
          category: ReportCategory.PARENT,
          incident_date: '2025-10-15',
          created_at: '2025-10-15T10:00:00Z',
          users: {
            name: '홍길동',
            nickname: '익명교사123',
          },
        },
      ];

      const mockData = {
        data: mockReports,
        count: 2,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue(mockData),
              }),
            }),
          }),
        }),
      });

      const query: AvailableReportsQuery = {
        sort: 'created_at',
        order: 'desc',
        page: 1,
        limit: 20,
      };

      const result = await service.getAvailableReports(query);

      expect(result.reports).toHaveLength(2);
      expect(result.reports[0].id).toBe('report-2'); // 최신 순
    });

    it('페이지네이션이 동작해야 한다', async () => {
      const mockReports = Array.from({ length: 10 }, (_, i) => ({
        id: `report-${i + 11}`,
        title: `신고 ${i + 11}`,
        category: ReportCategory.PARENT,
        incident_date: '2025-10-15',
        created_at: '2025-10-15T10:00:00Z',
        users: {
          name: '교사',
          nickname: `익명${i}`,
        },
      }));

      const mockData = {
        data: mockReports,
        count: 50,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue(mockData),
              }),
            }),
          }),
        }),
      });

      const query: AvailableReportsQuery = {
        page: 2,
        limit: 10,
      };

      const result = await service.getAvailableReports(query);

      expect(result.reports).toHaveLength(10);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total_pages).toBe(5);
    });

    it('빈 목록을 반환해야 한다', async () => {
      const mockData = {
        data: [],
        count: 0,
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue(mockData),
              }),
            }),
          }),
        }),
      });

      const query: AvailableReportsQuery = {
        page: 1,
        limit: 20,
      };

      const result = await service.getAvailableReports(query);

      expect(result.reports).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.total_pages).toBe(0);
    });
  });

  describe('selectReport', () => {
    const lawyerId = 'lawyer-123';
    const request: CreateConsultationRequest = {
      report_id: 'report-456',
    };

    it('상담 시작을 성공적으로 수행해야 한다', async () => {
      const mockReport = {
        id: 'report-456',
        user_id: 'teacher-789',
        title: '테스트 신고',
        category: ReportCategory.PARENT,
        status: ReportStatus.SUBMITTED,
        assigned_lawyer_id: null,
        created_at: '2025-10-15T10:00:00Z',
      };

      const mockConsultation = {
        id: 'consultation-111',
        report_id: 'report-456',
        teacher_id: 'teacher-789',
        lawyer_id: 'lawyer-123',
        status: ConsultationStatus.PENDING,
        created_at: '2025-10-20T10:00:00Z',
      };

      const mockUpdatedReport = {
        ...mockReport,
        status: ReportStatus.ASSIGNED,
        assigned_lawyer_id: 'lawyer-123',
      };

      // 진행 중인 상담 수 확인
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              count: 5,
            }),
          }),
        }),
      });

      // 신고 조회
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockReport,
              error: null,
            }),
          }),
        }),
      });

      // 신고 업데이트
      mockSupabaseClient.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedReport,
                error: null,
              }),
            }),
          }),
        }),
      });

      // 상담 생성
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConsultation,
              error: null,
            }),
          }),
        }),
      });

      const result = await service.selectReport(lawyerId, request);

      expect(result.consultation.id).toBe('consultation-111');
      expect(result.consultation.status).toBe(ConsultationStatus.PENDING);
      expect(result.report.status).toBe(ReportStatus.ASSIGNED);
      expect(result.report.assigned_lawyer_id).toBe('lawyer-123');
    });

    it('이미 배정된 신고 선택 시 409 에러를 반환해야 한다', async () => {
      const mockReport = {
        id: 'report-456',
        user_id: 'teacher-789',
        title: '테스트 신고',
        category: ReportCategory.PARENT,
        status: ReportStatus.ASSIGNED,
        assigned_lawyer_id: 'other-lawyer-999',
        created_at: '2025-10-15T10:00:00Z',
      };

      // 진행 중인 상담 수 확인
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              count: 5,
            }),
          }),
        }),
      });

      // 신고 조회
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockReport,
              error: null,
            }),
          }),
        }),
      });

      await expect(service.selectReport(lawyerId, request)).rejects.toThrow(
        'Report already assigned'
      );
    });

    it('존재하지 않는 신고 선택 시 404 에러를 반환해야 한다', async () => {
      // 진행 중인 상담 수 확인
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              count: 5,
            }),
          }),
        }),
      });

      // 신고 조회 실패
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Report not found' },
            }),
          }),
        }),
      });

      await expect(service.selectReport(lawyerId, request)).rejects.toThrow(
        'Report not found'
      );
    });

    it('진행 중인 상담 10개 초과 시 403 에러를 반환해야 한다', async () => {
      // 진행 중인 상담 수 확인 (11개)
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              count: 11,
            }),
          }),
        }),
      });

      await expect(service.selectReport(lawyerId, request)).rejects.toThrow(
        'Too many active consultations'
      );
    });

    it('신고 상태가 submitted가 아닐 때 400 에러를 반환해야 한다', async () => {
      const mockReport = {
        id: 'report-456',
        user_id: 'teacher-789',
        title: '테스트 신고',
        category: ReportCategory.PARENT,
        status: ReportStatus.IN_PROGRESS,
        assigned_lawyer_id: null,
        created_at: '2025-10-15T10:00:00Z',
      };

      // 진행 중인 상담 수 확인
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              count: 5,
            }),
          }),
        }),
      });

      // 신고 조회
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockReport,
              error: null,
            }),
          }),
        }),
      });

      await expect(service.selectReport(lawyerId, request)).rejects.toThrow(
        'Report is not available'
      );
    });
  });
});
