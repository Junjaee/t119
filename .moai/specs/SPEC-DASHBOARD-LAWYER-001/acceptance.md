# SPEC-DASHBOARD-LAWYER-001: 수락 기준 (Acceptance Criteria)

> **관련 SPEC**: `spec.md`
> **작성일**: 2025-10-23
> **작성자**: @Claude

---

## 1. 테스트 시나리오 (Given-When-Then)

### 시나리오 1: 변호사 대시보드 정상 데이터 조회

**Given**:
- 변호사 계정으로 로그인 완료
- JWT 토큰이 로컬스토리지에 저장됨 (`auth_token_lawyer`)
- Supabase `reports` 테이블에 해당 변호사에게 배정된 사건 데이터가 존재
  - pending: 2건, in_progress: 1건, completed: 3건
- Supabase `consultations` 테이블에 상담 데이터가 존재 (scheduled: 1건, completed: 2건)

**When**:
- 변호사가 `/dashboard/lawyer` 페이지에 접속

**Then**:
- 1초 이내에 대시보드 데이터가 표시됨
- `CaseStatsWidget`에 "대기 중 2건, 진행 중 1건, 완료 3건" 표시
- `ConsultationWidget`에 "예정 1건, 완료 2건" 표시
- `PersonalStatsWidget`에 통계 표시 (총 사건 수 6건, 평균 처리 시간, 평균 평점)

**검증 방법**:
```typescript
// E2E 테스트 (Playwright)
test('변호사 대시보드 정상 데이터 조회', async ({ page }) => {
  // Given: 로그인
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'lawyer@example.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');

  // When: 대시보드 접속
  await page.waitForURL('/dashboard/lawyer');

  // Then: 데이터 표시 확인
  await expect(page.locator('[data-testid="case-stats-widget"]')).toContainText('대기 중 2건');
  await expect(page.locator('[data-testid="case-stats-widget"]')).toContainText('진행 중 1건');
  await expect(page.locator('[data-testid="case-stats-widget"]')).toContainText('완료 3건');
  await expect(page.locator('[data-testid="consultation-widget"]')).toContainText('예정 1건');
});
```

---

### 시나리오 2: 배정된 사건 없음 (신규 가입 변호사)

**Given**:
- 신규 가입한 변호사 계정으로 로그인 완료
- Supabase `reports` 테이블에 해당 변호사에게 배정된 데이터 없음 (빈 배열)
- Supabase `consultations` 테이블에 데이터 없음 (빈 배열)

**When**:
- 변호사가 `/dashboard/lawyer` 페이지에 접속

**Then**:
- 에러 메시지 없이 정상 렌더링
- `CaseStatsWidget`에 "대기 중 0건, 진행 중 0건, 완료 0건" 표시
- `ConsultationWidget`에 "예정 0건, 완료 0건" 표시
- `PersonalStatsWidget`에 "총 사건 수 0건, 평균 처리 시간 0일, 평균 평점 0.0" 표시
- (선택사항) 빈 상태 UI: "배정된 사건이 없습니다" 메시지

**검증 방법**:
```typescript
// 통합 테스트 (Vitest + MSW)
test('신규 가입 변호사 빈 데이터 처리', async () => {
  // Given: Mock Supabase 빈 데이터
  server.use(
    http.get('/rest/v1/reports', ({ request }) => {
      const url = new URL(request.url);
      const assignedLawyerId = url.searchParams.get('assigned_lawyer_id');
      if (assignedLawyerId === 'eq.lawyer-123') {
        return HttpResponse.json([]);
      }
    }),
    http.get('/rest/v1/consultations', ({ request }) => {
      const url = new URL(request.url);
      const lawyerId = url.searchParams.get('lawyer_id');
      if (lawyerId === 'eq.lawyer-123') {
        return HttpResponse.json([]);
      }
    })
  );

  // When: useDashboardData 호출
  const { result } = renderHook(() => useDashboardData('lawyer', 'lawyer-123'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // Then: 빈 배열 반환
  expect(result.current.data?.cases.pending).toBe(0);
  expect(result.current.data?.cases.inProgress).toBe(0);
  expect(result.current.data?.cases.completed).toBe(0);
  expect(result.current.data?.cases.recent).toEqual([]);
});
```

---

### 시나리오 3: Supabase 연결 실패 (네트워크 오류)

**Given**:
- 변호사 계정으로 로그인 완료
- Supabase 서버가 일시적으로 다운 또는 네트워크 연결 불안정

**When**:
- 변호사가 `/dashboard/lawyer` 페이지에 접속

**Then**:
- 로딩 스켈레톤 UI 표시 (최대 10초)
- 3회 재시도 후 에러 메시지 표시: "데이터 로딩 중 오류가 발생했습니다"
- "재시도" 버튼 표시
- 사용자가 "재시도" 버튼 클릭 시 데이터 재조회

**검증 방법**:
```typescript
// 통합 테스트 (Vitest + MSW)
test('Supabase 연결 실패 시 에러 처리', async () => {
  // Given: Mock Supabase 오류
  server.use(
    http.get('/rest/v1/reports', () => {
      return HttpResponse.json({ error: 'Network error' }, { status: 500 });
    })
  );

  // When: useDashboardData 호출
  const { result } = renderHook(() => useDashboardData('lawyer', 'lawyer-123'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // Then: 에러 상태 확인
  expect(result.current.error).toBeTruthy();
  expect(result.current.data).toBeUndefined();
});
```

---

### 시나리오 4: 인증 실패 (토큰 만료)

**Given**:
- 변호사 계정으로 로그인했으나 JWT 토큰이 만료됨 (24시간 경과)
- Supabase 요청 시 401 Unauthorized 반환

**When**:
- 변호사가 `/dashboard/lawyer` 페이지에 접속

**Then**:
- Supabase 오류 감지
- 자동으로 `/auth/login` 페이지로 리다이렉트
- Toast 메시지: "로그인 세션이 만료되었습니다. 다시 로그인해주세요."

**검증 방법**:
```typescript
// E2E 테스트 (Playwright)
test('토큰 만료 시 로그인 페이지 리다이렉트', async ({ page }) => {
  // Given: 만료된 토큰 설정
  await page.goto('/dashboard/lawyer');
  await page.evaluate(() => {
    localStorage.setItem('auth_token_lawyer', 'expired-token');
  });

  // When: 페이지 새로고침
  await page.reload();

  // Then: 로그인 페이지 리다이렉트
  await page.waitForURL('/auth/login');
  await expect(page.locator('text=로그인 세션이 만료되었습니다')).toBeVisible();
});
```

---

### 시나리오 5: 5분 자동 리프레시

**Given**:
- 변호사가 대시보드 페이지에 접속하고 정상 데이터를 조회함
- React Query `refetchInterval: 5 * 60 * 1000` 설정

**When**:
- 5분 후 자동으로 데이터 재조회

**Then**:
- 사용자 액션 없이 자동으로 Supabase 쿼리 재실행
- 최신 데이터로 UI 업데이트 (예: 새로운 사건 배정 시 카운트 증가)

**검증 방법**:
```typescript
// 통합 테스트 (Vitest + MSW + Jest Fake Timers)
test('5분 자동 리프레시 동작 확인', async () => {
  jest.useFakeTimers();

  // Given: useDashboardData 호출
  const { result } = renderHook(() => useDashboardData('lawyer', 'lawyer-123'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // When: 5분 경과
  jest.advanceTimersByTime(5 * 60 * 1000);

  // Then: 재조회 확인 (쿼리 함수 2회 호출)
  await waitFor(() => expect(mockFetchLawyerData).toHaveBeenCalledTimes(2));

  jest.useRealTimers();
});
```

---

### 시나리오 6: 브라우저 포커스 복귀 시 리프레시

**Given**:
- 변호사가 대시보드 페이지를 열어둔 상태에서 다른 탭으로 이동
- React Query `refetchOnWindowFocus: true` 설정

**When**:
- 사용자가 대시보드 탭으로 돌아옴 (window focus)

**Then**:
- 자동으로 데이터 재조회
- 최신 데이터로 UI 업데이트

**검증 방법**:
```typescript
// E2E 테스트 (Playwright)
test('브라우저 포커스 복귀 시 리프레시', async ({ page, context }) => {
  // Given: 대시보드 페이지 열림
  await page.goto('/dashboard/lawyer');
  await page.waitForLoadState('networkidle');

  // When: 새 탭 열고 다시 대시보드로 돌아옴
  const newPage = await context.newPage();
  await newPage.goto('https://example.com');
  await page.bringToFront();

  // Then: 데이터 재조회 확인 (네트워크 요청 발생)
  const requests = [];
  page.on('request', req => {
    if (req.url().includes('/rest/v1/reports')) {
      requests.push(req);
    }
  });

  await page.waitForTimeout(1000);
  expect(requests.length).toBeGreaterThan(1);
});
```

---

### 시나리오 7: assigned_lawyer_id 필터 검증 (보안 중요)

**Given**:
- 변호사 A (ID: lawyer-a)가 로그인
- Supabase `reports` 테이블에 다음 데이터 존재:
  - 사건 1: assigned_lawyer_id = lawyer-a (본인 배정)
  - 사건 2: assigned_lawyer_id = lawyer-b (다른 변호사 배정)

**When**:
- 변호사 A가 대시보드 페이지에 접속

**Then**:
- 사건 1만 조회됨 (Supabase RLS 정책 적용)
- 사건 2는 조회되지 않음 (403 또는 빈 배열)

**검증 방법**:
```typescript
// 단위 테스트 (Vitest + Mock Supabase)
test('assigned_lawyer_id 필터 검증', async () => {
  // Given: Mock Supabase 데이터
  mockSupabase.from('reports').select.mockImplementation(({ eq }) => {
    if (eq.includes('lawyer-a')) {
      return Promise.resolve({
        data: [{ id: '1', assigned_lawyer_id: 'lawyer-a' }],
        error: null,
      });
    }
    return Promise.resolve({ data: [], error: null });
  });

  // When: fetchLawyerDashboardData 호출
  const result = await fetchLawyerDashboardData('lawyer-a');

  // Then: 본인 배정 사건만 조회
  expect(result.cases.recent).toHaveLength(1);
  expect(result.cases.recent[0].id).toBe('1');
});
```

---

### 시나리오 8: 다음 예정 상담 표시 (교사명 포함)

**Given**:
- 변호사 계정으로 로그인 완료
- Supabase `consultations` 테이블에 다음 데이터 존재:
  - 상담 1: status = 'scheduled', scheduled_at = '2025-10-25', teacher_id = 'teacher-1'
  - 상담 2: status = 'completed', scheduled_at = '2025-10-22', teacher_id = 'teacher-2'

**When**:
- 변호사가 대시보드 페이지에 접속

**Then**:
- `ConsultationWidget`에 "다음 예정 상담: 2025-10-25, 신청자: 홍길동" 표시
- Foreign Key Join으로 교사명 조회 성공

**검증 방법**:
```typescript
// 단위 테스트 (Vitest + Mock Supabase)
test('다음 예정 상담 표시 (교사명 포함)', async () => {
  // Given: Mock Supabase 데이터 (Foreign Key Join)
  mockSupabase.from('consultations').select.mockResolvedValue({
    data: [
      {
        id: '1',
        status: 'scheduled',
        scheduled_at: '2025-10-25T10:00:00Z',
        teacher: { name: '홍길동' },
      },
    ],
    error: null,
  });

  // When: fetchLawyerDashboardData 호출
  const result = await fetchLawyerDashboardData('lawyer-123');

  // Then: 다음 예정 상담 확인
  expect(result.consultations.nextScheduled).toBeDefined();
  expect(result.consultations.nextScheduled?.teacher_name).toBe('홍길동');
});
```

---

## 2. 품질 게이트 (Quality Gate)

### 2.1 기능 완성도
- [ ] ✅ 변호사 대시보드 데이터 정상 조회 (사건 현황, 상담 이력, 통계)
- [ ] ✅ 빈 데이터 상황 처리 (에러 없이 0 값 표시)
- [ ] ✅ 네트워크 오류 처리 (에러 메시지 + 재시도 버튼)
- [ ] ✅ 토큰 만료 처리 (로그인 페이지 리다이렉트)
- [ ] ✅ 5분 자동 리프레시 동작
- [ ] ✅ 브라우저 포커스 복귀 시 리프레시
- [ ] ✅ assigned_lawyer_id 필터 검증 (Supabase RLS)
- [ ] ✅ 다음 예정 상담 표시 (교사명 포함)

### 2.2 성능 기준
- [ ] ✅ 데이터 조회 응답 시간 < 1초 (병렬 페칭)
- [ ] ✅ 캐시 히트 시 응답 시간 < 10ms
- [ ] ✅ 스켈레톤 UI 표시 (로딩 > 0.5초일 때)

### 2.3 보안 기준
- [ ] ✅ Supabase RLS 정책 적용 (변호사는 배정된 사건만 조회)
- [ ] ✅ JWT 토큰 검증 (유효하지 않으면 401 반환)
- [ ] ✅ XSS 방지 (React 기본 이스케이핑)

### 2.4 테스트 커버리지
- [ ] ✅ 단위 테스트: `fetchLawyerDashboardData` (85% 이상)
- [ ] ✅ 통합 테스트: `useDashboardData('lawyer', userId)` 훅 (85% 이상)
- [ ] ✅ E2E 테스트: 2개 시나리오 이상 통과

### 2.5 코드 품질
- [ ] ✅ TypeScript strict mode 통과 (타입 에러 0개)
- [ ] ✅ ESLint 경고 0개
- [ ] ✅ 파일당 300 LOC 이하
- [ ] ✅ 함수당 50 LOC 이하

---

## 3. 수동 테스트 체크리스트

### 3.1 기능 테스트
- [ ] 로그인 후 대시보드 접근 시 데이터 표시 확인
- [ ] 사건 현황 위젯 (대기 중/진행 중/완료 건수, 최근 사건 목록)
- [ ] 상담 이력 위젯 (예정/완료 건수, 다음 예정 상담, 교사명)
- [ ] 개인 통계 위젯 (총 사건 수, 평균 처리 시간, 평균 평점)
- [ ] 5분 후 자동 리프레시 동작 확인 (콘솔 로그 또는 DevTools Network)
- [ ] 브라우저 탭 전환 후 돌아왔을 때 리프레시 확인

### 3.2 에러 시나리오 테스트
- [ ] Wi-Fi 끄고 대시보드 접근 → 에러 메시지 + 재시도 버튼
- [ ] 재시도 버튼 클릭 → Wi-Fi 켜고 정상 조회 확인
- [ ] 토큰 수동 삭제 후 대시보드 접근 → 로그인 페이지 리다이렉트

### 3.3 보안 테스트
- [ ] Supabase Dashboard에서 RLS 정책 확인
- [ ] 변호사 A로 로그인 → 다른 변호사 B의 사건 조회 불가 확인
- [ ] JWT 토큰 수동 수정 → 401 에러 확인

### 3.4 UX 테스트
- [ ] 로딩 스켈레톤 UI 표시 (0.5초 이상 소요 시)
- [ ] 데이터 조회 성공 시 부드러운 전환 (애니메이션)
- [ ] 모바일/태블릿/데스크톱 반응형 레이아웃 확인
- [ ] 빈 상태 UI 표시 (배정된 사건 없음)

---

## 4. 완료 조건 (Definition of Done)

### 최종 검증 체크리스트
- [ ] ✅ 모든 Given-When-Then 시나리오 통과 (8개)
- [ ] ✅ 품질 게이트 모든 항목 통과 (기능, 성능, 보안, 테스트, 코드 품질)
- [ ] ✅ 수동 테스트 체크리스트 완료 (기능, 에러, 보안, UX)
- [ ] ✅ PR 리뷰 승인 (최소 1명)
- [ ] ✅ SPEC 문서 동기화 완료 (`/alfred:3-sync`)
- [ ] ✅ 브랜치 머지 완료 (feature/SPEC-DASHBOARD-LAWYER-001 → develop)

---

**작성자**: @Claude
**최종 검증일**: (구현 완료 후 업데이트)
