---
id: DASHBOARD-001
version: 0.0.1
status: draft
created: 2025-10-20
updated: 2025-10-20
author: @Alfred
priority: critical
category: feature
labels:
  - dashboard
  - analytics
  - realtime
depends_on:
  - AUTH-001
  - REPORT-001
  - MATCH-001
scope:
  packages:
    - src/features/dashboard
    - src/components/charts
  files:
    - teacher-dashboard.tsx
    - lawyer-dashboard.tsx
    - admin-dashboard.tsx
---

# @SPEC:DASHBOARD-001: 역할별 대시보드

## HISTORY

### v0.0.1 (2025-10-20)
- **INITIAL**: 역할별 대시보드 명세 최초 작성
- **AUTHOR**: @Alfred
- **SCOPE**: 교사/변호사/관리자 대시보드, 실시간 통계, 성능 최적화
- **CONTEXT**: MVP Phase 1 - 사용자 맞춤형 정보 제공 및 시스템 모니터링

---

## 개요

사용자 역할(교사, 변호사, 관리자)에 따라 맞춤형 정보를 제공하는 대시보드입니다. Supabase Realtime을 활용하여 실시간 데이터를 표시하고, 성능 최적화를 통해 빠른 초기 로딩과 부드러운 UX를 제공합니다.

## 핵심 목표

- 역할별 핵심 지표 즉시 확인
- 실시간 데이터 업데이트 (Supabase Realtime)
- 초기 로딩 2초 이내 (성능 최적화)
- 직관적인 차트 및 위젯 배치
- 반응형 디자인 (모바일 지원)

---

## EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)

- 시스템은 사용자 역할에 따라 맞춤형 대시보드를 제공해야 한다
- 시스템은 초기 로딩 시간이 2초를 초과하지 않아야 한다
- 시스템은 실시간으로 데이터를 업데이트해야 한다
- 시스템은 차트 및 통계 위젯을 제공해야 한다
- 시스템은 반응형 레이아웃을 제공해야 한다 (데스크톱/태블릿/모바일)

### Event-driven Requirements (이벤트 기반)

- WHEN 사용자가 대시보드에 접근하면, 시스템은 역할을 확인하고 해당 대시보드를 로드해야 한다
- WHEN 새로운 신고가 생성되면, 교사 대시보드에 실시간으로 반영되어야 한다
- WHEN 매칭이 완료되면, 변호사 대시보드에 배정 사건이 표시되어야 한다
- WHEN 상담이 완료되면, 통계 데이터가 자동으로 업데이트되어야 한다
- WHEN 사용자가 위젯을 클릭하면, 상세 페이지로 이동해야 한다

### State-driven Requirements (상태 기반)

- WHILE 사용자가 대시보드를 보고 있을 때, 시스템은 5분마다 통계를 자동 갱신해야 한다
- WHILE 데이터 로딩 중일 때, 시스템은 스켈레톤 UI를 표시해야 한다
- WHILE 네트워크 오류 발생 시, 시스템은 에러 메시지와 재시도 버튼을 표시해야 한다

### Optional Features (선택적 기능)

- WHERE 사용자가 요청하면, 위젯 배치를 커스터마이징할 수 있다
- WHERE 사용자가 요청하면, 통계 기간을 변경할 수 있다 (주간/월간/연간)
- WHERE 사용자가 요청하면, 데이터를 CSV로 내보낼 수 있다
- WHERE 관리자가 요청하면, 시스템 상태 모니터링 위젯을 추가할 수 있다

### Constraints (제약사항)

- IF 사용자가 인증되지 않았으면, 대시보드 접근을 거부해야 한다
- IF 사용자가 해당 역할이 아니면, 다른 역할의 대시보드 접근을 막아야 한다
- 초기 로딩 시간은 2초를 초과하지 않아야 한다
- 통계 데이터 자동 갱신 간격은 5분을 초과하지 않아야 한다
- 차트 렌더링 시간은 1초를 초과하지 않아야 한다

---

## 역할별 대시보드 상세

### 1. 교사 대시보드

**핵심 위젯**:
1. **내 신고 현황**
   - 진행 중 신고 수
   - 완료된 신고 수
   - 최근 신고 목록 (최대 5개)

2. **상담 이력**
   - 진행 중 상담 수
   - 완료된 상담 수
   - 다음 예정 상담 일정

3. **개인 통계**
   - 총 신고 건수 (월별 차트)
   - 평균 처리 시간
   - 변호사 평가 점수

4. **빠른 액션**
   - 새 신고 작성 버튼
   - 진행 중 상담 바로가기
   - 도움말/FAQ

### 2. 변호사 대시보드

**핵심 위젯**:
1. **배정 사건**
   - 신규 배정 건수
   - 진행 중 사건 목록
   - 우선순위별 필터링

2. **진행 중 상담**
   - 활성 상담 수
   - 안읽은 메시지 알림
   - 상담 바로가기 링크

3. **평가 점수**
   - 평균 평가 점수 (별점)
   - 최근 리뷰 목록
   - 월별 평가 추이 차트

4. **실적 통계**
   - 월별 처리 건수
   - 평균 상담 시간
   - 완료율 (%)

### 3. 관리자 대시보드

**핵심 위젯**:
1. **전체 통계**
   - 총 사용자 수 (교사/변호사)
   - 총 신고 건수
   - 총 매칭 건수
   - 총 상담 건수

2. **사용자 관리**
   - 신규 가입 사용자 (최근 7일)
   - 활성 사용자 수 (DAU/MAU)
   - 사용자 승인 대기 목록

3. **시스템 모니터링**
   - 서버 응답 시간 (평균)
   - 에러 발생 현황
   - 데이터베이스 부하

4. **매칭 현황**
   - 대기 중 매칭 수
   - 평균 매칭 시간
   - 매칭 성공률 (%)

---

## 기술 스택

### 데이터 페칭
- **React Query**: 서버 상태 관리, 캐싱, 자동 리페치
- **Supabase Realtime**: 실시간 데이터 업데이트 (구독)
- **SWR (대안)**: 경량 데이터 페칭 (선택사항)

### 차트 라이브러리
- **Recharts**: 선 그래프, 막대 그래프, 원 그래프
- **D3.js (선택)**: 고급 시각화 (필요 시)

### 상태 관리
- **Zustand**: 대시보드 필터/설정 상태

### 스타일링
- **Tailwind CSS**: 반응형 레이아웃, 다크모드 지원
- **shadcn/ui**: 위젯 컴포넌트 (Card, Badge, Skeleton)

---

## 데이터 모델

### 교사 대시보드 쿼리
```sql
-- 내 신고 현황
SELECT status, COUNT(*) as count
FROM reports
WHERE teacher_id = $1
GROUP BY status;

-- 최근 신고 목록
SELECT id, title, status, created_at
FROM reports
WHERE teacher_id = $1
ORDER BY created_at DESC
LIMIT 5;

-- 상담 이력
SELECT COUNT(*) as total_consultations
FROM consultations
WHERE teacher_id = $1;
```

### 변호사 대시보드 쿼리
```sql
-- 배정 사건
SELECT r.id, r.title, r.severity, m.created_at
FROM reports r
JOIN matches m ON r.id = m.report_id
WHERE m.lawyer_id = $1 AND m.status = 'matched'
ORDER BY r.severity DESC, m.created_at ASC;

-- 평가 점수
SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
FROM reviews
WHERE lawyer_id = $1;

-- 월별 처리 건수
SELECT DATE_TRUNC('month', completed_at) as month, COUNT(*) as count
FROM consultations
WHERE lawyer_id = $1 AND status = 'completed'
GROUP BY month
ORDER BY month DESC
LIMIT 12;
```

### 관리자 대시보드 쿼리
```sql
-- 전체 통계
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teacher_count,
  (SELECT COUNT(*) FROM users WHERE role = 'lawyer') as lawyer_count,
  (SELECT COUNT(*) FROM reports) as report_count,
  (SELECT COUNT(*) FROM matches) as match_count;

-- 신규 가입 사용자 (최근 7일)
SELECT role, COUNT(*) as count
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY role;

-- 매칭 현황
SELECT
  (SELECT COUNT(*) FROM matches WHERE status = 'pending') as pending_matches,
  (SELECT AVG(EXTRACT(EPOCH FROM (matched_at - created_at))) FROM matches WHERE status = 'matched') as avg_match_time,
  (SELECT COUNT(*) FROM matches WHERE status = 'matched') * 100.0 / NULLIF((SELECT COUNT(*) FROM matches), 0) as success_rate;
```

---

## 핵심 시나리오

### 1. 대시보드 초기 로딩
1. 사용자가 대시보드 URL 접근
2. JWT 토큰으로 인증 및 역할 확인
3. 역할별 대시보드 컴포넌트 렌더링
4. 스켈레톤 UI 표시
5. 병렬로 모든 위젯 데이터 페칭
6. 데이터 수신 즉시 위젯별 렌더링
7. 2초 이내 완료

### 2. 실시간 데이터 업데이트
1. 대시보드 마운트 시 Supabase Realtime 구독
2. 새 데이터 발생 시 브로드캐스트 수신
3. React Query 캐시 무효화
4. 해당 위젯만 리페치
5. UI 부드럽게 업데이트 (애니메이션)

### 3. 차트 인터랙션
1. 사용자가 차트 데이터 포인트 호버
2. 툴팁으로 상세 정보 표시
3. 클릭 시 상세 페이지로 이동

### 4. 필터링 및 정렬
1. 사용자가 필터 옵션 선택 (예: 기간)
2. Zustand 스토어에 필터 상태 저장
3. 해당 위젯 쿼리 파라미터 변경
4. React Query 자동 리페치
5. UI 업데이트

---

## 성능 요구사항

- **초기 로딩**: 2초 이내 (모든 위젯 데이터 페칭 완료)
- **차트 렌더링**: 1초 이내
- **실시간 업데이트 지연**: 3초 이내
- **자동 갱신 간격**: 5분 (통계 데이터)
- **메모리 사용량**: 100MB 이하 (대시보드 페이지)

---

## 성능 최적화 전략

### 1. 병렬 데이터 페칭
```typescript
const { data: reports } = useQuery(['teacher-reports', userId]);
const { data: consultations } = useQuery(['teacher-consultations', userId]);
const { data: stats } = useQuery(['teacher-stats', userId]);
// 3개 쿼리 동시 실행
```

### 2. React Query Stale Time 설정
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
    },
  },
});
```

### 3. 스켈레톤 UI로 체감 속도 개선
```typescript
{isLoading ? <SkeletonCard /> : <ReportWidget data={reports} />}
```

### 4. 차트 데이터 메모이제이션
```typescript
const chartData = useMemo(() =>
  transformDataForChart(rawData),
  [rawData]
);
```

### 5. Virtual Scrolling (목록 위젯)
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## 보안 요구사항

- 역할 기반 접근 제어 (RBAC)
  - 교사는 자신의 데이터만 조회
  - 변호사는 배정된 사건만 조회
  - 관리자는 전체 데이터 조회 (RLS 예외)
- JWT 토큰 검증 (모든 API 호출)
- Supabase RLS 정책 적용
- 민감 정보 마스킹 (관리자 대시보드에서 개인정보)

---

## 접근성 요구사항

- 키보드 네비게이션 지원
- 스크린 리더 호환 (ARIA 레이블)
- 색상 대비 비율 4.5:1 이상 (WCAG 2.1 AA)
- 다크모드 지원

---

## 예외 처리

### 데이터 로딩 실패
- 에러 메시지 표시
- 재시도 버튼 제공
- 로그 기록 (Sentry)

### 권한 없음
- 403 Forbidden 에러 처리
- 홈 페이지로 리디렉션
- 사용자에게 권한 없음 안내

### 빈 데이터
- 빈 상태 UI 표시 (Empty State)
- 액션 유도 (예: "첫 신고 작성하기")

---

## 테스트 전략

### 단위 테스트
- 데이터 변환 함수 (차트용)
- 필터링/정렬 로직
- 권한 검증 함수

### 통합 테스트
- Supabase 쿼리 실행
- React Query 캐싱 동작
- Realtime 구독/해제

### E2E 테스트
- 역할별 대시보드 렌더링
- 실시간 데이터 업데이트
- 필터링/정렬 동작

---

## 추적성

- **@TEST:DASHBOARD-001**: tests/dashboard/
- **@CODE:DASHBOARD-001**: src/features/dashboard/
- **@DOC:DASHBOARD-001**: docs/dashboard.md

---

## 관련 SPEC

- **AUTH-001**: 사용자 인증 및 역할 확인
- **REPORT-001**: 신고 데이터 조회
- **MATCH-001**: 매칭 데이터 조회

---

**문서 버전**: v0.0.1
**최종 수정일**: 2025-10-20
**작성자**: @Goos
