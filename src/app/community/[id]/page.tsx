// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * PostDetail Page - 게시글 상세 페이지
 *
 * @SPEC:COMMUNITY-001 UR-003 (게시글 상세 조회 및 댓글 작성)
 */

'use client';

import { usePost, useReportPost } from '@/hooks/community';
import { CommentSection } from '@/components/community/CommentSection';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { useState } from 'react';

const CATEGORY_LABELS = {
  case: '사례',
  qa: 'Q&A',
  info: '정보',
} as const;

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading, isError, error } = usePost(params.id);
  const reportPost = useReportPost();
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || reportReason.length < 1 || reportReason.length > 200) {
      return;
    }

    reportPost.mutate(
      {
        post_id: params.id,
        reason: reportReason.trim(),
      },
      {
        onSuccess: () => {
          setReportReason('');
          setShowReportForm(false);
          alert('신고가 접수되었습니다.');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">
            게시글을 불러오는데 실패했습니다.
          </p>
          <p className="text-sm text-gray-500 mb-6">{error?.message}</p>
          <Link
            href="/community/test"
            className="text-blue-500 hover:underline"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { post, comments } = data;

  if (post.is_blinded) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-6">
            신고가 누적되어 블라인드 처리된 게시글입니다.
          </p>
          <Link
            href="/community/test"
            className="text-blue-500 hover:underline"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* 상단 네비게이션 */}
      <div className="mb-6">
        <Link
          href="/community/test"
          className="text-blue-500 hover:underline text-sm"
        >
          ← 목록으로
        </Link>
      </div>

      {/* 게시글 상세 */}
      <article className="bg-white border rounded-lg p-6 mb-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              {CATEGORY_LABELS[post.category]}
            </span>
            {post.is_popular && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                인기
              </span>
            )}
          </div>

          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            신고
          </button>
        </div>

        {/* 제목 */}
        <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

        {/* 메타 정보 */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-6 pb-6 border-b">
          <span>{post.anonymous_nickname}</span>
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
              locale: ko,
            })}
          </span>
          <span>•</span>
          <span>조회 {post.view_count.toLocaleString()}</span>
        </div>

        {/* 본문 */}
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* 첨부 이미지 */}
        {post.image_url && (
          <div className="mt-6">
            <img
              src={post.image_url}
              alt="첨부 이미지"
              className="max-w-full rounded-lg"
            />
          </div>
        )}
      </article>

      {/* 신고 폼 */}
      {showReportForm && (
        <div className="bg-gray-50 border rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">게시글 신고</h3>
          <form onSubmit={handleReport} className="space-y-4">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="신고 사유를 입력하세요 (1~200자)"
              className="w-full border rounded-lg p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              maxLength={200}
            />

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {reportReason.length}/200
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    reportPost.isPending ||
                    reportReason.length < 1 ||
                    reportReason.length > 200
                  }
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {reportPost.isPending ? '신고 중...' : '신고하기'}
                </button>
              </div>
            </div>

            {reportPost.isError && (
              <p className="text-sm text-red-500">
                신고 접수에 실패했습니다. 다시 시도해주세요.
              </p>
            )}
          </form>
        </div>
      )}

      {/* 댓글 섹션 */}
      <div className="bg-white border rounded-lg p-6">
        <CommentSection postId={params.id} comments={comments} />
      </div>
    </div>
  );
}
