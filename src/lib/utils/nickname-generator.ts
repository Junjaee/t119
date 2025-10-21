// @CODE:COMMUNITY-001:DOMAIN | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md | TEST: tests/lib/utils/nickname-generator.test.ts
// 익명 닉네임 생성 유틸

/**
 * 익명 닉네임 생성
 * C-005: 익명 닉네임은 "익명교사###" 형식 (### = 랜덤 3자리 숫자 001~999)
 */
export function generateAnonymousNickname(): string {
  // 1~999 사이의 랜덤 숫자 생성
  const randomNum = Math.floor(Math.random() * 999) + 1;

  // 3자리 숫자로 포맷팅 (1 → "001", 12 → "012", 999 → "999")
  const formattedNum = randomNum.toString().padStart(3, '0');

  return `익명교사${formattedNum}`;
}

/**
 * 사용자별 게시글 고정 닉네임 생성
 * ER-001: 같은 게시글 내에서 동일 사용자는 동일 닉네임 유지
 *
 * postId와 userId를 해싱하여 결정론적으로 닉네임 생성
 */
export function getNicknameForUser(postId: string, userId: string): string {
  // postId + userId를 조합하여 해시 생성 (간단한 문자열 해시)
  const combined = `${postId}:${userId}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // 해시를 1~999 범위로 변환
  const num = (Math.abs(hash) % 999) + 1;

  // 3자리 숫자로 포맷팅
  const formattedNum = num.toString().padStart(3, '0');

  return `익명교사${formattedNum}`;
}
