// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * Community Test Page - Hooks 및 Components 테스트
 */

'use client';

import { PostList } from '@/components/community/PostList';
import { useState } from 'react';
import type { PostCategory, PostSort } from '@/types/community.types';

export default function CommunityTestPage() {
  const [category, setCategory] = useState<PostCategory | undefined>();
  const [sort, setSort] = useState<PostSort>('latest');

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">커뮤니티 게시판 (테스트)</h1>

      {/* 필터 */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">카테고리</label>
          <select
            value={category || 'all'}
            onChange={(e) => setCategory(e.target.value === 'all' ? undefined : e.target.value as PostCategory)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">전체</option>
            <option value="case">사례</option>
            <option value="qa">Q&A</option>
            <option value="info">정보</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">정렬</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as PostSort)}
            className="border rounded-md px-3 py-2"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>

      {/* 게시글 목록 */}
      <PostList category={category} sort={sort} />
    </div>
  );
}
