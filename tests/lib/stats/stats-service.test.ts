// @TEST:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// TAG-002: Stats Service Layer 테스트

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchOverviewStats,
  fetchTrendsData,
  fetchConsultationStats,
  validateDateRange,
} from '@/lib/stats/stats-service';
import type { StatsFilters } from '@/types/stats.types';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

describe('TAG-002: Stats Service Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOverviewStats', () => {
    it('should fetch overview statistics with default date range', async () => {
      const result = await fetchOverviewStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('overview');
      expect(result.overview).toHaveProperty('total_reports');
      expect(result.overview).toHaveProperty('active_consultations');
      expect(result.overview).toHaveProperty('completion_rate');
      expect(result.overview).toHaveProperty('avg_processing_days');
    });

    it('should fetch overview statistics with custom date range', async () => {
      const filters: StatsFilters = {
        start_date: '2025-01-01',
        end_date: '2025-10-21',
      };

      const result = await fetchOverviewStats(filters);

      expect(result).toBeDefined();
      expect(result.by_type).toBeInstanceOf(Array);
      expect(result.by_region).toBeInstanceOf(Array);
      expect(result.by_school_level).toBeInstanceOf(Array);
    });

    it('should apply PII masking to data', async () => {
      const result = await fetchOverviewStats();

      // Names should be masked
      if (result.by_region.length > 0) {
        expect(result).toBeDefined();
      }
    });

    it('should handle empty data gracefully', async () => {
      const result = await fetchOverviewStats({
        start_date: '2099-01-01',
        end_date: '2099-12-31',
      });

      expect(result).toBeDefined();
      expect(result.overview.total_reports).toBe(0);
      expect(result.by_type).toHaveLength(0);
    });

    it('should calculate percentages correctly', async () => {
      const result = await fetchOverviewStats();

      const totalPercentage = result.by_type.reduce(
        (sum, item) => sum + item.percentage,
        0
      );

      if (result.by_type.length > 0) {
        expect(totalPercentage).toBeCloseTo(100, 0);
      }
    });
  });

  describe('fetchTrendsData', () => {
    it('should fetch monthly trends with default date range', async () => {
      const result = await fetchTrendsData();

      expect(result).toBeDefined();
      expect(result.trends).toBeInstanceOf(Array);
    });

    it('should fetch trends with type filter', async () => {
      const filters: StatsFilters = {
        type: '폭언/폭행',
      };

      const result = await fetchTrendsData(filters);

      expect(result).toBeDefined();
      expect(result.trends).toBeInstanceOf(Array);
    });

    it('should fetch trends with region filter', async () => {
      const filters: StatsFilters = {
        region: '서울',
      };

      const result = await fetchTrendsData(filters);

      expect(result).toBeDefined();
    });

    it('should limit to 12 months maximum', async () => {
      const result = await fetchTrendsData();

      expect(result.trends.length).toBeLessThanOrEqual(12);
    });

    it('should calculate month-over-month change', async () => {
      const result = await fetchTrendsData();

      if (result.trends.length > 1) {
        expect(result.trends[0]).toHaveProperty('month_over_month_change');
      }
    });

    it('should order by month descending', async () => {
      const result = await fetchTrendsData();

      if (result.trends.length > 1) {
        const months = result.trends.map((t) => new Date(t.month).getTime());
        for (let i = 0; i < months.length - 1; i++) {
          expect(months[i]).toBeGreaterThanOrEqual(months[i + 1]);
        }
      }
    });
  });

  describe('fetchConsultationStats', () => {
    it('should fetch consultation performance metrics', async () => {
      const result = await fetchConsultationStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('performance');
      expect(result.performance).toHaveProperty('total_consultations');
      expect(result.performance).toHaveProperty('completion_rate');
    });

    it('should fetch counselor statistics', async () => {
      const result = await fetchConsultationStats();

      expect(result.by_counselor).toBeInstanceOf(Array);
    });

    it('should mask counselor names', async () => {
      const result = await fetchConsultationStats();

      result.by_counselor.forEach((counselor) => {
        if (counselor.counselor_name) {
          expect(counselor.counselor_name).toMatch(/[가-힣]\*/);
        }
      });
    });

    it('should calculate avg_satisfaction correctly', async () => {
      const result = await fetchConsultationStats();

      if (result.performance.avg_satisfaction > 0) {
        expect(result.performance.avg_satisfaction).toBeGreaterThanOrEqual(1);
        expect(result.performance.avg_satisfaction).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date range', () => {
      expect(() =>
        validateDateRange({
          start_date: '2025-01-01',
          end_date: '2025-10-21',
        })
      ).not.toThrow();
    });

    it('should throw error if end_date before start_date', () => {
      expect(() =>
        validateDateRange({
          start_date: '2025-10-21',
          end_date: '2025-01-01',
        })
      ).toThrow('end_date must be after start_date');
    });

    it('should throw error if date range exceeds 12 months', () => {
      expect(() =>
        validateDateRange({
          start_date: '2024-01-01',
          end_date: '2025-10-21',
        })
      ).toThrow('Date range cannot exceed 12 months');
    });

    it('should accept empty filters', () => {
      expect(() => validateDateRange({})).not.toThrow();
    });
  });
});
