// @CODE:COMMUNITY-001:DOMAIN | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md | TEST: tests/lib/services/community-service.test.ts
/**
 * 커뮤니티 게시판 서비스
 *
 * 주요 기능:
 * - 게시글 작성/조회/수정/삭제 (CRUD)
 * - 댓글 작성/조회
 * - 게시글 신고 기능
 * - 임시 저장 기능
 * - 익명 닉네임 자동 부여
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Post,
  Comment,
  PostReport,
  PostDraft,
  PostCategory,
  PostSort,
  CreatePostInput,
  GetPostListParams,
  CreateCommentInput,
  ReportPostInput,
  SaveDraftInput,
} from '@/types/community.types';
import { generateAnonymousNickname, getNicknameForUser } from '@/lib/utils/nickname-generator';

/**
 * 게시글 작성 결과 타입
 */
export type CreatePostResult =
  | { success: true; post: Post }
  | { success: false; error: string };

/**
 * 게시글 목록 조회 결과 타입
 */
export type GetPostListResult =
  | { success: true; posts: Post[]; total: number }
  | { success: false; error: string };

/**
 * 게시글 상세 조회 결과 타입
 */
export type GetPostDetailResult =
  | { success: true; post: Post; comments: Comment[] }
  | { success: false; error: string };

/**
 * 조회수 증가 결과 타입
 */
export type IncrementViewCountResult =
  | { success: true }
  | { success: false; error: string };

/**
 * 댓글 작성 결과 타입
 */
export type CreateCommentResult =
  | { success: true; comment: Comment }
  | { success: false; error: string };

/**
 * 신고 결과 타입
 */
export type ReportPostResult =
  | { success: true; report: PostReport }
  | { success: false; error: string };

/**
 * 임시 저장 결과 타입
 */
export type SaveDraftResult =
  | { success: true; draft: PostDraft }
  | { success: false; error: string };

/**
 * 임시 저장 조회 결과 타입
 */
export type GetDraftResult =
  | { success: true; draft: PostDraft | null }
  | { success: false; error: string };

/**
 * 게시글 작성
 *
 * @SPEC:COMMUNITY-001 UR-001 (익명 게시글 작성)
 * @SPEC:COMMUNITY-001 ER-001 (익명 닉네임 자동 부여)
 * @SPEC:COMMUNITY-001 C-001, C-002 (제목/본문 길이 제한)
 *
 * @param supabase - Supabase 클라이언트
 * @param input - 게시글 데이터
 * @returns 생성된 게시글 또는 에러
 */
export async function createPost(
  supabase: SupabaseClient,
  input: CreatePostInput
): Promise<CreatePostResult> {
  try {
    // 현재 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      };
    }

    // 익명 닉네임 생성 (ER-001)
    const anonymous_nickname = generateAnonymousNickname();

    // 게시글 생성
    const { data, error } = await supabase
      .from('posts')
      .insert({
        category: input.category,
        title: input.title,
        content: input.content,
        author_id: user.id,
        anonymous_nickname,
        image_url: input.image_url,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `게시글 작성 실패: ${error.message}`,
      };
    }

    return {
      success: true,
      post: data as Post,
    };
  } catch (error) {
    return {
      success: false,
      error: `게시글 작성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 게시글 목록 조회 (페이지네이션)
 *
 * @SPEC:COMMUNITY-001 UR-002 (카테고리별 게시판)
 * @SPEC:COMMUNITY-001 API 설계 (페이지네이션)
 *
 * @param supabase - Supabase 클라이언트
 * @param params - 조회 파라미터 (category, page, limit, sort)
 * @returns 게시글 목록 또는 에러
 */
export async function getPostList(
  supabase: SupabaseClient,
  params: GetPostListParams
): Promise<GetPostListResult> {
  try {
    const { category, page = 1, limit = 20, sort = 'latest' } = params;

    // 페이지네이션 계산
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 쿼리 시작
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('is_blinded', false); // 블라인드 게시글 제외

    // 카테고리 필터 (선택적)
    if (category) {
      query = query.eq('category', category);
    }

    // 정렬
    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'popular') {
      query = query.order('view_count', { ascending: false });
    }

    // 페이지네이션 적용
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return {
        success: false,
        error: `게시글 목록 조회 실패: ${error.message}`,
      };
    }

    return {
      success: true,
      posts: data as Post[],
      total: count || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: `게시글 목록 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 게시글 상세 조회 (댓글 포함)
 *
 * @SPEC:COMMUNITY-001 UR-003 (댓글 조회)
 *
 * @param supabase - Supabase 클라이언트
 * @param postId - 게시글 ID
 * @returns 게시글 상세 정보 및 댓글 목록
 */
export async function getPostDetail(
  supabase: SupabaseClient,
  postId: string
): Promise<GetPostDetailResult> {
  try {
    // 게시글 조회
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return {
        success: false,
        error: '게시글을 찾을 수 없습니다.',
      };
    }

    // 댓글 조회
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsError) {
      return {
        success: false,
        error: `댓글 조회 실패: ${commentsError.message}`,
      };
    }

    return {
      success: true,
      post: post as Post,
      comments: (comments || []) as Comment[],
    };
  } catch (error) {
    return {
      success: false,
      error: `게시글 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 조회수 증가
 *
 * @SPEC:COMMUNITY-001 API 설계 (게시글 상세 조회 시 조회수 +1)
 *
 * @param supabase - Supabase 클라이언트
 * @param postId - 게시글 ID
 * @returns 성공 여부
 */
export async function incrementViewCount(
  supabase: SupabaseClient,
  postId: string
): Promise<IncrementViewCountResult> {
  try {
    // RPC 함수 대신 직접 update 사용
    const { error } = await supabase.rpc('increment_post_view_count', {
      post_id: postId,
    });

    if (error) {
      // RPC 함수가 없을 경우 fallback: 직접 update
      const { error: updateError } = await supabase
        .from('posts')
        .update({ view_count: supabase.sql`view_count + 1` } as any)
        .eq('id', postId);

      if (updateError) {
        return {
          success: false,
          error: `조회수 증가 실패: ${updateError.message}`,
        };
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `조회수 증가 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 댓글 작성
 *
 * @SPEC:COMMUNITY-001 UR-003 (댓글 작성)
 * @SPEC:COMMUNITY-001 ER-001 (게시글별 고정 닉네임)
 * @SPEC:COMMUNITY-001 C-004 (댓글 최대 500자)
 *
 * @param supabase - Supabase 클라이언트
 * @param input - 댓글 데이터
 * @returns 생성된 댓글 또는 에러
 */
export async function createComment(
  supabase: SupabaseClient,
  input: CreateCommentInput
): Promise<CreateCommentResult> {
  try {
    // 현재 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      };
    }

    // 게시글별 고정 닉네임 생성 (ER-001)
    const anonymous_nickname = getNicknameForUser(input.post_id, user.id);

    // 댓글 생성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: input.post_id,
        author_id: user.id,
        anonymous_nickname,
        content: input.content,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `댓글 작성 실패: ${error.message}`,
      };
    }

    return {
      success: true,
      comment: data as Comment,
    };
  } catch (error) {
    return {
      success: false,
      error: `댓글 작성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 게시글 신고
 *
 * @SPEC:COMMUNITY-001 UR-005 (부적절한 콘텐츠 신고)
 * @SPEC:COMMUNITY-001 ER-003 (신고 3회 이상 시 자동 블라인드)
 * @SPEC:COMMUNITY-001 C-007 (중복 신고 불가)
 *
 * @param supabase - Supabase 클라이언트
 * @param input - 신고 데이터
 * @returns 신고 결과 또는 에러
 */
export async function reportPost(
  supabase: SupabaseClient,
  input: ReportPostInput
): Promise<ReportPostResult> {
  try {
    // 현재 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      };
    }

    // 신고 생성 (UNIQUE 제약조건으로 중복 방지)
    const { data, error } = await supabase
      .from('post_reports')
      .insert({
        post_id: input.post_id,
        reporter_id: user.id,
        reason: input.reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // 중복 신고 에러 처리 (C-007)
      if (error.code === '23505') {
        return {
          success: false,
          error: '이미 신고한 게시글입니다.',
        };
      }

      return {
        success: false,
        error: `신고 처리 실패: ${error.message}`,
      };
    }

    return {
      success: true,
      report: data as PostReport,
    };
  } catch (error) {
    return {
      success: false,
      error: `신고 처리 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 임시 저장
 *
 * @SPEC:COMMUNITY-001 SR-002 (30초마다 자동 저장)
 *
 * @param supabase - Supabase 클라이언트
 * @param input - 임시 저장 데이터
 * @returns 임시 저장 결과
 */
export async function saveDraft(
  supabase: SupabaseClient,
  input: SaveDraftInput
): Promise<SaveDraftResult> {
  try {
    // 현재 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      };
    }

    // Upsert (기존 임시 저장이 있으면 업데이트, 없으면 생성)
    const { data, error } = await supabase
      .from('post_drafts')
      .upsert(
        {
          author_id: user.id,
          category: input.category,
          title: input.title,
          content: input.content,
        },
        {
          onConflict: 'author_id,category',
        }
      )
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `임시 저장 실패: ${error.message}`,
      };
    }

    return {
      success: true,
      draft: data as PostDraft,
    };
  } catch (error) {
    return {
      success: false,
      error: `임시 저장 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}

/**
 * 임시 저장 조회
 *
 * @param supabase - Supabase 클라이언트
 * @param category - 카테고리
 * @returns 임시 저장 데이터 또는 null
 */
export async function getDraft(
  supabase: SupabaseClient,
  category: PostCategory
): Promise<GetDraftResult> {
  try {
    // 현재 사용자 가져오기
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: '인증이 필요합니다.',
      };
    }

    // 임시 저장 조회
    const { data, error } = await supabase
      .from('post_drafts')
      .select('*')
      .eq('author_id', user.id)
      .eq('category', category)
      .single();

    if (error) {
      // 데이터가 없을 경우
      if (error.code === 'PGRST116') {
        return {
          success: true,
          draft: null,
        };
      }

      return {
        success: false,
        error: `임시 저장 조회 실패: ${error.message}`,
      };
    }

    return {
      success: true,
      draft: data as PostDraft,
    };
  } catch (error) {
    return {
      success: false,
      error: `임시 저장 조회 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    };
  }
}
