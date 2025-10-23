// @CODE:REPORT-FORM-001:F3 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md | TEST: tests/app/reports/new/page.test.tsx
// 신고 작성 페이지

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ReportForm from "@/components/reports/ReportForm";

/**
 * 신고 작성 페이지 (/reports/new)
 * @description 교사만 접근 가능한 신고 작성 페이지
 * @requirements
 * - REQ-004: 교사가 대시보드에서 '신고하기' 버튼을 클릭하면 이동
 * - CON-001: 교사 역할만 접근 가능
 * @tdd
 * - RED: 페이지 테스트 작성 (인증 검증, 렌더링, 접근성)
 * - GREEN: 페이지 구현 (useAuth, router.back, ReportForm)
 * - REFACTOR: 코드 품질 개선 (주석, 구조 최적화)
 */
export default function ReportNewPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  // 인증 및 권한 검증
  useEffect(() => {
    // 가드절: 로딩 중에는 리다이렉트 하지 않음
    if (isLoading) return;

    // 가드절: 미인증 사용자는 로그인 페이지로
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    // 가드절: 교사가 아닌 경우 대시보드로
    if (user.role !== "teacher") {
      router.push("/dashboard");
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  // 인증되지 않았거나 권한이 없는 경우 (리다이렉트 전까지 빈 화면)
  if (!isAuthenticated || !user || user.role !== "teacher") {
    return null;
  }

  /**
   * 뒤로가기 핸들러
   * @description 이전 페이지로 돌아가기 (router.back())
   */
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 영역 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={handleBack}
            aria-label="뒤로가기"
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>뒤로가기</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">신고 작성</h1>
        </div>

        {/* 안내 메시지 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            교권 침해 사건을 신고하실 수 있습니다. 필수 항목을 모두
            입력해주세요.
          </p>
        </div>

        {/* 신고 폼 */}
        <ReportForm />
      </div>
    </div>
  );
}
