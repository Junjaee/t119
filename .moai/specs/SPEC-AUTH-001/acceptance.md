# @SPEC:AUTH-001 수락 기준 (Acceptance Criteria)

> **SPEC**: `.moai/specs/SPEC-AUTH-001/spec.md`
>
> **목표**: 다중 역할 인증 시스템의 완료 조건 및 검증 방법 정의

---

## 1. Definition of Done (완료 조건)

### 필수 조건 (Mandatory)
- [x] 모든 단위 테스트 통과 (커버리지 ≥ 90%)
- [ ] 모든 통합 테스트 통과
- [ ] E2E 테스트 통과 (교사/변호사/관리자 플로우)
- [ ] API 문서 작성 완료 (Swagger/OpenAPI)
- [ ] 보안 체크리스트 100% 통과
- [ ] 코드 리뷰 승인 (2명 이상)
- [ ] Linter/Formatter 검증 통과 (ESLint, Prettier)
- [ ] 타입 검사 통과 (TypeScript strict mode)

### 권장 조건 (Recommended)
- [ ] 성능 테스트 통과 (로그인 < 200ms)
- [ ] 부하 테스트 통과 (동시 사용자 10,000명)
- [ ] 보안 스캔 통과 (OWASP ZAP)
- [ ] 접근성 테스트 통과 (WCAG 2.1 AA)

---

## 2. Given-When-Then 시나리오 (Test Scenarios)

### 2.1 회원가입 시나리오

#### 시나리오 1: 교사 회원가입 (정상)
**Given**: 유효한 이메일, 비밀번호, 교사 정보를 입력
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

**When**: POST /api/auth/register 호출

**Then**:
- HTTP 상태 코드 201 Created
- 응답 본문에 사용자 정보 포함 (`id`, `email`, `role`, `nickname`)
- 자동 닉네임 생성: "익명교사{4자리 숫자}" 형식
- IP 해싱 완료 (`ip_hash` 필드)
- 이메일 인증 링크 발송
- `association_approved` = true (자동 승인 정책)

**검증 코드**:
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(registerData),
});

expect(response.status).toBe(201);
const data = await response.json();
expect(data.success).toBe(true);
expect(data.data.user.email).toBe('teacher@example.com');
expect(data.data.user.role).toBe('teacher');
expect(data.data.user.nickname).toMatch(/^익명교사\d{4}$/);
```

---

#### 시나리오 2: 중복 이메일 회원가입 (실패)
**Given**: 이미 등록된 이메일 주소

**When**: POST /api/auth/register 호출

**Then**:
- HTTP 상태 코드 400 Bad Request
- 에러 코드: `EMAIL_DUPLICATE`
- 에러 메시지: "이미 등록된 이메일입니다."

**검증 코드**:
```typescript
expect(response.status).toBe(400);
const data = await response.json();
expect(data.error.code).toBe('EMAIL_DUPLICATE');
```

---

#### 시나리오 3: 약한 비밀번호 회원가입 (실패)
**Given**: 비밀번호 "1234" (8자 미만, 복잡도 낮음)

**When**: POST /api/auth/register 호출

**Then**:
- HTTP 상태 코드 400 Bad Request
- 에러 코드: `WEAK_PASSWORD`
- 에러 메시지: "비밀번호는 최소 8자 이상이어야 하며, 대문자/소문자/숫자/특수문자 중 3가지 이상 포함해야 합니다."

**검증 코드**:
```typescript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ ...registerData, password: '1234' }),
});

expect(response.status).toBe(400);
expect(data.error.code).toBe('WEAK_PASSWORD');
```

---

#### 시나리오 4: 변호사 회원가입 (승인 대기)
**Given**: 변호사 역할 선택

**When**: POST /api/auth/register 호출

**Then**:
- HTTP 상태 코드 201 Created
- `is_active` = false (관리자 승인 대기)
- 응답 메시지: "회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다."

---

### 2.2 로그인 시나리오

#### 시나리오 5: 교사 로그인 (정상)
**Given**: 유효한 이메일, 비밀번호

**When**: POST /api/auth/login 호출
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!"
}
```

**Then**:
- HTTP 상태 코드 200 OK
- 응답 본문에 `accessToken`, `refreshToken` 포함
- 토큰 Payload: `{ userId, email, role, association_id }`
- `last_login` 업데이트
- 역할별 독립 키 저장: `auth_token_teacher`

**검증 코드**:
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

expect(response.status).toBe(200);
const data = await response.json();
expect(data.success).toBe(true);
expect(data.data.accessToken).toBeDefined();
expect(data.data.refreshToken).toBeDefined();
expect(data.data.user.role).toBe('teacher');

// JWT Payload 검증
const decoded = jwt.decode(data.data.accessToken);
expect(decoded.userId).toBe(123);
expect(decoded.role).toBe('teacher');
```

---

#### 시나리오 6: 잘못된 비밀번호 로그인 (실패)
**Given**: 올바른 이메일, 잘못된 비밀번호

**When**: POST /api/auth/login 호출

**Then**:
- HTTP 상태 코드 401 Unauthorized
- 에러 코드: `INVALID_CREDENTIALS`
- 에러 메시지: "이메일 또는 비밀번호가 올바르지 않습니다."
- 감사 로그 기록: `{ action: 'login_failed', userId: null, ip_hash }`

**검증 코드**:
```typescript
expect(response.status).toBe(401);
expect(data.error.code).toBe('INVALID_CREDENTIALS');
```

---

#### 시나리오 7: 비활성화된 계정 로그인 (실패)
**Given**: `is_active = false` 계정

**When**: POST /api/auth/login 호출

**Then**:
- HTTP 상태 코드 403 Forbidden
- 에러 코드: `ACCOUNT_INACTIVE`
- 에러 메시지: "계정이 비활성화되었습니다. 관리자에게 문의하세요."

---

#### 시나리오 8: Rate Limiting (5회 실패)
**Given**: 동일 IP에서 5회 로그인 실패

**When**: 6번째 로그인 시도

**Then**:
- HTTP 상태 코드 429 Too Many Requests
- 에러 코드: `RATE_LIMIT_EXCEEDED`
- 에러 메시지: "로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요."
- `Retry-After` 헤더: 900 (15분)

---

### 2.3 역할별 권한 검증 시나리오

#### 시나리오 9: 교사가 본인 신고 조회 (정상)
**Given**: 교사 역할 JWT 토큰, 본인이 작성한 신고 ID

**When**: GET /api/reports/:id 호출
```
Authorization: Bearer {teacher_token}
```

**Then**:
- HTTP 상태 코드 200 OK
- 응답 본문에 신고 상세 정보 포함

---

#### 시나리오 10: 교사가 타인 신고 조회 (실패)
**Given**: 교사 역할 JWT 토큰, 다른 교사가 작성한 신고 ID

**When**: GET /api/reports/:id 호출

**Then**:
- HTTP 상태 코드 403 Forbidden
- 에러 코드: `FORBIDDEN`
- 에러 메시지: "접근 권한이 없습니다."

---

#### 시나리오 11: 변호사가 전체 신고 목록 조회 (정상)
**Given**: 변호사 역할 JWT 토큰

**When**: GET /api/reports 호출

**Then**:
- HTTP 상태 코드 200 OK
- 응답 본문에 미배정/배정된 신고 목록 포함
- 개인정보 마스킹 적용: `teacher_name: "김**"`

---

#### 시나리오 12: 변호사가 신고 작성 (실패)
**Given**: 변호사 역할 JWT 토큰

**When**: POST /api/reports 호출

**Then**:
- HTTP 상태 코드 403 Forbidden
- 에러 코드: `FORBIDDEN`
- 에러 메시지: "변호사는 신고를 작성할 수 없습니다."

---

#### 시나리오 13: 관리자가 협회 생성 (정상)
**Given**: 관리자 역할 JWT 토큰

**When**: POST /api/associations 호출
```json
{
  "name": "서울시교육청 교원단체",
  "description": "서울시 교원 권익 보호",
  "region": "서울",
  "contact_email": "seoul@example.com"
}
```

**Then**:
- HTTP 상태 코드 201 Created
- 응답 본문에 생성된 협회 정보 포함
- 감사 로그 기록: `{ action: 'association_created', userId, metadata: { name } }`

---

#### 시나리오 14: 교사가 협회 생성 (실패)
**Given**: 교사 역할 JWT 토큰

**When**: POST /api/associations 호출

**Then**:
- HTTP 상태 코드 403 Forbidden
- 에러 코드: `FORBIDDEN`

---

### 2.4 토큰 갱신 시나리오

#### 시나리오 15: 리프레시 토큰으로 액세스 토큰 갱신 (정상)
**Given**: 유효한 리프레시 토큰

**When**: POST /api/auth/refresh 호출
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Then**:
- HTTP 상태 코드 200 OK
- 응답 본문에 새로운 `accessToken`, `refreshToken` 포함
- 기존 액세스 토큰 블랙리스트 추가 (로그아웃 효과)

**검증 코드**:
```typescript
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken }),
});

expect(response.status).toBe(200);
const data = await response.json();
expect(data.data.accessToken).toBeDefined();
expect(data.data.refreshToken).toBeDefined();

// 새 토큰으로 API 호출 성공
const apiResponse = await fetch('/api/reports', {
  headers: { Authorization: `Bearer ${data.data.accessToken}` },
});
expect(apiResponse.status).toBe(200);

// 기존 토큰으로 API 호출 실패
const oldTokenResponse = await fetch('/api/reports', {
  headers: { Authorization: `Bearer ${oldAccessToken}` },
});
expect(oldTokenResponse.status).toBe(401);
```

---

#### 시나리오 16: 만료된 리프레시 토큰 (실패)
**Given**: 7일이 지난 리프레시 토큰

**When**: POST /api/auth/refresh 호출

**Then**:
- HTTP 상태 코드 401 Unauthorized
- 에러 코드: `TOKEN_EXPIRED`
- 에러 메시지: "리프레시 토큰이 만료되었습니다. 다시 로그인하세요."

---

### 2.5 익명성 보장 시나리오

#### 시나리오 17: 자동 닉네임 생성
**Given**: 회원가입 시 닉네임 미입력

**When**: POST /api/auth/register 호출

**Then**:
- 자동 닉네임 생성: "익명교사{4자리 숫자}" (예: "익명교사3847")
- 닉네임 중복 없음 (재생성 로직)

**검증 코드**:
```typescript
const nickname1 = data1.data.user.nickname;
const nickname2 = data2.data.user.nickname;
expect(nickname1).toMatch(/^익명교사\d{4}$/);
expect(nickname2).toMatch(/^익명교사\d{4}$/);
expect(nickname1).not.toBe(nickname2);
```

---

#### 시나리오 18: IP 해싱
**Given**: 회원가입 또는 로그인 시도

**When**: 클라이언트 IP 주소 기록

**Then**:
- `ip_hash` 필드에 SHA-256 해시값 저장
- 원본 IP 주소는 저장하지 않음

**검증 코드**:
```typescript
const ipHash = data.data.user.ip_hash;
expect(ipHash).toHaveLength(64); // SHA-256 해시 길이
expect(ipHash).toMatch(/^[a-f0-9]{64}$/);

// 동일 IP 재시도 시 동일 해시
const ipHash2 = data2.data.user.ip_hash;
expect(ipHash).toBe(ipHash2);
```

---

#### 시나리오 19: 개인정보 마스킹 (신고 조회 시)
**Given**: 변호사가 미배정 신고 목록 조회

**When**: GET /api/reports 호출

**Then**:
- `teacher_name`: "김**" (성만 공개)
- `school`: "서울**초등학교" (앞 2자, 뒤 2자만 공개)
- `phone`: 마스킹 (전체 비공개)

**검증 코드**:
```typescript
const report = data.data.reports[0];
expect(report.teacher_name).toMatch(/^.{1}\*+$/);
expect(report.school).toMatch(/^.{2}\*+.{2}$/);
expect(report.phone).toBeUndefined();
```

---

### 2.6 로그아웃 시나리오

#### 시나리오 20: 로그아웃 (정상)
**Given**: 유효한 액세스 토큰

**When**: POST /api/auth/logout 호출
```
Authorization: Bearer {accessToken}
```

**Then**:
- HTTP 상태 코드 200 OK
- 응답 메시지: "로그아웃되었습니다."
- 토큰 블랙리스트 추가
- 기존 토큰으로 API 호출 시 401 에러

**검증 코드**:
```typescript
const logoutResponse = await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
});
expect(logoutResponse.status).toBe(200);

// 로그아웃 후 API 호출 실패
const apiResponse = await fetch('/api/reports', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
expect(apiResponse.status).toBe(401);
```

---

## 3. 품질 게이트 (Quality Gates)

### 3.1 코드 커버리지
- **목표**: 90% 이상
- **측정 도구**: Vitest Coverage (c8)
- **제외 대상**: 타입 정의 파일, 설정 파일

**검증 명령어**:
```bash
pnpm test:coverage
```

**통과 기준**:
```
Statements   : 90% ( 450/500 )
Branches     : 85% ( 170/200 )
Functions    : 90% ( 90/100 )
Lines        : 90% ( 450/500 )
```

---

### 3.2 성능 기준

#### 로그인 응답 시간
- **목표**: < 200ms (95th percentile)
- **측정 도구**: Apache Bench (ab)
- **테스트 명령어**:
```bash
ab -n 1000 -c 10 -T 'application/json' \
   -p login.json \
   http://localhost:3000/api/auth/login
```

**통과 기준**:
```
Percentage of the requests served within a certain time (ms)
  95%    180
  99%    250
```

---

#### JWT 검증 속도
- **목표**: < 50ms (99th percentile)
- **측정 도구**: Vitest Benchmark

**검증 코드**:
```typescript
import { bench, describe } from 'vitest';
import { verifyAccessToken } from '@/lib/auth/jwt';

describe('JWT 검증 성능', () => {
  bench('1000회 토큰 검증', () => {
    for (let i = 0; i < 1000; i++) {
      verifyAccessToken(sampleToken);
    }
  }, { time: 1000 });
});
```

**통과 기준**: 1000회 검증 < 50ms

---

### 3.3 보안 체크리스트

- [ ] **비밀번호 평문 저장 금지**: 모든 비밀번호는 bcrypt 해싱
- [ ] **JWT Secret 노출 방지**: 환경 변수로 관리, `.gitignore` 포함
- [ ] **SQL Injection 방지**: Supabase ORM 사용 (파라미터화 쿼리)
- [ ] **XSS 방지**: 입력 검증 (Zod), DOMPurify (Phase 2)
- [ ] **CSRF 방지**: SameSite=Strict 쿠키 (Phase 2)
- [ ] **Rate Limiting**: 로그인 5회/5분, 회원가입 3회/시간
- [ ] **토큰 만료 시간**: 액세스 24시간, 리프레시 7일
- [ ] **HTTPS 강제**: 프로덕션 환경 TLS 1.3
- [ ] **감사 로그**: 모든 인증 시도 기록 (성공/실패)
- [ ] **개인정보 마스킹**: 변호사 조회 시 교사 정보 마스킹

---

### 3.4 접근성 (Accessibility)

#### 로그인 페이지
- [ ] **키보드 접근**: Tab 키로 모든 입력 필드 이동 가능
- [ ] **스크린 리더**: 레이블 및 aria-label 정의
- [ ] **대비율**: WCAG 2.1 AA (텍스트 4.5:1, 대형 텍스트 3:1)
- [ ] **포커스 표시**: 입력 필드 포커스 시 명확한 테두리

**검증 도구**: Lighthouse Accessibility Audit

---

## 4. 검증 방법 (Verification Methods)

### 4.1 자동화된 테스트
```bash
# 단위 테스트
pnpm test:unit

# 통합 테스트
pnpm test:integration

# E2E 테스트
pnpm test:e2e

# 전체 테스트 + 커버리지
pnpm test:all
```

---

### 4.2 수동 테스트 체크리스트

#### 교사 플로우
- [ ] 회원가입 → 이메일 인증 → 로그인
- [ ] 비밀번호 찾기 → 재설정
- [ ] 신고 작성 → 본인 신고 조회
- [ ] 타인 신고 조회 시 403 에러
- [ ] 로그아웃 → 재로그인

#### 변호사 플로우
- [ ] 회원가입 → 관리자 승인 대기
- [ ] 관리자 승인 → 로그인
- [ ] 미배정 신고 목록 조회 (개인정보 마스킹 확인)
- [ ] 신고 배정 → 담당 신고 조회
- [ ] 신고 작성 시도 → 403 에러

#### 관리자 플로우
- [ ] 시스템 관리자가 관리자 계정 생성
- [ ] 관리자 로그인
- [ ] 협회 생성/수정/삭제
- [ ] 변호사 승인/반려
- [ ] 감사 로그 조회

---

### 4.3 보안 스캔
```bash
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html

# npm audit
pnpm audit

# Snyk 취약점 스캔
snyk test
```

---

## 5. 롤백 계획 (Rollback Plan)

### 5.1 롤백 트리거
- 로그인 성공률 < 95%
- API 응답 시간 > 500ms (95th percentile)
- 치명적 보안 취약점 발견
- 프로덕션 에러율 > 5%

### 5.2 롤백 절차
1. Vercel 배포 페이지에서 이전 버전 선택
2. "Rollback" 버튼 클릭
3. 헬스 체크 확인: `GET /api/health`
4. 인증 API 동작 확인: `POST /api/auth/login`
5. 사용자 알림: "일시적 장애 복구 완료"

---

**작성일**: 2025-10-20
**검토자**: (승인 대기)
**최종 업데이트**: TDD 구현 완료 시
