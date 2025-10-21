// @CODE:DASHBOARD-001:DASHBOARD-PAGES | SPEC: SPEC-DASHBOARD-001.md | TEST: tests/app/dashboard/layout.test.tsx
// 대시보드 공통 레이아웃

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * 대시보드 공통 레이아웃
 * @TEST:DASHBOARD-001 - 헤더, 사이드바, 인증 체크, 마지막 업데이트 시간
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 인증 확인
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // 5분마다 업데이트 시간 갱신
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div data-testid="dashboard-skeleton">로딩 중...</div>
      </div>
    );
  }

  // 인증되지 않음
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로그인이 필요합니다</p>
      </div>
    );
  }

  // 역할별 네비게이션 메뉴
  const getNavLinks = () => {
    if (user.role === 'teacher') {
      return [
        { href: '/reports', label: '내 신고' },
        { href: '/consultations', label: '상담 이력' },
        { href: '/help', label: '도움말' },
      ];
    } else if (user.role === 'lawyer') {
      return [
        { href: '/cases', label: '배정 사건' },
        { href: '/consultations', label: '상담' },
        { href: '/reviews', label: '평가' },
      ];
    } else if (user.role === 'admin') {
      return [
        { href: '/users', label: '사용자 관리' },
        { href: '/system', label: '시스템 모니터링' },
        { href: '/settings', label: '설정' },
      ];
    }
    return [];
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* 사이드바 */}
      <aside
        data-testid="dashboard-sidebar"
        className="w-64 bg-white border-r border-gray-200 p-4"
        role="navigation"
        aria-label="대시보드 네비게이션"
      >
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800">대시보드</h2>
          <p className="text-sm text-gray-600" role="status" aria-live="polite">
            {user.role === 'teacher'
              ? '교사'
              : user.role === 'lawyer'
              ? '변호사'
              : '관리자'}
          </p>
        </div>

        <nav className="space-y-2" aria-label="주요 메뉴">
          {getNavLinks().map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={link.label}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <header
          data-testid="dashboard-header"
          className="bg-white border-b border-gray-200 px-6 py-4"
          role="banner"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>

            <div className="flex items-center gap-4">
              {/* 마지막 업데이트 시간 */}
              <div
                data-testid="last-updated"
                className="text-sm text-gray-600"
                role="status"
                aria-live="polite"
                aria-label="마지막 업데이트 시간"
              >
                마지막 업데이트: {lastUpdated.toLocaleTimeString()}
              </div>

              {/* 새로고침 버튼 */}
              <button
                data-testid="refresh-button"
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="대시보드 새로고침"
              >
                새로고침
              </button>
            </div>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 p-6" role="main" aria-label="대시보드 콘텐츠">
          {children}
        </main>
      </div>
    </div>
  );
}
