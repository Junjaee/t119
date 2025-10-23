// @CODE:REPORT-FORM-001:F1 | SPEC: .moai/specs/SPEC-REPORT-FORM-001/spec.md | TEST: tests/components/reports/file-upload.test.tsx
// 파일 업로드 컴포넌트

"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
};

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      // 파일 추가 (비동기로 처리하여 React state 경고 방지)
      queueMicrotask(() => {
        onFilesChange([...files, ...acceptedFiles]);
      });
    },
    [files, onFilesChange],
  );

  const onDropRejected = useCallback((fileRejections: any[]) => {
    if (!fileRejections || fileRejections.length === 0) return;

    const rejection = fileRejections[0];
    const errorCode = rejection.errors?.[0]?.code;

    if (errorCode === "file-too-large") {
      setError("파일이 너무 큽니다 (최대 10MB)");
    } else if (errorCode === "file-invalid-type") {
      setError("지원하지 않는 파일 형식입니다");
    } else if (errorCode === "too-many-files") {
      setError(`최대 ${MAX_FILES}개까지 업로드 가능합니다`);
    } else {
      setError("지원하지 않는 파일 형식입니다");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES - files.length,
    disabled: files.length >= MAX_FILES,
  });

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : files.length >= MAX_FILES
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} aria-label="파일 선택 input" />
        {isDragActive ? (
          <p className="text-blue-600">파일을 여기에 드롭하세요...</p>
        ) : files.length >= MAX_FILES ? (
          <p className="text-gray-500">
            최대 {MAX_FILES}개까지 업로드 가능합니다
          </p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              파일을 드래그하거나 클릭하여 업로드하세요
            </p>
            <button
              type="button"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              aria-label="파일 선택 버튼"
            >
              파일 선택
            </button>
            <p className="text-sm text-gray-500 mt-2">
              최대 {MAX_FILES}개, 파일당 10MB (이미지, 문서, 동영상)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                aria-label={`${file.name} 삭제`}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
