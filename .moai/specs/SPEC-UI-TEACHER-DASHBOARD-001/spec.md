---
id: UI-TEACHER-DASHBOARD-001
version: 0.0.1
status: draft
created: 2025-10-24
updated: 2025-10-24
author: @Alfred
priority: high
category: feature
labels:
  - ui
  - dashboard
  - redesign
  - teacher
  - orange-theme
depends_on:
  - DASHBOARD-001
  - NOTIFICATION-001
related_specs:
  - DASHBOARD-001
scope:
  packages:
    - src/app/dashboard/teacher
    - src/components/dashboard
---

# @SPEC:UI-TEACHER-DASHBOARD-001: 교사 대시보드 UI/UX 전면 개선

## HISTORY

### v0.0.1 (2025-10-24)
- **INITIAL**: 교사 대시보드 UI/UX 전면 개선 명세 최초 작성
- **AUTHOR**: @Alfred
- **SCOPE**: 색상 시스템, 헤더/사이드바 설계, 위젯 스타일링, 접근성 강화
- **CONTEXT**: 사용자 제공 스크린샷 기반 모던 오렌지 테마 적용

---

## 개요

교사 대시보드의 시각적 외관과 사용자 경험을 전면 개선합니다. 오렌지 기반 색상 시스템, 모던한 헤더/사이드바, 개선된 위젯 스타일링을 통해 직관적이고 전문적인 대시보드를 제공합니다.

기존 DASHBOARD-001 (v0.2.0)의 기능을 유지하면서, 사용자 제공 스크린샷을 기반으로 시각적 디자인을 현대화합니다.

---

## 핵심 목표

- **통합된 디자인 시스템**: 오렌지 기반 일관된 색상 팔레트
- **모던한 UI**: 둥근 모서리, 그림자, 부드러운 애니메이션
- **직관적 네비게이션**: 아이콘 기반 사이드바, 명확한 헤더
- **접근성 우선**: WCAG 2.1 AA 준수
- **성능 유지**: 초기 로딩 2초 이내
- **반응형 지원**: 모바일/태블릿/데스크톱 최적화

---

## EARS 요구사항

### Ubiquitous Requirements (기본 요구사항)

- 시스템은 오렌지 기반 통합 색상 시스템을 제공해야 한다
- 시스템은 헤더에 로고, 타이틀, 알림 버튼, 사용자 프로필을 표시해야 한다
- 시스템은 좌측 사이드바에 아이콘 기반 메뉴 네비게이션을 제공해야 한다
- 시스템은 위젯을 개선된 카드 스타일(둥근 모서리, 그림자, 호버 효과)로 표시해야 한다
- 시스템은 반응형 레이아웃을 제공해야 한다 (데스크톱/태블릿/모바일)
- 시스템은 모든 인터랙티브 요소에 적절한 ARIA 속성을 제공해야 한다

### Event-driven Requirements (이벤트 기반)

- WHEN 사용자가 사이드바 메뉴를 클릭하면, 시스템은 해당 페이지로 네비게이션해야 한다
- WHEN 사용자가 알림 버튼을 클릭하면, 시스템은 알림 패널을 표시해야 한다
- WHEN 사용자가 위젯에 마우스를 올리면, 시스템은 그림자를 강화하고 배경을 변경해야 한다
- WHEN 사용자가 데이터를 로딩 중이면, 시스템은 스켈레톤 UI를 표시해야 한다
- WHEN 사용자가 프로필 아이콘을 클릭하면, 시스템은 드롭다운 메뉴를 표시해야 한다

### State-driven Requirements (상태 기반)

- WHILE 사용자가 특정 페이지를 보고 있을 때, 시스템은 사이드바의 해당 메뉴를 하이라이트해야 한다
- WHILE 사용자가 대시보드를 조회할 때, 시스템은 오렌지 기반 색상 시스템을 일관되게 적용해야 한다
- WHILE 위젯이 로딩 중일 때, 시스템은 스켈레톤 UI를 표시하고 실제 데이터로 부드럽게 전환해야 한다

### Optional Features (선택적 기능)

- WHERE 사용자가 모바일에서 접근하면, 시스템은 사이드바를 숨기고 햄버거 메뉴를 표시할 수 있다
- WHERE 사용자가 다크모드를 선호하면, 시스템은 다크 테마를 제공할 수 있다 (향후 확장)

### Constraints (제약사항)

- IF 색상 조합이 사용되면, 시스템은 WCAG 2.1 AA 색 대비 비율(4.5:1 이상)을 준수해야 한다
- 초기 로딩 시간은 2초를 초과하지 않아야 한다
- 기존 기능(신고, 상담, 통계)의 호환성을 유지해야 한다
- 모든 컴포넌트는 TypeScript strict 모드를 준수해야 한다

---

## 디자인 시스템

### 색상 팔레트

Tailwind CSS 설정에 다음 색상을 추가합니다:

```typescript
// tailwind.config.ts 확장
{
  colors: {
    primary: '#FF7210',           // 오렌지 (기존 정의 유지)
    'primary-light': '#FF9147',   // 라이트 오렌지
    'primary-dark': '#E65100',    // 다크 오렌지
    secondary: '#FFFAF0',         // 라이트 오렌지 배경 (기존 정의 유지)
    background: '#FFFFFF',        // 화이트
    surface: '#F5F5F5',           // 라이트 그레이
    text: {
      DEFAULT: '#1F2937',         // 다크 그레이
      light: '#6B7280',           // 그레이
      muted: '#9CA3AF'            // 뮤트 그레이
    },
    border: {
      DEFAULT: '#E5E7EB',         // 라이트 그레이
      focus: '#FF7210'            // 오렌지 (포커스 시)
    }
  }
}
```

**색상 사용 가이드**:
- **Primary (#FF7210)**: 버튼, 액티브 상태, 중요 아이콘
- **Secondary (#FFFAF0)**: 호버 배경, 알림 배지
- **Background (#FFFFFF)**: 카드, 헤더, 사이드바
- **Surface (#F5F5F5)**: 메인 콘텐츠 배경
- **Text**: 가독성 우선, 대비 비율 준수

### 타이포그래피

```css
/* 폰트 패밀리 */
font-family: 'Pretendard', 'Inter', sans-serif;

/* 크기 및 스타일 */
.heading-1 { font-size: 24px; font-weight: 700; color: #1F2937; }
.heading-2 { font-size: 20px; font-weight: 600; color: #1F2937; }
.heading-3 { font-size: 16px; font-weight: 600; color: #1F2937; }
.subtitle  { font-size: 14px; font-weight: 400; color: #6B7280; }
.body      { font-size: 14px; font-weight: 400; color: #1F2937; }
.caption   { font-size: 12px; font-weight: 400; color: #9CA3AF; }
```

### 간격 시스템

```typescript
// Tailwind spacing 사용
spacing: {
  xs: '8px',   // 0.5rem
  sm: '12px',  // 0.75rem
  md: '16px',  // 1rem
  lg: '24px',  // 1.5rem
  xl: '32px',  // 2rem
  '2xl': '48px'  // 3rem
}
```

### 그림자

```css
/* 카드 그림자 */
.shadow-card { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
.shadow-card-hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }

/* 헤더/사이드바 그림자 */
.shadow-header { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
```

---

## 컴포넌트 설계

### 1. DashboardHeader (신규 컴포넌트)

**위치**: `src/components/dashboard/DashboardHeader.tsx`

**레이아웃**:
```
┌─────────────────────────────────────────────────────────┐
│ [🏫 교사119]  교사 대시보드                [🔔] [👤 ▼] │
└─────────────────────────────────────────────────────────┘
```

**요구사항**:
- 높이: 64px
- 배경: 화이트 (#FFFFFF)
- 테두리: 하단 1px #E5E7EB
- 좌측 영역:
  - 교사119 로고 (오렌지 색상)
  - "교사 대시보드" 타이틀 (24px Bold)
- 우측 영역:
  - 알림 아이콘 (Bell from lucide-react)
  - 사용자 프로필 아이콘 + 이름
  - 드롭다운 메뉴 (클릭 시)

**Props**:
```typescript
interface DashboardHeaderProps {
  userName: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}
```

**접근성**:
- 알림 버튼: `aria-label="알림 보기"`, `aria-live="polite"`
- 프로필 버튼: `aria-label="사용자 메뉴 열기"`, `aria-expanded`

### 2. DashboardSidebar (신규 컴포넌트)

**위치**: `src/components/dashboard/DashboardSidebar.tsx`

**레이아웃**:
```
┌──────────────────────┐
│  📚 교사119          │
│                      │
│  🏠 홈               │
│  📋 신고 접수        │
│  📝 내 신고내역      │
│  💬 커뮤니티         │
│  📚 교권 자료실      │
│  ⚙️ 설정             │
└──────────────────────┘
```

**요구사항**:
- 너비: 256px (md: 280px)
- 배경: 화이트 (#FFFFFF)
- 테두리: 우측 1px #E5E7EB
- 메뉴 항목:
  1. 홈 (Home)
  2. 신고 접수 (FileText)
  3. 내 신고내역 (List)
  4. 커뮤니티 (MessageSquare)
  5. 교권 자료실 (BookOpen)
  6. 설정 (Settings)

**상태**:
- **기본**: 텍스트 #6B7280, 아이콘 #6B7280
- **호버**: 배경 rgba(255, 114, 16, 0.05), 텍스트 #FF7210
- **활성**: 배경 #FF7210, 텍스트 #FFFFFF, 아이콘 #FFFFFF

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

**접근성**:
- 각 메뉴 항목: `role="navigation"`, `aria-current="page"` (활성 시)

### 3. 위젯 카드 스타일 (기존 위젯 업그레이드)

**영향받는 컴포넌트**:
- `ReportStatsWidget.tsx`
- `ConsultationWidget.tsx`
- `PersonalStatsWidget.tsx`
- `QuickActionsWidget.tsx`

**공통 스타일**:
```css
.widget-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 300ms ease;
}

.widget-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: rgba(255, 114, 16, 0.03);
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FF7210;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
```

**타이틀 아이콘**:
- 신고 현황: FileText (오렌지)
- 상담 현황: MessageSquare (오렌지)
- 통계: TrendingUp (오렌지)
- 빠른 작업: Zap (오렌지)

### 4. 메인 콘텐츠 영역

**레이아웃**:
```
┌───────────────────────────────────────┐
│ [Header]                              │
├────────┬──────────────────────────────┤
│        │  [Main Content Area]         │
│ [Side] │  배경: #F5F5F5               │
│  bar   │  패딩: 24px                  │
│        │  그리드: 2열 (md), 1열 (sm)  │
│        │  갭: 24px                    │
└────────┴──────────────────────────────┘
```

**반응형 규칙**:
- **Desktop (≥1024px)**: 2열 그리드, 사이드바 표시
- **Tablet (768px~1023px)**: 2열 그리드, 사이드바 축소
- **Mobile (<768px)**: 1열 그리드, 사이드바 햄버거 메뉴

---

## 기술 구현 사항

### Tailwind CSS 설정

**파일**: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF7210',
        'primary-light': '#FF9147',
        'primary-dark': '#E65100',
        secondary: '#FFFAF0',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: {
          DEFAULT: '#1F2937',
          light: '#6B7280',
          muted: '#9CA3AF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          focus: '#FF7210',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        header: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      transitionDuration: {
        smooth: '300ms',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 컴포넌트 목록

**신규 생성**:
1. `src/components/dashboard/DashboardHeader.tsx`
2. `src/components/dashboard/DashboardSidebar.tsx`

**수정 필요**:
1. `src/app/dashboard/layout.tsx` - 헤더/사이드바 추가
2. `src/app/dashboard/teacher/page.tsx` - 스타일 개선
3. `src/features/dashboard/widgets/teacher/ReportStatsWidget.tsx`
4. `src/features/dashboard/widgets/teacher/ConsultationWidget.tsx`
5. `src/features/dashboard/widgets/teacher/PersonalStatsWidget.tsx`
6. `src/features/dashboard/widgets/teacher/QuickActionsWidget.tsx`

### 아이콘

**라이브러리**: `lucide-react`

**사용 아이콘**:
- Home, FileText, List, MessageSquare, BookOpen, Settings (사이드바 메뉴)
- Bell (알림)
- User, ChevronDown (프로필 드롭다운)
- TrendingUp, Zap (위젯 타이틀)

---

## 접근성 요구사항

### WCAG 2.1 AA 준수

**색 대비 비율**:
- 텍스트/배경: 최소 4.5:1
- 큰 텍스트(18px 이상): 최소 3:1
- 검증 도구: axe DevTools, Lighthouse

**검증 필요 조합**:
- 오렌지 (#FF7210) / 화이트 (#FFFFFF): 3.5:1 → **18px 이상에서만 사용**
- 다크 그레이 (#1F2937) / 화이트 (#FFFFFF): 12.6:1 → **통과**
- 그레이 (#6B7280) / 화이트 (#FFFFFF): 4.5:1 → **통과**

### ARIA 속성

**필수 적용**:
- 모든 버튼: `aria-label` (아이콘만 있는 경우)
- 메뉴 항목: `aria-current="page"` (활성 시)
- 알림: `aria-live="polite"`, `aria-atomic="true"`
- 드롭다운: `aria-expanded`, `aria-haspopup`

**예시**:
```tsx
<button
  aria-label="알림 보기"
  aria-live="polite"
  className="..."
>
  <Bell className="w-5 h-5" />
  {notificationCount > 0 && (
    <span className="badge" aria-label={`${notificationCount}개의 새 알림`}>
      {notificationCount}
    </span>
  )}
</button>
```

### 키보드 네비게이션

**지원 키**:
- Tab: 포커스 이동
- Enter/Space: 버튼/링크 활성화
- Escape: 드롭다운/모달 닫기
- Arrow Keys: 메뉴 네비게이션 (선택)

**포커스 상태**:
```css
.focus-visible:focus {
  outline: 2px solid #FF7210;
  outline-offset: 2px;
}
```

---

## 성능 요구사항

### 로딩 성능

- **초기 로딩**: 2초 이내 (기존 유지)
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

### 렌더링 최적화

**컴포넌트 메모이제이션**:
```tsx
// DashboardHeader.tsx
export const DashboardHeader = React.memo(({ userName, notificationCount }) => {
  // ...
});

// DashboardSidebar.tsx
export const DashboardSidebar = React.memo(({ currentPath, menuItems }) => {
  // ...
});
```

**불필요한 리렌더링 방지**:
- `useMemo`로 계산 비용 큰 값 캐싱
- `useCallback`으로 이벤트 핸들러 메모이제이션

### 애니메이션

**부드러운 전환**:
```css
.transition-smooth {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**GPU 가속**:
```css
.hardware-accelerate {
  transform: translateZ(0);
  will-change: transform, opacity;
}
```

---

## 테스트 전략

### 단위 테스트

**대상 컴포넌트**:
- DashboardHeader
- DashboardSidebar
- 개별 위젯

**테스트 케이스**:
1. 렌더링: 기본 props로 정상 렌더링
2. 이벤트: 클릭/호버 이벤트 핸들러 실행
3. 상태: 활성/비활성 상태 표시
4. 접근성: ARIA 속성 존재

**도구**: Vitest + React Testing Library

### 스타일 회귀 테스트 (선택)

**도구**: Chromatic, Percy (선택 사항)

**검증 항목**:
- 색상 적용
- 레이아웃 구조
- 호버/포커스 상태

### 접근성 테스트

**도구**: axe-core, jest-axe

**검증 항목**:
1. 색 대비 비율
2. ARIA 속성 완전성
3. 키보드 네비게이션
4. 포커스 관리

**예시**:
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

### 브라우저 테스트

**대상 브라우저**:
- Chrome (최신)
- Safari (최신)
- Firefox (최신)
- Edge (최신)

**검증 항목**:
- 레이아웃 일관성
- 애니메이션 부드러움
- 색상 렌더링

---

## 의존성

### 필수 패키지

```json
{
  "dependencies": {
    "lucide-react": "^0.263.1",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "jest-axe": "^8.0.0"
  }
}
```

### 기존 SPEC 연계

- **DASHBOARD-001** (v0.2.0): 기본 레이아웃 및 위젯 로직 참조
- **NOTIFICATION-001**: 알림 시스템 통합 (헤더 알림 아이콘)

---

## 마이그레이션 계획

### 단계별 전환

1. **Phase 1**: 새 컴포넌트 생성 (DashboardHeader, DashboardSidebar)
2. **Phase 2**: 기존 레이아웃에 통합 (layout.tsx 수정)
3. **Phase 3**: 위젯 스타일 개선 (기존 컴포넌트 수정)
4. **Phase 4**: 접근성 검증 및 테스트
5. **Phase 5**: 성능 측정 및 최적화

### 호환성 유지

- 기존 기능(신고, 상담, 통계) 변경 없음
- 기존 API 호출 유지
- 기존 상태 관리 로직 유지

---

## 추적성

- **@SPEC:UI-TEACHER-DASHBOARD-001**: `.moai/specs/SPEC-UI-TEACHER-DASHBOARD-001/spec.md`
- **@TEST:UI-TEACHER-DASHBOARD-001**: `tests/app/dashboard/teacher/`, `tests/components/dashboard/`
- **@CODE:UI-TEACHER-DASHBOARD-001**: `src/app/dashboard/teacher/`, `src/components/dashboard/`
- **@DOC:UI-TEACHER-DASHBOARD-001**: `docs/dashboard-redesign.md` (선택)

---

## 검증 체크리스트

### 디자인 시스템
- [ ] 오렌지 색상 팔레트 적용 완료
- [ ] 모든 색 조합이 WCAG 2.1 AA 통과
- [ ] 타이포그래피 일관성 확인

### 컴포넌트
- [ ] DashboardHeader 렌더링 정상
- [ ] DashboardSidebar 메뉴 동작 정상
- [ ] 위젯 호버 효과 적용
- [ ] 반응형 레이아웃 동작

### 접근성
- [ ] axe-core 검증 통과
- [ ] 키보드 네비게이션 가능
- [ ] 스크린 리더 호환

### 성능
- [ ] 초기 로딩 < 2초
- [ ] Core Web Vitals 통과

---

**관련 문서**:
- DASHBOARD-001: `.moai/specs/SPEC-DASHBOARD-001/spec.md`
- NOTIFICATION-001: `.moai/specs/SPEC-NOTIFICATION-001/spec.md`
- development-guide.md: `.moai/memory/development-guide.md`
