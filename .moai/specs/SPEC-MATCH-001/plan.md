# MATCH-001 구현 계획 (Implementation Plan)

> **SPEC**: SPEC-MATCH-001 - 변호사 주도 매칭 시스템
> **버전**: v0.0.1 (Draft)
> **작성일**: 2025-10-20

---

## 1. 구현 개요

### 1.1 목표

변호사가 미배정 신고를 조회하고 직접 선택하여 상담을 시작할 수 있는 API를 TDD 방식으로 구현한다.

### 1.2 구현 범위

**Phase 1: API 엔드포인트** (본 계획)
- `GET /api/lawyers/available-reports` - 미배정 신고 목록 조회
- `GET /api/reports/:id` - 신고 상세 조회 (변호사용)
- `POST /api/consultations` - 상담 시작 (신고 선택)

**Phase 2: 실시간 기능** (SPEC-MATCH-002)
- 알림 시스템
- 상태 변경 실시간 동기화

---

## 2. TDD 워크플로우

### 2.1 RED-GREEN-REFACTOR 사이클

```
RED (테스트 작성)
  ├─ tests/api/lawyers/available-reports.test.ts
  ├─ tests/api/consultations/create.test.ts
  └─ tests/lib/services/matching-service.test.ts
    ↓
GREEN (최소 구현)
  ├─ src/app/api/lawyers/available-reports/route.ts
  ├─ src/app/api/consultations/route.ts
  └─ src/lib/services/matching-service.ts
    ↓
REFACTOR (코드 개선)
  ├─ 중복 로직 제거
  ├─ 타입 안전성 강화
  └─ 에러 처리 개선
```

---

## 3. 파일 구조

### 3.1 테스트 파일 (@TEST:MATCH-001)

```
tests/
├─ api/
│  ├─ lawyers/
│  │  └─ available-reports.test.ts       # 미배정 신고 목록 API 테스트
│  └─ consultations/
│     └─ create.test.ts                  # 상담 시작 API 테스트
└─ lib/
   └─ services/
      └─ matching-service.test.ts        # 매칭 서비스 로직 테스트
```

### 3.2 구현 파일 (@CODE:MATCH-001)

```
src/
├─ app/api/
│  ├─ lawyers/
│  │  └─ available-reports/
│  │     └─ route.ts                     # @CODE:MATCH-001:API
│  └─ consultations/
│     └─ route.ts                        # @CODE:MATCH-001:API (POST 추가)
├─ lib/
│  ├─ services/
│  │  └─ matching-service.ts             # @CODE:MATCH-001:DOMAIN
│  └─ types/
│     └─ matching.ts                     # @CODE:MATCH-001:DATA
└─ middleware/
   └─ auth.ts                            # 기존 파일 재사용 (SPEC-AUTH-001)
```

---

## 4. 상세 구현 계획

### 4.1 Step 1: 타입 정의 (DATA)

**파일**: `src/lib/types/matching.ts`

```typescript
// @CODE:MATCH-001:DATA | SPEC: SPEC-MATCH-001.md

export interface AvailableReport {
  id: string;
  title: string;
  category: 'parent' | 'student' | 'colleague' | 'other';
  incident_date: string;
  created_at: string;
  teacher: {
    name: string;
    anonymous_nickname: string;
  };
}

export interface AvailableReportsQuery {
  category?: string;
  sort?: 'created_at' | 'incident_date';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AvailableReportsResponse {
  reports: AvailableReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface CreateConsultationRequest {
  report_id: string;
}

export interface CreateConsultationResponse {
  consultation: {
    id: string;
    report_id: string;
    teacher_id: string;
    lawyer_id: string;
    status: string;
    created_at: string;
  };
  report: {
    id: string;
    status: string;
    assigned_lawyer_id: string;
  };
}
```

---

### 4.2 Step 2: 서비스 레이어 구현 (DOMAIN)

**파일**: `src/lib/services/matching-service.ts`

```typescript
// @CODE:MATCH-001:DOMAIN | SPEC: SPEC-MATCH-001.md | TEST: tests/lib/services/matching-service.test.ts

import { createClient } from '@/lib/supabase/server';
import type {
  AvailableReport,
  AvailableReportsQuery,
  AvailableReportsResponse,
  CreateConsultationRequest,
  CreateConsultationResponse,
} from '@/lib/types/matching';

export class MatchingService {
  /**
   * 미배정 신고 목록 조회
   *
   * @param query - 필터링 및 정렬 옵션
   * @returns 미배정 신고 목록 + 페이지네이션
   */
  async getAvailableReports(
    query: AvailableReportsQuery
  ): Promise<AvailableReportsResponse> {
    const supabase = createClient();
    const {
      category,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 20,
    } = query;

    // 쿼리 빌더 시작
    let queryBuilder = supabase
      .from('reports')
      .select(`
        id,
        title,
        category,
        incident_date,
        created_at,
        user:users!user_id (
          name,
          anonymous_nickname
        )
      `, { count: 'exact' })
      .eq('status', 'submitted')
      .is('assigned_lawyer_id', null);

    // 카테고리 필터
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 정렬
    queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc' });

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    queryBuilder = queryBuilder.range(from, to);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch available reports: ${error.message}`);
    }

    return {
      reports: (data || []).map((report) => ({
        id: report.id,
        title: report.title,
        category: report.category,
        incident_date: report.incident_date,
        created_at: report.created_at,
        teacher: {
          name: report.user.name,
          anonymous_nickname: report.user.anonymous_nickname,
        },
      })),
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 상담 시작 (신고 선택)
   *
   * @param lawyerId - 변호사 ID
   * @param request - 신고 ID
   * @returns 생성된 상담 및 업데이트된 신고
   */
  async selectReport(
    lawyerId: string,
    request: CreateConsultationRequest
  ): Promise<CreateConsultationResponse> {
    const supabase = createClient();
    const { report_id } = request;

    // 1. 신고 존재 및 상태 확인
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('id, user_id, status, assigned_lawyer_id')
      .eq('id', report_id)
      .single();

    if (fetchError || !report) {
      throw new Error('Report not found', { cause: { status: 404 } });
    }

    if (report.status !== 'submitted' || report.assigned_lawyer_id) {
      throw new Error('Report already assigned', { cause: { status: 409 } });
    }

    // 2. 변호사의 진행 중인 상담 수 확인
    const { count, error: countError } = await supabase
      .from('consultations')
      .select('id', { count: 'exact', head: true })
      .eq('lawyer_id', lawyerId)
      .in('status', ['pending', 'active']);

    if (countError) {
      throw new Error(`Failed to count consultations: ${countError.message}`);
    }

    if (count && count >= 10) {
      throw new Error('Lawyer has too many active consultations', {
        cause: { status: 403 },
      });
    }

    // 3. 트랜잭션: 신고 업데이트 + 상담 생성
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'assigned',
        assigned_lawyer_id: lawyerId,
      })
      .eq('id', report_id)
      .eq('status', 'submitted') // 낙관적 잠금
      .is('assigned_lawyer_id', null)
      .select()
      .single();

    if (updateError || !updatedReport) {
      throw new Error('Failed to assign report (conflict)', {
        cause: { status: 409 },
      });
    }

    const { data: consultation, error: createError } = await supabase
      .from('consultations')
      .insert({
        report_id,
        teacher_id: report.user_id,
        lawyer_id: lawyerId,
        status: 'pending',
      })
      .select()
      .single();

    if (createError || !consultation) {
      // 롤백: 신고 상태 복원
      await supabase
        .from('reports')
        .update({ status: 'submitted', assigned_lawyer_id: null })
        .eq('id', report_id);

      throw new Error(`Failed to create consultation: ${createError?.message}`);
    }

    return {
      consultation: {
        id: consultation.id,
        report_id: consultation.report_id,
        teacher_id: consultation.teacher_id,
        lawyer_id: consultation.lawyer_id,
        status: consultation.status,
        created_at: consultation.created_at,
      },
      report: {
        id: updatedReport.id,
        status: updatedReport.status,
        assigned_lawyer_id: updatedReport.assigned_lawyer_id,
      },
    };
  }
}
```

---

### 4.3 Step 3: API 엔드포인트 구현 (API)

#### 4.3.1 미배정 신고 목록 API

**파일**: `src/app/api/lawyers/available-reports/route.ts`

```typescript
// @CODE:MATCH-001:API | SPEC: SPEC-MATCH-001.md | TEST: tests/api/lawyers/available-reports.test.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { MatchingService } from '@/lib/services/matching-service';

export async function GET(request: NextRequest) {
  try {
    // 1. JWT 인증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'lawyer') {
      return NextResponse.json(
        { error: 'Forbidden: Lawyer role required' },
        { status: 403 }
      );
    }

    // 2. 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const query = {
      category: searchParams.get('category') || undefined,
      sort: (searchParams.get('sort') as 'created_at' | 'incident_date') || 'created_at',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    };

    // 3. 서비스 호출
    const matchingService = new MatchingService();
    const result = await matchingService.getAvailableReports(query);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('GET /api/lawyers/available-reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 4.3.2 상담 시작 API

**파일**: `src/app/api/consultations/route.ts`

```typescript
// @CODE:MATCH-001:API | SPEC: SPEC-MATCH-001.md | TEST: tests/api/consultations/create.test.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { MatchingService } from '@/lib/services/matching-service';
import { z } from 'zod';

const createConsultationSchema = z.object({
  report_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. JWT 인증
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role !== 'lawyer') {
      return NextResponse.json(
        { error: 'Forbidden: Lawyer role required' },
        { status: 403 }
      );
    }

    // 2. 요청 본문 검증
    const body = await request.json();
    const validationResult = createConsultationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error },
        { status: 400 }
      );
    }

    // 3. 서비스 호출
    const matchingService = new MatchingService();
    const result = await matchingService.selectReport(
      payload.userId,
      validationResult.data
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/consultations error:', error);

    const status = error.cause?.status || 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}
```

---

## 5. 테스트 시나리오

### 5.1 미배정 신고 목록 조회 테스트

**파일**: `tests/api/lawyers/available-reports.test.ts`

```typescript
// @TEST:MATCH-001 | SPEC: SPEC-MATCH-001.md

import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient, createTestUser, createTestReport } from '@/tests/helpers';

describe('GET /api/lawyers/available-reports', () => {
  it('변호사가 미배정 신고 목록을 조회할 수 있다', async () => {
    // Given: 미배정 신고 3개, 배정된 신고 1개
    const lawyer = await createTestUser({ role: 'lawyer' });
    const token = generateTestToken(lawyer);

    const report1 = await createTestReport({ status: 'submitted' });
    const report2 = await createTestReport({ status: 'submitted' });
    const report3 = await createTestReport({ status: 'assigned' });

    // When: 목록 조회 요청
    const response = await fetch('/api/lawyers/available-reports', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Then: 미배정 신고만 반환
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.reports).toHaveLength(2);
    expect(data.reports.map(r => r.id)).toContain(report1.id);
    expect(data.reports.map(r => r.id)).toContain(report2.id);
    expect(data.reports.map(r => r.id)).not.toContain(report3.id);
  });

  it('변호사 역할이 아니면 403 에러를 반환한다', async () => {
    // Given: teacher 역할 사용자
    const teacher = await createTestUser({ role: 'teacher' });
    const token = generateTestToken(teacher);

    // When: 목록 조회 요청
    const response = await fetch('/api/lawyers/available-reports', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Then: 403 Forbidden
    expect(response.status).toBe(403);
  });

  it('카테고리 필터링이 동작한다', async () => {
    // Given: 카테고리별 신고
    await createTestReport({ status: 'submitted', category: 'parent' });
    await createTestReport({ status: 'submitted', category: 'student' });

    // When: 'parent' 카테고리만 조회
    const response = await fetch('/api/lawyers/available-reports?category=parent', {
      headers: { Authorization: `Bearer ${lawyerToken}` },
    });

    // Then: 'parent' 카테고리만 반환
    const data = await response.json();
    expect(data.reports.every(r => r.category === 'parent')).toBe(true);
  });
});
```

### 5.2 상담 시작 테스트

**파일**: `tests/api/consultations/create.test.ts`

```typescript
// @TEST:MATCH-001 | SPEC: SPEC-MATCH-001.md

import { describe, it, expect } from 'vitest';

describe('POST /api/consultations', () => {
  it('변호사가 미배정 신고를 선택하여 상담을 시작할 수 있다', async () => {
    // Given: 미배정 신고
    const lawyer = await createTestUser({ role: 'lawyer' });
    const report = await createTestReport({ status: 'submitted' });

    // When: 상담 시작 요청
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${generateTestToken(lawyer)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_id: report.id }),
    });

    // Then: 상담 생성 성공, 신고 상태 변경
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.consultation.lawyer_id).toBe(lawyer.id);
    expect(data.report.status).toBe('assigned');
    expect(data.report.assigned_lawyer_id).toBe(lawyer.id);
  });

  it('이미 배정된 신고를 선택하면 409 에러를 반환한다', async () => {
    // Given: 이미 배정된 신고
    const lawyer1 = await createTestUser({ role: 'lawyer' });
    const lawyer2 = await createTestUser({ role: 'lawyer' });
    const report = await createTestReport({
      status: 'assigned',
      assigned_lawyer_id: lawyer1.id,
    });

    // When: 다른 변호사가 선택 시도
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${generateTestToken(lawyer2)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_id: report.id }),
    });

    // Then: 409 Conflict
    expect(response.status).toBe(409);
  });

  it('진행 중인 상담이 10개 이상이면 403 에러를 반환한다', async () => {
    // Given: 변호사가 진행 중인 상담 10개 보유
    const lawyer = await createTestUser({ role: 'lawyer' });
    for (let i = 0; i < 10; i++) {
      await createTestConsultation({ lawyer_id: lawyer.id, status: 'active' });
    }

    const newReport = await createTestReport({ status: 'submitted' });

    // When: 11번째 신고 선택 시도
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${generateTestToken(lawyer)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ report_id: newReport.id }),
    });

    // Then: 403 Forbidden
    expect(response.status).toBe(403);
  });
});
```

---

## 6. 구현 순서

### 6.1 Phase 1: RED (테스트 작성)

1. `tests/lib/services/matching-service.test.ts` 작성
2. `tests/api/lawyers/available-reports.test.ts` 작성
3. `tests/api/consultations/create.test.ts` 작성
4. 테스트 실행 → 모두 실패 확인 ✅

### 6.2 Phase 2: GREEN (최소 구현)

1. `src/lib/types/matching.ts` 타입 정의
2. `src/lib/services/matching-service.ts` 서비스 구현
3. `src/app/api/lawyers/available-reports/route.ts` API 구현
4. `src/app/api/consultations/route.ts` API 구현
5. 테스트 실행 → 모두 통과 확인 ✅

### 6.3 Phase 3: REFACTOR (코드 개선)

1. 중복 로직 제거 (공통 인증 미들웨어 추출)
2. 에러 처리 개선 (커스텀 에러 클래스)
3. 타입 안전성 강화 (Zod 스키마 확장)
4. 테스트 커버리지 확인 (≥ 85%) ✅

---

## 7. 마이그레이션 계획

### 7.1 데이터베이스 변경사항

**없음** - 기존 SPEC-INFRA-001 스키마 그대로 사용

### 7.2 기존 코드 영향도

- **SPEC-REPORT-001**: `reports.status` 흐름에 `assigned` 상태 추가 (이미 ENUM에 존재)
- **SPEC-AUTH-001**: 역할 검증 로직 재사용

---

## 8. 배포 체크리스트

- [ ] 모든 테스트 통과 (≥ 85% 커버리지)
- [ ] TypeScript 타입 체크 통과
- [ ] ESLint/Prettier 통과
- [ ] Supabase RLS 정책 검증
- [ ] API 문서 업데이트 (Swagger/OpenAPI)
- [ ] `.moai/reports/sync-report.md` 업데이트 (`/alfred:3-sync`)

---

## 9. 롤백 계획

구현 실패 시 롤백 단계:
1. Git 커밋 되돌리기 (`git revert`)
2. 데이터베이스 마이그레이션 없음 (롤백 불필요)
3. 테스트 파일만 남기고 구현 파일 삭제

---

**다음 단계**: `/alfred:2-build MATCH-001` 실행하여 TDD 구현 시작
