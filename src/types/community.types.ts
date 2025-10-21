// @CODE:COMMUNITY-001:DATA | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
// 커뮤니티 도메인 타입 정의

/**
 * 게시글 카테고리
 * UR-002: 사례 공유, Q&A, 정보 공유 카테고리
 */
export type PostCategory = 'case' | 'qa' | 'info';

/**
 * 게시글 정렬 방식
 */
export type PostSort = 'latest' | 'popular';

/**
 * 신고 처리 상태
 */
export type ReportStatus = 'pending' | 'approved' | 'rejected';

/**
 * 게시글 (Post)
 * SPEC 섹션 3.1 데이터 모델 기반
 */
export interface Post {
  id: string;                    // UUID
  category: PostCategory;        // 카테고리
  title: string;                 // 제목 (5~100자)
  content: string;               // 본문 (20~5000자)
  author_id: string;             // 작성자 ID (FK: users.id)
  anonymous_nickname: string;    // 익명 닉네임 (예: "익명교사123")
  view_count: number;            // 조회수 (default: 0)
  is_popular: boolean;           // 인기 게시글 여부 (view_count >= 100)
  is_blinded: boolean;           // 블라인드 여부 (default: false)
  image_url?: string;            // 첨부 이미지 URL (optional)
  created_at: Date;
  updated_at: Date;
}

/**
 * 댓글 (Comment)
 * SPEC 섹션 3.2 데이터 모델 기반
 */
export interface Comment {
  id: string;                    // UUID
  post_id: string;               // 게시글 ID (FK: posts.id)
  author_id: string;             // 작성자 ID (FK: users.id)
  anonymous_nickname: string;    // 익명 닉네임 (게시글별 고정)
  content: string;               // 댓글 내용 (1~500자)
  created_at: Date;
  updated_at: Date;
}

/**
 * 게시글 신고 (PostReport)
 * SPEC 섹션 3.3 데이터 모델 기반
 */
export interface PostReport {
  id: string;                    // UUID
  post_id: string;               // 신고 대상 게시글 ID (FK: posts.id)
  reporter_id: string;           // 신고자 ID (FK: users.id)
  reason: string;                // 신고 사유 (1~200자)
  status: ReportStatus;          // 처리 상태
  created_at: Date;
  resolved_at?: Date;            // 처리 완료 시간
}

/**
 * 임시 저장 (PostDraft)
 * SPEC 섹션 3.4 데이터 모델 기반
 */
export interface PostDraft {
  id: string;                    // UUID
  author_id: string;             // 작성자 ID (FK: users.id)
  category: PostCategory;        // 카테고리
  title: string;                 // 임시 제목
  content: string;               // 임시 본문
  created_at: Date;
  updated_at: Date;              // 마지막 자동 저장 시간
}

/**
 * 게시글 목록 응답 (API)
 * SPEC 섹션 4.1 API 설계 기반
 */
export interface PostListResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 게시글 상세 응답 (API)
 * SPEC 섹션 4.1 API 설계 기반
 */
export interface PostDetailResponse {
  post: Post;
  comments: Comment[];
}
