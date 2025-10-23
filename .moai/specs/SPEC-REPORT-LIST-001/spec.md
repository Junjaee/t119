---
id: REPORT-LIST-001
version: 0.0.1
status: draft
created: 2025-10-23
updated: 2025-10-23
author: @Alfred
priority: high
category: feature
labels:
  - report
  - list
  - detail
  - pagination
depends_on:
  - REPORT-FORM-001
  - AUTH-001
scope:
  packages:
    - src/app/reports
    - src/components/reports
  files:
    - report-list.tsx
    - report-detail.tsx
    - report-card.tsx
---

# @SPEC:REPORT-LIST-001: 신고 목록 및 상세 조회 페이지

## HISTORY

### v0.0.1 (2025-10-23)
- **INITIAL**: 신고 목록 및 상세 조회 페이지 SPEC 작성
- **AUTHOR**: @Alfred
- **REASON**: 사용자(교사/변호사/관리자)의 신고 조회 및 관리 기능 구현 필요

---

## 1. 개요

사용자가 자신의 신고 목록을 조회하고, 개별 신고의 상세 정보를 확인할 수 있는 페이지입니다. 페이지네이션, 필터링, 정렬, 실시간 업데이트 기능을 제공합니다.

### 핵심 목표
- 사용자별 신고 목록 조회 (교사는 자신의 신고, 변호사는 배정된 신고)
- 신고 상태별 필터링 및 검색 기능
- 신고 상세 정보 조회 (증거 파일, 담당자 정보 등)
- 실시간 상태 업데이트 (5분 주기 자동 갱신)

---

## 2. EARS 요구사항

### 2.1 Ubiquitous Requirements (필수 기능)

- **REQ-001**: 시스템은 사용자에게 자신의 신고 목록을 제공해야 한다
  - 교사: 자신이 작성한 신고만 조회
  - 변호사: 자신에게 배정된 신고만 조회
  - 관리자: 모든 신고 조회 (추가 필터 제공)

- **REQ-002**: 시스템은 신고 상세 정보를 제공해야 한다
  - 제목, 카테고리, 설명, 사건 날짜, 우선순위
  - 현재 상태 (submitted, assigned, in_progress, resolved, closed)
  - 증거 파일 목록 (다운로드 가능)
  - 담당 변호사 정보 (배정된 경우)
  - 생성/수정 일시

- **REQ-003**: 시스템은 신고별 현재 상태를 배지로 표시해야 한다
  - submitted: '대기 중' (회색)
  - assigned: '배정됨' (파란색)
  - in_progress: '진행 중' (주황색)
  - resolved: '해결됨' (녹색)
  - closed: '종료됨' (어두운 회색)

### 2.2 Event-driven Requirements (이벤트 기반)

- **REQ-004**: WHEN 사용자가 대시보드에서 '내 신고' 버튼을 클릭하면, 시스템은 신고 목록 페이지(/reports)로 이동해야 한다

- **REQ-005**: WHEN 페이지가 로드되면, 시스템은 GET /api/reports API를 호출하여 신고 목록을 조회해야 한다

- **REQ-006**: WHEN 사용자가 목록에서 신고를 클릭하면, 시스템은 신고 상세 페이지(/reports/[id])로 이동해야 한다

- **REQ-007**: WHEN 상세 페이지가 로드되면, 시스템은 GET /api/reports/[id] API를 호출하여 신고 상세 정보를 조회해야 한다

- **REQ-008**: WHEN 사용자가 페이지네이션 버튼을 클릭하면, 시스템은 해당 페이지의 신고 목록을 조회해야 한다

- **REQ-009**: WHEN 사용자가 필터(상태)를 선택하면, 시스템은 해당 조건에 맞는 신고만 표시해야 한다

- **REQ-010**: WHEN 사용자가 정렬 옵션을 변경하면, 시스템은 선택된 기준으로 신고를 정렬해야 한다

### 2.3 State-driven Requirements (상태 기반)

- **REQ-011**: WHILE 목록을 로드 중인 상태일 때, 시스템은 스켈레톤 로딩 UI를 표시해야 한다

- **REQ-012**: WHILE 신고가 없는 상태일 때, 시스템은 '신고 내역이 없습니다' 안내 메시지와 '신고하기' 버튼을 표시해야 한다

- **REQ-013**: WHILE 신고 상태가 'submitted'인 상태일 때, 시스템은 '대기 중' 배지(회색)를 표시해야 한다

- **REQ-014**: WHILE 신고 상태가 'assigned'인 상태일 때, 시스템은 '배정됨' 배지(파란색)를 표시해야 한다

- **REQ-015**: WHILE 신고 상태가 'in_progress'인 상태일 때, 시스템은 '진행 중' 배지(주황색)를 표시해야 한다

- **REQ-016**: WHILE 신고 상태가 'resolved'인 상태일 때, 시스템은 '해결됨' 배지(녹색)를 표시해야 한다

### 2.4 Optional Features (선택 기능)

- **OPT-001**: WHERE 사용자가 검색어를 입력하면, 시스템은 제목/설명 기반으로 필터링할 수 있다

- **OPT-002**: WHERE 사용자가 날짜 범위를 선택하면, 시스템은 해당 기간의 신고만 표시할 수 있다

- **OPT-003**: WHERE 사용자가 카테고리를 선택하면, 시스템은 해당 카테고리의 신고만 표시할 수 있다

- **OPT-004**: WHERE 사용자가 '새로고침' 버튼을 클릭하면, 시스템은 최신 신고 목록을 다시 조회할 수 있다

### 2.5 Constraints (제약사항)

- **CON-001**: 신고 목록은 페이지네이션으로 한 페이지에 최대 20개를 표시해야 한다

- **CON-002**: 신고 상세 페이지에서는 신고자 본인 또는 배정된 변호사만 접근할 수 있어야 한다 (RLS 적용)

- **CON-003**: 신고 상태는 실시간으로 업데이트되어야 한다 (5분 주기 자동 갱신)

- **CON-004**: 파일 다운로드는 인증된 사용자만 가능하며, Supabase Storage URL은 서명된(signed) URL이어야 한다

- **CON-005**: 목록 로드 실패 시, 사용자에게 명확한 에러 메시지와 재시도 옵션을 제공해야 한다

---

## 3. 기술 스택

- **프레임워크**: Next.js 14.2 App Router
- **언어**: TypeScript 5.6
- **데이터 페칭**: TanStack React Query (react-query) 5.x
- **스타일**: Tailwind CSS 3.4
- **UI 컴포넌트**: shadcn-ui (Card, Badge, Pagination)
- **아이콘**: lucide-react
- **날짜 포맷**: date-fns 또는 dayjs
- **백엔드**: Supabase (PostgreSQL + RLS)

---

## 4. 데이터 모델

### 4.1 Report (서버 응답)

```typescript
interface Report {
  id: string;                       // UUID
  teacher_id: string;               // UUID (신고자)
  lawyer_id?: string;               // UUID (배정된 변호사, 선택)
  category: 'parent' | 'student' | 'other';
  title: string;
  description: string;
  incident_date: string;            // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  evidence_files: string[];         // Supabase Storage URL 배열
  created_at: string;               // ISO 8601
  updated_at: string;               // ISO 8601

  // JOIN 데이터 (선택)
  teacher?: {
    id: string;
    name: string;
  };
  lawyer?: {
    id: string;
    name: string;
    specialization?: string;
  };
}
```

### 4.2 ReportListParams (클라이언트 쿼리)

```typescript
interface ReportListParams {
  page?: number;                    // 기본값: 1
  limit?: number;                   // 기본값: 20
  status?: Report['status'];        // 필터: 상태
  category?: Report['category'];    // 필터: 카테고리
  search?: string;                  // 필터: 제목/설명 검색
  sortBy?: 'created_at' | 'priority'; // 정렬 기준
  sortOrder?: 'asc' | 'desc';       // 정렬 순서 (기본: desc)
}
```

---

## 5. API 명세

### 5.1 신고 목록 조회 API

**Endpoint**: `GET /api/reports`

**Query Parameters**:
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 20)
- `status`: 상태 필터 (선택)
- `category`: 카테고리 필터 (선택)
- `search`: 검색어 (선택)
- `sortBy`: 정렬 기준 (기본값: created_at)
- `sortOrder`: 정렬 순서 (기본값: desc)

**Response (성공)**:
```json
{
  "data": [
    {
      "id": "uuid-123",
      "teacher_id": "uuid-456",
      "category": "parent",
      "title": "학부모 폭언 사건",
      "status": "submitted",
      "priority": "high",
      "incident_date": "2025-10-23",
      "created_at": "2025-10-23T12:34:56Z",
      "updated_at": "2025-10-23T12:34:56Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 5.2 신고 상세 조회 API

**Endpoint**: `GET /api/reports/[id]`

**Response (성공)**:
```json
{
  "id": "uuid-123",
  "teacher_id": "uuid-456",
  "lawyer_id": "uuid-789",
  "category": "parent",
  "title": "학부모 폭언 사건",
  "description": "수업 중 학부모로부터 폭언을 받았습니다. 상세 내용...",
  "incident_date": "2025-10-23",
  "priority": "high",
  "status": "assigned",
  "evidence_files": [
    "https://supabase.co/storage/.../file1.jpg",
    "https://supabase.co/storage/.../file2.pdf"
  ],
  "created_at": "2025-10-23T12:34:56Z",
  "updated_at": "2025-10-23T14:00:00Z",
  "teacher": {
    "id": "uuid-456",
    "name": "홍길동"
  },
  "lawyer": {
    "id": "uuid-789",
    "name": "김변호사",
    "specialization": "교육법"
  }
}
```

**Response (에러 - 권한 없음)**:
```json
{
  "error": "Forbidden",
  "message": "이 신고에 접근할 권한이 없습니다"
}
```

---

## 6. UI/UX 요구사항

### 6.1 신고 목록 페이지 레이아웃 (/reports)

```
┌─────────────────────────────────────────┐
│ [내 신고 목록]          [+ 신고하기]    │
├─────────────────────────────────────────┤
│ 필터: [전체▼] [상태: 전체▼] [🔍 검색]  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [대기중] 학부모 폭언 사건           │ │
│ │ 2025-10-23 | 우선순위: High         │ │
│ │ 학부모 | 진행 상태 표시줄 [====  ] │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ [배정됨] 학생 폭행 사건             │ │
│ │ 2025-10-22 | 우선순위: Critical     │ │
│ │ 학생 | 담당: 김변호사              │ │
│ └─────────────────────────────────────┘ │
│ ...                                     │
├─────────────────────────────────────────┤
│ [이전] 1 2 3 ... 10 [다음]              │
└─────────────────────────────────────────┘
```

### 6.2 신고 상세 페이지 레이아웃 (/reports/[id])

```
┌─────────────────────────────────────────┐
│ [← 목록으로]                            │
├─────────────────────────────────────────┤
│ [대기중] 학부모 폭언 사건               │
│ 우선순위: High | 카테고리: 학부모       │
├─────────────────────────────────────────┤
│ 사건 발생일: 2025-10-23                 │
│ 신고 접수일: 2025-10-23 12:34           │
│ 최종 수정일: 2025-10-23 14:00           │
├─────────────────────────────────────────┤
│ 상세 설명:                              │
│ 수업 중 학부모로부터 폭언을 받았습니다. │
│ ...                                     │
├─────────────────────────────────────────┤
│ 증거 파일 (2개):                        │
│ 📄 file1.jpg (2.3MB) [다운로드]         │
│ 📄 file2.pdf (1.5MB) [다운로드]         │
├─────────────────────────────────────────┤
│ 담당 변호사: 김변호사 (교육법 전문)     │
│ 연락처: lawyer@example.com              │
├─────────────────────────────────────────┤
│ [신고 수정] [신고 취소]                 │
└─────────────────────────────────────────┘
```

### 6.3 상태 배지 색상

| 상태          | 배지 텍스트 | 색상 (Tailwind)       |
|---------------|-------------|-----------------------|
| submitted     | 대기 중     | gray (bg-gray-200)    |
| assigned      | 배정됨      | blue (bg-blue-200)    |
| in_progress   | 진행 중     | orange (bg-orange-200)|
| resolved      | 해결됨      | green (bg-green-200)  |
| closed        | 종료됨      | slate (bg-slate-400)  |

### 6.4 반응형 디자인
- 모바일: 카드 세로 스택, 필터 드롭다운
- 태블릿: 2열 그리드
- 데스크톱: 3열 그리드 또는 리스트 뷰

---

## 7. 파일 구조

```
src/app/reports/
├── page.tsx                        # /reports 페이지 (목록)
├── [id]/
│   └── page.tsx                    # /reports/[id] 페이지 (상세)
└── layout.tsx                      # (선택) 레이아웃

src/components/reports/
├── ReportList.tsx                  # 신고 목록 컴포넌트
├── ReportCard.tsx                  # 신고 카드 컴포넌트
├── ReportDetailView.tsx            # 신고 상세 뷰 컴포넌트
├── ReportStatusBadge.tsx           # 상태 배지 컴포넌트
├── ReportFilters.tsx               # 필터 컴포넌트
└── ReportPagination.tsx            # 페이지네이션 컴포넌트

src/app/api/reports/
├── route.ts                        # GET /api/reports (목록)
└── [id]/
    └── route.ts                    # GET /api/reports/[id] (상세)

src/lib/hooks/
├── useReports.ts                   # 신고 목록 훅
└── useReportDetail.ts              # 신고 상세 훅
```

---

## 8. 테스트 시나리오

### 8.1 신고 목록 조회
```
Given 교사가 대시보드에서 '내 신고' 버튼을 클릭했을 때
When  신고 목록 페이지(/reports)가 로드될 때
Then  시스템은 GET /api/reports API를 호출하여
      교사의 신고 목록을 페이지네이션으로 표시하고
      각 신고의 제목, 상태, 생성일을 표시해야 한다
```

### 8.2 신고 상세 조회
```
Given 교사가 신고 목록 페이지에서 신고를 클릭했을 때
When  신고 상세 페이지(/reports/[id])가 로드될 때
Then  시스템은 GET /api/reports/[id] API를 호출하여
      신고의 전체 정보(제목, 설명, 사건 날짜, 증거 파일 등)를 표시하고
      현재 상태와 담당 변호사 정보를 표시해야 한다
```

### 8.3 상태별 필터링
```
Given 교사가 신고 목록 페이지에 있을 때
When  교사가 상태 필터에서 '대기 중'을 선택할 때
Then  시스템은 상태가 'submitted'인 신고만 표시해야 한다
```

### 8.4 페이지네이션
```
Given 교사가 총 42개의 신고를 가지고 있을 때
When  신고 목록 페이지가 로드될 때
Then  시스템은 첫 20개의 신고를 표시하고
      페이지네이션 컨트롤 (1 2 3)을 표시해야 한다
When  교사가 '2' 페이지 버튼을 클릭할 때
Then  시스템은 21~40번째 신고를 표시해야 한다
```

### 8.5 실시간 업데이트
```
Given 교사가 신고 목록 페이지를 열고 5분이 지났을 때
When  자동 갱신 타이머가 트리거될 때
Then  시스템은 GET /api/reports API를 다시 호출하여
      최신 신고 목록을 조회하고
      상태가 변경된 신고를 업데이트해야 한다
```

### 8.6 빈 목록 처리
```
Given 교사가 신고한 내역이 없을 때
When  신고 목록 페이지가 로드될 때
Then  시스템은 '신고 내역이 없습니다' 메시지를 표시하고
      '신고하기' 버튼을 표시해야 한다
```

### 8.7 권한 확인
```
Given 교사 A가 교사 B의 신고 상세 페이지 URL에 직접 접근하려고 할 때
When  /reports/[B의 신고 ID]를 열 때
Then  시스템은 403 Forbidden 에러를 반환하고
      '이 신고에 접근할 권한이 없습니다' 메시지를 표시해야 한다
```

---

## 9. 보안 요구사항

- **인증**: 로그인한 사용자만 접근 가능
- **권한 검증**: RLS 정책으로 자신의 신고만 조회 가능
- **데이터 노출 방지**: API 응답에 민감 정보 제외 (비밀번호, 토큰 등)
- **Signed URL**: 파일 다운로드는 Supabase Storage의 signed URL 사용 (1시간 만료)

### Supabase RLS 정책 예시
```sql
-- 교사는 자신의 신고만 조회
CREATE POLICY "teachers_view_own_reports"
  ON reports FOR SELECT
  USING (auth.uid() = teacher_id);

-- 변호사는 배정된 신고만 조회
CREATE POLICY "lawyers_view_assigned_reports"
  ON reports FOR SELECT
  USING (auth.uid() = lawyer_id);
```

---

## 10. 성능 요구사항

- **페이지 로드**: 2초 이내
- **API 응답**: 500ms 이내 (목록), 300ms 이내 (상세)
- **자동 갱신**: 5분 주기 (React Query refetchInterval)
- **캐싱**: React Query staleTime 5분, cacheTime 10분

---

## 11. 에러 처리

### 11.1 API 에러
- **401 Unauthorized**: 로그인 페이지로 리다이렉트
- **403 Forbidden**: '접근 권한이 없습니다' 메시지 + 목록으로 돌아가기
- **404 Not Found**: '신고를 찾을 수 없습니다' 메시지 + 목록으로 돌아가기
- **500 Internal Server Error**: '서버 오류가 발생했습니다' 메시지 + 재시도 버튼

### 11.2 네트워크 에러
- **네트워크 연결 끊김**: '네트워크 연결을 확인해주세요' 메시지 + 재시도 버튼
- **타임아웃**: '요청 시간이 초과되었습니다' 메시지 + 재시도 버튼

---

## 12. 추적성 TAG

```
@SPEC:REPORT-LIST-001 → @TEST:REPORT-LIST-001 → @CODE:REPORT-LIST-001 → @DOC:REPORT-LIST-001
```

---

## 13. 다음 단계

1. **즉시 실행**: `/alfred:2-build REPORT-LIST-001` - TDD 구현 시작
2. **의존 SPEC**:
   - `SPEC-AUTH-001` (인증 시스템 완료 필요)
   - `SPEC-REPORT-FORM-001` (신고 작성 완료 권장)
3. **후속 SPEC**:
   - `SPEC-REPORT-EDIT-001` (신고 수정/취소)
   - `SPEC-LAWYER-MATCH-001` (변호사 배정 시스템)

---

**문서 버전**: v0.0.1
**작성자**: @Alfred
**최종 업데이트**: 2025-10-23
