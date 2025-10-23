---
id: REPORT-FORM-001
version: 0.0.1
status: draft
created: 2025-10-23
updated: 2025-10-23
author: @Alfred
priority: high
category: feature
labels:
  - report
  - form
  - teacher
  - file-upload
scope:
  packages:
    - src/app/reports
    - src/components/reports
  files:
    - report-form.tsx
    - file-upload.tsx
    - report-validation.ts
---

# @SPEC:REPORT-FORM-001: 신고 작성 및 제출 페이지

## HISTORY

### v0.0.1 (2025-10-23)
- **INITIAL**: 신고 작성 및 제출 페이지 SPEC 작성
- **AUTHOR**: @Alfred
- **REASON**: 교사의 신고 접수 UI 및 파일 업로드 기능 구현 필요

---

## 1. 개요

교사가 교권 침해 사건을 신고할 수 있는 웹 폼 페이지입니다. 필수 정보 입력, 증거 파일 업로드(최대 5개, 파일당 10MB), 실시간 검증, 제출 기능을 제공합니다.

### 핵심 목표
- 교사가 쉽고 빠르게 신고를 작성할 수 있도록 직관적인 UI 제공
- 파일 업로드 지원으로 증거 자료 첨부 가능
- 실시간 검증으로 제출 전 오류 방지
- 제출 실패 시 데이터 유지로 재작성 부담 최소화

---

## 2. EARS 요구사항

### 2.1 Ubiquitous Requirements (필수 기능)

- **REQ-001**: 시스템은 교사에게 신고 작성 폼을 제공해야 한다
  - 카테고리 선택 (학부모, 학생, 기타)
  - 제목 입력 (최대 100자)
  - 상세 설명 입력 (최대 2000자)
  - 사건 날짜 선택 (과거 날짜만 허용)
  - 우선순위 선택 (low, medium, high, critical)

- **REQ-002**: 시스템은 입력된 신고 데이터를 검증해야 한다
  - 필수 필드: 카테고리, 제목, 설명, 사건 날짜, 우선순위
  - 제목 길이: 5~100자
  - 설명 길이: 20~2000자
  - 사건 날짜: 과거 날짜만 허용 (미래 날짜 차단)

- **REQ-003**: 시스템은 신고와 함께 증거 파일(최대 5개, 파일당 10MB)을 업로드할 수 있어야 한다
  - 지원 파일 형식: 이미지(jpg, png, gif), 문서(pdf, docx), 동영상(mp4, mov)
  - 드래그&드롭 및 파일 선택 UI 제공
  - 파일 삭제 기능 제공

### 2.2 Event-driven Requirements (이벤트 기반)

- **REQ-004**: WHEN 교사가 대시보드에서 '신고하기' 버튼을 클릭하면, 시스템은 신고 작성 페이지(/reports/new)로 이동해야 한다

- **REQ-005**: WHEN 교사가 신고 폼을 작성하고 '제출' 버튼을 클릭하면, 시스템은 POST /api/reports API를 호출하여 신고를 생성해야 한다

- **REQ-006**: WHEN 신고 생성이 성공하면, 시스템은 신고 목록 페이지(/reports)로 리다이렉트하고 '신고가 접수되었습니다' 토스트 메시지를 표시해야 한다

- **REQ-007**: WHEN 신고 생성이 실패하면, 시스템은 에러 메시지를 표시하고 폼 데이터를 유지해야 한다

- **REQ-008**: WHEN 교사가 파일을 선택하거나 드래그&드롭하면, 시스템은 파일을 폼에 추가하고 미리보기를 표시해야 한다

- **REQ-009**: WHEN 교사가 업로드된 파일의 삭제 버튼을 클릭하면, 시스템은 해당 파일을 목록에서 제거해야 한다

### 2.3 State-driven Requirements (상태 기반)

- **REQ-010**: WHILE 폼이 작성 중인 상태일 때, 시스템은 각 필드의 입력값을 리얼타임으로 검증해야 한다
  - 제목 길이 초과 시 경고 표시
  - 설명 최소 길이 미달 시 안내 표시
  - 사건 날짜 미래 날짜 선택 시 차단

- **REQ-011**: WHILE 파일이 업로드 중인 상태일 때, 시스템은 프로그레스 바 또는 로딩 스피너를 표시해야 한다

- **REQ-012**: WHILE 제출 중인 상태일 때, 시스템은 '제출 중...' 상태를 표시하고 제출 버튼을 비활성화해야 한다

- **REQ-013**: WHILE 필수 필드가 비어있는 상태일 때, 시스템은 제출 버튼을 비활성화해야 한다

### 2.4 Optional Features (선택 기능)

- **OPT-001**: WHERE 사용자가 작성 중단을 원하면, 시스템은 로컬스토리지에 임시 저장할 수 있다
  - 페이지 이탈 시 자동 저장
  - 다음 방문 시 복구 옵션 제시

- **OPT-002**: WHERE 이전 임시 저장 데이터가 있으면, 시스템은 '이전 작성 내용을 복구하시겠습니까?' 팝업을 표시할 수 있다

### 2.5 Constraints (제약사항)

- **CON-001**: IF 필수 필드가 비어있으면, 시스템은 제출 버튼을 비활성화해야 한다

- **CON-002**: IF 파일 크기가 10MB를 초과하면, 시스템은 '파일이 너무 큽니다 (최대 10MB)' 에러를 표시하고 업로드를 차단해야 한다

- **CON-003**: IF 파일 개수가 5개를 초과하면, 시스템은 '최대 5개까지 업로드 가능합니다' 에러를 표시하고 추가 업로드를 차단해야 한다

- **CON-004**: IF 지원하지 않는 파일 형식이면, 시스템은 '지원하지 않는 파일 형식입니다' 에러를 표시하고 업로드를 차단해야 한다

- **CON-005**: 제출 버튼은 모든 필수 필드가 채워지고 검증이 완료되어야만 활성화되어야 한다

---

## 3. 기술 스택

- **프레임워크**: Next.js 14.2 App Router
- **언어**: TypeScript 5.6
- **폼 관리**: react-hook-form 7.x
- **검증**: Zod 3.x
- **파일 업로드**: react-dropzone 14.x
- **데이터 페칭**: TanStack React Query (react-query) 5.x
- **스타일**: Tailwind CSS 3.4
- **UI 컴포넌트**: shadcn-ui (optional)
- **아이콘**: lucide-react
- **백엔드**: Supabase (PostgreSQL + Storage)

---

## 4. 데이터 모델

### 4.1 ReportFormData (클라이언트)

```typescript
interface ReportFormData {
  category: 'parent' | 'student' | 'other';
  title: string;                // 5~100자
  description: string;          // 20~2000자
  incidentDate: string;         // YYYY-MM-DD (과거 날짜만)
  priority: 'low' | 'medium' | 'high' | 'critical';
  files?: File[];               // 최대 5개, 파일당 10MB
}
```

### 4.2 API Request (POST /api/reports)

```typescript
interface CreateReportRequest {
  category: string;
  title: string;
  description: string;
  incident_date: string;        // YYYY-MM-DD
  priority: string;
  evidence_files?: string[];    // Supabase Storage URL 배열
}
```

---

## 5. API 명세

### 5.1 신고 생성 API

**Endpoint**: `POST /api/reports`

**Request Body**:
```json
{
  "category": "parent",
  "title": "학부모 폭언 사건",
  "description": "수업 중 학부모로부터 폭언을 받았습니다. 상세 내용...",
  "incident_date": "2025-10-23",
  "priority": "high",
  "evidence_files": [
    "https://supabase.co/storage/.../file1.jpg",
    "https://supabase.co/storage/.../file2.pdf"
  ]
}
```

**Response (성공)**:
```json
{
  "id": "uuid-123",
  "teacher_id": "uuid-456",
  "category": "parent",
  "title": "학부모 폭언 사건",
  "status": "submitted",
  "created_at": "2025-10-23T12:34:56Z"
}
```

**Response (실패)**:
```json
{
  "error": "Validation failed",
  "details": {
    "title": "제목은 5자 이상이어야 합니다"
  }
}
```

---

## 6. UI/UX 요구사항

### 6.1 페이지 레이아웃

```
┌─────────────────────────────────────────┐
│ [← 뒤로가기]  신고 작성                  │
├─────────────────────────────────────────┤
│ 카테고리 선택 *                          │
│ [ ] 학부모  [ ] 학생  [ ] 기타           │
│                                          │
│ 제목 *                                   │
│ [________________] (5~100자)             │
│                                          │
│ 상세 설명 *                              │
│ [                                      ] │
│ [         텍스트 영역 (20~2000자)      ] │
│                                          │
│ 사건 발생일 *                            │
│ [2025-10-23 ▼]                          │
│                                          │
│ 우선순위 *                               │
│ [ ] Low [ ] Medium [✓] High [ ] Critical│
│                                          │
│ 증거 파일 (최대 5개, 파일당 10MB)        │
│ ┌─────────────────────────┐             │
│ │  파일을 드래그하거나    │             │
│ │  [파일 선택] 클릭       │             │
│ └─────────────────────────┘             │
│ • file1.jpg (2.3MB) [✕]                 │
│ • file2.pdf (1.5MB) [✕]                 │
│                                          │
│ [취소]              [제출하기 ✓]         │
└─────────────────────────────────────────┘
```

### 6.2 반응형 디자인
- 모바일: 세로 스크롤, 버튼 전체 너비
- 태블릿/데스크톱: 중앙 정렬, 최대 너비 800px

### 6.3 접근성
- 모든 입력 필드에 label 연결
- 에러 메시지는 aria-describedby로 연결
- 키보드 네비게이션 지원
- 스크린 리더 지원 (ARIA 속성)

---

## 7. 파일 구조

```
src/app/reports/new/
├── page.tsx                    # /reports/new 페이지
└── layout.tsx                  # (선택) 레이아웃

src/components/reports/
├── ReportForm.tsx              # 신고 폼 메인 컴포넌트
├── FileUpload.tsx              # 파일 업로드 컴포넌트
└── CategorySelector.tsx        # 카테고리 선택 컴포넌트

src/lib/validators/
└── report.validator.ts         # Zod 검증 스키마

src/app/api/reports/
└── route.ts                    # POST /api/reports API
```

---

## 8. 테스트 시나리오

### 8.1 정상 신고 작성
```
Given 교사가 /reports/new 페이지에 있고
      신고 폼이 로드되었을 때
When  교사가 다음을 입력하고 '제출' 버튼을 클릭할 때
      - 카테고리: "학부모"
      - 제목: "학부모 폭언 사건"
      - 설명: "수업 중 학부모로부터 폭언을 받았습니다" (20자 이상)
      - 사건 날짜: "2025-10-23"
      - 우선순위: "high"
Then  시스템은 POST /api/reports API를 호출하여 신고를 생성하고
      신고 목록 페이지(/reports)로 리다이렉트하며
      '신고가 접수되었습니다' 토스트 메시지를 표시해야 한다
```

### 8.2 필수 필드 미입력
```
Given 교사가 /reports/new 페이지에 있을 때
When  교사가 제목만 입력하고 '제출' 버튼을 클릭하려고 시도할 때
Then  시스템은 '제출' 버튼을 비활성화하거나
      '필수 필드를 모두 입력해주세요' 에러 메시지를 표시해야 한다
```

### 8.3 파일 업로드
```
Given 교사가 신고 폼 작성 중일 때
When  교사가 파일을 드래그&드롭으로 업로드하거나
      파일 선택 버튼으로 파일을 선택할 때
Then  시스템은 파일을 폼에 추가하고
      파일 목록을 표시하며
      파일 삭제 버튼을 제공해야 한다
```

### 8.4 파일 크기 초과
```
Given 교사가 신고 폼 작성 중일 때
When  교사가 10MB를 초과하는 파일을 업로드하려고 시도할 때
Then  시스템은 '파일이 너무 큽니다 (최대 10MB)' 에러를 표시하고
      업로드를 차단해야 한다
```

### 8.5 파일 개수 초과
```
Given 교사가 이미 5개의 파일을 업로드한 상태일 때
When  교사가 6번째 파일을 업로드하려고 시도할 때
Then  시스템은 '최대 5개까지 업로드 가능합니다' 에러를 표시하고
      추가 업로드를 차단해야 한다
```

---

## 9. 보안 요구사항

- **인증**: 교사 역할만 접근 가능 (미들웨어 또는 서버 컴포넌트에서 검증)
- **CSRF 보호**: Next.js 기본 CSRF 토큰 활용
- **XSS 방지**: 사용자 입력 sanitization (DOMPurify 또는 서버 사이드 검증)
- **파일 업로드 보안**:
  - MIME 타입 검증 (클라이언트 + 서버)
  - 파일 크기 제한 (클라이언트 + 서버)
  - 파일명 sanitization (특수문자 제거)
  - Supabase Storage RLS 정책 적용

---

## 10. 성능 요구사항

- **페이지 로드**: 2초 이내
- **폼 제출**: 3초 이내 (파일 없는 경우)
- **파일 업로드**: 파일당 5초 이내
- **실시간 검증**: 디바운스 300ms

---

## 11. 에러 처리

### 11.1 클라이언트 에러
- 필수 필드 미입력: 빨간색 테두리 + 에러 메시지
- 파일 크기 초과: 토스트 에러 메시지
- 파일 형식 불일치: 토스트 에러 메시지

### 11.2 서버 에러
- 네트워크 오류: '네트워크 연결을 확인해주세요' 토스트
- 401 Unauthorized: 로그인 페이지로 리다이렉트
- 500 Internal Server Error: '서버 오류가 발생했습니다' 토스트

---

## 12. 추적성 TAG

```
@SPEC:REPORT-FORM-001 → @TEST:REPORT-FORM-001 → @CODE:REPORT-FORM-001 → @DOC:REPORT-FORM-001
```

---

## 13. 다음 단계

1. **즉시 실행**: `/alfred:2-build REPORT-FORM-001` - TDD 구현 시작
2. **의존 SPEC**: `SPEC-AUTH-001` (인증 시스템 완료 필요)
3. **후속 SPEC**: `SPEC-REPORT-LIST-001` (신고 목록 및 상세 조회)

---

**문서 버전**: v0.0.1
**작성자**: @Alfred
**최종 업데이트**: 2025-10-23
