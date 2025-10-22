// @CODE:COMMUNITY-001:INFRA | SPEC: .moai/specs/SPEC-COMMUNITY-001/spec.md
/**
 * Providers - React Query Provider 설정
 *
 * QueryClient 설정을 제공하여 모든 React Query Hooks가 동작하도록 합니다.
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 데이터를 5분간 신선한 상태로 유지
            staleTime: 5 * 60 * 1000,
            // 캐시를 10분간 유지
            gcTime: 10 * 60 * 1000,
            // 윈도우 포커스 시 자동 리페치 비활성화
            refetchOnWindowFocus: false,
            // 네트워크 재연결 시 자동 리페치 활성화
            refetchOnReconnect: true,
            // 백그라운드에서 자동 리페치 비활성화
            refetchOnMount: false,
            // 에러 발생 시 재시도 1회
            retry: 1,
          },
          mutations: {
            // 뮤테이션 에러 발생 시 재시도 없음
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
