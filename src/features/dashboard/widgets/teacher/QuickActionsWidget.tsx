// @CODE:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md | TEST: tests/features/dashboard/widgets/teacher/quick-actions-widget.test.tsx
/**
 * QuickActionsWidget - 빠른 액션 위젯
 *
 * 교사 대시보드 - 빠른 액션 버튼 모음
 * - 새 신고 작성 버튼
 * - 진행 중 상담 바로가기
 * - 도움말/FAQ
 *
 * @SPEC:DASHBOARD-001 - 교사 대시보드
 * Ubiquitous Requirements: 시스템은 역할에 따라 맞춤형 대시보드를 제공해야 한다
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, HelpCircle } from 'lucide-react';

export interface QuickActionsWidgetProps {
  onNewReport?: () => void;
  onConsultations?: () => void;
  onHelp?: () => void;
}

/**
 * QuickActionsWidget 컴포넌트
 */
export function QuickActionsWidget({
  onNewReport,
  onConsultations,
  onHelp,
}: QuickActionsWidgetProps = {}) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4">빠른 액션</h2>

      <div className="space-y-3">
        {/* 새 신고 작성 버튼 */}
        <Button
          onClick={onNewReport}
          className="w-full justify-start gap-3"
          variant="default"
        >
          <PlusCircle size={20} />
          새 신고 작성
        </Button>

        {/* 진행 중 상담 바로가기 */}
        <Button
          onClick={onConsultations}
          className="w-full justify-start gap-3"
          variant="outline"
        >
          <MessageSquare size={20} />
          진행 중 상담
        </Button>

        {/* 도움말 버튼 */}
        <Button
          onClick={onHelp}
          className="w-full justify-start gap-3"
          variant="ghost"
        >
          <HelpCircle size={20} />
          도움말
        </Button>
      </div>
    </Card>
  );
}
