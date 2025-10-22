// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * PostList - 게시글 목록 컴포넌트
 *
 * @SPEC:COMMUNITY-001 UR-002 (카테고리별 게시판 조회)
 */

'use client';

import { usePosts } from '@/hooks/community';
import { PostCard } from './PostCard';
import type { PostCategory, PostSort } from '@/types/community.types';

export interface PostListProps {
  category?: PostCategory;
  sort?: PostSort;
  page?: number;
  limit?: number;
}

export function PostList({ category, sort = 'latest', page = 1, limit = 20 }: PostListProps) {
  const { data, isLoading, isError, error } = usePosts({ category, sort, page, limit });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">게시글을 불러오는데 실패했습니다.</p>
        <p className="text-sm text-gray-500 mt-2">{error?.message}</p>
      </div>
    );
  }

  if (!data || data.posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* 페이지네이션 정보 */}
      <div className="text-center text-sm text-gray-500 pt-4">
        전체 {data.total}개의 게시글
      </div>
    </div>
  );
}
