# 교사 대시보드 UI/UX 개선 구현 계획

> **SPEC**: UI-TEACHER-DASHBOARD-001
> **목표**: 오렌지 기반 모던 디자인 시스템 적용

---

## 구현 전략

### 핵심 접근 방법

1. **점진적 마이그레이션**: 기존 기능 유지하면서 시각적 개선
2. **컴포넌트 우선**: 재사용 가능한 컴포넌트 먼저 구축
3. **TDD 적용**: 각 컴포넌트마다 테스트 선작성
4. **접근성 통합**: 구현과 동시에 ARIA 속성 적용

### 우선순위

**High (필수)**:
- 색상 시스템 적용
- DashboardHeader/Sidebar 컴포넌트
- 위젯 스타일 개선
- 접근성 준수

**Medium (권장)**:
- 애니메이션 최적화
- 반응형 미세 조정
- 성능 모니터링

**Low (선택)**:
- 다크모드 준비 (향후 확장)
- 추가 애니메이션 효과

---

## Phase 1: 기초 설정 및 색상 시스템

### 목표
Tailwind CSS 설정 확장 및 디자인 토큰 정의

### 작업 항목

#### 1.1 Tailwind 설정 확장
**파일**: `tailwind.config.ts`

**작업**:
- 색상 팔레트 추가 (primary, secondary, text, border 등)
- 그림자 추가 (card, card-hover, header)
- 전환 시간 추가 (smooth: 300ms)

**검증**:
- 모든 색상이 CSS 변수로 정상 생성되는지 확인
- 빌드 에러 없는지 확인

**예상 파일**:
```
tailwind.config.ts (수정)
```

#### 1.2 색상 대비 검증
**도구**: axe DevTools, Lighthouse

**작업**:
- 모든 색상 조합의 대비 비율 측정
- WCAG 2.1 AA 기준 통과 여부 확인
- 부적합 조합 수정

**검증 항목**:
- 오렌지 (#FF7210) / 화이트: 3.5:1 → 18px 이상 사용
- 다크 그레이 (#1F2937) / 화이트: 12.6:1 → 통과
- 그레이 (#6B7280) / 화이트: 4.5:1 → 통과

#### 1.3 유틸리티 클래스 정의
**파일**: `src/styles/dashboard.css` (신규)

**작업**:
- 공통 카드 스타일 정의 (`.widget-card`)
- 타이틀 스타일 정의 (`.widget-title`)
- 호버 효과 정의 (`.widget-card:hover`)

**예시**:
```css
@layer components {
  .widget-card {
    @apply bg-background border border-border rounded-xl p-6
           shadow-card transition-smooth hover:shadow-card-hover
           hover:bg-[rgba(255,114,16,0.03)];
  }

  .widget-title {
    @apply flex items-center gap-2 text-primary text-base
           font-semibold mb-4;
  }
}
```

**예상 파일**:
```
src/styles/dashboard.css (신규)
src/app/layout.tsx (import 추가)
```

---

## Phase 2: 헤더 및 사이드바 컴포넌트

### 목표
재사용 가능한 DashboardHeader 및 DashboardSidebar 컴포넌트 생성

### 작업 항목

#### 2.1 DashboardHeader 컴포넌트
**파일**: `src/components/dashboard/DashboardHeader.tsx`

**TDD 순서**:
1. **RED**: 테스트 작성
   - 기본 렌더링 테스트
   - 알림 버튼 클릭 테스트
   - 프로필 드롭다운 테스트
   - 접근성 검증 (axe-core)

2. **GREEN**: 구현
   - Props 인터페이스 정의
   - JSX 구조 작성
   - 이벤트 핸들러 연결
   - ARIA 속성 적용

3. **REFACTOR**: 개선
   - 스타일 최적화
   - 메모이제이션 적용
   - 타입 안전성 강화

**Props**:
```typescript
interface DashboardHeaderProps {
  userName: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}
```

**주요 요소**:
- 로고 + 타이틀 (좌측)
- 알림 아이콘 + 프로필 아이콘 (우측)
- 드롭다운 메뉴 (프로필 클릭 시)

**접근성**:
- 알림: `aria-label="알림 보기"`, `aria-live="polite"`
- 프로필: `aria-label="사용자 메뉴 열기"`, `aria-expanded`

**예상 파일**:
```
src/components/dashboard/DashboardHeader.tsx (신규)
tests/components/dashboard/DashboardHeader.test.tsx (신규)
```

#### 2.2 DashboardSidebar 컴포넌트
**파일**: `src/components/dashboard/DashboardSidebar.tsx`

**TDD 순서**:
1. **RED**: 테스트 작성
   - 메뉴 항목 렌더링 테스트
   - 활성 메뉴 하이라이트 테스트
   - 클릭 네비게이션 테스트
   - 접근성 검증

2. **GREEN**: 구현
   - Props 인터페이스 정의
   - 메뉴 데이터 구조 정의
   - JSX 구조 작성
   - 활성 상태 로직 구현

3. **REFACTOR**: 개선
   - 스타일 최적화
   - 메뉴 데이터 외부화
   - 타입 안전성 강화

**Props**:
```typescript
interface DashboardSidebarProps {
  currentPath: string;
  menuItems?: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}
```

**메뉴 항목** (기본값):
1. 홈 (Home) → `/dashboard/teacher`
2. 신고 접수 (FileText) → `/report/form`
3. 내 신고내역 (List) → `/report/list`
4. 커뮤니티 (MessageSquare) → `/community`
5. 교권 자료실 (BookOpen) → `/resources`
6. 설정 (Settings) → `/settings`

**상태별 스타일**:
- 기본: 텍스트/아이콘 #6B7280
- 호버: 배경 rgba(255,114,16,0.05), 텍스트 #FF7210
- 활성: 배경 #FF7210, 텍스트 #FFFFFF

**접근성**:
- 메뉴 항목: `role="navigation"`, `aria-current="page"` (활성 시)

**예상 파일**:
```
src/components/dashboard/DashboardSidebar.tsx (신규)
tests/components/dashboard/DashboardSidebar.test.tsx (신규)
```

#### 2.3 레이아웃 통합
**파일**: `src/app/dashboard/layout.tsx`

**작업**:
- DashboardHeader 추가
- DashboardSidebar 추가
- Flexbox 레이아웃 구성
- 반응형 설정

**레이아웃 구조**:
```tsx
<div className="flex flex-col h-screen">
  <DashboardHeader userName={userName} notificationCount={count} />
  <div className="flex flex-1 overflow-hidden">
    <DashboardSidebar currentPath={pathname} />
    <main className="flex-1 overflow-y-auto bg-surface p-6">
      {children}
    </main>
  </div>
</div>
```

**반응형**:
- Desktop (≥1024px): 사이드바 고정 표시
- Tablet (768px~1023px): 사이드바 축소 또는 오버레이
- Mobile (<768px): 햄버거 메뉴 + 사이드바 숨김

**예상 파일**:
```
src/app/dashboard/layout.tsx (수정)
```

---

## Phase 3: 위젯 스타일 개선

### 목표
기존 위젯 컴포넌트에 새로운 디자인 시스템 적용

### 작업 항목

#### 3.1 위젯 공통 래퍼 컴포넌트
**파일**: `src/components/dashboard/WidgetCard.tsx` (신규)

**목적**: 중복 스타일 제거, 일관성 유지

**Props**:
```typescript
interface WidgetCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}
```

**구조**:
```tsx
<div className="widget-card">
  <div className="widget-title">
    <Icon className="w-5 h-5" />
    <span>{title}</span>
  </div>
  <div>{children}</div>
</div>
```

**예상 파일**:
```
src/components/dashboard/WidgetCard.tsx (신규)
tests/components/dashboard/WidgetCard.test.tsx (신규)
```

#### 3.2 개별 위젯 업그레이드

**대상 위젯**:
1. `ReportStatsWidget.tsx` - 신고 현황
2. `ConsultationWidget.tsx` - 상담 현황
3. `PersonalStatsWidget.tsx` - 개인 통계
4. `QuickActionsWidget.tsx` - 빠른 작업

**공통 작업**:
- `WidgetCard` 래퍼 적용
- 타이틀 아이콘 추가 (FileText, MessageSquare, TrendingUp, Zap)
- 기존 스타일 제거
- 새 디자인 시스템 적용

**예시 (ReportStatsWidget)**:
```tsx
// Before
<div className="bg-white p-6 rounded-lg shadow">
  <h3>내 신고 현황</h3>
  {/* ... */}
</div>

// After
<WidgetCard title="내 신고 현황" icon={FileText}>
  {/* ... */}
</WidgetCard>
```

**예상 파일**:
```
src/features/dashboard/widgets/teacher/ReportStatsWidget.tsx (수정)
src/features/dashboard/widgets/teacher/ConsultationWidget.tsx (수정)
src/features/dashboard/widgets/teacher/PersonalStatsWidget.tsx (수정)
src/features/dashboard/widgets/teacher/QuickActionsWidget.tsx (수정)
```

#### 3.3 대시보드 페이지 업데이트
**파일**: `src/app/dashboard/teacher/page.tsx`

**작업**:
- 메인 콘텐츠 배경 제거 (레이아웃에서 처리)
- 그리드 갭 조정 (24px)
- 스켈레톤 UI 스타일 개선

**그리드 설정**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <ReportStatsWidget />
  <ConsultationWidget />
  <PersonalStatsWidget />
  <QuickActionsWidget />
</div>
```

**예상 파일**:
```
src/app/dashboard/teacher/page.tsx (수정)
```

---

## Phase 4: 접근성 및 품질 검증

### 목표
WCAG 2.1 AA 준수 및 코드 품질 보장

### 작업 항목

#### 4.1 접근성 검증
**도구**: axe-core, jest-axe

**검증 항목**:
1. 색 대비 비율 (4.5:1 이상)
2. ARIA 속성 완전성
3. 키보드 네비게이션
4. 포커스 관리
5. 스크린 리더 호환성

**테스트 예시**:
```typescript
// DashboardHeader.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(<DashboardHeader userName="홍길동" />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**자동화**:
- 모든 컴포넌트 테스트에 axe 검증 추가
- CI/CD 파이프라인에 접근성 검사 통합

#### 4.2 코드 품질 검증
**도구**: ESLint, TypeScript strict

**검증 항목**:
- TypeScript 타입 안전성
- 린트 에러 0개
- 컴포넌트 메모이제이션
- 불필요한 리렌더링 제거

**최적화 체크리스트**:
- [ ] 모든 컴포넌트에 `React.memo` 적용
- [ ] 이벤트 핸들러에 `useCallback` 적용
- [ ] 계산 비용 큰 값에 `useMemo` 적용
- [ ] Props 타입 정의 완료

#### 4.3 시각적 회귀 테스트 (선택)
**도구**: Chromatic, Percy (선택 사항)

**목적**: 디자인 변경 추적 및 회귀 방지

**대상**:
- DashboardHeader
- DashboardSidebar
- 각 위젯

---

## Phase 5: 성능 최적화 및 모니터링

### 목표
초기 로딩 2초 이내 유지, Core Web Vitals 통과

### 작업 항목

#### 5.1 성능 측정
**도구**: Lighthouse, Chrome DevTools

**측정 항목**:
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- Time to Interactive (TTI) < 3.8s

**측정 환경**:
- Desktop: Chrome DevTools (Throttle: 4x slowdown)
- Mobile: Lighthouse Mobile

#### 5.2 최적화 전략

**코드 스플리팅**:
- Next.js dynamic import 활용
- 위젯별 lazy loading (필요 시)

**이미지 최적화**:
- Next.js Image 컴포넌트 사용
- WebP 포맷 전환

**CSS 최적화**:
- Tailwind JIT 모드 활용
- 사용하지 않는 스타일 제거

**JavaScript 최적화**:
- 불필요한 의존성 제거
- Tree shaking 확인

#### 5.3 모니터링 설정 (선택)
**도구**: Vercel Analytics, Sentry (선택 사항)

**추적 항목**:
- 페이지 로딩 시간
- 에러 발생률
- 사용자 인터랙션 지연

---

## 파일 영향도 맵

### 신규 생성 (7개)
```
src/
├── components/dashboard/
│   ├── DashboardHeader.tsx       # 헤더 컴포넌트
│   ├── DashboardSidebar.tsx      # 사이드바 컴포넌트
│   └── WidgetCard.tsx            # 위젯 래퍼
├── styles/
│   └── dashboard.css             # 대시보드 유틸리티 클래스
└── tests/components/dashboard/
    ├── DashboardHeader.test.tsx  # 헤더 테스트
    ├── DashboardSidebar.test.tsx # 사이드바 테스트
    └── WidgetCard.test.tsx       # 위젯 래퍼 테스트
```

### 수정 (6개)
```
tailwind.config.ts                # 색상 시스템 추가
src/app/layout.tsx                # CSS import 추가
src/app/dashboard/layout.tsx      # 헤더/사이드바 추가
src/app/dashboard/teacher/page.tsx  # 스타일 개선
src/features/dashboard/widgets/teacher/
├── ReportStatsWidget.tsx         # 위젯 스타일 업그레이드
├── ConsultationWidget.tsx        # 위젯 스타일 업그레이드
├── PersonalStatsWidget.tsx       # 위젯 스타일 업그레이드
└── QuickActionsWidget.tsx        # 위젯 스타일 업그레이드
```

### 영향 받지 않는 파일
- 기존 API 로직
- 상태 관리 (Zustand, Context)
- 데이터 페칭 로직

---

## 리스크 및 대응 방안

### 리스크 1: 색 대비 비율 부족
**영향**: 접근성 기준 미달

**대응**:
- 사전 검증: 디자인 토큰 정의 시 대비 비율 측정
- 대안 색상 준비: 오렌지 다크 (#E65100) 사용

### 리스크 2: 기존 기능 호환성 문제
**영향**: 레이아웃 변경으로 인한 기능 오작동

**대응**:
- 회귀 테스트: 기존 테스트 스위트 모두 통과 확인
- 점진적 마이그레이션: Phase별 독립 배포

### 리스크 3: 성능 저하
**영향**: 초기 로딩 시간 증가

**대응**:
- 성능 벤치마크: 각 Phase 완료 시 측정
- 조건부 로딩: 위젯 lazy loading

### 리스크 4: 브라우저 호환성
**영향**: 특정 브라우저에서 레이아웃 깨짐

**대응**:
- 크로스 브라우저 테스트: Chrome, Safari, Firefox, Edge
- Polyfill 적용: 필요 시 CSS Grid/Flexbox polyfill

---

## 완료 기준 (Definition of Done)

### Phase별 체크리스트

**Phase 1**:
- [ ] Tailwind 설정 확장 완료
- [ ] 모든 색상 조합 WCAG 2.1 AA 통과
- [ ] 유틸리티 클래스 정의 완료

**Phase 2**:
- [ ] DashboardHeader 컴포넌트 생성 및 테스트 통과
- [ ] DashboardSidebar 컴포넌트 생성 및 테스트 통과
- [ ] 레이아웃 통합 완료

**Phase 3**:
- [ ] WidgetCard 래퍼 컴포넌트 생성
- [ ] 모든 위젯 스타일 개선 완료
- [ ] 대시보드 페이지 업데이트 완료

**Phase 4**:
- [ ] 모든 컴포넌트 axe-core 검증 통과
- [ ] 키보드 네비게이션 테스트 통과
- [ ] 코드 품질 검증 통과

**Phase 5**:
- [ ] 초기 로딩 < 2초
- [ ] Core Web Vitals 통과
- [ ] 크로스 브라우저 테스트 통과

### 최종 체크리스트
- [ ] 모든 SPEC 요구사항 충족
- [ ] 접근성 검증 통과 (axe-core)
- [ ] 성능 기준 충족 (Lighthouse)
- [ ] 회귀 테스트 통과 (기존 테스트 스위트)
- [ ] 코드 리뷰 완료
- [ ] 문서화 완료 (선택)

---

## 다음 단계

### TDD 구현
```bash
/alfred:2-build UI-TEACHER-DASHBOARD-001
```

### 문서 동기화
```bash
/alfred:3-sync
```

### PR 생성 (Team 모드)
```bash
# git-manager가 자동 처리
```

---

**작성일**: 2025-10-24
**작성자**: @Alfred
**SPEC**: UI-TEACHER-DASHBOARD-001
