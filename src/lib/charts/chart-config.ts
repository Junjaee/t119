// @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/lib/charts/chart-config.test.ts
// TAG-004: Chart Configuration

/**
 * Recharts 공통 설정
 */
export const chartConfig = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    quinternary: '#8b5cf6',
    senary: '#ec4899',
  },
  margins: {
    top: 20,
    right: 30,
    left: 20,
    bottom: 5,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out' as const,
  },
};

/**
 * Chart color palette
 */
export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

/**
 * Transform data for Recharts
 * @param data - Source data
 * @param keyField - Key field name
 * @returns Transformed data for Recharts
 */
export function transformChartData<T extends Record<string, any>>(
  data: T[],
  keyField: keyof T
): Array<{ name: string; value: number }> {
  if (!data || data.length === 0) {
    return [];
  }

  return data.map((item) => ({
    name: String(item[keyField]),
    value: item.count || item.value || 0,
  }));
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

/**
 * Format month (YYYY-MM to YYYY년 MM월)
 */
export function formatMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  return `${year}년 ${monthNum}월`;
}
