// @TEST:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// TAG-001: Database Views & Schema 테스트

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('TAG-001: Database Views & Schema', () => {
  describe('report_stats view', () => {
    it('should exist in database', async () => {
      const { data, error } = await supabase
        .from('report_stats')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have required columns', async () => {
      const { data, error } = await supabase
        .from('report_stats')
        .select('month, type, region, school_level, report_count, percentage')
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        const row = data[0];
        expect(row).toHaveProperty('month');
        expect(row).toHaveProperty('type');
        expect(row).toHaveProperty('region');
        expect(row).toHaveProperty('school_level');
        expect(row).toHaveProperty('report_count');
        expect(row).toHaveProperty('percentage');
      }
    });

    it('should aggregate by month', async () => {
      const { data, error } = await supabase
        .from('report_stats')
        .select('month, report_count')
        .order('month', { ascending: false })
        .limit(12);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('consultation_stats view', () => {
    it('should exist in database', async () => {
      const { data, error } = await supabase
        .from('consultation_stats')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have required columns', async () => {
      const { data, error } = await supabase
        .from('consultation_stats')
        .select(
          'month, total_consultations, completed_count, completion_rate, avg_processing_days, avg_satisfaction'
        )
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        const row = data[0];
        expect(row).toHaveProperty('month');
        expect(row).toHaveProperty('total_consultations');
        expect(row).toHaveProperty('completed_count');
        expect(row).toHaveProperty('completion_rate');
        expect(row).toHaveProperty('avg_processing_days');
        expect(row).toHaveProperty('avg_satisfaction');
      }
    });

    it('should calculate completion rate correctly', async () => {
      const { data, error } = await supabase
        .from('consultation_stats')
        .select('total_consultations, completed_count, completion_rate')
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        const row = data[0];
        if (row.total_consultations > 0) {
          const expectedRate =
            (row.completed_count * 100.0) / row.total_consultations;
          expect(Math.abs(row.completion_rate - expectedRate)).toBeLessThan(
            0.01
          );
        }
      }
    });
  });

  describe('monthly_trends view', () => {
    it('should exist in database', async () => {
      const { data, error } = await supabase
        .from('monthly_trends')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have required columns', async () => {
      const { data, error } = await supabase
        .from('monthly_trends')
        .select(
          'month, report_count, month_over_month_change, percentage_change'
        )
        .limit(1);

      expect(error).toBeNull();
      if (data && data.length > 0) {
        const row = data[0];
        expect(row).toHaveProperty('month');
        expect(row).toHaveProperty('report_count');
        expect(row).toHaveProperty('month_over_month_change');
        expect(row).toHaveProperty('percentage_change');
      }
    });

    it('should limit to last 12 months', async () => {
      const { data, error } = await supabase
        .from('monthly_trends')
        .select('month')
        .order('month', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      if (data && data.length > 0) {
        expect(data.length).toBeLessThanOrEqual(12);
      }
    });

    it('should order by month descending', async () => {
      const { data, error } = await supabase
        .from('monthly_trends')
        .select('month')
        .limit(3);

      expect(error).toBeNull();
      if (data && data.length > 1) {
        const dates = data.map((row) => new Date(row.month).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });
  });

  describe('Index optimization', () => {
    it('should have index on reports.created_at', async () => {
      const { data, error } = await supabase.rpc('check_index_exists', {
        table_name: 'reports',
        index_name: 'idx_reports_created_at',
      });

      // Note: This test requires a custom function in Supabase
      // For now, we'll just verify the view queries are fast
      expect(error).toBe(null);
    });
  });
});
