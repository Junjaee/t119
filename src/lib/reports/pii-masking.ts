// @CODE:REPORT-001 | SPEC: .moai/specs/SPEC-REPORT-001/spec.md | TEST: tests/lib/reports/pii-masking.test.ts
// 신고 내용 PII 자동 마스킹

import { maskName, maskSchool } from '@/lib/auth/anonymize';

/**
 * 전화번호 마스킹
 * @param text - 원본 텍스트
 * @returns 마스킹된 텍스트
 *
 * @example
 * maskPhoneNumber('010-1234-5678') // '010-****-****'
 * maskPhoneNumber('01012345678')   // '010********'
 */
export function maskPhoneNumber(text: string): string {
  // 하이픈 포함 전화번호: 010-1234-5678 → 010-****-****
  text = text.replace(/01\d-\d{3,4}-\d{4}/g, (match) => {
    const parts = match.split('-');
    return `${parts[0]}-****-****`;
  });

  // 하이픈 없는 전화번호: 01012345678 → 010********
  text = text.replace(/01\d\d{7,8}/g, (match) => {
    return match.substring(0, 3) + '*'.repeat(match.length - 3);
  });

  return text;
}

/**
 * 이메일 마스킹
 * @param text - 원본 텍스트
 * @returns 마스킹된 텍스트
 *
 * @example
 * maskEmail('test@example.com') // 't***@example.com'
 */
export function maskEmail(text: string): string {
  return text.replace(
    /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
    (match, user, domain) => {
      if (user.length <= 1) {
        return match;
      }
      return user[0] + '***@' + domain;
    }
  );
}

/**
 * 주민등록번호 마스킹
 * @param text - 원본 텍스트
 * @returns 마스킹된 텍스트
 *
 * @example
 * maskSSN('901231-1234567') // '******-*******'
 */
export function maskSSN(text: string): string {
  return text.replace(/\d{6}-\d{7}/g, '******-*******');
}

/**
 * 주소 마스킹 (상세 주소 부분만 마스킹)
 * @param text - 원본 텍스트
 * @returns 마스킹된 텍스트
 *
 * @example
 * maskAddress('서울시 강남구 테헤란로 123번지 456호')
 * // '서울시 강남구 ***'
 */
export function maskAddress(text: string): string {
  // 번지, 호수 등 상세 주소 패턴 마스킹
  text = text.replace(/\d+번지\s*\d*호?/g, '***');
  text = text.replace(/\d+동\s*\d+호/g, '***');

  return text;
}

/**
 * PII 통합 마스킹 (신고 내용 자동 처리)
 * @param text - 원본 신고 내용
 * @returns 마스킹된 텍스트
 *
 * @description
 * 다음 개인정보를 자동 마스킹 처리:
 * - 이름 (2-4자 한글): AUTH-001 maskName 활용
 * - 학교명: AUTH-001 maskSchool 활용
 * - 전화번호: 010-****-****
 * - 이메일: t***@example.com
 * - 주민등록번호: ******-*******
 * - 주소: 상세 주소 마스킹
 */
export function maskPII(text: string): string {
  // 1. 전화번호 마스킹
  text = maskPhoneNumber(text);

  // 2. 이메일 마스킹
  text = maskEmail(text);

  // 3. 주민등록번호 마스킹
  text = maskSSN(text);

  // 4. 주소 마스킹
  text = maskAddress(text);

  // 5. 학교명 마스킹 먼저 수행 - AUTH-001 maskSchool 활용
  const schoolPattern = /([가-힣]+)(초등학교|중학교|고등학교|대학교)/g;
  text = text.replace(schoolPattern, (match) => {
    return maskSchool(match);
  });

  // 6. 이름 마스킹 (2-4자 한글) - AUTH-001 maskName 활용
  // 특정 단어는 마스킹 제외 (일반 명사, 단위 등)
  const excludeWords = [
    '교사',
    '학생',
    '학부모',
    '선생님',
    '동료',
    '관리자',
    '개인정보',
    '텍스트',
    '학교',
    '연락처',
    '이메일',
    '이름',
    '피해자',
    '전화',
    '일반',
    '협박',
    '메일',
    '폭언',
    '했습니다',
    '보냈습니다',
  ];

  // 3자 이상 이름 먼저 처리
  text = text.replace(/([가-힣]{3,4})(?=\s|$|:|,|\.|교사|변호사)/g, (match) => {
    if (excludeWords.includes(match) || match.includes('*')) {
      return match;
    }
    return maskName(match);
  });

  // 2자 이름 처리
  text = text.replace(/([가-힣]{2})(?=\s|$|:|,|\.|교사|변호사)/g, (match) => {
    if (excludeWords.includes(match) || match.includes('*')) {
      return match;
    }
    return maskName(match);
  });

  return text;
}
