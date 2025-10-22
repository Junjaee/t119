// @TEST:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// TAG-004: Chart Configuration 테스트

import { describe, it, expect } from 'vitest';
import { chartConfig, transformChartData } from '@/lib/charts/chart-config';

describe('TAG-004: Chart Configuration', () => {
  describe('chartConfig', () => {
    it('should have color configuration', () => {
      expect(chartConfig).toHaveProperty('colors');
      expect(chartConfig.colors).toHaveProperty('primary');
      expect(chartConfig.colors).toHaveProperty('secondary');
      expect(chartConfig.colors).toHaveProperty('tertiary');
      expect(chartConfig.colors).toHaveProperty('quaternary');
    });

    it('should have margins configuration', () => {
      expect(chartConfig).toHaveProperty('margins');
      expect(chartConfig.margins).toHaveProperty('top');
      expect(chartConfig.margins).toHaveProperty('right');
      expect(chartConfig.margins).toHaveProperty('left');
      expect(chartConfig.margins).toHaveProperty('bottom');
    });

    it('should have animation configuration', () => {
      expect(chartConfig).toHaveProperty('animation');
      expect(chartConfig.animation).toHaveProperty('duration');
      expect(chartConfig.animation).toHaveProperty('easing');
      expect(chartConfig.animation.duration).toBe(300);
    });
  });

  describe('transformChartData', () => {
    it('should transform type stats for BarChart', () => {
      const input = [
        { type: '폭언/폭행', count: 50, percentage: 50 },
        { type: '명예훼손', count: 30, percentage: 30 },
        { type: '수업방해', count: 20, percentage: 20 },
      ];

      const result = transformChartData(input, 'type');

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('name', '폭언/폭행');
      expect(result[0]).toHaveProperty('value', 50);
    });

    it('should handle empty data', () => {
      const result = transformChartData([], 'type');

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
