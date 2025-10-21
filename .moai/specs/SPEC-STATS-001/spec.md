---
# 필수 필드 (7개)
id: STATS-001
version: 0.0.1
status: draft
created: 2025-10-21
updated: 2025-10-21
author: @Alfred
priority: high

# 선택 필드 - 분류/메타
category: feature
labels:
  - statistics
  - dashboard
  - analytics
  - reporting

# 선택 필드 - 관계 (의존성 그래프)
depends_on:
  - REPORT-001
related_specs:
  - DASHBOARD-001

# 선택 필드 - 범위 (영향 분석)
scope:
  packages:
    - src/features/stats
    - src/lib/charts
  files:
    - stats-service.ts
    - chart-config.ts
    - pdf-generator.ts
---

# @SPEC:STATS-001: 통계 대시보드 및 분석 시스템

## HISTORY

### v0.0.1 (2025-10-21)
- **INITIAL**: 교권 침해 통계 대시보드 및 분석 시스템 명세 작성
- **AUTHOR**: @Alfred
- **REASON**: 데이터 기반 정책 제언 및 예방 교육 자료 생성을 위한 실시간 통계 모니터링 시스템 구축

---

## 1. Overview

### 비즈니스 목표
교권 침해 현황 실시간 모니터링을 통해 데이터 기반 정책 제언을 제공하고, 예방 교육 자료를 생성하여 교권 보호 체계를 강화

### 핵심 가치 제안
- **실시간 모니터링**: 교권 침해 유형/지역/기간별 통계 실시간 갱신 (5분 이내)
- **데이터 기반 정책 제언**: 정책 수립 근거 자료 제공 (PDF 리포트)
- **예방 교육 자료**: 통계 데이터 기반 교육 자료 생성
- **성과 지표**: 상담 성과 및 효과성 측정

---

## 2. EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)
시스템은 다음 핵심 기능을 제공해야 한다:

- **UR-001**: 시스템은 교권 침해 유형별 통계를 제공해야 한다
  - 유형: 폭언/폭행, 명예훼손, 수업방해, 성희롱, 기타
  - 집계 방식: 건수, 비율, 전월 대비 증감
- **UR-002**: 시스템은 지역별/학교급별 분포를 시각화해야 한다
  - 지역: 17개 시도 단위
  - 학교급: 초등학교, 중학교, 고등학교, 특수학교
- **UR-003**: 시스템은 월별/연도별 추이 분석을 제공해야 한다
  - 최대 12개월 데이터 표시
  - 전년 동기 대비 비교
- **UR-004**: 시스템은 상담 성과 지표를 제공해야 한다
  - 상담 완료율, 평균 처리 시간, 만족도
- **UR-005**: 시스템은 PDF 리포트 생성 기능을 제공해야 한다
  - 선택 기간, 차트 이미지 포함

### Event-driven Requirements (이벤트 기반)
WHEN [조건]이면, 시스템은 다음과 같이 동작해야 한다:

- **ER-001**: WHEN 신규 신고가 접수되면, 시스템은 통계를 자동 갱신해야 한다
  - 갱신 주기: 5분 이내 (실시간)
  - React Query 캐시 무효화 및 재조회
- **ER-002**: WHEN 관리자가 PDF 리포트를 요청하면, 시스템은 10초 이내 PDF를 생성해야 한다
  - 차트 이미지 캡처 및 PDF 변환
  - 다운로드 링크 제공
- **ER-003**: WHEN 특정 지표가 임계값을 초과하면, 시스템은 관리자에게 알림을 전송해야 한다
  - 임계값 예시: 주간 신고 건수 +50%, 특정 유형 신고 급증
  - 알림 채널: 이메일 또는 시스템 알림

### State-driven Requirements (상태 기반)
WHILE [상태]일 때, 시스템은 다음과 같이 동작해야 한다:

- **SR-001**: WHILE 데이터 로딩 중일 때, 시스템은 스켈레톤 UI를 표시해야 한다
  - 차트 영역에 스켈레톤 컴포넌트 표시
  - 로딩 상태 표시: "데이터를 불러오는 중..."
- **SR-002**: WHILE 차트 렌더링 중일 때, 시스템은 프로그레스 바를 표시해야 한다
  - 렌더링 진행률 표시 (0~100%)

### Optional Features (선택적 기능)
WHERE [조건]이면, 시스템은 다음 기능을 제공할 수 있다:

- **OF-001**: WHERE 사용자가 요청하면, 시스템은 Excel 내보내기 기능을 제공할 수 있다
  - 라이브러리: xlsx
  - 형식: .xlsx (다중 시트 지원)
- **OF-002**: WHERE 사용자가 요청하면, 시스템은 사용자 정의 대시보드를 생성할 수 있다
  - 차트 위젯 드래그 앤 드롭
  - 레이아웃 저장/불러오기

### Constraints (제약사항)
시스템은 다음 제약을 준수해야 한다:

- **C-001**: 차트 렌더링 시간은 1초를 초과하지 않아야 한다
  - Recharts 성능 최적화 (메모이제이션)
- **C-002**: 데이터는 개인정보 마스킹 후 표시해야 한다
  - 교사명: "홍*동" 형식
  - 학교명: "**초등학교" 형식
- **C-003**: PDF 생성은 10초를 초과하지 않아야 한다
  - 차트 이미지 캡처: html2canvas
  - PDF 생성: jsPDF
- **C-004**: 통계 데이터는 실시간 갱신 (5분 이내)
  - React Query staleTime: 5분
  - Supabase Realtime 구독
- **C-005**: 차트는 최대 12개월 데이터 표시
  - 12개월 초과 시 페이지네이션

---

## 3. 데이터 모델

### 3.1 report_stats 뷰 (유형별/지역별/기간별 집계)
```sql
CREATE VIEW report_stats AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  type,                    -- 침해 유형 (폭언/폭행, 명예훼손 등)
  region,                  -- 지역 (17개 시도)
  school_level,            -- 학교급 (초/중/고/특수)
  COUNT(*) AS report_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY month) AS percentage
FROM reports
WHERE status != 'deleted'
GROUP BY month, type, region, school_level;
```

### 3.2 consultation_stats 뷰 (상담 성과 지표)
```sql
CREATE VIEW consultation_stats AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_consultations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) AS completion_rate,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) AS avg_processing_days,
  AVG(satisfaction_score) AS avg_satisfaction
FROM consultations
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month;
```

### 3.3 monthly_trends 뷰 (월별 추이 데이터)
```sql
CREATE VIEW monthly_trends AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS report_count,
  COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS month_over_month_change,
  (COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at))) * 100.0 /
    NULLIF(LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)), 0) AS percentage_change
FROM reports
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;
```

---

## 4. API 설계

### 4.1 통계 API

#### GET /api/stats/overview
전체 통계 개요

**Query Parameters**:
```typescript
{
  start_date?: string;  // ISO 8601 (default: 12개월 전)
  end_date?: string;    // ISO 8601 (default: 오늘)
}
```

**Response** (200 OK):
```typescript
{
  overview: {
    total_reports: number;           // 총 신고 건수
    active_consultations: number;    // 진행 중 상담 건수
    completion_rate: number;         // 상담 완료율 (%)
    avg_processing_days: number;     // 평균 처리 일수
  },
  by_type: Array<{
    type: string;
    count: number;
    percentage: number;
    month_over_month_change: number;  // 전월 대비 증감 (%)
  }>,
  by_region: Array<{
    region: string;
    count: number;
    percentage: number;
  }>,
  by_school_level: Array<{
    level: string;
    count: number;
    percentage: number;
  }>
}
```

#### GET /api/stats/trends
월별 추이 데이터

**Query Parameters**:
```typescript
{
  start_date?: string;
  end_date?: string;
  type?: string;        // optional: 특정 유형 필터
  region?: string;      // optional: 특정 지역 필터
}
```

**Response** (200 OK):
```typescript
{
  trends: Array<{
    month: string;      // YYYY-MM
    report_count: number;
    consultation_count: number;
    completion_rate: number;
    avg_satisfaction: number;
    month_over_month_change: number;
  }>
}
```

#### GET /api/stats/consultations
상담 성과 지표

**Response** (200 OK):
```typescript
{
  performance: {
    total_consultations: number;
    completed_count: number;
    completion_rate: number;      // %
    avg_processing_days: number;
    avg_satisfaction: number;     // 1~5
  },
  by_counselor: Array<{
    counselor_id: string;
    counselor_name: string;
    consultation_count: number;
    completion_rate: number;
    avg_satisfaction: number;
  }>
}
```

### 4.2 리포트 생성 API

#### POST /api/stats/reports/pdf
PDF 리포트 생성

**Request Body**:
```typescript
{
  start_date: string;   // ISO 8601
  end_date: string;     // ISO 8601
  include_charts: string[];  // ['type', 'region', 'trends', 'consultations']
  title?: string;       // optional (default: "교권 침해 통계 리포트")
}
```

**Response** (200 OK):
```typescript
{
  pdf_url: string;      // Supabase Storage URL
  file_name: string;    // stats-report-2025-10-21.pdf
  expires_at: string;   // ISO 8601 (24시간 후 만료)
}
```

#### POST /api/stats/reports/excel
Excel 내보내기 (Optional)

**Request Body**:
```typescript
{
  start_date: string;
  end_date: string;
  sheets: string[];  // ['overview', 'trends', 'consultations']
}
```

**Response** (200 OK):
```typescript
{
  excel_url: string;
  file_name: string;
  expires_at: string;
}
```

---

## 5. 차트 설계

### 5.1 차트 종류 (Recharts 2.13.0)

#### BarChart: 유형별 분포
```typescript
// @CODE:STATS-001:UI
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<BarChart data={typeDistribution}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="type" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="count" fill="#8884d8" />
</BarChart>
```

#### LineChart: 월별 추이
```typescript
// @CODE:STATS-001:UI
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<LineChart data={monthlyTrends}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="report_count" stroke="#8884d8" />
  <Line type="monotone" dataKey="consultation_count" stroke="#82ca9d" />
</LineChart>
```

#### PieChart: 지역별 비율
```typescript
// @CODE:STATS-001:UI
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

<PieChart>
  <Pie
    data={regionDistribution}
    dataKey="count"
    nameKey="region"
    cx="50%"
    cy="50%"
    outerRadius={80}
    fill="#8884d8"
    label
  >
    {regionDistribution.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

#### AreaChart: 누적 통계
```typescript
// @CODE:STATS-001:UI
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

<AreaChart data={cumulativeStats}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="month" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="cumulative_count" stroke="#8884d8" fill="#8884d8" />
</AreaChart>
```

### 5.2 차트 설정 공유 (DASHBOARD-001 재사용)
```typescript
// @CODE:STATS-001:UI
// Recharts 공통 설정 (DASHBOARD-001과 동일)
export const chartConfig = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
  },
  margins: { top: 20, right: 30, left: 20, bottom: 5 },
  animation: {
    duration: 300,
    easing: 'ease-in-out',
  },
};
```

---

## 6. 성능 최적화 전략

### 6.1 데이터 집계 최적화
- **P-001**: 뷰 기반 집계 (report_stats, consultation_stats, monthly_trends)
  - 실시간 집계 부하 감소
  - 인덱스 최적화: `CREATE INDEX idx_reports_created_at ON reports(created_at)`
- **P-002**: Materialized View 고려 (데이터 규모 증가 시)
  - 5분마다 REFRESH MATERIALIZED VIEW

### 6.2 차트 렌더링 최적화
- **P-003**: React.memo 사용 (차트 컴포넌트 메모이제이션)
  ```typescript
  export const TypeDistributionChart = React.memo(({ data }) => {
    // BarChart 렌더링
  });
  ```
- **P-004**: useMemo 사용 (차트 데이터 가공)
  ```typescript
  const chartData = useMemo(() => {
    return transformData(rawData);
  }, [rawData]);
  ```

### 6.3 캐싱 전략
- **P-005**: React Query 캐싱
  ```typescript
  useQuery({
    queryKey: ['stats', 'overview', { start_date, end_date }],
    queryFn: fetchOverviewStats,
    staleTime: 5 * 60 * 1000,  // 5분
    cacheTime: 30 * 60 * 1000, // 30분
  });
  ```

---

## 7. 보안 요구사항

### 7.1 개인정보 마스킹
- **S-001**: 교사명 마스킹 (예: "홍길동" → "홍*동")
  ```typescript
  function maskName(name: string): string {
    if (name.length <= 2) return name[0] + '*';
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  }
  ```
- **S-002**: 학교명 마스킹 (예: "서울초등학교" → "**초등학교")
  ```typescript
  function maskSchoolName(name: string): string {
    const suffix = name.slice(-5);  // "초등학교" 등
    return '**' + suffix;
  }
  ```

### 7.2 접근 제어
- **S-003**: 통계 API는 관리자 권한 필요
  - JWT 토큰 검증 + role='admin' 확인
- **S-004**: PDF 리포트 생성은 관리자만 가능
  - Rate Limiting: 1분당 5회 요청 제한

### 7.3 데이터 필터링
- **S-005**: SQL Injection 방지 (Prepared Statement)
- **S-006**: XSS 공격 방지 (차트 레이블 이스케이프)

---

## 8. 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript 5.6.3** (strict mode)
- **Recharts 2.13.0** (차트 라이브러리, DASHBOARD-001과 동일)
- **React Query 5.56.0** (데이터 페칭 및 캐싱)
- **Tailwind CSS** (스타일링)
- **jsPDF** (PDF 생성)
- **html2canvas** (차트 이미지 캡처)
- **xlsx** (Excel 내보내기, 선택사항)

### Backend
- **Supabase** (PostgreSQL + Realtime)
- **Supabase Functions** (PDF 생성 서버리스 함수)
- **Supabase Storage** (PDF/Excel 파일 저장)

### Testing
- **Vitest** (단위 테스트)
- **React Testing Library** (컴포넌트 테스트)
- **Playwright** (E2E 테스트)

---

## 9. 구현 우선순위

### 1차 목표 (Core Statistics)
- [ ] 유형별/지역별/기간별 통계 API 구현
- [ ] BarChart (유형별 분포) 구현
- [ ] LineChart (월별 추이) 구현
- [ ] 데이터 집계 뷰 생성 (report_stats, monthly_trends)

### 2차 목표 (Advanced Charts)
- [ ] PieChart (지역별 비율) 구현
- [ ] AreaChart (누적 통계) 구현
- [ ] 상담 성과 지표 API 구현
- [ ] React Query 캐싱 최적화

### 3차 목표 (Reporting)
- [ ] PDF 리포트 생성 기능
- [ ] 차트 이미지 캡처 (html2canvas)
- [ ] PDF 다운로드 링크 제공
- [ ] 개인정보 마스킹 로직 구현

### 4차 목표 (Optional Features)
- [ ] Excel 내보내기 기능
- [ ] 사용자 정의 대시보드 (드래그 앤 드롭)
- [ ] 알림 임계값 설정 UI
- [ ] 실시간 통계 갱신 (Supabase Realtime)

---

## 10. 테스트 계획

### 10.1 단위 테스트
- **개인정보 마스킹 함수** (maskName, maskSchoolName)
- **차트 데이터 변환 함수** (transformData)
- **날짜 범위 검증 함수** (validateDateRange)

### 10.2 통합 테스트
- **통계 API → 차트 렌더링 플로우**
- **PDF 생성 → 다운로드 플로우**
- **React Query 캐싱 동작 검증**

### 10.3 성능 테스트
- **차트 렌더링 시간 ≤ 1초**
- **PDF 생성 시간 ≤ 10초**
- **API 응답 시간 ≤ 500ms**

### 10.4 E2E 테스트
- **사용자 시나리오**: 통계 페이지 접근 → 차트 확인 → PDF 다운로드
- **데이터 무결성**: 신규 신고 접수 → 통계 자동 갱신 확인 (5분 이내)

---

## 11. Traceability (추적성)

### TAG 체계
- `@SPEC:STATS-001` - 본 명세 문서
- `@TEST:STATS-001` - 테스트 코드 (tests/stats/)
- `@CODE:STATS-001` - 구현 코드 (src/features/stats/)
- `@DOC:STATS-001` - Living Document (docs/stats.md)

### 의존성
- **depends_on**: REPORT-001 (신고 데이터 기반 통계 생성)
- **related_specs**: DASHBOARD-001 (Recharts 공통 설정 재사용)

---

**최종 업데이트**: 2025-10-21
**작성자**: @Alfred
**버전**: 0.0.1 (INITIAL)
