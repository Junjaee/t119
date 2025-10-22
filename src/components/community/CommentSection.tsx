// @CODE:COMMUNITY-001:UI | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * CommentSection - 댓글 영역 컴포넌트
 *
 * @SPEC:COMMUNITY-001 UR-003 (게시글 상세 조회 및 댓글 작성)
 */

'use client';

import { useState } from 'react';
import { useCreateComment } from '@/hooks/community';
import type { Comment } from '@/types/community.types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface CommentSectionProps {
  postId: string;
  comments: Comment[];
}

export function CommentSection({ postId, comments }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const createComment = useCreateComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentText.length < 1 || commentText.length > 500) {
      return;
    }

    createComment.mutate(
      {
        post_id: postId,
        content: commentText.trim(),
      },
      {
        onSuccess: () => {
          setCommentText('');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* 댓글 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          댓글 {comments.length}개
        </h3>

        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            첫 댓글을 작성해보세요!
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">
                    {comment.anonymous_nickname}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 댓글 작성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="댓글을 입력하세요 (1~500자)"
          className="w-full border rounded-lg p-3 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={500}
        />

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {commentText.length}/500
          </span>

          <button
            type="submit"
            disabled={
              createComment.isPending ||
              commentText.length < 1 ||
              commentText.length > 500
            }
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {createComment.isPending ? '작성 중...' : '댓글 작성'}
          </button>
        </div>

        {createComment.isError && (
          <p className="text-sm text-red-500">
            댓글 작성에 실패했습니다. 다시 시도해주세요.
          </p>
        )}
      </form>
    </div>
  );
}
