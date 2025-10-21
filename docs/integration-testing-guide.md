# 📋 Supabase 통합 테스트 가이드

> **작성일**: 2025-10-20
> **대상**: CONSULT-001 (실시간 상담), DASHBOARD-001 (역할별 대시보드)

---

## 🎯 테스트 목표

- ✅ 실제 Supabase 데이터베이스 연결 검증
- ✅ WebSocket 실시간 통신 확인
- ✅ 파일 업로드 기능 테스트
- ✅ 대시보드 렌더링 및 성능 측정

---

## 📦 사전 준비

### 1. Supabase 프로젝트 설정 확인

```bash
# .env.local 파일 확인
cat .env.local

# 필요한 환경변수:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
```

### 2. 데이터베이스 스키마 생성

**Supabase Dashboard → SQL Editor**에서 다음 SQL 실행:

```bash
# SQL 파일 위치
supabase/migrations/001_create_consultation_tables.sql
```

**실행 순서**:
1. Supabase Dashboard 로그인 (https://app.supabase.com)
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. "New Query" 클릭
5. `001_create_consultation_tables.sql` 파일 내용 복사
6. "Run" 버튼 클릭

**검증 쿼리**:
```sql
-- 테이블 생성 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('consultations', 'messages');
```

예상 결과:
```
consultations
messages
```

### 3. 샘플 데이터 생성 (선택사항)

**사용자 데이터**:
```sql
-- 교사 사용자
INSERT INTO users (email, role, name)
VALUES
  ('teacher@test.com', 'teacher', '김교사'),
  ('lawyer@test.com', 'lawyer', '박변호사')
RETURNING id;
```

**매칭 데이터**:
```sql
-- 신고 및 매칭 생성
INSERT INTO reports (teacher_id, title, description, severity)
VALUES (<teacher_id>, '학교폭력 사례', '테스트 신고입니다', 'high')
RETURNING id;

INSERT INTO matches (report_id, teacher_id, lawyer_id, status)
VALUES (<report_id>, <teacher_id>, <lawyer_id>, 'matched')
RETURNING id;
```

**상담 데이터**:
```sql
-- 활성 상담 생성
INSERT INTO consultations (match_id, teacher_id, lawyer_id, status)
VALUES (<match_id>, <teacher_id>, <lawyer_id>, 'active')
RETURNING id;
```

### 4. Supabase Storage 버킷 생성 (파일 업로드 테스트용)

1. Supabase Dashboard → Storage
2. "Create a new bucket" 클릭
3. 버킷 이름: `consultation-attachments`
4. Public 설정: ❌ (비공개)
5. "Create bucket" 클릭

**RLS 정책 설정**:
```sql
-- 인증된 사용자만 업로드 가능
CREATE POLICY "authenticated_users_upload" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'consultation-attachments');

-- 인증된 사용자만 다운로드 가능
CREATE POLICY "authenticated_users_download" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'consultation-attachments');
```

---

## 🖥️ 옵션 C: 브라우저 수동 테스트

### 1. 개발 서버 실행

```bash
npm run dev
```

서버 주소: http://localhost:3001

### 2. Chrome DevTools 열기

- **Windows/Linux**: `F12` 또는 `Ctrl+Shift+I`
- **Mac**: `Cmd+Option+I`

### 3. 실시간 상담 기능 테스트

#### A. WebSocket 연결 확인

**DevTools → Network 탭**:
1. "WS" 필터 선택 (WebSocket만 보기)
2. 페이지 새로고침
3. `realtime` 연결 확인

**예상 WebSocket 메시지**:
```json
{
  "event": "phx_join",
  "topic": "realtime:public:consultations",
  "ref": "1"
}
```

**WebSocket 상태 확인**:
- 🟢 **Status 101**: 연결 성공
- 🔴 **Status 4xx/5xx**: 연결 실패 (환경변수 확인)

#### B. 메시지 전송 테스트

**브라우저 Console에서 실행**:

```typescript
// 1. Supabase 클라이언트 생성
import { createBrowserClient } from '@/lib/supabase/client';
import { sendMessage } from '@/lib/services/consultation-service';

const supabase = createBrowserClient();

// 2. 메시지 전송
const result = await sendMessage(supabase, {
  consultationId: '<실제 consultation UUID>',
  senderId: '<실제 user UUID>',
  content: '브라우저 테스트 메시지'
});

console.log('전송 결과:', result);
// 예상: { success: true, messageId: 'uuid...' }
```

**실시간 수신 확인**:
- DevTools → Network → WS 탭
- `broadcast` 이벤트로 메시지 수신 확인

#### C. 파일 업로드 테스트

**HTML에서 직접 테스트**:

```html
<input type="file" id="fileInput" accept=".pdf,image/*" />
<button onclick="uploadTest()">업로드 테스트</button>

<script>
async function uploadTest() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('파일을 선택하세요');
    return;
  }

  // 파일 크기 검증
  if (file.size > 5 * 1024 * 1024) {
    alert('파일 크기는 5MB 이하여야 합니다');
    return;
  }

  const result = await uploadFile(supabase, file, '<user_id>');
  console.log('업로드 결과:', result);
}
</script>
```

**검증 항목**:
- ✅ 5MB 이하 파일: 업로드 성공
- ❌ 5MB 초과 파일: 에러 메시지
- ❌ 허용되지 않은 파일 타입 (.exe, .zip): 에러 메시지

#### D. 읽음 상태 관리 테스트

```typescript
// 1. 메시지 전송 (교사)
const sendResult = await sendMessage(supabase, {
  consultationId: '<consultation_id>',
  senderId: '<teacher_id>',
  content: '읽음 테스트 메시지'
});

// 2. 읽음 처리 (변호사)
const readResult = await markAsRead(
  supabase,
  sendResult.messageId,
  '<lawyer_id>'
);

console.log('읽음 처리:', readResult);
// 예상: { success: true, data: { is_read: true, read_at: '...' } }
```

---

### 4. 대시보드 기능 테스트

#### A. 교사 대시보드 렌더링

**URL**: http://localhost:3001/dashboard/teacher

**DevTools → Performance 탭**:
1. "Record" 시작
2. 페이지 새로고침
3. "Stop" 클릭
4. "Loading" 시간 확인

**성능 기준**:
- ✅ **LCP (Largest Contentful Paint)**: < 2000ms
- ✅ **FCP (First Contentful Paint)**: < 1000ms

**검증 항목**:
- ✅ 신고 현황 위젯 표시
- ✅ 상담 이력 위젯 표시
- ✅ 최근 신고 목록 표시 (최대 5개)
- ✅ 월별 통계 차트 렌더링

**Console에서 데이터 확인**:
```typescript
// DevTools Console에서 실행
import { fetchTeacherDashboard } from '@/features/dashboard/dashboard-service';

const data = await fetchTeacherDashboard(supabase, '<teacher_id>');
console.log('교사 대시보드 데이터:', data);
```

#### B. 변호사 대시보드 렌더링

**URL**: http://localhost:3001/dashboard/lawyer

**검증 항목**:
- ✅ 배정 사건 목록 표시
- ✅ 활성 상담 목록 표시
- ✅ 평가 점수 표시 (별점)
- ✅ 월별 처리 건수 차트 렌더링

**Recharts 렌더링 확인**:
- DevTools → Elements 탭
- `<svg>` 요소 확인 (차트)
- `.recharts-wrapper` 클래스 확인

#### C. 실시간 데이터 업데이트 테스트

**시나리오**:
1. 대시보드 페이지 열어두기
2. 다른 탭에서 Supabase Dashboard 열기
3. SQL Editor에서 데이터 수정:
   ```sql
   UPDATE reports
   SET status = 'completed'
   WHERE id = '<report_id>';
   ```
4. 대시보드 자동 업데이트 확인 (5분 이내)

**DevTools Console에서 확인**:
```
Supabase Realtime: Received broadcast event
```

---

## 🧪 E2E 테스트 실행

### 1. E2E 테스트 실행 (Vitest)

```bash
# 모든 E2E 테스트 실행
npm test tests/e2e/

# 상담 통합 테스트만 실행
npm test tests/e2e/consultation-integration.test.ts

# 대시보드 통합 테스트만 실행
npm test tests/e2e/dashboard-integration.test.ts
```

### 2. 테스트 결과 확인

**성공 예시**:
```
✓ E2E: 실시간 상담 시스템 > 메시지 전송 및 수신 (123ms)
✓ E2E: 실시간 상담 시스템 > Realtime 구독 (2341ms)
✓ E2E: 역할별 대시보드 > 교사 대시보드 로딩 (456ms)
✓ E2E: 역할별 대시보드 > 변호사 대시보드 로딩 (389ms)

Test Files  2 passed (2)
Tests  15 passed (15)
Duration  5.23s
```

**실패 시 확인 사항**:
- ❌ 환경변수 설정 확인 (.env.local)
- ❌ Supabase 프로젝트 URL/Key 정확성
- ❌ 데이터베이스 스키마 생성 여부
- ❌ 샘플 데이터 존재 여부

---

## 📊 성능 측정

### 1. Chrome DevTools Performance

**측정 방법**:
1. DevTools → Performance 탭
2. "Record" 클릭
3. 페이지 새로고침
4. "Stop" 클릭
5. Summary 확인

**측정 지표**:
- **LCP (Largest Contentful Paint)**: < 2.5s (Good)
- **FID (First Input Delay)**: < 100ms (Good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good)

### 2. Network Waterfall 분석

**DevTools → Network 탭**:
- "Waterfall" 열 확인
- Supabase API 호출 순서 확인
- 병렬 요청 확인 (대시보드)

**목표**:
- ✅ 병렬 데이터 페칭: 4개 쿼리 동시 실행
- ✅ 총 로딩 시간: < 2000ms

---

## 🐛 트러블슈팅

### 문제 1: "Network error" 발생

**원인**: 잘못된 Supabase URL 또는 Key

**해결**:
```bash
# .env.local 파일 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 서버 재시작
npm run dev
```

### 문제 2: "Table does not exist" 에러

**원인**: 데이터베이스 스키마 미생성

**해결**:
1. Supabase Dashboard → SQL Editor
2. `001_create_consultation_tables.sql` 실행
3. 테이블 생성 확인

### 문제 3: WebSocket 연결 실패 (Status 403)

**원인**: Supabase Realtime 비활성화

**해결**:
1. Supabase Dashboard → Database → Replication
2. `consultations`, `messages` 테이블 "Enable" 클릭
3. Publication 설정 확인

### 문제 4: 파일 업로드 실패 (Storage error)

**원인**: Storage 버킷 미생성 또는 RLS 정책 누락

**해결**:
1. Supabase Dashboard → Storage
2. `consultation-attachments` 버킷 생성
3. RLS 정책 추가 (위 "사전 준비" 섹션 참조)

---

## ✅ 체크리스트

### 옵션 A: 데이터베이스 스키마 생성
- [ ] `001_create_consultation_tables.sql` 실행
- [ ] `consultations` 테이블 생성 확인
- [ ] `messages` 테이블 생성 확인
- [ ] RLS 정책 활성화 확인
- [ ] Realtime Publication 설정 확인

### 옵션 B: E2E 테스트 스크립트
- [ ] `tests/e2e/consultation-integration.test.ts` 작성 완료
- [ ] `tests/e2e/dashboard-integration.test.ts` 작성 완료
- [ ] 샘플 데이터 생성 (users, reports, matches, consultations)
- [ ] E2E 테스트 실행 성공

### 옵션 C: 브라우저 수동 테스트
- [ ] 개발 서버 실행 (http://localhost:3001)
- [ ] WebSocket 연결 확인 (DevTools Network → WS)
- [ ] 메시지 전송/수신 테스트
- [ ] 파일 업로드 테스트 (5MB 제한)
- [ ] 교사 대시보드 렌더링 확인 (< 2초)
- [ ] 변호사 대시보드 렌더링 확인 (< 2초)
- [ ] 실시간 데이터 업데이트 확인

---

## 📝 다음 단계

1. **프로덕션 배포 전 확인**:
   - ✅ 모든 E2E 테스트 통과
   - ✅ 성능 기준 충족 (LCP < 2.5s)
   - ✅ WebSocket 안정성 확인
   - ✅ 파일 업로드 검증 완료

2. **SPEC 상태 업데이트**:
   ```bash
   # CONSULT-001, DASHBOARD-001
   status: draft → completed
   version: 0.0.1 → 0.1.0
   ```

3. **문서 동기화**:
   ```bash
   /alfred:3-sync
   ```

---

**작성자**: @Alfred
**최종 업데이트**: 2025-10-20
