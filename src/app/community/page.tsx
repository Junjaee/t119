// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * Community Main Page - 커뮤니티 메인 페이지
 *
 * @SPEC:COMMUNITY-001 UR-002 (게시글 목록 조회)
 * - 카테고리별 필터링 (전체, 사례, Q&A, 정보)
 * - 정렬 (최신순, 인기순)
 * - 게시글 작성 버튼
 */

'use client';

import { PostList } from '@/components/community/PostList';
import { useState } from 'react';
import Link from 'next/link';
import type { PostCategory, PostSort } from '@/types/community.types';

const CATEGORY_OPTIONS: Array<{ value: PostCategory | 'all'; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'case', label: '사례' },
  { value: 'qa', label: 'Q&A' },
  { value: 'info', label: '정보' },
];

const SORT_OPTIONS: Array<{ value: PostSort; label: string }> = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];

export default function CommunityPage() {
  const [category, setCategory] = useState<PostCategory | undefined>();
  const [sort, setSort] = useState<PostSort>('latest');

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">커뮤니티</h1>
          <p className="text-gray-600">
            사례를 공유하고 질문을 나누는 공간입니다
          </p>
        </div>

        {/* 게시글 작성 버튼 */}
        <Link
          href="/community/new"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          글쓰기
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* 카테고리 필터 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <div className="flex gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setCategory(option.value === 'all' ? undefined : option.value as PostCategory)
                  }
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    (option.value === 'all' && !category) ||
                    category === option.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 필터 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬
            </label>
            <div className="flex gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSort(option.value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    sort === option.value
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <PostList category={category} sort={sort} />
    </div>
  );
}
