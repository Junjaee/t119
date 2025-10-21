# @DOC:DASHBOARD-001: 대시보드 Phase 1 컴포넌트 API 문서

> **Living Document** - 코드와 동기화되는 실시간 API 문서
>
> **Related SPEC**: `.moai/specs/SPEC-DASHBOARD-001/spec.md`
> **Last Updated**: 2025-10-21

---

## 개요

SPEC-DASHBOARD-001 Phase 1에서 구현된 3개의 핵심 대시보드 컴포넌트의 API 문서입니다.

- **StatsCard**: 통계 정보 표시 카드
- **ChartWidget**: 차트 래퍼 컴포넌트
- **SkeletonCard**: 로딩 스켈레톤 UI

---

## 1. StatsCard 컴포넌트

### 위치
- **코드**: `src/components/dashboard/StatsCard.tsx`
- **테스트**: `tests/components/dashboard/stats-card.test.tsx`
- **TAG**: `@CODE:DASHBOARD-001`

### 개요

대시보드에서 사용하는 통계 정보 표시 카드입니다. 제목, 값, 설명, 아이콘을 지원하며, 증감 추이를 표시할 수 있습니다.

**SPEC 요구사항**:
- ✅ `@SPEC:DASHBOARD-001` - Ubiquitous Requirements: 시스템은 차트 및 통계 위젯을 제공해야 한다

### Props 인터페이스

```typescript
interface StatsCardProps {
  /** 카드 제목 */
  title: string;

  /** 통계 값 */
  value: string | number;

  /** 설명 텍스트 (선택) */
  description?: string;

  /** 아이콘 (선택) */
  icon?: React.ReactNode;

  /** 증감 추이 (선택) */
  trend?: {
    value: number;
    isIncrease: boolean;
  };

  /** 클릭 핸들러 (선택) */
  onClick?: () => void;

  /** 스타일 변형 */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';

  /** 추가 CSS 클래스 */
  className?: string;
}
```

### Props 상세

#### 필수 Props

| Prop | 타입 | 설명 | 예시 |
|------|------|------|------|
| `title` | `string` | 카드 제목 | `"진행 중인 신고"` |
| `value` | `string \| number` | 표시할 통계 값 | `42` 또는 `"3.5K"` |

#### 선택 Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|-------|------|
| `description` | `string` | - | 부가 설명 텍스트 |
| `icon` | `React.ReactNode` | - | 아이콘 컴포넌트 |
| `trend` | `object` | - | 증감 추이 데이터 |
| `trend.value` | `number` | - | 증감율 (%) |
| `trend.isIncrease` | `boolean` | - | 증가/감소 여부 |
| `onClick` | `() => void` | - | 클릭 이벤트 핸들러 |
| `variant` | `enum` | `'default'` | 카드 스타일 변형 |
| `className` | `string` | - | 추가 CSS 클래스 |

### Variant 스타일

| Variant | 설명 | 배경색 | 테두리색 |
|---------|------|-------|---------|
| `default` | 기본 스타일 | 흰색 | 회색 |
| `primary` | 기본 정보 (파란색) | `bg-blue-50` | `border-blue-500` |
| `success` | 성공 정보 (초록색) | `bg-green-50` | `border-green-500` |
| `warning` | 경고 정보 (황색) | `bg-yellow-50` | `border-yellow-500` |
| `danger` | 위험 정보 (빨강색) | `bg-red-50` | `border-red-500` |

### 사용 예시

#### 기본 사용

```typescript
import { StatsCard } from '@/components/dashboard/StatsCard';

export function TeacherDashboard() {
  return (
    <StatsCard
      title="진행 중인 신고"
      value={12}
      description="이 달"
      variant="primary"
    />
  );
}
```

#### 증감 추이 포함

```typescript
<StatsCard
  title="완료된 상담"
  value={156}
  description="월별"
  trend={{
    value: 12.5,
    isIncrease: true,
  }}
  variant="success"
/>
```

#### 클릭 이벤트 포함

```typescript
<StatsCard
  title="배정 사건"
  value={8}
  icon={<CaseIcon />}
  onClick={() => navigate('/cases')}
  variant="primary"
/>
```

### 렌더링 결과

```
┌─────────────────────────────┐
│ 진행 중인 신고        [icon] │
├─────────────────────────────┤
│ 12                          │
│ +5.2% 이 달                 │
└─────────────────────────────┘
```

### 접근성

- `role="region"`: 통계 영역으로 식별
- `aria-label`: "통계 카드: {title}" 형식으로 스크린 리더 지원
- 키보드 네비게이션 지원 (onClick 제공 시 button 요소로 렌더링)

---

## 2. ChartWidget 컴포넌트

### 위치
- **코드**: `src/components/dashboard/ChartWidget.tsx`
- **테스트**: `tests/components/dashboard/chart-widget.test.tsx`
- **TAG**: `@CODE:DASHBOARD-001`

### 개요

Recharts 차트를 감싸는 재사용 가능한 위젯입니다. 로딩, 에러, 빈 상태를 자동으로 처리합니다.

**SPEC 요구사항**:
- ✅ `@SPEC:DASHBOARD-001` - Ubiquitous Requirements: 시스템은 차트 및 통계 위젯을 제공해야 한다
- ✅ `@SPEC:DASHBOARD-001` - Constraints: 차트 렌더링 시간은 1초를 초과하지 않아야 한다

### Props 인터페이스

```typescript
interface ChartWidgetProps {
  /** 차트 제목 */
  title: string;

  /** 설명 텍스트 (선택) */
  description?: string;

  /** 차트 컴포넌트 */
  children: React.ReactNode;

  /** 로딩 상태 */
  isLoading?: boolean;

  /** 에러 메시지 */
  error?: string;

  /** 빈 데이터 여부 */
  isEmpty?: boolean;

  /** 빈 데이터 메시지 */
  emptyMessage?: string;

  /** 차트 높이 (px) */
  height?: number;

  /** 추가 CSS 클래스 */
  className?: string;
}
```

### Props 상세

#### 필수 Props

| Prop | 타입 | 설명 | 예시 |
|------|------|------|------|
| `title` | `string` | 차트 제목 | `"월별 신고 현황"` |
| `children` | `React.ReactNode` | 차트 컴포넌트 (Recharts) | `<LineChart />` |

#### 선택 Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|-------|------|
| `description` | `string` | - | 부가 설명 텍스트 |
| `isLoading` | `boolean` | `false` | 로딩 상태 표시 |
| `error` | `string` | - | 에러 메시지 |
| `isEmpty` | `boolean` | `false` | 빈 데이터 여부 |
| `emptyMessage` | `string` | `"데이터가 없습니다"` | 빈 데이터 메시지 |
| `height` | `number` | `300` | 차트 높이 (px) |
| `className` | `string` | - | 추가 CSS 클래스 |

### 상태 렌더링

ChartWidget은 다음 순서로 상태를 검사하여 렌더링합니다:

1. **로딩 중** (`isLoading === true`)
   - 애니메이션 Skeleton 표시
   - 메시지: "로딩 중..."

2. **에러** (`!isLoading && error`)
   - 빨간색 배경
   - 에러 메시지 표시
   - 재시도 UI는 부모에서 제공

3. **빈 데이터** (`!isLoading && !error && isEmpty`)
   - 회색 배경
   - 커스텀 메시지 표시

4. **정상 렌더링** (`!isLoading && !error && !isEmpty`)
   - 차트 컴포넌트 렌더링

### 사용 예시

#### 기본 차트 표시

```typescript
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { LineChart, Line, XAxis, YAxis } from 'recharts';

const data = [
  { month: '1월', count: 10 },
  { month: '2월', count: 15 },
  { month: '3월', count: 12 },
];

export function MonthlySalesChart() {
  return (
    <ChartWidget
      title="월별 신고 현황"
      description="지난 3개월간의 신고 추이"
    >
      <LineChart data={data}>
        <XAxis dataKey="month" />
        <YAxis />
        <Line type="monotone" dataKey="count" stroke="#0284c7" />
      </LineChart>
    </ChartWidget>
  );
}
```

#### 로딩 상태 포함

```typescript
import { useQuery } from '@tanstack/react-query';

export function TeacherStatsChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: fetchTeacherStats,
  });

  return (
    <ChartWidget
      title="상담 통계"
      isLoading={isLoading}
      error={error?.message}
      isEmpty={!data || data.length === 0}
    >
      <BarChart data={data}>
        {/* 차트 구성 */}
      </BarChart>
    </ChartWidget>
  );
}
```

#### 에러 처리

```typescript
<ChartWidget
  title="데이터 분석"
  error="데이터를 불러올 수 없습니다. 다시 시도해주세요."
  height={400}
/>
```

### 성능 최적화

**렌더링 시간**: 1초 이내 (SPEC 제약사항)

- Recharts 차트는 별도 최적화 필요
- useMemo를 사용하여 차트 데이터 메모이제이션
- Virtual Scrolling (목록 위젯) 적용

### 접근성

- `role="figure"`: 차트를 그림/그래프로 식별
- `aria-label`: 차트 제목으로 설정
- 데이터 테이블 제공 (accessibility)

---

## 3. SkeletonCard 컴포넌트

### 위치
- **코드**: `src/components/dashboard/SkeletonCard.tsx`
- **테스트**: `tests/components/dashboard/skeleton-card.test.tsx`
- **TAG**: `@CODE:DASHBOARD-001`

### 개요

대시보드 로딩 상태를 표시하는 스켈레톤 UI 컴포넌트입니다. 체감 속도를 개선하여 사용자에게 더 나은 UX를 제공합니다.

**SPEC 요구사항**:
- ✅ `@SPEC:DASHBOARD-001` - State-driven Requirements: WHILE 데이터 로딩 중일 때, 시스템은 스켈레톤 UI를 표시해야 한다

### Props 인터페이스

```typescript
interface SkeletonCardProps {
  /** 높이 (px) */
  height?: number;

  /** 행 개수 */
  rows?: number;

  /** 추가 CSS 클래스 */
  className?: string;
}
```

### Props 상세

| Prop | 타입 | 기본값 | 설명 | 범위 |
|------|------|-------|------|------|
| `height` | `number` | `150` | 전체 높이 (픽셀) | 50~600 |
| `rows` | `number` | `3` | 행의 개수 | 1~10 |
| `className` | `string` | - | 추가 CSS 클래스 | - |

### 구조

```
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓                  │  (제목: h-6)
├─────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  (행 1: h-4, full width)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │  (행 2: h-4, full width)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓                  │  (행 3: h-4, 50% width)
└─────────────────────────────┘
```

### 사용 예시

#### 기본 스켈레톤

```typescript
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';

export function LoadingDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
```

#### 커스텀 높이와 행 개수

```typescript
<SkeletonCard
  height={200}
  rows={5}
  className="mb-4"
/>
```

#### 조건부 렌더링 (StatsCard와 함께)

```typescript
import { useQuery } from '@tanstack/react-query';

export function TeacherStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: fetchStats,
  });

  return (
    <>
      {isLoading ? (
        <SkeletonCard height={150} rows={3} />
      ) : (
        <StatsCard
          title="진행 중인 신고"
          value={data?.activeReports}
          variant="primary"
        />
      )}
    </>
  );
}
```

### 성능 특성

- **렌더링**: < 100ms
- **메모리**: 매우 경량
- **애니메이션**: CSS `animate-pulse` (GPU 가속)
- **접근성**: 시각적 피드백만 제공 (ARIA 레이블 없음, 스켈레톤이므로 정보 아님)

### 테스트 어트리뷰트

```typescript
// 테스트에서 사용 가능한 data-testid
<SkeletonCard data-testid="skeleton-card" />
<div data-testid="skeleton-row-0" />
<div data-testid="skeleton-row-1" />
// ...
```

---

## @TAG 체인 검증

### TAG 시스템

```
@SPEC:DASHBOARD-001 (명세)
    ↓
@TEST:DASHBOARD-001 (테스트)
    ↓
@CODE:DASHBOARD-001 (구현)
    ↓
@DOC:DASHBOARD-001 (문서)  ← 본 문서
```

### 검증 명령어

```bash
# 전체 TAG 스캔
rg '@(SPEC|TEST|CODE|DOC):DASHBOARD-001' -n

# SPEC 확인
rg '@SPEC:DASHBOARD-001' -n .moai/specs/

# CODE 확인
rg '@CODE:DASHBOARD-001' -n src/

# TEST 확인
rg '@TEST:DASHBOARD-001' -n tests/

# DOC 확인 (본 문서)
rg '@DOC:DASHBOARD-001' -n docs/
```

---

## 통합 예시

### 완전한 대시보드 구성

```typescript
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ChartWidget } from '@/components/dashboard/ChartWidget';
import { SkeletonCard } from '@/components/dashboard/SkeletonCard';
import { useQuery } from '@tanstack/react-query';

export function TeacherDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
  });

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* 통계 카드 섹션 */}
      <div className="col-span-3 grid grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <SkeletonCard height={150} rows={3} />
            <SkeletonCard height={150} rows={3} />
            <SkeletonCard height={150} rows={3} />
          </>
        ) : (
          <>
            <StatsCard
              title="진행 중인 신고"
              value={data?.activeReports || 0}
              variant="primary"
            />
            <StatsCard
              title="완료된 상담"
              value={data?.completedConsultations || 0}
              trend={{
                value: 12.5,
                isIncrease: true,
              }}
              variant="success"
            />
            <StatsCard
              title="평가 점수"
              value={`${data?.rating || 0}/5.0`}
              variant="primary"
            />
          </>
        )}
      </div>

      {/* 차트 섹션 */}
      <div className="col-span-2">
        <ChartWidget
          title="월별 신고 현황"
          description="지난 12개월 추이"
          isLoading={isLoading}
          height={300}
        >
          {/* Recharts 구성요소 */}
        </ChartWidget>
      </div>

      {/* 추가 통계 */}
      <div>
        <ChartWidget
          title="역할별 분포"
          isLoading={isLoading}
          height={300}
        >
          {/* Pie Chart */}
        </ChartWidget>
      </div>
    </div>
  );
}
```

---

## 관련 리소스

### SPEC 문서
- `.moai/specs/SPEC-DASHBOARD-001/spec.md` - 전체 명세 및 요구사항

### 테스트 파일
- `tests/components/dashboard/stats-card.test.tsx`
- `tests/components/dashboard/chart-widget.test.tsx`
- `tests/components/dashboard/skeleton-card.test.tsx`

### 의존 라이브러리
- **shadcn/ui**: Card, Badge 컴포넌트
- **React Query**: 데이터 페칭 및 캐싱
- **Recharts**: 차트 라이브러리
- **Tailwind CSS**: 스타일링

### 관련 SPEC
- **AUTH-001**: 사용자 인증 및 역할 확인
- **REPORT-001**: 신고 데이터 조회
- **MATCH-001**: 매칭 데이터 조회

---

## 문서 메타데이터

| 항목 | 값 |
|------|-----|
| **Document ID** | @DOC:DASHBOARD-001 |
| **Related SPEC** | @SPEC:DASHBOARD-001 |
| **Created** | 2025-10-20 |
| **Last Updated** | 2025-10-21 |
| **Status** | draft |
| **Version** | 0.0.1 |

