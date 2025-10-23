// @CODE:REPORT-FORM-001:F2 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md | TEST: tests/components/reports/report-form.test.tsx
// ReportForm 메인 컴포넌트

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import FileUpload from "./FileUpload";
import {
  reportFormSchema,
  type ReportFormData,
  reportFormCategories,
  reportFormPriorities,
} from "@/lib/validators/report-form.validator";

/**
 * API 요청 데이터 타입
 * @description POST /api/reports 호출 시 사용
 */
interface CreateReportRequest {
  category: string;
  title: string;
  description: string;
  incident_date: string;
  priority: string;
  evidence_files?: string[];
}

/**
 * 카테고리 한글 라벨 매핑
 */
const CATEGORY_LABELS: Record<(typeof reportFormCategories)[number], string> = {
  parent: "학부모",
  student: "학생",
  other: "기타",
};

/**
 * 우선순위 한글 라벨 매핑
 */
const PRIORITY_LABELS: Record<(typeof reportFormPriorities)[number], string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  critical: "긴급",
};

export default function ReportForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    mode: "onChange",
  });

  const createReportMutation = useMutation({
    mutationFn: async (data: CreateReportRequest) => {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create report");
      }

      return response.json();
    },
    onSuccess: () => {
      router.push("/reports");
    },
    onError: (error) => {
      console.error("Report creation failed:", error);
      setSubmitError("서버 오류가 발생했습니다. 다시 시도해주세요.");
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    setSubmitError(null);

    // TODO: 파일 업로드 처리 (Supabase Storage)
    const evidenceFiles: string[] = [];

    const requestData: CreateReportRequest = {
      category: data.category,
      title: data.title,
      description: data.description,
      incident_date: data.incidentDate,
      priority: data.priority,
      evidence_files: evidenceFiles.length > 0 ? evidenceFiles : undefined,
    };

    createReportMutation.mutate(requestData);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 space-y-6"
    >
      <h1 className="text-2xl font-bold">신고 작성</h1>

      {/* 카테고리 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          카테고리 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          {reportFormCategories.map((category) => (
            <label key={category} className="flex items-center gap-2">
              <input
                type="radio"
                value={category}
                {...register("category")}
                className="w-4 h-4"
              />
              <span>{CATEGORY_LABELS[category]}</span>
            </label>
          ))}
        </div>
        {errors.category && (
          <p role="alert" className="text-sm text-red-600">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* 제목 입력 */}
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="5~100자"
        />
        {errors.title && (
          <p role="alert" className="text-sm text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* 상세 설명 입력 */}
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          상세 설명 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="20~2000자"
        />
        {errors.description && (
          <p role="alert" className="text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* 사건 발생일 */}
      <div className="space-y-2">
        <label htmlFor="incidentDate" className="block text-sm font-medium">
          사건 발생일 <span className="text-red-500">*</span>
        </label>
        <input
          id="incidentDate"
          type="date"
          {...register("incidentDate")}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.incidentDate && (
          <p role="alert" className="text-sm text-red-600">
            {errors.incidentDate.message}
          </p>
        )}
      </div>

      {/* 우선순위 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          우선순위 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          {reportFormPriorities.map((priority) => (
            <label key={priority} className="flex items-center gap-2">
              <input
                type="radio"
                value={priority}
                {...register("priority")}
                className="w-4 h-4"
              />
              <span>{PRIORITY_LABELS[priority]}</span>
            </label>
          ))}
        </div>
        {errors.priority && (
          <p role="alert" className="text-sm text-red-600">
            {errors.priority.message}
          </p>
        )}
      </div>

      {/* 파일 업로드 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          증거 파일 (최대 5개, 파일당 10MB)
        </label>
        <FileUpload files={files} onFilesChange={setFiles} />
      </div>

      {/* 제출 에러 메시지 */}
      {submitError && (
        <div role="alert" className="p-3 bg-red-100 text-red-700 rounded">
          {submitError}
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/teacher")}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={!isValid || createReportMutation.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {createReportMutation.isPending ? "제출 중..." : "제출"}
        </button>
      </div>
    </form>
  );
}
