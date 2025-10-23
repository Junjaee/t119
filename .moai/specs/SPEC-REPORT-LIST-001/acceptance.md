# SPEC-REPORT-LIST-001 인수 테스트

> **신고 목록 및 상세 조회 페이지 인수 기준 (Given-When-Then)**

---

## 1. 신고 목록 조회

### 시나리오 1-1: 기본 신고 목록 조회
```gherkin
Feature: 신고 목록 조회
  사용자는 자신의 신고 목록을 조회할 수 있다

Scenario: 교사가 신고 목록 조회
  Given 교사가 로그인한 상태이고
    And 교사가 3개의 신고를 작성한 상태일 때
  When  교사가 대시보드에서 '내 신고' 버튼을 클릭할 때
  Then  시스템은 신고 목록 페이지(/reports)로 이동하고
    And GET /api/reports API를 호출하며
    And 3개의 신고를 카드 형태로 표시해야 한다
    And 각 신고 카드는 다음을 포함해야 한다
    | 필드         | 표시 여부 |
    | 제목         | ✅         |
    | 상태 배지    | ✅         |
    | 생성 날짜    | ✅         |
    | 우선순위     | ✅         |
    | 카테고리     | ✅         |
```

### 시나리오 1-2: 빈 목록 처리
```gherkin
Scenario: 신고 내역이 없는 경우
  Given 교사가 로그인한 상태이고
    And 교사가 작성한 신고가 없을 때
  When  교사가 /reports 페이지에 접근할 때
  Then  시스템은 다음을 표시해야 한다
    | UI 요소         | 내용                      |
    | 메시지          | "신고 내역이 없습니다"    |
    | 안내 문구       | "새로운 신고를 작성하세요"|
    | 버튼            | "신고하기" (/reports/new) |
```

### 시나리오 1-3: 로딩 상태
```gherkin
Scenario: 신고 목록 로딩 중
  Given 교사가 /reports 페이지에 접근할 때
  When  API 응답을 기다리는 중일 때
  Then  시스템은 스켈레톤 로딩 UI를 표시해야 한다
    And 최소 3개의 카드 형태 스켈레톤을 표시해야 한다
```

---

## 2. 페이지네이션

### 시나리오 2-1: 페이지네이션 표시
```gherkin
Scenario: 신고가 20개를 초과하는 경우
  Given 교사가 42개의 신고를 작성한 상태일 때
  When  교사가 /reports 페이지에 접근할 때
  Then  시스템은 첫 20개의 신고를 표시하고
    And 페이지네이션 컨트롤을 표시해야 한다
    | 버튼         | 상태        |
    | [이전]       | 비활성화    |
    | [1]          | 활성화 (현재)|
    | [2]          | 활성화      |
    | [3]          | 활성화      |
    | [다음]       | 활성화      |
```

### 시나리오 2-2: 페이지 이동
```gherkin
Scenario: 2페이지로 이동
  Given 교사가 42개의 신고를 가지고 있고
    And 1페이지에 있을 때
  When  교사가 '2' 페이지 버튼을 클릭할 때
  Then  시스템은 GET /api/reports?page=2&limit=20 API를 호출하고
    And 21~40번째 신고를 표시해야 한다
    And URL이 /reports?page=2로 변경되어야 한다
```

### 시나리오 2-3: 마지막 페이지
```gherkin
Scenario: 마지막 페이지(3페이지) 이동
  Given 교사가 42개의 신고를 가지고 있고
    And 2페이지에 있을 때
  When  교사가 '다음' 버튼을 클릭할 때
  Then  시스템은 3페이지(마지막 2개 신고)를 표시하고
    And [다음] 버튼을 비활성화해야 한다
```

---

## 3. 필터링

### 시나리오 3-1: 상태별 필터링
```gherkin
Scenario: '대기 중' 상태 필터 적용
  Given 교사가 /reports 페이지에 있고
    And 다음과 같은 신고가 있을 때
    | 제목         | 상태         |
    | 신고 A       | submitted    |
    | 신고 B       | assigned     |
    | 신고 C       | submitted    |
  When  교사가 상태 필터에서 '대기 중'을 선택할 때
  Then  시스템은 GET /api/reports?status=submitted API를 호출하고
    And '신고 A'와 '신고 C'만 표시해야 한다
    And URL이 /reports?status=submitted로 변경되어야 한다
```

### 시나리오 3-2: 카테고리별 필터링
```gherkin
Scenario: '학부모' 카테고리 필터 적용
  Given 교사가 /reports 페이지에 있을 때
  When  교사가 카테고리 필터에서 '학부모'를 선택할 때
  Then  시스템은 GET /api/reports?category=parent API를 호출하고
    And 카테고리가 'parent'인 신고만 표시해야 한다
```

### 시나리오 3-3: 검색
```gherkin
Scenario: 제목으로 검색
  Given 교사가 /reports 페이지에 있을 때
  When  교사가 검색창에 "폭언"을 입력하고 엔터를 누를 때
  Then  시스템은 GET /api/reports?search=폭언 API를 호출하고
    And 제목 또는 설명에 "폭언"이 포함된 신고만 표시해야 한다
```

### 시나리오 3-4: 복합 필터
```gherkin
Scenario: 상태 + 카테고리 필터 조합
  Given 교사가 /reports 페이지에 있을 때
  When  교사가 다음을 선택할 때
    | 필터         | 값         |
    | 상태         | submitted  |
    | 카테고리     | parent     |
  Then  시스템은 다음 API를 호출해야 한다
    | URL | /api/reports?status=submitted&category=parent |
    And 조건에 맞는 신고만 표시해야 한다
```

---

## 4. 정렬

### 시나리오 4-1: 생성일 기준 정렬
```gherkin
Scenario: 생성일 내림차순 정렬 (기본값)
  Given 교사가 /reports 페이지에 접근할 때
  When  페이지가 로드될 때
  Then  시스템은 GET /api/reports?sortBy=created_at&sortOrder=desc API를 호출하고
    And 신고를 최신순으로 표시해야 한다
```

### 시나리오 4-2: 우선순위 기준 정렬
```gherkin
Scenario: 우선순위 내림차순 정렬
  Given 교사가 /reports 페이지에 있을 때
  When  교사가 정렬 옵션에서 '우선순위'를 선택할 때
  Then  시스템은 GET /api/reports?sortBy=priority&sortOrder=desc API를 호출하고
    And 신고를 우선순위 순으로 표시해야 한다
    | 순서 | 우선순위 |
    | 1    | critical |
    | 2    | high     |
    | 3    | medium   |
    | 4    | low      |
```

---

## 5. 신고 상세 조회

### 시나리오 5-1: 신고 상세 페이지 접근
```gherkin
Scenario: 신고 카드 클릭 시 상세 페이지로 이동
  Given 교사가 /reports 페이지에 있고
    And 신고 목록이 표시되어 있을 때
  When  교사가 첫 번째 신고 카드를 클릭할 때
  Then  시스템은 /reports/[신고 ID] 페이지로 이동하고
    And GET /api/reports/[신고 ID] API를 호출해야 한다
```

### 시나리오 5-2: 신고 상세 정보 표시
```gherkin
Scenario: 신고 상세 정보 조회
  Given 교사가 /reports/uuid-123 페이지에 접근할 때
  When  페이지가 로드될 때
  Then  시스템은 다음 정보를 표시해야 한다
    | 필드          | 표시 여부 |
    | 제목          | ✅         |
    | 상태 배지     | ✅         |
    | 카테고리      | ✅         |
    | 우선순위      | ✅         |
    | 사건 발생일   | ✅         |
    | 신고 접수일   | ✅         |
    | 상세 설명     | ✅         |
    | 증거 파일 목록| ✅         |
    | 담당 변호사   | ✅ (배정된 경우) |
```

### 시나리오 5-3: 증거 파일 다운로드
```gherkin
Scenario: 증거 파일 다운로드
  Given 교사가 신고 상세 페이지에 있고
    And 신고에 2개의 증거 파일이 첨부되어 있을 때
  When  교사가 첫 번째 파일의 '다운로드' 버튼을 클릭할 때
  Then  시스템은 Supabase Storage의 signed URL을 생성하고
    And 파일 다운로드를 시작해야 한다
```

### 시나리오 5-4: 담당 변호사 정보 표시
```gherkin
Scenario: 배정된 변호사 정보 표시
  Given 교사가 신고 상세 페이지에 있고
    And 신고에 변호사가 배정된 상태일 때
  When  페이지가 로드될 때
  Then  시스템은 다음 변호사 정보를 표시해야 한다
    | 필드          | 예시                      |
    | 이름          | "김변호사"                |
    | 전문 분야     | "교육법"                  |
    | 연락처        | "lawyer@example.com"      |
```

---

## 6. 상태 배지

### 시나리오 6-1: 상태별 배지 색상
```gherkin
Scenario: 상태별 배지 색상 표시
  Given 교사가 /reports 페이지에 있고
    And 다음과 같은 신고가 있을 때
    | 제목         | 상태         |
    | 신고 A       | submitted    |
    | 신고 B       | assigned     |
    | 신고 C       | in_progress  |
    | 신고 D       | resolved     |
    | 신고 E       | closed       |
  When  페이지가 로드될 때
  Then  시스템은 각 신고에 다음 배지를 표시해야 한다
    | 신고   | 배지 텍스트 | 색상          |
    | 신고 A | "대기 중"   | 회색 (gray)   |
    | 신고 B | "배정됨"    | 파란색 (blue) |
    | 신고 C | "진행 중"   | 주황색 (orange)|
    | 신고 D | "해결됨"    | 녹색 (green)  |
    | 신고 E | "종료됨"    | 어두운 회색 (slate)|
```

---

## 7. 실시간 업데이트

### 시나리오 7-1: 자동 갱신
```gherkin
Scenario: 5분 주기 자동 갱신
  Given 교사가 /reports 페이지를 열고 있을 때
  When  5분이 경과할 때
  Then  시스템은 GET /api/reports API를 자동으로 다시 호출하고
    And 변경된 신고 상태를 업데이트해야 한다
```

### 시나리오 7-2: 수동 새로고침
```gherkin
Scenario: 새로고침 버튼 클릭
  Given 교사가 /reports 페이지에 있을 때
  When  교사가 '새로고침' 버튼을 클릭할 때
  Then  시스템은 GET /api/reports API를 즉시 호출하고
    And 최신 신고 목록을 표시해야 한다
```

---

## 8. 권한 검증

### 시나리오 8-1: 자신의 신고만 조회
```gherkin
Scenario: 교사는 자신의 신고만 조회 가능
  Given 교사 A가 로그인한 상태이고
    And 교사 B가 작성한 신고가 존재할 때
  When  교사 A가 /reports 페이지에 접근할 때
  Then  시스템은 교사 A가 작성한 신고만 표시하고
    And 교사 B의 신고는 표시하지 않아야 한다
```

### 시나리오 8-2: 타인의 신고 상세 접근 차단
```gherkin
Scenario: 타인의 신고 상세 페이지 직접 접근 차단
  Given 교사 A가 로그인한 상태이고
    And 교사 B가 작성한 신고 ID가 "uuid-B-001"일 때
  When  교사 A가 /reports/uuid-B-001 URL에 직접 접근할 때
  Then  시스템은 403 Forbidden 에러를 반환하고
    And '이 신고에 접근할 권한이 없습니다' 메시지를 표시하며
    And /reports 페이지로 리다이렉트해야 한다
```

### 시나리오 8-3: 변호사는 배정된 신고만 조회
```gherkin
Scenario: 변호사는 자신에게 배정된 신고만 조회 가능
  Given 변호사가 로그인한 상태이고
    And 변호사에게 3개의 신고가 배정되어 있을 때
  When  변호사가 /reports 페이지에 접근할 때
  Then  시스템은 배정된 3개의 신고만 표시해야 한다
```

---

## 9. 에러 처리

### 시나리오 9-1: 네트워크 오류
```gherkin
Scenario: 네트워크 연결 실패
  Given 교사가 /reports 페이지에 접근할 때
  When  네트워크 연결이 끊어진 상태일 때
  Then  시스템은 다음을 표시해야 한다
    | UI 요소         | 내용                           |
    | 에러 메시지     | "네트워크 연결을 확인해주세요" |
    | 재시도 버튼     | "다시 시도"                    |
```

### 시나리오 9-2: 서버 오류 (500)
```gherkin
Scenario: 서버 내부 오류
  Given 교사가 /reports 페이지에 접근할 때
  When  서버에서 500 에러를 반환할 때
  Then  시스템은 다음을 표시해야 한다
    | UI 요소         | 내용                                       |
    | 에러 메시지     | "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요" |
    | 재시도 버튼     | "다시 시도"                                |
```

### 시나리오 9-3: 인증 세션 만료
```gherkin
Scenario: 세션 만료
  Given 교사가 /reports 페이지를 열고 있을 때
  When  세션이 만료된 상태일 때
  Then  시스템은 로그인 페이지(/auth/login)로 리다이렉트하고
    And returnUrl=/reports를 쿼리 파라미터로 전달해야 한다
```

### 시나리오 9-4: 신고 없음 (404)
```gherkin
Scenario: 존재하지 않는 신고 ID 접근
  Given 교사가 /reports/non-existent-id URL에 접근할 때
  When  해당 신고가 존재하지 않을 때
  Then  시스템은 404 에러를 반환하고
    And '신고를 찾을 수 없습니다' 메시지를 표시하며
    And /reports 페이지로 리다이렉트해야 한다
```

---

## 10. 반응형 디자인

### 시나리오 10-1: 모바일 레이아웃
```gherkin
Scenario: 모바일 화면 (< 768px)에서 목록 표시
  Given 교사가 모바일 기기(375px 너비)로 접속했을 때
  When  /reports 페이지를 열 때
  Then  시스템은 다음과 같이 표시해야 한다
    | UI 요소         | 표시              |
    | 카드 너비       | 100%              |
    | 카드 레이아웃   | 세로 스택         |
    | 필터            | 드롭다운          |
```

### 시나리오 10-2: 데스크톱 레이아웃
```gherkin
Scenario: 데스크톱 화면 (≥ 1024px)에서 목록 표시
  Given 교사가 데스크톱 브라우저로 접속했을 때
  When  /reports 페이지를 열 때
  Then  시스템은 다음과 같이 표시해야 한다
    | UI 요소         | 표시              |
    | 카드 레이아웃   | 3열 그리드        |
    | 필터            | 상단 가로 배치    |
```

---

## 11. 접근성

### 시나리오 11-1: 키보드 네비게이션
```gherkin
Scenario: Tab 키로 신고 카드 이동
  Given 교사가 /reports 페이지에 있을 때
  When  교사가 Tab 키를 누를 때
  Then  시스템은 다음 순서로 포커스를 이동해야 한다
    | 순서 | 요소                |
    | 1    | 필터 (상태)         |
    | 2    | 필터 (카테고리)     |
    | 3    | 검색창              |
    | 4    | 첫 번째 신고 카드   |
    | 5    | 두 번째 신고 카드   |
    | ...  | ...                 |
```

### 시나리오 11-2: 스크린 리더 지원
```gherkin
Scenario: 스크린 리더로 신고 목록 읽기
  Given 교사가 스크린 리더를 사용 중일 때
  When  /reports 페이지가 로드될 때
  Then  시스템은 다음을 읽어야 한다
    | 요소         | 읽을 내용                           |
    | 페이지 제목  | "내 신고 목록"                      |
    | 신고 카드    | "신고 제목, 상태: 대기 중, 생성일: ..." |
    | 상태 배지    | "대기 중" (aria-label)              |
```

---

## 12. 성능 요구사항

### 시나리오 12-1: 페이지 로드 시간
```gherkin
Scenario: 신고 목록 페이지 로드
  Given 교사가 /reports 페이지에 접근할 때
  When  페이지가 로드될 때
  Then  시스템은 2초 이내에 신고 목록을 렌더링해야 한다
```

### 시나리오 12-2: API 응답 시간
```gherkin
Scenario: 신고 목록 API 응답
  Given 교사가 GET /api/reports API를 호출할 때
  When  API 요청이 처리될 때
  Then  시스템은 500ms 이내에 응답해야 한다
```

---

## Definition of Done (완료 조건)

### 기능 완료
- [x] 신고 목록 조회 (페이지네이션)
- [x] 신고 상세 조회
- [x] 필터링 (상태, 카테고리, 검색)
- [x] 정렬 (생성일, 우선순위)
- [x] 상태 배지 표시
- [x] 실시간 업데이트 (5분 주기)
- [x] 권한 검증 (RLS)
- [x] 파일 다운로드 (Signed URL)

### 품질 게이트
- [x] 테스트 커버리지 ≥ 85%
- [x] 모든 시나리오 E2E 테스트 통과
- [x] 접근성 WCAG 2.1 AA 준수
- [x] Lighthouse 성능 점수 ≥ 90
- [x] 모바일/데스크톱 반응형 동작 확인

### 문서화
- [x] API 문서 작성
- [x] 컴포넌트 JSDoc 작성
- [x] Supabase RLS 정책 문서화

---

**작성자**: @Alfred
**최종 업데이트**: 2025-10-23
