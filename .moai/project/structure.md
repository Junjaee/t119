---
id: STRUCTURE-001
version: 0.2.0
status: active
created: 2025-10-01
updated: 2025-10-20
author: @teacher119
priority: high
---

# 교사119 System Architecture

## HISTORY

### v0.2.0 (2025-10-20)
- **UPDATED**: 교사119 플랫폼 아키텍처 정의
- **AUTHOR**: @Alfred
- **SECTIONS**: 모놀리식 아키텍처, Supabase 통합, 모듈 구조 설계
- **REASON**: PRD 기반 시스템 아키텍처 수립

### v0.1.1 (2025-10-17)
- **UPDATED**: 템플릿 버전 동기화 (v0.3.8)
- **AUTHOR**: @Alfred

### v0.1.0 (2025-10-01)
- **INITIAL**: 템플릿 생성
- **AUTHOR**: @architect

---

## @DOC:ARCHITECTURE-001: Architecture

### 아키텍처 전략

#### 선택: 모놀리식 아키텍처 (Monolithic)
- **Next.js 14 App Router 기반 통합 애플리케이션**
- **이유**:
  - MVP 빠른 개발 및 배포
  - 단일 코드베이스로 관리 용이
  - 초기 운영 복잡도 최소화
  - Vercel 배포 최적화

#### 향후 전환 계획
- **Phase 2**: 알림 시스템 분리 (마이크로서비스)
- **Phase 3**: 통계/분석 시스템 분리
- **조건**: MAU 10,000명 또는 동시 접속 1,000명 초과 시

### 기술 스택 아키텍처

```
┌─────────────────────────────────────────────┐
│             Frontend (Client)                │
│         Next.js 14 App Router                │
│     TypeScript + Tailwind + shadcn/ui        │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│           API Layer (Server)                 │
│         Next.js API Routes                   │
│        JWT Auth + Middleware                 │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│             Supabase Platform                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │PostgreSQL│ │Auth      │ │Storage   │    │
│  │Database  │ │Service   │ │Service   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Realtime  │ │Vector    │ │Edge      │    │
│  │Service   │ │Search    │ │Functions │    │
│  └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
```

### Supabase 통합 전략

#### 데이터베이스 (PostgreSQL)
- **Primary DB**: 모든 핵심 데이터 저장
- **Row Level Security (RLS)**: 역할별 데이터 접근 제어
- **자동 백업**: 일일 백업, 7일 보관
- **성능**: Connection Pooling, 인덱싱 최적화

#### 인증 서비스
- **Supabase Auth + Custom JWT**:
  - Supabase Auth: 기본 인증 (이메일/비밀번호)
  - Custom JWT: 다중 역할 토큰 관리
  - 세션 관리: 24시간 유지, 자동 갱신

#### 스토리지 서비스
- **증거 파일 저장**: 최대 10MB × 5개 파일
- **버킷 구조**:
  - `evidence/`: 신고 증거 자료
  - `documents/`: 법률 문서
  - `avatars/`: 사용자 프로필 이미지
- **CDN 통합**: 빠른 파일 서빙

#### 실시간 기능
- **Supabase Realtime**:
  - 메시지 알림
  - 상태 변경 알림
  - 온라인 상태 표시
- **WebSocket 기반**: 낮은 지연시간

---

## @DOC:MODULES-001: Modules

### 모듈 구조 및 책임

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # 인증 관련 페이지
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot/
│   ├── (dashboard)/       # 대시보드 (역할별)
│   │   ├── teacher/       # 교사 대시보드
│   │   ├── lawyer/        # 변호사 대시보드
│   │   └── admin/         # 관리자 대시보드
│   ├── reports/           # 신고 관리
│   │   ├── new/          # 신고 작성
│   │   ├── [id]/         # 신고 상세
│   │   └── list/         # 신고 목록
│   ├── consultations/     # 상담 관리
│   │   ├── [id]/         # 상담 상세
│   │   └── messages/     # 메시지
│   ├── community/         # 커뮤니티
│   ├── statistics/        # 통계
│   └── api/              # API Routes
│       ├── auth/         # 인증 API
│       ├── reports/      # 신고 API
│       ├── consultations/# 상담 API
│       └── stats/        # 통계 API
│
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── auth/             # 인증 컴포넌트
│   ├── reports/          # 신고 컴포넌트
│   └── shared/           # 공통 컴포넌트
│
├── lib/                   # 라이브러리 및 유틸리티
│   ├── supabase/         # Supabase 클라이언트
│   │   ├── client.ts     # 브라우저 클라이언트
│   │   ├── server.ts     # 서버 클라이언트
│   │   └── admin.ts      # Admin SDK
│   ├── auth/             # 인증 로직
│   │   ├── jwt.ts        # JWT 토큰 관리
│   │   └── rbac.ts       # 역할 기반 접근 제어
│   ├── validators/       # 입력 검증
│   └── utils/            # 유틸리티 함수
│
├── hooks/                 # Custom React Hooks
│   ├── useAuth.ts        # 인증 훅
│   ├── useSupabase.ts    # Supabase 훅
│   └── useRealtime.ts    # 실시간 훅
│
├── types/                 # TypeScript 타입 정의
│   ├── database.types.ts # DB 스키마 타입
│   ├── api.types.ts      # API 타입
│   └── auth.types.ts     # 인증 타입
│
└── middleware.ts          # Next.js 미들웨어
```

### 주요 모듈 책임

#### Auth Module (인증)
- **책임**: 사용자 인증, 회원가입, 역할 관리
- **핵심 기능**:
  - JWT 토큰 발급/검증
  - 다중 역할 관리 (교사/변호사/관리자)
  - 2FA 구현 (Phase 2)
- **의존성**: Supabase Auth, bcrypt

#### Reports Module (신고)
- **책임**: 교권 침해 신고 접수 및 관리
- **핵심 기능**:
  - 신고 CRUD
  - 파일 업로드 (증거 자료)
  - 상태 관리 (submitted → assigned → resolved)
  - 익명화 처리
- **의존성**: Supabase Storage, Realtime

#### Consultations Module (상담)
- **책임**: 변호사-교사 상담 매칭 및 진행
- **핵심 기능**:
  - 변호사 자동/수동 배정
  - 실시간 메시지
  - 상담 이력 관리
  - 만족도 평가
- **의존성**: Realtime, Notification

#### Statistics Module (통계)
- **책임**: 데이터 분석 및 시각화
- **핵심 기능**:
  - 실시간 대시보드
  - 시계열 분석
  - 지역별/유형별 통계
  - PDF 리포트 생성
- **의존성**: Chart.js, jsPDF

---

## @DOC:INTEGRATION-001: Integration

### 외부 시스템 통합

#### 1. Supabase 서비스
- **Database**: PostgreSQL 14+
- **Auth**: 이메일/비밀번호, OAuth (Google, Kakao)
- **Storage**: 증거 파일, 문서
- **Realtime**: 메시지, 알림
- **Edge Functions**: 서버리스 로직

#### 2. 알림 서비스
- **이메일**: Resend API
  - 트랜잭션 이메일
  - 일일 다이제스트
  - HTML 템플릿
- **SMS**: Twilio API (Phase 2)
  - 긴급 알림
  - 인증 코드

#### 3. 분석 및 모니터링
- **Sentry**: 에러 추적
- **Google Analytics 4**: 사용자 행동 분석
- **Vercel Analytics**: 성능 모니터링
- **LogRocket**: 세션 리플레이 (Phase 2)

#### 4. 결제 시스템 (Phase 3)
- **토스페이먼츠**: 프리미엄 서비스 결제
- **후원 시스템**: 정기 후원

### API 통합 패턴

```typescript
// API 호출 표준 패턴
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    total: number;
  };
}

// Supabase 클라이언트 래퍼
class SupabaseService {
  async query<T>(table: string, filters?: any): Promise<T[]>
  async insert<T>(table: string, data: T): Promise<T>
  async update<T>(table: string, id: string, data: Partial<T>): Promise<T>
  async delete(table: string, id: string): Promise<void>
}
```

---

## @DOC:TRACEABILITY-001: Traceability

### 추적성 전략

#### 1. 로깅 시스템
```typescript
// 구조화된 로깅
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  userId?: string;
  sessionId: string;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
}
```

#### 2. 감사 로그 (Audit Trail)
- **기록 대상**:
  - 모든 인증 시도
  - 신고 생성/수정/삭제
  - 변호사 배정
  - 권한 변경
  - 협회 관리 작업
- **보관 기간**: 5년

#### 3. 데이터 계보 (Data Lineage)
- **변경 이력**: 모든 테이블에 created_at, updated_at, updated_by
- **소프트 삭제**: deleted_at 필드로 논리 삭제
- **버전 관리**: 중요 문서는 버전 테이블 별도 관리

#### 4. 성능 추적
- **API 응답시간**: 95 percentile < 500ms
- **페이지 로드**: Core Web Vitals 측정
- **에러율**: < 1%
- **가용성**: 99.9% SLA

### 보안 아키텍처

#### 1. 인증/인가
- **Multi-factor**: 이메일 + OTP (관리자 필수)
- **역할 기반**: teacher, lawyer, admin
- **세션 관리**: 24시간, sliding window

#### 2. 데이터 보호
- **전송**: TLS 1.3
- **저장**: AES-256 암호화
- **PII 마스킹**: 자동 개인정보 마스킹

#### 3. 보안 헤더
```typescript
// security-headers.ts
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
```

---

## Next Steps

1. **Supabase 프로젝트 생성**:
   - 프로젝트 초기화
   - 데이터베이스 스키마 설정
   - RLS 정책 구성

2. **Next.js 프로젝트 구조 설정**:
   - App Router 구조 생성
   - 모듈별 폴더 구성
   - 공통 컴포넌트 설계

3. **인증 시스템 구현**:
   - `/alfred:1-spec "다중 역할 인증 시스템"`
   - Supabase Auth 통합
   - JWT 토큰 관리