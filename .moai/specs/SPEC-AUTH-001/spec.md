---
id: AUTH-001
version: 0.0.1
status: draft
created: 2025-10-20
updated: 2025-10-20
author: @teacher119
priority: critical
category: feature
labels:
  - authentication
  - security
  - jwt
  - rbac
depends_on:
  - INFRA-001
blocks:
  - REPORT-001
  - MATCH-001
scope:
  packages:
    - src/lib/auth
    - src/middleware.ts
    - src/app/api/auth
---

# @SPEC:AUTH-001: 다중 역할 인증 시스템 (Multi-Role Authentication System)

## HISTORY

### v0.0.1 (2025-10-20)
- **INITIAL**: JWT 기반 다중 역할 인증 시스템 명세 작성
- **AUTHOR**: @teacher119
- **REASON**: 교사119 플랫폼의 핵심 인증/인가 시스템 구축
- **SCOPE**: Supabase Auth + Custom JWT 통합, 3가지 역할 관리, 익명성 보장

---

## 1. 개요 (Overview)

### 1.1 목적
교사119 플랫폼의 **핵심 인증 및 권한 관리 시스템**을 구축하여 다음을 보장:
- **보안**: JWT 기반 안전한 인증
- **역할 분리**: 교사/변호사/관리자 3가지 역할 독립 관리
- **익명성 보장**: 자동 닉네임 생성, IP 해싱, 개인정보 최소화
- **확장성**: 2FA, IP 기반 접근 제어 등 향후 확장 준비

### 1.2 배경
- **현황**: 교권 침해 신고 플랫폼에서 역할별 접근 제어 필수
- **문제점**:
  - 기존 단일 역할 시스템은 복잡한 권한 관리 불가
  - 익명성 보장이 없으면 교사들의 신고 접수 꺼려짐
  - 변호사 배정 시 개인정보 최소 공개 원칙 필요
- **해결**: Supabase Auth 기반 + Custom JWT로 다중 역할 토큰 관리

### 1.3 범위
- **포함**:
  - 회원가입/로그인/로그아웃
  - JWT 토큰 발급/검증/갱신
  - 역할 기반 접근 제어 (RBAC)
  - 익명화 로직 (닉네임, IP 해싱)
  - 세션 관리 (24시간 유지, 자동 갱신)
  - 협회(Association) 선택 및 승인 정책 통합
- **제외**:
  - 2FA (TOTP) 구현 → Phase 2
  - OAuth 소셜 로그인 (Google, Kakao) → Phase 2
  - IP 기반 접근 제어 → Phase 2

---

## 2. EARS 요구사항 (EARS Requirements)

### 2.1 Ubiquitous Requirements (기본 요구사항)
- 시스템은 **교사, 변호사, 관리자 3가지 역할**을 구분하여 인증을 제공해야 한다
- 시스템은 **JWT 토큰 기반 인증**을 제공해야 한다
- 시스템은 **역할별 독립 토큰 키**를 저장해야 한다 (`auth_token_teacher`, `auth_token_lawyer`, `auth_token_admin`)
- 시스템은 **자동 닉네임 생성 및 IP 해싱**을 통해 익명성을 보장해야 한다

### 2.2 Event-driven Requirements (이벤트 기반)
- **WHEN** 사용자가 회원가입하면, 시스템은 **역할에 맞는 권한을 부여**해야 한다
  - 교사: association_id 선택 가능, 승인 정책에 따라 자동 승인 또는 대기
  - 변호사: 관리자 승인 후 활성화
  - 관리자: 시스템 관리자가 직접 생성
- **WHEN** 사용자가 로그인하면, 시스템은 **Supabase Auth로 인증하고 Custom JWT를 발급**해야 한다
- **WHEN** JWT 토큰이 만료되면, 시스템은 **자동으로 리프레시**하거나 **재로그인을 요구**해야 한다
- **WHEN** 사용자가 로그아웃하면, 시스템은 **토큰을 무효화**하고 **세션을 종료**해야 한다
- **WHEN** 비밀번호 찾기 요청 시, 시스템은 **이메일로 재설정 링크를 전송**해야 한다

### 2.3 State-driven Requirements (상태 기반)
- **WHILE** 사용자가 인증된 상태일 때, 시스템은 **역할별 권한을 검증**해야 한다
- **WHILE** 세션이 활성화된 상태일 때, 시스템은 **24시간 동안 유지**하고 **슬라이딩 윈도우 방식으로 갱신**해야 한다
- **WHILE** 토큰이 유효한 상태일 때, 시스템은 **API 요청에 대해 인증을 통과**시켜야 한다

### 2.4 Optional Features (선택적 기능)
- **WHERE** 리프레시 토큰이 제공되면, 시스템은 **새로운 액세스 토큰을 발급**할 수 있다
- **WHERE** 관리자 계정인 경우, 시스템은 **IP 기반 접근 제어**를 적용할 수 있다 (Phase 2)
- **WHERE** 2FA가 활성화된 경우, 시스템은 **TOTP 코드 검증**을 요구할 수 있다 (Phase 2)

### 2.5 Constraints (제약사항)
- **IF** 잘못된 토큰이 제공되면, 시스템은 **401 Unauthorized 에러**를 반환해야 한다
- **IF** 권한이 없는 리소스에 접근하면, 시스템은 **403 Forbidden 에러**를 반환해야 한다
- **IF** 토큰이 만료되면, 시스템은 **자동 갱신 또는 재로그인**을 요구해야 한다
- **IF** 비밀번호가 8자 미만이거나 복잡도가 낮으면, 시스템은 **회원가입을 거부**해야 한다
- 액세스 토큰 만료시간은 **24시간**을 기본으로 하며, **관리자는 설정 변경 가능**해야 한다
- 비밀번호는 **bcrypt**로 암호화하며, **평문 저장 금지**해야 한다

---

## 3. 시스템 설계 (System Design)

### 3.1 역할 체계 (Role System)

#### TypeScript 타입 정의
```typescript
export enum UserRole {
  TEACHER = 'teacher',  // 교사
  LAWYER = 'lawyer',    // 변호사
  ADMIN = 'admin',      // 시스템 관리자
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  school?: string;
  position?: string;
  association_id?: number;           // 교사 전용
  association_approved: boolean;     // 협회 승인 상태
  is_verified: boolean;              // 이메일 인증 상태
  is_active: boolean;                // 계정 활성화 상태
  nickname?: string;                 // 자동 생성 닉네임
  ip_hash?: string;                  // 익명화된 IP
  created_at: string;
  updated_at: string;
  last_login?: string;
}
```

#### 역할별 권한 매트릭스
| 리소스/기능 | 교사 | 변호사 | 관리자 |
|------------|------|--------|--------|
| 신고 작성 (본인) | ✅ | ❌ | ✅* |
| 신고 조회 (본인) | ✅ | ❌ | ✅ |
| 신고 조회 (전체) | ❌ | ✅** | ✅ |
| 법률 상담 | ✅ | ✅ | ✅ |
| 변호사 배정 | ❌ | ✅ | ✅ |
| 사용자 관리 | ❌ | ❌ | ✅ |
| 협회 CRUD | ❌ | ❌ | ✅ |
| 협회 회원 승인 | ❌ | ❌ | ✅ |
| 시스템 설정 | ❌ | ❌ | ✅ |
| 감사 로그 조회 | ❌ | ❌ | ✅ |

*관리자는 운영 목적으로 테스트 신고 생성 가능 (옵션)
**변호사는 미배정/배정된 사건 풀만 조회 (개인정보 최소화)

### 3.2 인증 흐름 (Authentication Flow)

#### 회원가입 플로우
```
[사용자 입력: 이메일, 비밀번호, 역할, 기본정보]
    ↓
[입력 검증: 이메일 중복, 비밀번호 복잡도]
    ↓
[Supabase Auth 회원가입]
    ↓
[users 테이블 삽입]
    ├─ 교사: association_id 선택 가능
    │   └─ 정책: 자동 승인 / 관리자 승인 대기
    ├─ 변호사: 관리자 승인 대기
    └─ 관리자: 시스템 관리자가 직접 생성
    ↓
[익명화 처리]
    ├─ 닉네임 자동 생성 (예: "익명교사1234")
    └─ IP 해싱 (SHA-256)
    ↓
[이메일 인증 링크 발송]
    ↓
[가입 완료 / 승인 대기]
```

#### 로그인 플로우
```
[사용자 입력: 이메일, 비밀번호]
    ↓
[Supabase Auth 인증]
    ↓
[사용자 정보 조회: users 테이블]
    ↓
[권한 검증]
    ├─ is_active = false → 403 Forbidden
    ├─ is_verified = false → 이메일 인증 요구
    └─ association_approved = false → 승인 대기 안내
    ↓
[Custom JWT 발급]
    ├─ Payload: { userId, email, role, association_id }
    ├─ Secret: process.env.JWT_SECRET
    ├─ Expiry: 24시간
    └─ 역할별 독립 키 저장
        ├─ auth_token_teacher
        ├─ auth_token_lawyer
        └─ auth_token_admin
    ↓
[세션 생성: 24시간 유지, 슬라이딩 윈도우]
    ↓
[last_login 업데이트]
    ↓
[로그인 성공: JWT 반환]
```

#### 토큰 검증 플로우
```
[API 요청: Authorization: Bearer {token}]
    ↓
[미들웨어: JWT 검증]
    ├─ 토큰 존재 여부
    ├─ 서명 유효성 (JWT_SECRET)
    ├─ 만료 시간 체크
    └─ 블랙리스트 확인 (로그아웃된 토큰)
    ↓
[Payload 추출: { userId, role }]
    ↓
[DB 조회: users 테이블]
    ├─ is_active 확인
    └─ role 일치 확인
    ↓
[권한 검증: RBAC]
    ├─ 요청 리소스
    └─ 사용자 역할 매칭
    ↓
[요청 처리 / 403 Forbidden]
```

#### 토큰 갱신 플로우
```
[클라이언트: 토큰 만료 감지]
    ↓
[POST /api/auth/refresh]
    ├─ Body: { refreshToken }
    ↓
[리프레시 토큰 검증]
    ├─ 서명 확인
    ├─ 만료 시간 체크 (7일)
    └─ 블랙리스트 확인
    ↓
[새 액세스 토큰 발급]
    ├─ Expiry: 24시간
    └─ 기존 리프레시 토큰 재사용
    ↓
[새 토큰 반환]
```

### 3.3 익명화 시스템 (Anonymization)

#### 자동 닉네임 생성
```typescript
function generateNickname(role: UserRole): string {
  const prefix = {
    teacher: '익명교사',
    lawyer: '익명변호사',
    admin: '관리자',
  }[role];

  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 1000~9999
  return `${prefix}${randomSuffix}`;
}

// 예시: "익명교사3847", "익명변호사7234"
```

#### IP 해싱
```typescript
import crypto from 'crypto';

function hashIp(ipAddress: string): string {
  return crypto
    .createHash('sha256')
    .update(ipAddress + process.env.IP_SALT)
    .digest('hex');
}

// 예시: "abc123..." (64자 해시)
```

#### 개인정보 마스킹 (신고 접수 시)
```typescript
interface ReportDataMasked {
  title: string;               // 공개
  description: string;         // 공개 (민감 정보 자동 필터링)
  category: string;            // 공개
  incident_date: string;       // 공개
  teacher_name: string;        // 마스킹: "김**"
  school: string;              // 마스킹: "서울**초등학교"
  perpetrator_info: string;    // 마스킹: "학부모 이**"
}
```

### 3.4 RBAC 미들웨어 (Role-Based Access Control)

#### Next.js 미들웨어 구현
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';

export async function middleware(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyJwt(token);

    // 요청 헤더에 사용자 정보 추가
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('X-User-Id', payload.userId.toString());
    requestHeaders.set('X-User-Role', payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ['/api/reports/:path*', '/api/consultations/:path*', '/api/admin/:path*'],
};
```

#### 역할 기반 접근 제어 헬퍼
```typescript
// src/lib/auth/rbac.ts
import { UserRole } from '@/types/auth.types';

export function requireRole(allowedRoles: UserRole[]) {
  return (userRole: UserRole) => {
    if (!allowedRoles.includes(userRole)) {
      throw new Error('Forbidden');
    }
  };
}

// 사용 예시
requireRole([UserRole.ADMIN])(currentUser.role);
```

---

## 4. API 엔드포인트 설계 (API Endpoints)

### 4.1 인증 API

#### POST /api/auth/register
회원가입

**Request Body**:
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!",
  "name": "김철수",
  "role": "teacher",
  "phone": "010-1234-5678",
  "school": "서울초등학교",
  "position": "담임교사",
  "association_id": 1
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "teacher@example.com",
      "name": "김철수",
      "role": "teacher",
      "nickname": "익명교사3847",
      "association_approved": true
    }
  },
  "message": "회원가입이 완료되었습니다. 이메일 인증을 진행해주세요."
}
```

**Error (400 Bad Request)**:
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_DUPLICATE",
    "message": "이미 등록된 이메일입니다."
  }
}
```

#### POST /api/auth/login
로그인

**Request Body**:
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 123,
      "email": "teacher@example.com",
      "name": "김철수",
      "role": "teacher",
      "nickname": "익명교사3847"
    }
  }
}
```

**Error (401 Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다."
  }
}
```

#### GET /api/auth/me
현재 사용자 정보 조회

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "teacher@example.com",
    "name": "김철수",
    "role": "teacher",
    "nickname": "익명교사3847",
    "association_id": 1,
    "association_approved": true,
    "is_verified": true
  }
}
```

#### POST /api/auth/refresh
토큰 갱신

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/auth/logout
로그아웃

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

#### POST /api/auth/forgot
비밀번호 찾기

**Request Body**:
```json
{
  "email": "teacher@example.com"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "비밀번호 재설정 링크를 이메일로 전송했습니다."
}
```

#### POST /api/auth/reset
비밀번호 재설정

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "비밀번호가 재설정되었습니다."
}
```

---

## 5. 보안 요구사항 (Security Requirements)

### 5.1 비밀번호 정책
- **최소 길이**: 8자 이상
- **복잡도**: 대문자, 소문자, 숫자, 특수문자 중 3가지 이상 포함
- **암호화**: bcrypt (salt rounds: 10)
- **평문 저장 금지**: 모든 비밀번호는 해시 후 저장

### 5.2 토큰 보안
- **JWT Secret**: 환경 변수로 관리, 256비트 이상 랜덤 키
- **액세스 토큰 만료**: 24시간
- **리프레시 토큰 만료**: 7일
- **토큰 블랙리스트**: 로그아웃 시 Redis에 저장 (만료 시간까지 보관)

### 5.3 세션 관리
- **유휴 타임아웃**: 30분 (사용자 활동 없을 시 경고)
- **슬라이딩 윈도우**: API 요청 시 세션 자동 연장
- **동시 세션 제한**: 계정당 최대 3개 (최신 세션 우선)

### 5.4 Rate Limiting
- **로그인 시도**: IP당 5회/5분 (실패 시 15분 차단)
- **회원가입**: IP당 3회/시간
- **비밀번호 재설정**: 이메일당 3회/시간

### 5.5 감사 로그 (Audit Trail)
- **기록 대상**:
  - 모든 인증 시도 (성공/실패)
  - 권한 변경
  - 협회 승인/반려
  - 관리자 작업
- **로그 필드**: timestamp, userId, action, ip_hash, user_agent, result
- **보관 기간**: 5년

---

## 6. 데이터 모델 (Data Model)

### 6.1 users 테이블
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher','lawyer','admin')),
  phone TEXT,
  school TEXT,
  position TEXT,
  association_id INTEGER,
  association_approved BOOLEAN DEFAULT 1,
  is_verified BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  nickname TEXT,
  ip_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  FOREIGN KEY (association_id) REFERENCES associations(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_association ON users(association_id);
```

### 6.2 sessions 테이블 (선택적 - Redis 대체 가능)
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 6.3 audit_logs 테이블
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  result TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## 7. 테스트 전략 (Test Strategy)

### 7.1 단위 테스트 (Unit Tests)
- **대상**: JWT 발급/검증, 비밀번호 해싱, 익명화 함수
- **도구**: Vitest
- **커버리지 목표**: 90% 이상

### 7.2 통합 테스트 (Integration Tests)
- **대상**: API 엔드포인트 (회원가입, 로그인, 토큰 갱신)
- **도구**: Vitest + Supertest
- **시나리오**:
  - 정상 회원가입 → 로그인 → 토큰 검증 → 로그아웃
  - 중복 이메일 회원가입 실패
  - 잘못된 비밀번호 로그인 실패
  - 만료된 토큰 검증 실패

### 7.3 E2E 테스트 (End-to-End Tests)
- **대상**: 전체 인증 플로우
- **도구**: Playwright
- **시나리오**:
  - 교사 회원가입 → 이메일 인증 → 로그인 → 대시보드 접근
  - 변호사 회원가입 → 관리자 승인 대기
  - 관리자 로그인 → 협회 승인 → 사용자 관리

### 7.4 보안 테스트
- **대상**: SQL Injection, XSS, CSRF, JWT 변조
- **도구**: OWASP ZAP, 수동 테스트
- **체크리스트**:
  - 비밀번호 평문 저장 확인
  - JWT Secret 노출 여부
  - Rate Limiting 동작 확인

---

## 8. 성능 요구사항 (Performance Requirements)

### 8.1 응답 시간
- **로그인**: < 200ms (95th percentile)
- **토큰 검증**: < 50ms (99th percentile)
- **회원가입**: < 500ms (95th percentile)

### 8.2 동시 사용자
- **목표**: 10,000명 동시 인증 지원
- **전략**: Redis 캐싱, JWT 무상태 인증

### 8.3 가용성
- **SLA**: 99.9% uptime
- **장애 복구**: < 1시간

---

## 9. 의존성 (Dependencies)

### 9.1 선행 요구사항
- **INFRA-001**: Supabase 프로젝트 설정, 데이터베이스 스키마 생성

### 9.2 차단하는 SPEC
- **REPORT-001**: 신고 접수 시스템 (인증 필요)
- **MATCH-001**: 변호사 매칭 시스템 (역할 기반 접근 제어 필요)

### 9.3 외부 라이브러리
- `@supabase/supabase-js`: Supabase 클라이언트
- `jsonwebtoken`: JWT 생성/검증
- `bcrypt`: 비밀번호 해싱
- `zod`: 입력 검증

---

## 10. 향후 확장 (Future Enhancements)

### Phase 2
- **2FA (TOTP)**: Google Authenticator 통합
- **OAuth 소셜 로그인**: Google, Kakao
- **IP 기반 접근 제어**: 관리자 계정 화이트리스트
- **생체 인증**: Touch ID, Face ID (모바일)

### Phase 3
- **SSO (Single Sign-On)**: 교육청 통합 인증
- **다중 계정 전환**: 교사 + 변호사 역할 동시 보유
- **감사 로그 고급 분석**: 이상 패턴 탐지

---

## 11. 참고 자료 (References)

- **PRD**: `T119_prd.md` - 인증 및 권한 관리 시스템 (섹션 2.1)
- **데이터베이스 스키마**: `T119_prd.md` - 섹션 3.2
- **API 엔드포인트**: `T119_prd.md` - 섹션 3.3
- **보안 정책**: `T119_prd.md` - 섹션 4
- **Supabase Auth 문서**: https://supabase.com/docs/guides/auth
- **JWT Best Practices**: https://datatracker.ietf.org/doc/html/rfc8725

---

**작성자**: @teacher119
**리뷰어**: (승인 대기)
**최종 수정일**: 2025-10-20
