# MATCH-001 인수 조건 (Acceptance Criteria)

> **SPEC**: SPEC-MATCH-001 - 변호사 주도 매칭 시스템
> **버전**: v0.0.1 (Draft)
> **작성일**: 2025-10-20

---

## 1. 인수 조건 개요

본 문서는 SPEC-MATCH-001의 구현이 완료되었음을 검증하기 위한 Given-When-Then 방식의 인수 조건을 정의한다.

---

## 2. Feature: 미배정 신고 목록 조회

### Scenario 1: 변호사가 미배정 신고 목록을 성공적으로 조회한다

**Given**:
- 변호사 역할의 사용자가 로그인되어 있다
- 데이터베이스에 다음 신고들이 존재한다:
  - 신고 A: `status=submitted`, `assigned_lawyer_id=NULL` (parent 카테고리)
  - 신고 B: `status=submitted`, `assigned_lawyer_id=NULL` (student 카테고리)
  - 신고 C: `status=assigned`, `assigned_lawyer_id={lawyer_id}` (이미 배정됨)

**When**:
- 변호사가 `GET /api/lawyers/available-reports` API를 호출한다

**Then**:
- HTTP 응답 코드는 `200 OK`이다
- 응답 본문에는 신고 A, B만 포함된다 (C는 제외)
- 각 신고는 다음 필드를 포함한다:
  - `id`, `title`, `category`, `incident_date`, `created_at`
  - `teacher.name`, `teacher.anonymous_nickname`
- 페이지네이션 정보가 포함된다:
  - `pagination.total`, `pagination.page`, `pagination.limit`, `pagination.total_pages`

---

### Scenario 2: 변호사가 카테고리 필터를 사용하여 신고를 조회한다

**Given**:
- 변호사 역할의 사용자가 로그인되어 있다
- 데이터베이스에 다음 신고들이 존재한다:
  - 신고 A: `status=submitted`, `category=parent`
  - 신고 B: `status=submitted`, `category=student`
  - 신고 C: `status=submitted`, `category=parent`

**When**:
- 변호사가 `GET /api/lawyers/available-reports?category=parent` API를 호출한다

**Then**:
- HTTP 응답 코드는 `200 OK`이다
- 응답 본문에는 신고 A, C만 포함된다
- 모든 신고의 `category` 필드는 `parent`이다

---

### Scenario 3: 변호사가 아닌 사용자가 목록 조회를 시도하면 접근이 거부된다

**Given**:
- 교사 역할의 사용자가 로그인되어 있다

**When**:
- 교사가 `GET /api/lawyers/available-reports` API를 호출한다

**Then**:
- HTTP 응답 코드는 `403 Forbidden`이다
- 응답 본문에는 에러 메시지 `"Forbidden: Lawyer role required"`가 포함된다

---

### Scenario 4: 인증되지 않은 사용자가 목록 조회를 시도하면 접근이 거부된다

**Given**:
- 사용자가 로그인되어 있지 않다 (JWT 토큰 없음)

**When**:
- `GET /api/lawyers/available-reports` API를 JWT 토큰 없이 호출한다

**Then**:
- HTTP 응답 코드는 `401 Unauthorized`이다
- 응답 본문에는 에러 메시지 `"Unauthorized"`가 포함된다

---

## 3. Feature: 신고 상세 조회

### Scenario 5: 변호사가 미배정 신고의 상세 내용을 조회한다

**Given**:
- 변호사 역할의 사용자가 로그인되어 있다
- 신고 A가 `status=submitted`, `assigned_lawyer_id=NULL` 상태로 존재한다
- 신고 A에 증거 파일 2개가 첨부되어 있다

**When**:
- 변호사가 `GET /api/reports/{report_a_id}` API를 호출한다

**Then**:
- HTTP 응답 코드는 `200 OK`이다
- 응답 본문에는 다음 정보가 포함된다:
  - `id`, `title`, `description`, `category`, `incident_date`, `status`
  - `teacher.name`, `teacher.anonymous_nickname`
  - `evidence_files` 배열 (2개 파일 정보)

---

### Scenario 6: 변호사가 다른 변호사에게 배정된 신고를 조회하면 접근이 거부된다

**Given**:
- 변호사 A, B가 모두 로그인되어 있다
- 신고 C가 `status=assigned`, `assigned_lawyer_id={lawyer_a_id}` 상태로 존재한다

**When**:
- 변호사 B가 `GET /api/reports/{report_c_id}` API를 호출한다

**Then**:
- HTTP 응답 코드는 `403 Forbidden`이다
- 응답 본문에는 에러 메시지가 포함된다

---

## 4. Feature: 상담 시작 (신고 선택)

### Scenario 7: 변호사가 미배정 신고를 선택하여 상담을 시작한다

**Given**:
- 변호사 A가 로그인되어 있다
- 신고 R이 `status=submitted`, `assigned_lawyer_id=NULL` 상태로 존재한다
- 신고 R의 작성자는 교사 T이다
- 변호사 A의 진행 중인 상담 수는 5개이다

**When**:
- 변호사 A가 `POST /api/consultations` API를 호출한다:
  ```json
  { "report_id": "{report_r_id}" }
  ```

**Then**:
- HTTP 응답 코드는 `201 Created`이다
- 응답 본문에는 다음 정보가 포함된다:
  ```json
  {
    "consultation": {
      "id": "{consultation_id}",
      "report_id": "{report_r_id}",
      "teacher_id": "{teacher_t_id}",
      "lawyer_id": "{lawyer_a_id}",
      "status": "pending",
      "created_at": "{timestamp}"
    },
    "report": {
      "id": "{report_r_id}",
      "status": "assigned",
      "assigned_lawyer_id": "{lawyer_a_id}"
    }
  }
  ```
- 데이터베이스의 `reports` 테이블에서:
  - 신고 R의 `status`가 `assigned`로 변경된다
  - 신고 R의 `assigned_lawyer_id`가 변호사 A의 ID로 설정된다
- 데이터베이스의 `consultations` 테이블에:
  - 새 레코드가 생성된다 (`status=pending`)

---

### Scenario 8: 변호사가 이미 배정된 신고를 선택하면 충돌 에러가 발생한다

**Given**:
- 변호사 A, B가 모두 로그인되어 있다
- 신고 R이 `status=assigned`, `assigned_lawyer_id={lawyer_a_id}` 상태로 존재한다

**When**:
- 변호사 B가 `POST /api/consultations` API를 호출한다:
  ```json
  { "report_id": "{report_r_id}" }
  ```

**Then**:
- HTTP 응답 코드는 `409 Conflict`이다
- 응답 본문에는 에러 메시지 `"Report already assigned"`가 포함된다
- 데이터베이스 상태는 변경되지 않는다

---

### Scenario 9: 두 변호사가 동시에 같은 신고를 선택하면 한 명만 성공한다

**Given**:
- 변호사 A, B가 모두 로그인되어 있다
- 신고 R이 `status=submitted`, `assigned_lawyer_id=NULL` 상태로 존재한다

**When**:
- 변호사 A와 B가 **동시에** `POST /api/consultations` API를 호출한다:
  ```json
  { "report_id": "{report_r_id}" }
  ```

**Then**:
- 두 요청 중 **하나만** `201 Created`를 받는다 (먼저 처리된 요청)
- 나머지 하나는 `409 Conflict`를 받는다
- 데이터베이스의 신고 R은 **한 명의 변호사에게만** 배정된다
- `consultations` 테이블에는 **1개의 레코드만** 생성된다

---

### Scenario 10: 변호사가 진행 중인 상담이 10개 이상이면 새 신고 선택이 거부된다

**Given**:
- 변호사 A가 로그인되어 있다
- 변호사 A는 이미 10개의 진행 중인 상담을 보유하고 있다:
  - 5개는 `status=pending`
  - 5개는 `status=active`
- 신고 R이 `status=submitted`, `assigned_lawyer_id=NULL` 상태로 존재한다

**When**:
- 변호사 A가 `POST /api/consultations` API를 호출한다:
  ```json
  { "report_id": "{report_r_id}" }
  ```

**Then**:
- HTTP 응답 코드는 `403 Forbidden`이다
- 응답 본문에는 에러 메시지 `"Lawyer has too many active consultations"`가 포함된다
- 데이터베이스 상태는 변경되지 않는다

---

### Scenario 11: 변호사가 존재하지 않는 신고를 선택하면 에러가 발생한다

**Given**:
- 변호사 A가 로그인되어 있다
- 데이터베이스에 신고 ID `{invalid_uuid}`가 존재하지 않는다

**When**:
- 변호사 A가 `POST /api/consultations` API를 호출한다:
  ```json
  { "report_id": "{invalid_uuid}" }
  ```

**Then**:
- HTTP 응답 코드는 `404 Not Found`이다
- 응답 본문에는 에러 메시지 `"Report not found"`가 포함된다

---

### Scenario 12: 변호사가 유효하지 않은 요청 본문을 전송하면 에러가 발생한다

**Given**:
- 변호사 A가 로그인되어 있다

**When**:
- 변호사 A가 `POST /api/consultations` API를 잘못된 본문으로 호출한다:
  ```json
  { "invalid_field": "invalid_value" }
  ```

**Then**:
- HTTP 응답 코드는 `400 Bad Request`이다
- 응답 본문에는 에러 메시지 `"Invalid request body"`와 유효성 검증 세부사항이 포함된다

---

## 5. Feature: 상태 전환 흐름

### Scenario 13: 신고가 올바른 상태 순서로 전환된다

**Given**:
- 신고 R이 `status=submitted` 상태로 존재한다
- 변호사 A가 신고 R을 선택하여 상담을 시작했다

**When**:
1. 변호사 A가 신고 R을 선택 (`POST /api/consultations`)
2. 변호사 A가 첫 메시지를 전송 (`POST /api/messages`)
3. 변호사 A가 상담 완료 처리 (`PATCH /api/reports/{id}` - status: `resolved`)
4. 교사 T가 만족도 평가 완료 (`PATCH /api/consultations/{id}`)

**Then**:
- 신고 R의 상태가 다음 순서로 전환된다:
  ```
  submitted → assigned → in_progress → resolved → closed
  ```
- 각 상태 전환 시 `updated_at` 필드가 갱신된다

---

## 6. 성능 인수 조건

### Scenario 14: API 응답 시간이 기준치를 만족한다

**Given**:
- 데이터베이스에 100개의 미배정 신고가 존재한다
- 변호사 A가 로그인되어 있다

**When**:
- 변호사 A가 `GET /api/lawyers/available-reports?limit=20` API를 호출한다

**Then**:
- API 응답 시간은 **500ms 이하**이다
- 응답 본문에는 20개의 신고가 포함된다

---

### Scenario 15: 상담 시작 API가 트랜잭션 내에서 1초 이내에 완료된다

**Given**:
- 변호사 A가 로그인되어 있다
- 신고 R이 `status=submitted` 상태로 존재한다

**When**:
- 변호사 A가 `POST /api/consultations` API를 호출한다

**Then**:
- API 응답 시간은 **1000ms 이하**이다
- 데이터베이스 트랜잭션이 원자적으로 완료된다

---

## 7. 보안 인수 조건

### Scenario 16: JWT 토큰 없이 API 호출 시 인증이 거부된다

**Given**:
- 사용자가 로그인되어 있지 않다

**When**:
- `GET /api/lawyers/available-reports` API를 Authorization 헤더 없이 호출한다

**Then**:
- HTTP 응답 코드는 `401 Unauthorized`이다

---

### Scenario 17: 만료된 JWT 토큰으로 API 호출 시 인증이 거부된다

**Given**:
- 변호사 A의 JWT 토큰이 만료되었다

**When**:
- 변호사 A가 만료된 토큰으로 `GET /api/lawyers/available-reports` API를 호출한다

**Then**:
- HTTP 응답 코드는 `401 Unauthorized`이다
- 응답 본문에는 에러 메시지 `"Token expired"`가 포함된다

---

### Scenario 18: 변호사가 다른 교사의 개인정보를 볼 수 없다 (익명 닉네임)

**Given**:
- 변호사 A가 로그인되어 있다
- 신고 R이 교사 T에 의해 작성되었다
- 교사 T의 실명은 `"김철수"`이고, 익명 닉네임은 `"익명123"`이다

**When**:
- 변호사 A가 `GET /api/lawyers/available-reports` API를 호출한다

**Then**:
- 응답 본문의 `teacher.name`은 **익명 닉네임** `"익명123"`으로 표시된다
- 교사의 실명 `"김철수"`는 노출되지 않는다

---

## 8. 데이터 무결성 인수 조건

### Scenario 19: 상담 생성 실패 시 신고 상태가 롤백된다

**Given**:
- 변호사 A가 로그인되어 있다
- 신고 R이 `status=submitted` 상태로 존재한다
- 데이터베이스에 일시적인 오류가 발생한다 (예: 연결 끊김)

**When**:
- 변호사 A가 `POST /api/consultations` API를 호출한다
- `consultations` 테이블 INSERT가 실패한다

**Then**:
- HTTP 응답 코드는 `500 Internal Server Error`이다
- 신고 R의 상태는 여전히 `submitted`이다 (롤백됨)
- 신고 R의 `assigned_lawyer_id`는 여전히 `NULL`이다 (롤백됨)

---

## 9. 테스트 커버리지 목표

- **전체 커버리지**: ≥ 85%
- **핵심 비즈니스 로직** (`matching-service.ts`): 100%
- **API 엔드포인트**: ≥ 90%

---

## 10. 검증 방법

### 자동 테스트
- Vitest 단위 테스트 실행: `npm test`
- 커버리지 확인: `npm run test:coverage`

### 수동 테스트
- Postman/Insomnia를 사용한 API 호출 테스트
- Supabase Studio에서 데이터베이스 상태 확인

### E2E 테스트
- Playwright를 사용한 전체 시나리오 테스트 (선택사항)

---

**문서 상태**: Draft (v0.0.1)
**작성일**: 2025-10-20
**작성자**: @Alfred
**승인**: TBD (구현 완료 후 검증)
