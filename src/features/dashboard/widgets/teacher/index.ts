// @CODE:DASHBOARD-001:TEACHER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * Teacher Dashboard Widgets - Index
 *
 * 교사 대시보드 위젯 모음
 * - ReportStatsWidget: 내 신고 현황
 * - ConsultationWidget: 상담 이력
 * - PersonalStatsWidget: 개인 통계 (차트 포함)
 * - QuickActionsWidget: 빠른 액션
 */

export { ReportStatsWidget } from './ReportStatsWidget';
export { ConsultationWidget } from './ConsultationWidget';
export { PersonalStatsWidget } from './PersonalStatsWidget';
export { QuickActionsWidget } from './QuickActionsWidget';

export type { ReportStatsWidgetProps, ReportStats } from './ReportStatsWidget';
export type { ConsultationWidgetProps, ConsultationData } from './ConsultationWidget';
export type { PersonalStatsWidgetProps, PersonalStatsData } from './PersonalStatsWidget';
export type { QuickActionsWidgetProps } from './QuickActionsWidget';
