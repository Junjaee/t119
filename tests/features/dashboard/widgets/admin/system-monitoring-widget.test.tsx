// @TEST:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * SystemMonitoringWidget 테스트
 *
 * 관리자 대시보드 - 시스템 모니터링 위젯
 * - 서버 응답 시간 (평균)
 * - 에러 발생 현황
 * - 데이터베이스 부하
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemMonitoringWidget } from '@/features/dashboard/widgets/admin/SystemMonitoringWidget';

describe('SystemMonitoringWidget', () => {
  const mockData = {
    avgResponseTime: 145,
    errorCount: 3,
    dbLoad: 42,
    healthStatus: 'healthy' as const,
    responseTimeTrend: [
      { time: '09:00', value: 120 },
      { time: '10:00', value: 135 },
      { time: '11:00', value: 145 },
      { time: '12:00', value: 150 },
    ],
  };

  it('위젯 제목이 표시되어야 함', () => {
    render(<SystemMonitoringWidget data={mockData} />);
    expect(screen.getByText('시스템 모니터링')).toBeInTheDocument();
  });

  it('시스템 지표가 표시되어야 함', () => {
    render(<SystemMonitoringWidget data={mockData} />);

    expect(screen.getByText('응답 시간')).toBeInTheDocument();
    expect(screen.getByText('145ms')).toBeInTheDocument();

    expect(screen.getByText('에러')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('DB 부하')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('상태 Badge가 표시되어야 함', () => {
    render(<SystemMonitoringWidget data={mockData} />);
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('응답 시간 추이 LineChart가 표시되어야 함', () => {
    render(<SystemMonitoringWidget data={mockData} />);
    expect(screen.getByText('응답 시간 추이')).toBeInTheDocument();
  });

  it('경고 상태 표시', () => {
    const warningData = {
      ...mockData,
      healthStatus: 'warning' as const,
    };

    render(<SystemMonitoringWidget data={warningData} />);
    expect(screen.getByText('주의')).toBeInTheDocument();
  });
});
