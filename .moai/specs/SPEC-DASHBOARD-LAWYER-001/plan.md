# SPEC-DASHBOARD-LAWYER-001: 구현 계획 (Implementation Plan)

> **관련 SPEC**: `spec.md`
> **작성일**: 2025-10-23
> **작성자**: @Claude

---

## 1. 구현 우선순위

### 1차 목표: 핵심 데이터 조회 기능
- `dashboardService.ts`에 `fetchLawyerDashboardData` 함수 구현
- Supabase 쿼리 최적화 (limit, order by, assigned_lawyer_id 필터)
- 타입 안전성 검증 (LawyerDashboardData 인터페이스)
- Helper 함수 구현 (calculateAvgProcessingTime)

### 2차 목표: React Query 연동 강화
- `useDashboardData` 훅의 lawyer 역할 연결 확인
- 재시도 전략 검증 (지수 백오프)
- 캐싱 정책 검증 (staleTime, refetchInterval)

### 3차 목표: UI 통합 및 테스트
- 변호사 대시보드 페이지 에러 상태 처리
- 스켈레톤 UI 개선
- 단위/통합/E2E 테스트 작성

---

## 2. 기술적 접근 방법

### 2.1 아키텍처 결정: Supabase Direct Client

**선택**: Supabase Direct Client (Teacher SPEC과 동일)

**근거**:
- ✅ 서버리스 아키텍처 (인프라 관리 불필요)
- ✅ Supabase RLS 정책으로 보안 보장
- ✅ 타입 안전성 (Supabase Types Generator)
- ✅ 낮은 레이턴시 (중간 서버 없음)
- ✅ Teacher SPEC 패턴 재사용 가능
- ❌ 클라이언트 네트워크 비용 (단점, 하지만 캐싱으로 완화)

**대안 (Next.js API Route)**:
- 장점: 서버 측 캐싱, API 버전 관리 용이
- 단점: 추가 레이어, 배포 복잡도 증가
- **결론**: MVP에서는 불필요, Phase 2 고려

### 2.2 Teacher SPEC과의 차이점 관리

#### 데이터 소스 차이
```typescript
// Teacher: reports.teacher_id = auth.uid()
supabase
  .from('reports')
  .select('*')
  .eq('teacher_id', userId)

// Lawyer: reports.assigned_lawyer_id = auth.uid()
supabase
  .from('reports')
  .select('*')
  .eq('assigned_lawyer_id', userId)  // ← 핵심 차이점!
```

#### 상태 분류 차이
- **Teacher**: pending, completed (2가지)
- **Lawyer**: pending, in_progress, completed (3가지)

**구현 전략**: 공통 패턴을 유지하면서 필터 조건만 변경

### 2.3 React Query 전략

#### 캐싱 정책 (Teacher와 동일)
```typescript
{
  staleTime: 5 * 60 * 1000,        // 5분간 신선한 상태 유지
  refetchInterval: 5 * 60 * 1000,  // 5분마다 자동 리프레시
  refetchOnWindowFocus: true,       // 포커스 복귀 시 갱신
  retry: 3,                         // 3회 재시도
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000) // 지수 백오프
}
```

#### 병렬 페칭 최적화
- `Promise.all`로 3개 Supabase 쿼리 동시 실행
- 총 응답 시간: max(query1, query2, query3) ≈ 300-500ms (예상)

### 2.4 에러 처리 전략

#### 3단계 에러 처리
1. **Supabase 레벨**: `result.error` 체크 후 예외 전파
2. **Service 레벨**: try-catch로 사용자 친화적 메시지 변환
3. **UI 레벨**: React Query `error` 상태로 에러 UI 렌더링

#### 에러 메시지 표준화
```typescript
// dashboardService.ts
if (casesResult.error) {
  throw new Error(`사건 데이터 조회 실패: ${casesResult.error.message}`);
}

// 변호사 대시보드 페이지
if (error) {
  return (
    <div className="p-4">
      <p className="text-red-600">데이터 로딩 중 오류가 발생했습니다</p>
      <button onClick={() => refetch()}>재시도</button>
    </div>
  );
}
```

---

## 3. 리스크 및 대응 방안

### 3.1 Supabase RLS 정책 미설정
- **리스크**: 변호사가 다른 변호사의 데이터 조회 가능
- **대응**: Supabase Dashboard에서 RLS 정책 확인 및 적용
  ```sql
  CREATE POLICY "변호사는 배정된 사건만 조회"
  ON reports FOR SELECT
  USING (auth.uid()::TEXT = assigned_lawyer_id::TEXT);

  CREATE POLICY "변호사는 담당 상담만 조회"
  ON consultations FOR SELECT
  USING (auth.uid()::TEXT = lawyer_id::TEXT);
  ```

### 3.2 데이터 없음 상황
- **리스크**: 신규 가입 변호사 또는 배정된 사건 없음으로 빈 배열 반환
- **대응**: 빈 상태 UI (Empty State) 표시
  ```tsx
  {data?.cases.recent.length === 0 ? (
    <p className="text-gray-500">배정된 사건이 없습니다</p>
  ) : (
    <ul>{/* 사건 목록 */}</ul>
  )}
  ```

### 3.3 assigned_lawyer_id 컬럼 누락
- **리스크**: reports 테이블에 assigned_lawyer_id 컬럼이 없을 수 있음
- **대응**: 마이그레이션 스크립트 확인 또는 Supabase Dashboard에서 컬럼 추가
  ```sql
  ALTER TABLE reports
  ADD COLUMN assigned_lawyer_id UUID REFERENCES users(id);
  ```

### 3.4 consultations 테이블 lawyer_id 컬럼 누락
- **리스크**: consultations 테이블에 lawyer_id 컬럼이 없을 수 있음
- **대응**: 마이그레이션 스크립트 확인 또는 Supabase Dashboard에서 컬럼 추가
  ```sql
  ALTER TABLE consultations
  ADD COLUMN lawyer_id UUID REFERENCES users(id);
  ```

### 3.5 Supabase 타임아웃
- **리스크**: 네트워크 불안정 시 무한 대기
- **대응**: React Query `retry` 3회 제한 + 지수 백오프

---

## 4. 구현 체크리스트

### Phase 1: 코어 로직 구현
- [ ] `dashboardService.ts`에 `fetchLawyerDashboardData` 함수 추가
- [ ] Supabase 쿼리 구현 (assigned_lawyer_id, lawyer_id 필터)
- [ ] 에러 처리 추가 (`if (result.error) throw ...`)
- [ ] TypeScript 타입 정의 (`LawyerDashboardData` 인터페이스)
- [ ] Helper 함수 구현 (`calculateAvgProcessingTime`)
- [ ] Supabase 쿼리 최적화 (`.limit(5)`, `.order('assigned_at', { ascending: false })`)

### Phase 2: React Query 통합
- [ ] `useDashboardData` 훅의 lawyer 역할 연결 확인
- [ ] 재시도 전략 검증 (3회 재시도, 지수 백오프)
- [ ] 캐싱 정책 검증 (staleTime, refetchInterval)
- [ ] 에러 상태 UI 연동 확인

### Phase 3: UI 개선
- [ ] 변호사 대시보드 페이지 에러 상태 처리
- [ ] 재시도 버튼 구현
- [ ] 스켈레톤 UI 개선 (로딩 시간 > 0.5초일 때만 표시)
- [ ] 빈 상태 UI 구현 (배정된 사건 없음)

### Phase 4: 테스트
- [ ] 단위 테스트: `fetchLawyerDashboardData` (Vitest)
  - 정상 데이터 조회
  - Supabase 오류 처리
  - 빈 데이터 처리
  - Helper 함수 검증
- [ ] 통합 테스트: `useDashboardData('lawyer', userId)` + Mock Supabase
  - React Query 캐싱 동작
  - 5분 자동 리프레시
  - 3회 재시도
- [ ] E2E 테스트: 로그인 → 대시보드 접근 → 데이터 표시 (Playwright)

### Phase 5: 성능 검증
- [ ] 데이터 조회 응답 시간 측정 (< 1초)
- [ ] 캐시 히트율 확인
- [ ] 렌더링 성능 검증 (Chrome DevTools Profiler)

### Phase 6: 보안 검증
- [ ] Supabase RLS 정책 적용 확인
  - 변호사는 assigned_lawyer_id = auth.uid() 조건으로만 조회
  - 변호사는 lawyer_id = auth.uid() 조건으로만 상담 조회
- [ ] JWT 토큰 검증 (유효하지 않으면 로그인 페이지 리다이렉트)

---

## 5. 마일스톤

### Milestone 1: 데이터 조회 기능 완료
- **목표**: Supabase 쿼리 성공 + 에러 처리
- **완료 조건**:
  - `fetchLawyerDashboardData` 정상 동작
  - assigned_lawyer_id, lawyer_id 필터 적용 확인
  - 에러 발생 시 예외 전파
  - 타입 안전성 검증 통과

### Milestone 2: React Query 통합 완료
- **목표**: `useDashboardData('lawyer', userId)` 훅 완성
- **완료 조건**:
  - 5분 자동 리프레시 동작
  - 3회 재시도 동작
  - 에러 상태 UI 표시

### Milestone 3: 테스트 및 문서화 완료
- **목표**: 단위/통합/E2E 테스트 작성
- **완료 조건**:
  - 테스트 커버리지 85% 이상
  - SPEC 문서 동기화 (`/alfred:3-sync`)
  - PR Ready 상태

---

## 6. 기술 부채 및 향후 개선

### 기술 부채
1. **평균 평점 Mock 값**: 현재 `avgRating: 4.7` 고정 → reviews 테이블 조인 필요 (Phase 2)
2. **Helper 함수 중복**: `calculateAvgProcessingTime`이 Teacher SPEC과 동일 → 유틸리티 함수로 분리 필요
3. **상담 신청 교사명 조회**: Foreign Key Join 사용 → 성능 모니터링 필요

### 향후 개선
1. **실시간 알림**: WebSocket/SSE로 사건 배정 시 자동 갱신
2. **차트 데이터**: 월별 사건 추이, 처리 시간 트렌드 시각화
3. **오프라인 지원**: Service Worker + IndexedDB 캐싱

---

## 7. 개발 환경 설정

### 필요한 도구
- Node.js: v20.x (이미 설치)
- pnpm: v8.x (이미 설치)
- Supabase CLI: v1.x (선택사항)
- Playwright: v1.x (E2E 테스트용)

### 환경 변수 확인
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 데이터베이스 스키마 확인
```sql
-- reports 테이블에 assigned_lawyer_id 컬럼 존재 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reports' AND column_name = 'assigned_lawyer_id';

-- consultations 테이블에 lawyer_id 컬럼 존재 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'consultations' AND column_name = 'lawyer_id';
```

---

## 8. Teacher SPEC 재사용 전략

### 재사용 가능한 패턴
1. **React Query 설정**: staleTime, refetchInterval, retry 동일
2. **에러 처리 구조**: 3단계 에러 처리 (Supabase → Service → UI)
3. **UI 레이아웃**: 스켈레톤 UI, 에러 메시지, 재시도 버튼
4. **테스트 전략**: 단위/통합/E2E 테스트 시나리오 유사

### 커스터마이징 필요한 부분
1. **데이터 필터**: `teacher_id` → `assigned_lawyer_id`, `lawyer_id`
2. **상태 분류**: 2가지 → 3가지 (pending, in_progress, completed)
3. **통계 기준**: 작성일 → 배정일
4. **Foreign Key Join**: 상담 신청 교사명 조회 추가

---

## 9. 완료 조건 (Definition of Done)

- [ ] `dashboardService.ts`에 `fetchLawyerDashboardData` 함수 구현 완료
- [ ] `useDashboardData('lawyer', userId)` 훅 React Query 통합 완료
- [ ] 변호사 대시보드 페이지 에러 상태 처리 완료
- [ ] 단위/통합 테스트 작성 (커버리지 85% 이상)
- [ ] E2E 테스트 작성 (1개 시나리오 이상)
- [ ] Supabase RLS 정책 적용 확인
- [ ] 성능 검증 (응답 시간 < 1초)
- [ ] SPEC 문서 동기화 완료 (`/alfred:3-sync`)
- [ ] PR 리뷰 승인 (최소 1명)

---

**작성자**: @Claude
**다음 단계**: `/alfred:2-build DASHBOARD-LAWYER-001`
