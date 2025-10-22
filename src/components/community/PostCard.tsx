// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * PostCard - 게시글 카드 컴포넌트
 *
 * @SPEC:COMMUNITY-001 UR-002 (게시판 목록 표시)
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Post } from '@/types/community.types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface PostCardProps {
  post: Post;
}

const CATEGORY_LABELS = {
  case: '사례',
  qa: 'Q&A',
  info: '정보',
} as const;

export function PostCard({ post }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ko,
  });

  return (
    <Link href={`/community/${post.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[post.category]}
            </Badge>
            {post.is_popular && (
              <Badge variant="default" className="text-xs bg-red-500">
                인기
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-semibold line-clamp-2">{post.title}</h3>
        </CardHeader>

        <CardContent className="pb-3">
          <p className="text-sm text-gray-600 line-clamp-3">{post.content}</p>
        </CardContent>

        <CardFooter className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
          <span className="font-medium">{post.anonymous_nickname}</span>
          <div className="flex items-center gap-3">
            <span>조회 {post.view_count}</span>
            <span>{timeAgo}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
