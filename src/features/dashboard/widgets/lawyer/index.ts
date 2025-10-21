// @CODE:DASHBOARD-001:LAWYER-WIDGETS | SPEC: .moai/specs/SPEC-DASHBOARD-001/spec.md
/**
 * Lawyer Dashboard Widgets - Index
 *
 * 변호사 대시보드 위젯 모음
 * - AssignedCasesWidget: 배정 사건
 * - ActiveConsultationsWidget: 진행 중 상담
 * - RatingWidget: 평가 점수
 * - PerformanceStatsWidget: 실적 통계
 */

export { AssignedCasesWidget } from './AssignedCasesWidget';
export { ActiveConsultationsWidget } from './ActiveConsultationsWidget';
export { RatingWidget } from './RatingWidget';
export { PerformanceStatsWidget } from './PerformanceStatsWidget';

export type { AssignedCasesWidgetProps, AssignedCasesData, AssignedCase } from './AssignedCasesWidget';
export type { ActiveConsultationsWidgetProps, ActiveConsultationsData } from './ActiveConsultationsWidget';
export type { RatingWidgetProps, RatingData, Review } from './RatingWidget';
export type { PerformanceStatsWidgetProps, PerformanceData } from './PerformanceStatsWidget';
