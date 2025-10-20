// @TEST:REPORT-001 | SPEC: .moai/specs/SPEC-REPORT-001/spec.md
// PII 마스킹 테스트

import { describe, it, expect } from 'vitest';
import { maskPII, maskPhoneNumber, maskEmail } from '@/lib/reports/pii-masking';

describe('PII Masking - @TEST:REPORT-001', () => {
  describe('maskPhoneNumber', () => {
    it('하이픈 포함 전화번호를 마스킹해야 한다', () => {
      const text = '연락처: 010-1234-5678';
      const result = maskPhoneNumber(text);
      expect(result).toBe('연락처: 010-****-****');
    });

    it('하이픈 없는 전화번호를 마스킹해야 한다', () => {
      const text = '전화번호 01012345678입니다';
      const result = maskPhoneNumber(text);
      expect(result).toBe('전화번호 010********입니다');
    });

    it('여러 전화번호를 모두 마스킹해야 한다', () => {
      const text = '010-1111-2222와 010-3333-4444로 연락주세요';
      const result = maskPhoneNumber(text);
      expect(result).toBe('010-****-****와 010-****-****로 연락주세요');
    });

    it('전화번호가 없으면 원본을 반환해야 한다', () => {
      const text = '전화번호가 없는 텍스트입니다';
      const result = maskPhoneNumber(text);
      expect(result).toBe(text);
    });
  });

  describe('maskEmail', () => {
    it('이메일을 마스킹해야 한다', () => {
      const text = '이메일: test@example.com';
      const result = maskEmail(text);
      expect(result).toBe('이메일: t***@example.com');
    });

    it('여러 이메일을 모두 마스킹해야 한다', () => {
      const text = 'abc@test.com과 xyz@example.com으로 보내주세요';
      const result = maskEmail(text);
      expect(result).toBe('a***@test.com과 x***@example.com으로 보내주세요');
    });

    it('이메일이 없으면 원본을 반환해야 한다', () => {
      const text = '이메일이 없는 텍스트';
      const result = maskEmail(text);
      expect(result).toBe(text);
    });
  });

  describe('maskPII (통합 마스킹)', () => {
    it('전화번호와 이메일을 모두 마스킹해야 한다', () => {
      const text = '연락처: 010-1234-5678, 이메일: john@example.com';

      const result = maskPII(text);

      // 전화번호 마스킹 확인
      expect(result).toContain('010-****-****');

      // 이메일 마스킹 확인
      expect(result).toContain('j***@example.com');
    });

    it('주민등록번호를 마스킹해야 한다', () => {
      const text = '주민등록번호: 901231-1234567';
      const result = maskPII(text);
      expect(result).toContain('******-*******');
    });

    it('주소 상세 부분을 마스킹해야 한다', () => {
      const text = '서울시 강남구 테헤란로 123번지 456호';
      const result = maskPII(text);

      // 상세 주소 부분만 마스킹
      expect(result).not.toContain('123번지 456호');
      expect(result).toContain('***');
    });

    it('PII가 없으면 원본과 유사하게 반환해야 한다', () => {
      const text = '사건이 발생했습니다';
      const result = maskPII(text);

      // 기본적인 텍스트는 유지
      expect(result).toContain('발생');
    });

    it('복합적인 PII를 모두 마스킹해야 한다', () => {
      const text = '전화(010-5555-6666)와 이메일(parent@school.com) 확인';

      const result = maskPII(text);

      expect(result).toContain('010-****-****');
      expect(result).toContain('p***@school.com');
    });
  });
});
