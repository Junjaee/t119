# 교사119 플랫폼 - Product Requirements Document (PRD)

## 📋 문서 정보

* **버전**: 2.2.0
* **작성일**: 2025-10-20
* **작성자**: Claude Code Assistant
* **상태**: Production Ready
* **플랫폼**: 교사119 (교사 권익 보호 통합 플랫폼)

---

## 1. 제품 개요 (Product Overview)

### 1.1 비전 (Vision)

**"교사의 권익을 보호하고, 교육 현장의 문제를 신속하게 해결하는 통합 지원 플랫폼"**

교사119는 교사들이 겪는 다양한 교권 침해 상황에 대해 즉각적인 법률 지원과 상담을 제공하며, 교사 커뮤니티를 통해 경험과 지식을 공유할 수 있는 종합 솔루션임.

### 1.2 핵심 가치 제안 (Value Proposition)

1. **즉각적 대응**: 24시간 내 법률 상담 연결
2. **전문성**: 교육법 전문 변호사 네트워크
3. **익명성 보장**: 안전한 신고 및 상담 시스템
4. **데이터 기반**: 교권 침해 통계 및 분석 제공
5. **커뮤니티**: 교사 간 경험 공유 및 상호 지원

### 1.3 목표 사용자 (Target Users)

#### Primary Users

* **교사** (초/중/고등학교 교원)

  * 교권 침해 피해자, 예방 교육 필요 교사, 동료 지원 희망 교사

#### Secondary Users

* **변호사** (교육법 전문)

  * 교권 보호 전문 변호사, 프로보노 참여 변호사

#### Administrative Users

* **관리자**

  * 시스템 전반 운영, **협회(Association) 관리**(생성/수정/삭제), 회원 승인 정책 관리, RBAC/감사로그 관리

> 주의: 본 최종본에서는 **협회관리자(association_admin) 역할을 삭제**함. 협회 관련 승인/정책은 전부 **관리자**가 수행.

---

## 2. 핵심 기능 (Core Features)

### 2.1 🔐 인증 및 권한 관리 시스템

#### 2.1.1 다중 역할 기반 인증 (Multi-Role Authentication)

**기능 상세**:

* JWT 기반 토큰 인증, 자동 갱신, 세션 타임아웃(기본 24시간)
* 역할별 독립 토큰 키 (Dual Storage)

  * 예: `auth_token_teacher`, `auth_token_lawyer`, `auth_token_admin`
  * 레거시 호환: `token` 유지
* 2FA(TOTP) 확장 준비, IP 기반 접근 제어(관리자 계정 옵션)

**역할 체계(TypeScript)**:

```ts
export enum UserRole {
  TEACHER = 'teacher',  // 교사
  LAWYER = 'lawyer',    // 변호사
  ADMIN = 'admin',      // 시스템 관리자
}
```

#### 2.1.2 역할별 접근 제어 (RBAC)

**권한 매트릭스 (요약)**

| 기능          |  교사 | 변호사 | 관리자 |
| ----------- | :-: | :-: | :-: |
| 신고 작성       |  ✅  |  ❌  |  ✅* |
| 신고 조회(본인)   |  ✅  |  ❌  |  ✅  |
| 신고 조회(전체)   |  ❌  | ✅** |  ✅  |
| 법률 상담       |  ✅  |  ✅  |  ✅  |
| 통계 조회(요약)   |  ✅  |  ✅  |  ✅  |
| 사용자 관리      |  ❌  |  ❌  |  ✅  |
| 협회 생성/수정/삭제 |  ❌  |  ❌  |  ✅  |
| 협회 회원가입 승인  |  ❌  |  ❌  |  ✅  |
| 시스템 설정/감사로그 |  ❌  |  ❌  |  ✅  |

* *관리자는 운영 목적으로 테스트 신고 생성 가능(옵션)
* **변호사의 전체 조회 범위는 배정/미배정 사건 풀에 한정(개인정보 최소화 정책 적용)

---

### 2.2 📝 교권 침해 신고 시스템

#### 2.2.1 신고 접수 (Report Submission)

**신고 유형 분류**:

1. **학부모 관련**: 폭언/욕설, 무리한 요구, 명예훼손, 물리적 위협
2. **학생 관련**: 수업 방해, 반항/불복종, 폭언/폭행, 사이버 불링
3. **동료/관리자 관련**: 직장 내 괴롭힘, 부당한 업무 지시, 차별/배제

**신고 프로세스**:

```
[신고 작성] → [초기 분류] → [변호사 배정] → [상담 진행] → [해결/종결]
     ↓            ↓              ↓              ↓            ↓
  (익명처리)   (긴급도 평가)  (24시간 내)   (진행 추적)  (만족도 조사)
```

**데이터 수집 항목**: 사건 일시·장소, 가해자 정보(익명화 가능), 사건 경위(최대 5000자), 증거(최대 10MB×5), 목격자, 희망 조치 등

#### 2.2.2 신고 추적 시스템 (Case Tracking)

**상태 관리**:

```ts
export enum ReportStatus {
  SUBMITTED = 'submitted',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}
```

**실시간 알림**: 상태 변경/변호사 답변/중요 일정 시 이메일·SMS·인앱 알림

---

### 2.3 ⚖️ 법률 상담 시스템

* 변호사 매칭: 변호사가 미배정 케이스 풀을 조회해 상담 수락(개인정보 최소화)
* 변호사용 대시보드: 미배정 케이스, 담당 케이스, 상담 이력, 자료 첨부, 일정 관리
* 교사용 기능: 진행 상황, 메시지, 평가/피드백, 다운로드

---

### 2.4 👥 커뮤니티 시스템

* 익명 게시판(경험공유/Q&A/자료실), 자동 닉네임, IP 해싱, 개인정보 마스킹

---

### 2.5 📊 통계 및 분석 시스템

* 시계열, 유형별, 지역별, 해결률 분석
* Chart.js 인터랙티브, 히트맵, 실시간 대시보드, PDF 리포트 생성

---

### 2.6 🔔 알림 시스템

* 인앱, 이메일(HTML 템플릿/일일 다이제스트), SMS(긴급/리마인더)
* 유형별 on/off, 시간대 설정(방해금지), 채널 우선순위

---

## 3. 기술 사양 (Technical Specifications)

### 3.1 기술 스택

**Frontend**: Next.js 14(App Router), TypeScript 5+, Tailwind CSS 3, Zustand, Radix UI + shadcn/ui, Chart.js
**Backend**: Node.js 18+ (ARM 최적화), Next.js API Routes, SQLite3(Better-SQLite3), JWT, bcrypt
**Infra**: Vercel/Self-hosted, Cloudflare CDN, Sentry, GA4

### 3.2 데이터베이스 스키마

```sql
-- 협회 테이블
CREATE TABLE associations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  region TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블 (association_admin 삭제, 승인 주체는 관리자)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher','lawyer','admin')),
  phone TEXT,
  school TEXT,
  position TEXT,
  association_id INTEGER,                  -- 교사 회원가입 시 선택 가능
  association_approved BOOLEAN DEFAULT 1,  -- 기본 자동 승인(정책 토글로 보류 가능)
  is_verified BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  FOREIGN KEY (association_id) REFERENCES associations(id)
);

-- 신고/상담/메시지 테이블 (변경 없음)
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  incident_location TEXT,
  perpetrator_type TEXT,
  status TEXT DEFAULT 'submitted',
  priority TEXT DEFAULT 'normal',
  assigned_lawyer_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_lawyer_id) REFERENCES users(id)
);

CREATE TABLE consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  lawyer_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  type TEXT DEFAULT 'general',
  started_at DATETIME,
  completed_at DATETIME,
  satisfaction_rating INTEGER,
  notes TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (lawyer_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consultation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

> **정책 옵션**: 관리자 콘솔에서 *협회 회원가입 승인 모드*를 토글로 설정 가능
>
> * `자동 승인(기본)` / `관리자 승인 대기` 중 선택
> * 승인 대기 상태에서는 제한적 접근(프로필/신고 초안 작성 허용 여부 선택)

### 3.3 API 엔드포인트

#### Authentication / User

```
POST   /api/auth/register               - 회원가입 (교사는 association_id 포함)
POST   /api/auth/login                  - 로그인
GET    /api/auth/me                     - 현재 사용자 정보
POST   /api/auth/logout                 - 로그아웃
POST   /api/auth/refresh                - 토큰 갱신
POST   /api/auth/forgot                 - 비밀번호 찾기
POST   /api/auth/reset                  - 비밀번호 재설정
```

#### Association Management (관리자 전용)

```
GET    /api/associations                - 협회 목록
POST   /api/associations                - 협회 생성
GET    /api/associations/:id            - 협회 상세
PUT    /api/associations/:id            - 협회 수정
DELETE /api/associations/:id            - 협회 삭제
```

#### Association Membership (관리자 전용 승인 모드일 때)

```
GET    /api/associations/:id/pending-members      - 승인 대기 목록
POST   /api/associations/:id/members/:userId/approve  - 승인
POST   /api/associations/:id/members/:userId/reject   - 반려
```

#### Report Management

```
GET    /api/reports                     - 신고 목록
GET    /api/reports/:id                 - 신고 상세
POST   /api/reports                     - 신고 작성
PUT    /api/reports/:id                 - 신고 수정
DELETE /api/reports/:id                 - 신고 삭제
POST   /api/reports/:id/assign          - 변호사 배정
```

#### Consultation

```
GET    /api/consultations               - 상담 목록
GET    /api/consultations/:id           - 상담 상세
POST   /api/consultations               - 상담 시작
PUT    /api/consultations/:id           - 상담 상태 변경
POST   /api/consultations/:id/messages  - 메시지 전송
```

#### Statistics

```
GET    /api/stats/overview              - 전체 통계
GET    /api/stats/trends                - 추세 분석
GET    /api/stats/regional              - 지역별 통계
GET    /api/stats/categories            - 카테고리별 통계
```

---

## 4. 보안 요구사항 (Security Requirements)

* **데이터 보호**: AES-256, TLS 1.3, PII 자동 마스킹, 보존 5년
* **접근 제어**: TOTP 2FA(옵션), 유휴 30분 타임아웃, 관리자 IP 제한(옵션), RBAC
* **감사로그**: 협회 CRUD, 회원 승인/반려, 권한 변경, 신고/상담 상태 변경 전부 기록
* **규정 준수**: 개인정보보호법(PIPA), GDPR 대응, 교육부 가이드라인, 변호사법 관련 규정 준수

---

## 5. 성능 요구사항 (Performance Requirements)

* 페이지 로드 < 2초, API < 500ms(95p), 검색 < 1초, 업로드 < 10초(10MB)
* 가용성 99.9%, 계획 점검 월 1회≤2시간, 장애 복구 < 1시간
* 확장성: 동시 사용자 10,000, 일일 활성 50,000, 연 100GB 데이터 증가

---

## 6. 사용자 경험 (User Experience)

### 6.1 디자인 원칙

* 심플/일관/접근성(WCAG 2.1 AA)/반응형

### 6.2 주요 사용자 플로우

#### 교사 - 회원가입 & 협회 선택

```
[회원가입] → [협회 선택] → [본인 인증] → [가입 제출]
   → (정책에 따라 자동 승인 또는 관리자 승인 대기) → [대시보드]
```

#### 관리자 - 협회/회원 승인

```
[로그인] → [협회 관리] → [협회 생성/수정/삭제]
   → [승인 대기 목록] → [승인/반려] → [감사로그 확인]
```

#### 변호사 - 상담

```
[로그인] → [상담 대시보드] → [미배정 케이스] → [수락] → [메시지] → [상태 업데이트]
```

### 6.3 브랜딩

* **Primary**: #FF7210, **Secondary**: #FFFAF0
* **Typography**: Pretendard(한글), Inter(영문)
* **아이콘**: Lucide Icons

---

## 7. 로드맵 (Product Roadmap)

### Phase 1

* 기본 인증, 신고 접수/관리, 변호사 매칭, 기본 통계
* **추가**: 협회 테이블, 관리자 협회 CRUD, *회원 승인 정책 토글*

### Phase 2

* 실시간 채팅, 모바일 앱, AI 분류, 고급 분석
* **확장**: 협회별 대시보드(가입 추이/승인 리드타임), 다중 협회 운영 지원(옵션)

---

**© 2025 교사119. All Rights Reserved.**

본 PRD는 **협회관리자 역할 제거** 및 이에 따른 RBAC·DB·API·UX 전면 반영을 포함한 최종본임. 지속 업데이트 예정.
