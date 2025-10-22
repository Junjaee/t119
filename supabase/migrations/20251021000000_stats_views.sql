-- @CODE:STATS-001 | SPEC: .moai/specs/SPEC-STATS-001/spec.md | TEST: tests/lib/stats/database-views.test.ts
-- TAG-001: Database Views & Schema
-- 통계 대시보드를 위한 데이터베이스 뷰 및 인덱스 생성

-- 1. 성능 최적화: reports 테이블 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_region ON reports(region);

-- 2. report_stats 뷰: 유형별/지역별/학교급별 집계
CREATE OR REPLACE VIEW report_stats AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  type,
  region,
  school_level,
  COUNT(*) AS report_count,
  ROUND(
    COUNT(*) * 100.0 / NULLIF(
      SUM(COUNT(*)) OVER (PARTITION BY DATE_TRUNC('month', created_at)),
      0
    ),
    2
  ) AS percentage
FROM reports
WHERE status != 'deleted' AND status IS NOT NULL
GROUP BY DATE_TRUNC('month', created_at), type, region, school_level
ORDER BY month DESC, report_count DESC;

-- 3. consultation_stats 뷰: 상담 성과 지표
CREATE OR REPLACE VIEW consultation_stats AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_consultations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) AS completion_rate,
  ROUND(
    AVG(
      CASE
        WHEN status = 'completed' AND completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400.0
      END
    ),
    2
  ) AS avg_processing_days,
  ROUND(AVG(satisfaction_score), 2) AS avg_satisfaction
FROM consultations
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 4. monthly_trends 뷰: 월별 추이 데이터
CREATE OR REPLACE VIEW monthly_trends AS
SELECT
  month,
  report_count,
  report_count - LAG(report_count) OVER (ORDER BY month) AS month_over_month_change,
  ROUND(
    (report_count - LAG(report_count) OVER (ORDER BY month)) * 100.0 /
    NULLIF(LAG(report_count) OVER (ORDER BY month), 0),
    2
  ) AS percentage_change
FROM (
  SELECT
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS report_count
  FROM reports
  WHERE created_at >= NOW() - INTERVAL '12 months'
    AND status != 'deleted'
  GROUP BY DATE_TRUNC('month', created_at)
) monthly_data
ORDER BY month DESC;

-- 5. 뷰 권한 설정 (authenticated 사용자만 읽기 가능)
GRANT SELECT ON report_stats TO authenticated;
GRANT SELECT ON consultation_stats TO authenticated;
GRANT SELECT ON monthly_trends TO authenticated;

-- 6. 주석 추가 (문서화)
COMMENT ON VIEW report_stats IS 'STATS-001: 교권 침해 유형별/지역별/학교급별 통계 집계 뷰';
COMMENT ON VIEW consultation_stats IS 'STATS-001: 상담 성과 지표 집계 뷰 (최근 12개월)';
COMMENT ON VIEW monthly_trends IS 'STATS-001: 월별 신고 추이 및 전월 대비 증감 분석 뷰 (최근 12개월)';
