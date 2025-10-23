# SPEC-REPORT-FORM-001 구현 계획서

> **신고 작성 및 제출 페이지 구현 계획**

---

## 1. 구현 개요

### 목표
교사가 교권 침해 사건을 신고할 수 있는 웹 폼 페이지를 구현합니다. 실시간 검증, 파일 업로드, 에러 처리를 포함한 완전한 신고 작성 경험을 제공합니다.

### 구현 범위
- 신고 작성 페이지 (/reports/new)
- 신고 폼 컴포넌트 (react-hook-form + Zod)
- 파일 업로드 컴포넌트 (react-dropzone)
- 신고 생성 API (POST /api/reports)
- 클라이언트/서버 검증
- 에러 처리 및 로딩 상태

---

## 2. 우선순위별 구현 단계

### 1차 목표: 기본 신고 폼 구현
- [ ] 신고 폼 페이지 라우트 생성 (/reports/new)
- [ ] ReportForm 컴포넌트 구조 설계
- [ ] Zod 검증 스키마 정의
- [ ] react-hook-form 통합
- [ ] 필수 필드 입력 UI (카테고리, 제목, 설명, 날짜, 우선순위)

### 2차 목표: 파일 업로드 기능
- [ ] FileUpload 컴포넌트 구현
- [ ] react-dropzone 통합
- [ ] 파일 크기/개수/형식 검증
- [ ] 파일 미리보기 및 삭제 기능
- [ ] Supabase Storage 업로드 로직

### 3차 목표: API 연동 및 제출
- [ ] POST /api/reports API 구현
- [ ] React Query useMutation 통합
- [ ] 제출 성공 시 리다이렉트
- [ ] 제출 실패 시 에러 처리
- [ ] 로딩 상태 UI

### 4차 목표: 고급 기능
- [ ] 로컬스토리지 임시 저장
- [ ] 임시 저장 복구 기능
- [ ] 실시간 검증 피드백
- [ ] 접근성 개선 (ARIA 속성)
- [ ] 반응형 디자인 최적화

---

## 3. 기술적 접근 방법

### 3.1 폼 관리 전략
- **react-hook-form**: 폼 상태 관리, 검증 트리거
- **Zod**: 타입 안전 검증 스키마 정의
- **zodResolver**: react-hook-form과 Zod 통합

### 3.2 파일 업로드 전략
- **react-dropzone**: 드래그&드롭 UI
- **Supabase Storage**: 파일 저장소
- **2단계 업로드**:
  1. 클라이언트 → Supabase Storage (파일 업로드)
  2. 클라이언트 → API → Database (URL 저장)

### 3.3 상태 관리
- **폼 상태**: react-hook-form (로컬 상태)
- **API 상태**: React Query (useMutation)
- **파일 상태**: useState (파일 목록)

### 3.4 검증 전략
- **클라이언트 검증**: Zod 스키마 (즉시 피드백)
- **서버 검증**: API 라우트에서 재검증 (보안)
- **파일 검증**: 클라이언트 + 서버 (MIME 타입, 크기)

---

## 4. 아키텍처 설계

### 4.1 컴포넌트 구조

```
/reports/new (page.tsx)
  └─ ReportForm (ReportForm.tsx)
      ├─ CategorySelector (CategorySelector.tsx)
      ├─ Input (title)
      ├─ Textarea (description)
      ├─ DatePicker (incidentDate)
      ├─ PrioritySelector (priority)
      └─ FileUpload (FileUpload.tsx)
          ├─ Dropzone (react-dropzone)
          └─ FileList
              └─ FileItem (미리보기 + 삭제)
```

### 4.2 데이터 흐름

```
사용자 입력
  ↓
ReportForm (react-hook-form)
  ↓
Zod 검증 (실시간)
  ↓
파일 업로드 (Supabase Storage)
  ↓
useMutation (React Query)
  ↓
POST /api/reports
  ↓
Database 저장 (Supabase PostgreSQL)
  ↓
성공: /reports로 리다이렉트
실패: 에러 메시지 표시
```

---

## 5. 파일 구조

```
src/app/reports/new/
├── page.tsx                    # /reports/new 페이지
└── loading.tsx                 # 로딩 스피너 (선택)

src/components/reports/
├── ReportForm.tsx              # 신고 폼 메인 컴포넌트
├── FileUpload.tsx              # 파일 업로드 컴포넌트
├── CategorySelector.tsx        # 카테고리 선택 컴포넌트
└── PrioritySelector.tsx        # 우선순위 선택 컴포넌트

src/lib/validators/
└── report.validator.ts         # Zod 검증 스키마

src/app/api/reports/
└── route.ts                    # POST /api/reports API

src/lib/hooks/
└── useReportForm.ts            # 신고 폼 커스텀 훅 (선택)

src/lib/utils/
└── file-upload.ts              # 파일 업로드 유틸리티
```

---

## 6. 핵심 구현 상세

### 6.1 Zod 검증 스키마 (report.validator.ts)

```typescript
import { z } from 'zod';

export const reportFormSchema = z.object({
  category: z.enum(['parent', 'student', 'other'], {
    required_error: '카테고리를 선택해주세요',
  }),
  title: z
    .string()
    .min(5, '제목은 5자 이상이어야 합니다')
    .max(100, '제목은 100자 이하여야 합니다'),
  description: z
    .string()
    .min(20, '설명은 20자 이상이어야 합니다')
    .max(2000, '설명은 2000자 이하여야 합니다'),
  incidentDate: z
    .string()
    .refine((date) => new Date(date) <= new Date(), {
      message: '미래 날짜는 선택할 수 없습니다',
    }),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: '우선순위를 선택해주세요',
  }),
  files: z
    .array(z.instanceof(File))
    .max(5, '최대 5개까지 업로드 가능합니다')
    .optional(),
});

export type ReportFormData = z.infer<typeof reportFormSchema>;
```

### 6.2 ReportForm 컴포넌트 (ReportForm.tsx)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { reportFormSchema, type ReportFormData } from '@/lib/validators/report.validator';

export function ReportForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isValid } } = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    mode: 'onChange', // 실시간 검증
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      // 1. 파일 업로드 (Supabase Storage)
      const fileUrls = await uploadFiles(data.files);

      // 2. 신고 생성 API 호출
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          evidence_files: fileUrls,
        }),
      });

      if (!response.ok) throw new Error('신고 생성 실패');
      return response.json();
    },
    onSuccess: () => {
      router.push('/reports');
      // 토스트 메시지 표시 (선택)
    },
    onError: (error) => {
      console.error('신고 제출 실패:', error);
      // 에러 메시지 표시
    },
  });

  const onSubmit = (data: ReportFormData) => {
    createReportMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 폼 필드들 */}
      <button
        type="submit"
        disabled={!isValid || createReportMutation.isPending}
      >
        {createReportMutation.isPending ? '제출 중...' : '제출하기'}
      </button>
    </form>
  );
}
```

### 6.3 POST /api/reports API (route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reportFormSchema } from '@/lib/validators/report.validator';

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 요청 바디 파싱
    const body = await request.json();

    // 3. 서버 사이드 검증
    const validatedData = reportFormSchema.parse(body);

    // 4. 데이터베이스 저장
    const { data, error } = await supabase
      .from('reports')
      .insert({
        teacher_id: user.id,
        category: validatedData.category,
        title: validatedData.title,
        description: validatedData.description,
        incident_date: validatedData.incidentDate,
        priority: validatedData.priority,
        evidence_files: body.evidence_files || [],
        status: 'submitted',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('신고 생성 실패:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## 7. 리스크 및 대응 방안

### 7.1 파일 업로드 실패
- **문제**: 네트워크 불안정으로 파일 업로드 실패
- **대응**:
  - 재시도 로직 (최대 3회)
  - 실패한 파일만 재업로드
  - 에러 메시지 명확히 표시

### 7.2 폼 데이터 유실
- **문제**: 페이지 새로고침 또는 브라우저 종료 시 데이터 유실
- **대응**:
  - 로컬스토리지 임시 저장 (OPT-001)
  - 페이지 이탈 전 경고 (beforeunload)

### 7.3 검증 불일치
- **문제**: 클라이언트와 서버 검증 로직 불일치
- **대응**:
  - Zod 스키마 공유 (클라이언트 + 서버)
  - 서버 검증 필수 적용

---

## 8. 테스트 전략

### 8.1 단위 테스트
- Zod 검증 스키마 (필수 필드, 길이 제한)
- 파일 업로드 유틸리티 (크기, 형식 검증)
- API 라우트 (POST /api/reports)

### 8.2 통합 테스트
- 폼 제출 전체 흐름 (입력 → 검증 → API → 리다이렉트)
- 파일 업로드 → Supabase Storage → URL 저장

### 8.3 E2E 테스트
- 정상 신고 작성 및 제출
- 필수 필드 미입력 시 에러
- 파일 업로드 및 삭제
- 파일 크기/개수 초과 에러

---

## 9. 성능 최적화

- **디바운스**: 실시간 검증에 300ms 디바운스 적용
- **지연 로딩**: FileUpload 컴포넌트 동적 임포트
- **이미지 최적화**: 파일 미리보기 썸네일 생성
- **캐싱**: React Query 캐싱 전략 (staleTime: 5분)

---

## 10. 접근성 체크리스트

- [ ] 모든 입력 필드에 `<label>` 연결
- [ ] 에러 메시지에 `aria-describedby` 연결
- [ ] 필수 필드에 `aria-required="true"`
- [ ] 제출 버튼 비활성화 시 `aria-disabled="true"`
- [ ] 파일 업로드 영역에 `role="button"`
- [ ] 키보드 네비게이션 지원 (Tab, Enter, Escape)

---

## 11. 배포 체크리스트

- [ ] 환경변수 설정 (Supabase URL, Key)
- [ ] Supabase Storage RLS 정책 설정
- [ ] API 라우트 인증 미들웨어 적용
- [ ] 에러 로깅 설정 (Sentry 등)
- [ ] 성능 모니터링 설정 (Vercel Analytics)

---

**작성자**: @Alfred
**최종 업데이트**: 2025-10-23
