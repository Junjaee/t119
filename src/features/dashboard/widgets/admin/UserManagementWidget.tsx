// @CODE:DASHBOARD-001:ADMIN-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/admin/user-management-widget.test.tsx
/**
 * UserManagementWidget - 사용자 관리 위젯
 *
 * 관리자 대시보드 - 사용자 관리
 * - 신규 가입 사용자 (최근 7일)
 * - 활성 사용자 (DAU/MAU)
 * - 사용자 승인 대기 목록
 *
 * @SPEC:DASHBOARD-001 - 관리자 대시보드
 */

'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * UserManagementData - 사용자 관리 데이터
 */
export interface UserManagementData {
  /** 신규 가입 사용자 (최근 7일) */
  newUsers: {
    /** 교사 수 */
    teacher: number;
    /** 변호사 수 */
    lawyer: number;
  };
  /** 활성 사용자 */
  activeUsers: {
    /** DAU (Daily Active Users) */
    dau: number;
    /** MAU (Monthly Active Users) */
    mau: number;
  };
  /** 승인 대기 목록 */
  pendingApprovals: Array<{
    /** 사용자 ID */
    id: string;
    /** 이름 */
    name: string;
    /** 역할 */
    role: 'teacher' | 'lawyer';
    /** 가입일 */
    createdAt: string;
  }>;
}

/**
 * UserManagementWidgetProps - 위젯 속성
 */
export interface UserManagementWidgetProps {
  /** 사용자 관리 데이터 */
  data: UserManagementData;
}

/**
 * UserManagementWidget 컴포넌트
 *
 * 사용자 관리 정보를 표시합니다.
 * - BarChart로 신규 가입 사용자 시각화
 * - DAU/MAU 통계
 * - 승인 대기 목록
 */
export function UserManagementWidget({ data }: UserManagementWidgetProps) {
  // 차트 데이터 변환
  const chartData = [
    { role: '교사', count: data.newUsers.teacher },
    { role: '변호사', count: data.newUsers.lawyer },
  ];

  // 빈 승인 대기 목록 확인
  const isEmpty = data.pendingApprovals.length === 0;

  return (
    <div className="space-y-4">
      {/* 활성 사용자 */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">사용자 관리</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatsCard title="DAU" value={data.activeUsers.dau} variant="primary" />
          <StatsCard title="MAU" value={data.activeUsers.mau} variant="default" />
        </div>
      </Card>

      {/* 신규 가입 차트 */}
      <ChartWidget title="신규 가입 (7일)" height={200}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="role" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartWidget>

      {/* 차트 하단 요약 */}
      <div className="flex gap-4 text-sm text-gray-600">
        <div>교사: {data.newUsers.teacher}</div>
        <div>변호사: {data.newUsers.lawyer}</div>
      </div>

      {/* 승인 대기 목록 */}
      <Card className="p-4">
        <h3 className="text-md font-semibold mb-3">승인 대기</h3>
        {isEmpty ? (
          <div className="text-center py-6 text-gray-500">
            승인 대기 중인 사용자가 없습니다
          </div>
        ) : (
          <ul className="space-y-2">
            {data.pendingApprovals.map((user) => (
              <li key={user.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                <div>
                  <span className="font-medium">{user.name}</span>
                  <Badge variant={user.role === 'teacher' ? 'default' : 'secondary'} className="ml-2">
                    {user.role === 'teacher' ? '교사' : '변호사'}
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">{user.createdAt}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
