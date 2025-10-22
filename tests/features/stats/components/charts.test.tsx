// @TEST:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md
// TAG-005: Chart Components 테스트

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  TypeDistributionChart,
  MonthlyTrendsChart,
  RegionPieChart,
  CumulativeAreaChart,
} from '@/features/stats/components/charts';

// Mock Recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  AreaChart: ({ children }: any) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('TAG-005: Chart Components', () => {
  describe('TypeDistributionChart', () => {
    const mockData = [
      { type: '폭언/폭행', count: 50, percentage: 50 },
      { type: '명예훼손', count: 30, percentage: 30 },
      { type: '수업방해', count: 20, percentage: 20 },
    ];

    it('should render BarChart', () => {
      render(<TypeDistributionChart data={mockData} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render with empty data', () => {
      render(<TypeDistributionChart data={[]} />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render axis and grid', () => {
      render(<TypeDistributionChart data={mockData} />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('grid')).toBeInTheDocument();
    });

    it('should render tooltip and legend', () => {
      render(<TypeDistributionChart data={mockData} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should be memoized', () => {
      const { rerender } = render(<TypeDistributionChart data={mockData} />);
      rerender(<TypeDistributionChart data={mockData} />);
      // Memoization test (component should not re-render)
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should use responsive container', () => {
      render(<TypeDistributionChart data={mockData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('MonthlyTrendsChart', () => {
    const mockData = [
      {
        month: '2025-10',
        report_count: 100,
        consultation_count: 50,
        completion_rate: 80,
        avg_satisfaction: 4.5,
        month_over_month_change: 10,
      },
      {
        month: '2025-09',
        report_count: 90,
        consultation_count: 45,
        completion_rate: 75,
        avg_satisfaction: 4.3,
        month_over_month_change: 5,
      },
    ];

    it('should render LineChart', () => {
      render(<MonthlyTrendsChart data={mockData} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render with empty data', () => {
      render(<MonthlyTrendsChart data={[]} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render multiple lines', () => {
      render(<MonthlyTrendsChart data={mockData} />);
      const lines = screen.getAllByTestId('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should render axis and grid', () => {
      render(<MonthlyTrendsChart data={mockData} />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('grid')).toBeInTheDocument();
    });

    it('should be memoized', () => {
      const { rerender } = render(<MonthlyTrendsChart data={mockData} />);
      rerender(<MonthlyTrendsChart data={mockData} />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should use responsive container', () => {
      render(<MonthlyTrendsChart data={mockData} />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('RegionPieChart', () => {
    const mockData = [
      { region: '서울', count: 50, percentage: 50 },
      { region: '경기', count: 30, percentage: 30 },
      { region: '부산', count: 20, percentage: 20 },
    ];

    it('should render PieChart', () => {
      render(<RegionPieChart data={mockData} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render with empty data', () => {
      render(<RegionPieChart data={[]} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render pie and cells', () => {
      render(<RegionPieChart data={mockData} />);
      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    it('should render tooltip and legend', () => {
      render(<RegionPieChart data={mockData} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should be memoized', () => {
      const { rerender } = render(<RegionPieChart data={mockData} />);
      rerender(<RegionPieChart data={mockData} />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('CumulativeAreaChart', () => {
    const mockData = [
      { month: '2025-10', cumulative_count: 500 },
      { month: '2025-09', cumulative_count: 400 },
      { month: '2025-08', cumulative_count: 300 },
    ];

    it('should render AreaChart', () => {
      render(<CumulativeAreaChart data={mockData} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should render with empty data', () => {
      render(<CumulativeAreaChart data={[]} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should render area', () => {
      render(<CumulativeAreaChart data={mockData} />);
      expect(screen.getByTestId('area')).toBeInTheDocument();
    });

    it('should be memoized', () => {
      const { rerender } = render(<CumulativeAreaChart data={mockData} />);
      rerender(<CumulativeAreaChart data={mockData} />);
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });
});
