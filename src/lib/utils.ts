/**
 * 유틸리티 함수
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn - Tailwind CSS 클래스 병합 유틸리티
 *
 * clsx로 조건부 클래스를 병합하고,
 * tailwind-merge로 중복 클래스를 제거합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
