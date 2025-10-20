# SPEC-REPORT-001: 수락 기준 (Acceptance Criteria)

> **문서 정보**
> - **SPEC ID**: REPORT-001
> - **버전**: 0.0.1
> - **작성일**: 2025-10-20
> - **테스트 프레임워크**: Vitest, Playwright

---

## 수락 기준 개요 (Acceptance Criteria Overview)

### Definition of Done (완료 조건)
- [ ] 모든 테스트 시나리오 통과 (Unit + Integration + E2E)
- [ ] 테스트 커버리지 ≥ 85%
- [ ] 코드 린트 통과 (ESLint + Prettier)
- [ ] 타입 검사 통과 (TypeScript strict mode)
- [ ] 성능 테스트 통과 (API < 500ms, 페이지 로드 < 2초)
- [ ] 접근성 테스트 통과 (WCAG 2.1 AA)
- [ ] 보안 검증 완료 (JWT, RLS, 파일 검증)

### 검증 방법 (Verification Methods)
- **Unit Tests**: Vitest (개별 함수/컴포넌트 검증)
- **Integration Tests**: Vitest + Supabase Test Client (API 엔드포인트 검증)
- **E2E Tests**: Playwright (사용자 플로우 검증)
- **Performance Tests**: Lighthouse CI (성능 지표 측정)
- **Security Tests**: OWASP ZAP (보안 취약점 스캔)

---

## 테스트 시나리오 (Test Scenarios)

### 1. 신고 작성 시나리오

#### Given-When-Then 시나리오 1.1: 정상 신고 작성
**Given**:
- 사용자는 인증된 교사(teacher) 역할을 가지고 있다
- `/reports/new` 페이지에 접속한 상태이다

**When**:
- 사용자가 다음 정보를 입력한다:
  - 카테고리: "학부모 관련"
  - 세부 유형: "폭언/욕설"
  - 제목: "학부모 욕설 신고"
  - 내용: "학부모가 전화로 욕설을 했습니다."
  - 사건 일시: "2025-10-20 10:00"
  - 사건 장소: "교무실"
  - 긴급도: "높음"
- "제출" 버튼을 클릭한다

**Then**:
- 신고가 성공적으로 생성된다
- 신고 상태는 "submitted"이다
- 사용자는 신고 상세 페이지로 리다이렉트된다
- 성공 메시지가 표시된다: "신고가 접수되었습니다."
- 데이터베이스에 신고가 저장된다
- 관리자에게 알림이 전송된다 (긴급도가 "높음"이므로)

**검증 코드**:
```typescript
// tests/e2e/report-submission.spec.ts
import { test, expect } from '@playwright/test';

test('정상 신고 작성', async ({ page }) => {
  // Given
  await page.goto('/login');
  await page.fill('#email', 'teacher@test.com');
  await page.fill('#password', 'password');
  await page.click('#submit');
  await page.waitForURL('/dashboard');

  await page.goto('/reports/new');

  // When
  await page.selectOption('#category', 'parent');
  await page.selectOption('#sub_category', '폭언/욕설');
  await page.fill('#title', '학부모 욕설 신고');
  await page.fill('#description', '학부모가 전화로 욕설을 했습니다.');
  await page.fill('#incident_date', '2025-10-20T10:00');
  await page.fill('#incident_location', '교무실');
  await page.selectOption('#priority', 'high');
  await page.click('#submit-button');

  // Then
  await page.waitForURL(/\/reports\/[a-z0-9-]+/);
  await expect(page.locator('.status-badge')).toHaveText('제출됨');
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.success-message')).toContainText('신고가 접수되었습니다');
});
```

#### Given-When-Then 시나리오 1.2: 개인정보 자동 마스킹
**Given**:
- 사용자는 신고 작성 페이지에 있다
- 신고 내용에 개인정보가 포함되어 있다

**When**:
- 사용자가 다음 내용을 입력한다:
  ```
  학부모 홍길동(010-1234-5678)이 욕설을 했습니다.
  이메일 test@example.com으로 협박 메일도 보냈습니다.
  ```
- "제출" 버튼을 클릭한다

**Then**:
- 신고 내용이 자동으로 마스킹된다:
  ```
  학부모 홍*동(010-****-****)이 욕설을 했습니다.
  이메일 t***@example.com으로 협박 메일도 보냈습니다.
  ```
- 마스킹된 내용이 데이터베이스에 저장된다
- 신고 상세 페이지에서 마스킹된 내용이 표시된다

**검증 코드**:
```typescript
// tests/unit/anonymization.test.ts
import { describe, test, expect } from 'vitest';
import { maskPII } from '@/lib/utils/anonymization';

describe('PII 마스킹', () => {
  test('전화번호 마스킹', () => {
    const input = '학부모 홍길동(010-1234-5678)이 욕설을 했습니다.';
    const output = maskPII(input);
    expect(output).toContain('010-****-****');
  });

  test('이메일 마스킹', () => {
    const input = '이메일 test@example.com으로 협박 메일도 보냈습니다.';
    const output = maskPII(input);
    expect(output).toContain('t***@example.com');
  });

  test('한글 이름 마스킹', () => {
    expect(maskPII('홍길동 선생님')).toContain('홍*동');
    expect(maskPII('김철수님')).toContain('김*수');
  });

  test('복합 개인정보 마스킹', () => {
    const input = '학부모 홍길동(010-1234-5678)이 이메일 test@example.com으로 협박했습니다.';
    const output = maskPII(input);

    expect(output).toContain('홍*동');
    expect(output).toContain('010-****-****');
    expect(output).toContain('t***@example.com');
  });
});
```

#### Given-When-Then 시나리오 1.3: 필수 필드 누락
**Given**:
- 사용자는 신고 작성 페이지에 있다

**When**:
- 사용자가 제목만 입력하고 내용을 비운다
- "제출" 버튼을 클릭한다

**Then**:
- 폼 검증 오류가 표시된다
- "신고 내용을 입력해주세요." 오류 메시지가 나타난다
- 신고가 제출되지 않는다

**검증 코드**:
```typescript
// tests/e2e/report-validation.spec.ts
test('필수 필드 누락 시 검증', async ({ page }) => {
  await page.goto('/reports/new');

  // 제목만 입력
  await page.fill('#title', '테스트 제목');
  await page.click('#submit-button');

  // 오류 메시지 확인
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('신고 내용을 입력해주세요');

  // URL 변경 없음 (제출 안 됨)
  expect(page.url()).toContain('/reports/new');
});
```

---

### 2. 파일 업로드 시나리오

#### Given-When-Then 시나리오 2.1: 정상 파일 업로드
**Given**:
- 사용자는 신고를 작성한 상태이다
- 증거 파일(이미지 5MB)을 준비했다

**When**:
- 사용자가 "파일 첨부" 버튼을 클릭한다
- `evidence.jpg` 파일을 선택한다

**Then**:
- 파일 업로드가 시작된다
- 업로드 진행률이 표시된다 (0% → 100%)
- 업로드가 완료되면 파일 목록에 추가된다
- 파일 이름, 크기, 타입이 표시된다
- Supabase Storage에 파일이 저장된다
- `report_files` 테이블에 메타데이터가 저장된다

**검증 코드**:
```typescript
// tests/e2e/file-upload.spec.ts
test('정상 파일 업로드', async ({ page }) => {
  // Given
  await page.goto('/reports/new');
  await page.fill('#title', '테스트');
  await page.fill('#description', '내용');

  // When
  const fileInput = await page.locator('#file-upload');
  await fileInput.setInputFiles('./test-files/evidence.jpg');

  // Then
  await expect(page.locator('.file-progress')).toBeVisible();
  await page.waitForSelector('.file-uploaded', { timeout: 10000 });

  const fileName = await page.locator('.file-name').textContent();
  expect(fileName).toContain('evidence.jpg');

  const fileSize = await page.locator('.file-size').textContent();
  expect(fileSize).toContain('5 MB');
});
```

#### Given-When-Then 시나리오 2.2: 파일 크기 초과
**Given**:
- 사용자는 신고 작성 중이다
- 15MB 크기의 파일을 준비했다 (제한: 10MB)

**When**:
- 사용자가 15MB 파일을 업로드한다

**Then**:
- 파일 검증 오류가 표시된다
- "파일 크기는 10MB를 초과할 수 없습니다." 오류 메시지가 나타난다
- 파일이 업로드되지 않는다

**검증 코드**:
```typescript
// tests/unit/file-validator.test.ts
import { describe, test, expect } from 'vitest';
import { validateFile } from '@/lib/validators/file-validator';

describe('파일 검증', () => {
  test('파일 크기 초과', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    const result = validateFile(largeFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('10MB를 초과할 수 없습니다');
  });

  test('허용되지 않는 파일 형식', () => {
    const invalidFile = new File(['content'], 'test.exe', {
      type: 'application/x-msdownload',
    });

    const result = validateFile(invalidFile);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('지원하지 않는 파일 형식');
  });

  test('정상 파일', () => {
    const validFile = new File(['content'], 'test.jpg', {
      type: 'image/jpeg',
    });

    const result = validateFile(validFile);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
```

#### Given-When-Then 시나리오 2.3: 최대 파일 개수 초과
**Given**:
- 사용자는 이미 5개의 파일을 업로드한 상태이다

**When**:
- 사용자가 6번째 파일을 업로드한다

**Then**:
- 오류 메시지가 표시된다: "최대 5개까지 업로드 가능합니다."
- 파일이 업로드되지 않는다

**검증 코드**:
```typescript
test('최대 파일 개수 초과', async ({ page }) => {
  await page.goto('/reports/new');

  // 5개 파일 업로드
  for (let i = 1; i <= 5; i++) {
    await page.setInputFiles('#file-upload', `./test-files/file${i}.jpg`);
    await page.waitForSelector(`.file-uploaded:nth-child(${i})`);
  }

  // 6번째 파일 시도
  await page.setInputFiles('#file-upload', './test-files/file6.jpg');

  // 오류 메시지 확인
  await expect(page.locator('.error-message')).toBeVisible();
  await expect(page.locator('.error-message')).toContainText('최대 5개까지 업로드');

  // 파일 목록 개수 확인 (여전히 5개)
  const fileCount = await page.locator('.file-uploaded').count();
  expect(fileCount).toBe(5);
});
```

---

### 3. 신고 조회 시나리오

#### Given-When-Then 시나리오 3.1: 본인 신고 목록 조회
**Given**:
- 사용자는 인증된 교사이다
- 사용자가 3개의 신고를 작성했다
- 다른 교사가 5개의 신고를 작성했다

**When**:
- 사용자가 `/reports` 페이지에 접속한다

**Then**:
- 사용자가 작성한 3개의 신고만 표시된다
- 다른 교사의 신고는 보이지 않는다
- 신고는 최신순으로 정렬된다
- 각 신고 카드에 제목, 상태, 생성일이 표시된다

**검증 코드**:
```typescript
// tests/integration/reports-api.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('GET /api/reports', () => {
  let supabase;
  let teacherToken;

  beforeEach(async () => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // 교사 로그인
    const { data } = await supabase.auth.signInWithPassword({
      email: 'teacher@test.com',
      password: 'password',
    });
    teacherToken = data.session.access_token;
  });

  test('본인 신고만 조회', async () => {
    const response = await fetch('http://localhost:3000/api/reports', {
      headers: { Authorization: `Bearer ${teacherToken}` },
    });

    expect(response.status).toBe(200);

    const { data } = await response.json();

    // 3개의 신고만 반환
    expect(data).toHaveLength(3);

    // 모든 신고의 user_id가 현재 사용자
    data.forEach((report) => {
      expect(report.user_id).toBe(currentUserId);
    });

    // 최신순 정렬 확인
    const dates = data.map((r) => new Date(r.created_at).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});
```

#### Given-When-Then 시나리오 3.2: 상태별 필터링
**Given**:
- 사용자가 10개의 신고를 작성했다
- 상태 분포: submitted(3개), assigned(2개), in_progress(3개), resolved(2개)

**When**:
- 사용자가 상태 필터를 "진행 중"으로 선택한다

**Then**:
- "in_progress" 상태인 3개의 신고만 표시된다
- URL이 `/reports?status=in_progress`로 변경된다

**검증 코드**:
```typescript
test('상태별 필터링', async ({ page }) => {
  await page.goto('/reports');

  // 필터 선택
  await page.selectOption('#status-filter', 'in_progress');

  // URL 변경 확인
  expect(page.url()).toContain('status=in_progress');

  // 결과 개수 확인
  const reportCount = await page.locator('.report-card').count();
  expect(reportCount).toBe(3);

  // 모든 카드의 상태 확인
  const statuses = await page.locator('.status-badge').allTextContents();
  statuses.forEach((status) => {
    expect(status).toBe('진행 중');
  });
});
```

---

### 4. 신고 수정/삭제 시나리오

#### Given-When-Then 시나리오 4.1: 제출 상태에서 수정
**Given**:
- 사용자가 "submitted" 상태인 신고를 작성했다
- 신고 상세 페이지에 접속한 상태이다

**When**:
- 사용자가 "수정" 버튼을 클릭한다
- 제목을 "수정된 제목"으로 변경한다
- "저장" 버튼을 클릭한다

**Then**:
- 신고가 성공적으로 수정된다
- 수정된 제목이 표시된다
- 성공 메시지가 표시된다: "신고가 수정되었습니다."

**검증 코드**:
```typescript
test('제출 상태에서 수정', async ({ page }) => {
  await page.goto('/reports/[id]');

  await page.click('#edit-button');
  await page.fill('#title', '수정된 제목');
  await page.click('#save-button');

  await expect(page.locator('h1')).toContainText('수정된 제목');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

#### Given-When-Then 시나리오 4.2: 배정 후 수정 불가
**Given**:
- 사용자가 "assigned" 상태인 신고를 가지고 있다
- 신고 상세 페이지에 접속한 상태이다

**When**:
- 사용자가 "수정" 버튼을 찾는다

**Then**:
- "수정" 버튼이 비활성화되어 있다
- 툴팁이 표시된다: "배정된 신고는 수정할 수 없습니다."

**검증 코드**:
```typescript
test('배정 후 수정 불가', async ({ page }) => {
  await page.goto('/reports/[id-assigned]');

  // 수정 버튼 비활성화 확인
  await expect(page.locator('#edit-button')).toBeDisabled();

  // 툴팁 확인
  await page.hover('#edit-button');
  await expect(page.locator('.tooltip')).toContainText('배정된 신고는 수정할 수 없습니다');
});
```

#### Given-When-Then 시나리오 4.3: 신고 삭제
**Given**:
- 사용자가 "submitted" 상태인 신고를 가지고 있다

**When**:
- 사용자가 "삭제" 버튼을 클릭한다
- 확인 다이얼로그에서 "삭제" 버튼을 클릭한다

**Then**:
- 신고가 삭제된다
- 신고 목록 페이지로 리다이렉트된다
- 성공 메시지가 표시된다: "신고가 삭제되었습니다."
- 데이터베이스에서 신고가 삭제된다

**검증 코드**:
```typescript
test('신고 삭제', async ({ page }) => {
  await page.goto('/reports/[id]');

  await page.click('#delete-button');

  // 확인 다이얼로그
  await expect(page.locator('.confirm-dialog')).toBeVisible();
  await page.click('.confirm-delete');

  // 리다이렉트 확인
  await page.waitForURL('/reports');

  // 성공 메시지
  await expect(page.locator('.success-message')).toContainText('신고가 삭제되었습니다');
});
```

---

### 5. 권한 검증 시나리오

#### Given-When-Then 시나리오 5.1: 교사가 아닌 경우 접근 차단
**Given**:
- 사용자는 "lawyer" 역할로 로그인했다

**When**:
- 사용자가 `/reports/new` 페이지에 접속한다

**Then**:
- 403 오류 페이지가 표시된다
- "신고 작성 권한이 없습니다." 메시지가 나타난다

**검증 코드**:
```typescript
test('변호사 역할 접근 차단', async ({ page }) => {
  // 변호사로 로그인
  await page.goto('/login');
  await page.fill('#email', 'lawyer@test.com');
  await page.fill('#password', 'password');
  await page.click('#submit');

  // 신고 작성 페이지 접근 시도
  await page.goto('/reports/new');

  // 403 오류 확인
  await expect(page.locator('h1')).toContainText('403');
  await expect(page.locator('.error-message')).toContainText('신고 작성 권한이 없습니다');
});
```

#### Given-When-Then 시나리오 5.2: 다른 교사의 신고 접근 차단
**Given**:
- 교사A가 신고를 작성했다
- 교사B로 로그인한 상태이다

**When**:
- 교사B가 교사A의 신고 상세 페이지 URL에 접속한다

**Then**:
- 403 오류가 발생한다
- "접근 권한이 없습니다." 메시지가 표시된다

**검증 코드**:
```typescript
// tests/integration/reports-authorization.test.ts
test('다른 교사의 신고 접근 차단', async () => {
  // 교사A의 신고 ID
  const reportIdByTeacherA = 'uuid-teacher-a';

  // 교사B로 로그인
  const response = await fetch(`/api/reports/${reportIdByTeacherA}`, {
    headers: { Authorization: `Bearer ${teacherBToken}` },
  });

  expect(response.status).toBe(403);

  const { error } = await response.json();
  expect(error).toContain('접근 권한이 없습니다');
});
```

---

## 성능 테스트 시나리오 (Performance Test Scenarios)

### 시나리오 P1: API 응답 시간
**목표**: 모든 API 엔드포인트가 95 percentile 기준 500ms 이하

**검증 방법**:
```typescript
// tests/performance/api-benchmark.test.ts
import { test, expect } from 'vitest';
import { performance } from 'perf_hooks';

test('GET /api/reports 응답 시간', async () => {
  const times: number[] = [];

  // 100회 요청
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    await fetch('/api/reports', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const end = performance.now();
    times.push(end - start);
  }

  // 95 percentile 계산
  times.sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95)];

  expect(p95).toBeLessThan(500); // 500ms 이하
});
```

### 시나리오 P2: 페이지 로드 시간
**목표**: Lighthouse 성능 점수 ≥ 90

**검증 방법**:
```typescript
// tests/performance/lighthouse.test.ts
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

test('신고 목록 페이지 성능', async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { port: chrome.port };

  const runnerResult = await lighthouse('http://localhost:3000/reports', options);

  const performanceScore = runnerResult.lhr.categories.performance.score * 100;

  expect(performanceScore).toBeGreaterThanOrEqual(90);

  await chrome.kill();
});
```

### 시나리오 P3: 파일 업로드 시간
**목표**: 10MB 파일 업로드 10초 이하

**검증 방법**:
```typescript
test('10MB 파일 업로드 시간', async () => {
  const file = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', {
    type: 'image/jpeg',
  });

  const formData = new FormData();
  formData.append('file', file);

  const start = performance.now();

  const response = await fetch('/api/reports/[id]/files', {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  const end = performance.now();
  const duration = end - start;

  expect(response.status).toBe(201);
  expect(duration).toBeLessThan(10000); // 10초 이하
});
```

---

## 보안 테스트 시나리오 (Security Test Scenarios)

### 시나리오 S1: SQL Injection 방어
**검증 방법**:
```typescript
test('SQL Injection 방어', async () => {
  const maliciousInput = "'; DROP TABLE reports; --";

  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: maliciousInput,
      description: 'test',
      category: 'parent',
      sub_category: '폭언/욕설',
      incident_date: '2025-10-20T10:00:00Z',
    }),
  });

  expect(response.status).toBe(201); // 정상 생성

  // 테이블이 여전히 존재하는지 확인
  const checkResponse = await fetch('/api/reports', {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(checkResponse.status).toBe(200); // 테이블 정상
});
```

### 시나리오 S2: XSS 방어
**검증 방법**:
```typescript
test('XSS 방어', async ({ page }) => {
  const xssPayload = '<script>alert("XSS")</script>';

  await page.goto('/reports/new');
  await page.fill('#title', xssPayload);
  await page.fill('#description', 'test');
  await page.click('#submit-button');

  await page.waitForURL(/\/reports\/[a-z0-9-]+/);

  // 스크립트가 실행되지 않고 텍스트로 표시됨
  const title = await page.locator('h1').textContent();
  expect(title).toBe(xssPayload); // 이스케이핑된 텍스트

  // 실제로 <script> 태그가 DOM에 없음
  const scriptTags = await page.locator('script').count();
  expect(scriptTags).toBe(0);
});
```

### 시나리오 S3: 파일 타입 검증
**검증 방법**:
```typescript
test('악성 파일 업로드 차단', async () => {
  const maliciousFile = new File(['<?php system($_GET["cmd"]); ?>'], 'malicious.php', {
    type: 'application/x-php',
  });

  const formData = new FormData();
  formData.append('file', maliciousFile);

  const response = await fetch('/api/reports/[id]/files', {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status).toBe(400);

  const { error } = await response.json();
  expect(error).toContain('지원하지 않는 파일 형식');
});
```

---

## 접근성 테스트 시나리오 (Accessibility Test Scenarios)

### 시나리오 A1: 키보드 네비게이션
**검증 방법**:
```typescript
test('키보드로 신고 작성 폼 탐색', async ({ page }) => {
  await page.goto('/reports/new');

  // Tab 키로 필드 간 이동
  await page.keyboard.press('Tab'); // 제목 필드
  await page.keyboard.type('테스트 제목');

  await page.keyboard.press('Tab'); // 내용 필드
  await page.keyboard.type('테스트 내용');

  await page.keyboard.press('Tab'); // 제출 버튼
  await page.keyboard.press('Enter'); // 제출

  // 제출 성공 확인
  await page.waitForURL(/\/reports\/[a-z0-9-]+/);
});
```

### 시나리오 A2: 스크린 리더 지원
**검증 방법**:
```typescript
test('ARIA 레이블 존재', async ({ page }) => {
  await page.goto('/reports/new');

  // 모든 입력 필드에 레이블 존재
  const titleLabel = await page.getAttribute('#title', 'aria-label');
  expect(titleLabel).toBeTruthy();

  const descriptionLabel = await page.getAttribute('#description', 'aria-label');
  expect(descriptionLabel).toBeTruthy();

  // 오류 메시지 aria-live
  await page.click('#submit-button'); // 빈 폼 제출
  const errorRegion = await page.getAttribute('.error-message', 'aria-live');
  expect(errorRegion).toBe('assertive');
});
```

---

## 품질 게이트 기준 (Quality Gates)

### 코드 품질
- [ ] ESLint 오류 0개
- [ ] Prettier 포맷팅 준수
- [ ] TypeScript strict mode 통과
- [ ] 순환 의존성 없음

### 테스트 커버리지
- [ ] 전체 커버리지 ≥ 85%
- [ ] 핵심 로직 (PII 마스킹, 파일 검증) ≥ 95%
- [ ] UI 컴포넌트 ≥ 80%

### 성능
- [ ] Lighthouse 성능 점수 ≥ 90
- [ ] API 95p 응답 시간 ≤ 500ms
- [ ] 파일 업로드 (10MB) ≤ 10초

### 보안
- [ ] OWASP ZAP 스캔 0 high/critical
- [ ] JWT 검증 통과
- [ ] RLS 정책 적용 확인
- [ ] 파일 타입/크기 검증 확인

### 접근성
- [ ] WCAG 2.1 AA 준수
- [ ] Lighthouse 접근성 점수 ≥ 95
- [ ] 키보드 네비게이션 가능

---

## 검증 도구 및 설정 (Verification Tools & Setup)

### Vitest 설정
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
});
```

### Playwright 설정
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
```

---

## 최종 체크리스트 (Final Checklist)

### 기능 완성도
- [ ] 신고 CRUD 모든 시나리오 통과
- [ ] 파일 업로드/다운로드 시나리오 통과
- [ ] 권한 검증 시나리오 통과
- [ ] PII 마스킹 시나리오 통과

### 품질 보증
- [ ] 모든 단위 테스트 통과
- [ ] 모든 통합 테스트 통과
- [ ] 모든 E2E 테스트 통과
- [ ] 성능 테스트 통과
- [ ] 보안 테스트 통과
- [ ] 접근성 테스트 통과

### 문서화
- [ ] API 문서 작성 완료
- [ ] 사용자 가이드 작성 완료
- [ ] 관리자 가이드 작성 완료

### 배포 준비
- [ ] 프로덕션 환경 설정 완료
- [ ] Supabase 마이그레이션 실행 완료
- [ ] 모니터링 설정 완료 (Sentry, GA4)

---

**작성자**: @teacher119
**최종 수정**: 2025-10-20
**다음 단계**: `/alfred:2-build REPORT-001` 실행하여 TDD 구현 시작
