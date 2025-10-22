// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * PostForm Page - 게시글 작성 페이지
 *
 * @SPEC:COMMUNITY-001 UR-001 (익명 게시글 작성)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreatePost, useDraft, useSaveDraft } from '@/hooks/community';
import { createPostSchema } from '@/lib/validators/post.validator';
import type { CreatePostInput } from '@/types/community.types';

const CATEGORY_OPTIONS = [
  { value: 'case', label: '사례 공유' },
  { value: 'qa', label: 'Q&A' },
  { value: 'info', label: '정보 공유' },
] as const;

export default function PostFormPage() {
  const router = useRouter();
  const createPost = useCreatePost();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      category: 'case',
      title: '',
      content: '',
    },
  });

  const formValues = watch();

  // 임시 저장 hooks
  const { data: draftData } = useDraft(formValues.category);
  const saveDraft = useSaveDraft();

  // 임시 저장 불러오기
  useEffect(() => {
    if (draftData) {
      setValue('category', draftData.category);
      setValue('title', draftData.title);
      setValue('content', draftData.content);
    }
  }, [draftData, setValue]);

  // 자동 임시 저장 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      if (formValues.title || formValues.content) {
        setAutoSaveStatus('saving');
        saveDraft.mutate(
          {
            category: formValues.category,
            title: formValues.title,
            content: formValues.content,
          },
          {
            onSuccess: () => {
              setAutoSaveStatus('saved');
              setTimeout(() => setAutoSaveStatus(null), 2000);
            },
          }
        );
      }
    }, 30000); // 30초

    return () => clearInterval(interval);
  }, [formValues, saveDraft]);

  const onSubmit = async (data: CreatePostInput) => {
    createPost.mutate(data, {
      onSuccess: (result) => {
        // 임시 저장 삭제 (선택사항)
        router.push(`/community/${result.id}`);
      },
    });
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 있습니다. 나가시겠습니까?')) {
      router.push('/community/test');
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">게시글 작성</h1>
        {autoSaveStatus && (
          <span className="text-sm text-gray-500">
            {autoSaveStatus === 'saving' ? '임시 저장 중...' : '임시 저장 완료'}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            카테고리 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category')}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            제목 <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-2">
              (5~100자)
            </span>
          </label>
          <input
            type="text"
            {...register('title')}
            placeholder="제목을 입력하세요"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.title ? (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            ) : (
              <span className="text-sm text-gray-500">
                {formValues.title.length}/100
              </span>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            본문 <span className="text-red-500">*</span>
            <span className="text-gray-500 font-normal ml-2">
              (20~5000자)
            </span>
          </label>
          <textarea
            {...register('content')}
            placeholder="본문을 입력하세요"
            className="w-full border rounded-lg px-3 py-2 min-h-[300px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={5000}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.content ? (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            ) : (
              <span className="text-sm text-gray-500">
                {formValues.content.length}/5000
              </span>
            )}
          </div>
        </div>

        {/* 첨부 이미지 (선택사항) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            첨부 이미지 (선택사항)
          </label>
          <input
            type="text"
            {...register('image_url')}
            placeholder="이미지 URL을 입력하세요"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.image_url && (
            <p className="text-sm text-red-500 mt-1">{errors.image_url.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Supabase Storage 연동 시 이미지 업로드 기능이 추가됩니다
          </p>
        </div>

        {/* 에러 메시지 */}
        {createPost.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">
              게시글 작성에 실패했습니다. 다시 시도해주세요.
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            disabled={isSubmitting || createPost.isPending}
          >
            취소
          </button>

          <button
            type="button"
            onClick={() => {
              saveDraft.mutate(formValues, {
                onSuccess: () => {
                  alert('임시 저장되었습니다.');
                },
              });
            }}
            className="px-6 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50"
            disabled={isSubmitting || createPost.isPending || saveDraft.isPending}
          >
            {saveDraft.isPending ? '저장 중...' : '임시 저장'}
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={isSubmitting || createPost.isPending}
          >
            {createPost.isPending ? '작성 중...' : '작성 완료'}
          </button>
        </div>
      </form>

      {/* 안내 사항 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">작성 안내</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 게시글은 익명으로 작성되며, 자동으로 익명 닉네임이 부여됩니다</li>
          <li>• 30초마다 자동으로 임시 저장됩니다</li>
          <li>• 부적절한 내용은 신고 3회 누적 시 자동으로 블라인드 처리됩니다</li>
        </ul>
      </div>
    </div>
  );
}
