'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          교사119 | Teacher119
        </h1>
        <p className="text-center text-lg mb-4">
          교사 권익 보호 통합 지원 플랫폼
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* 회원가입 카드 */}
          <div className="bg-white p-8 rounded-lg shadow-md text-black">
            <h2 className="text-2xl font-semibold mb-4">회원가입</h2>
            <p className="text-gray-600 mb-6">
              새로운 계정을 만들어 교사119 서비스를 시작하세요
            </p>
            <Link
              href="/auth/register"
              className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              회원가입하기
            </Link>
          </div>

          {/* 로그인 카드 */}
          <div className="bg-white p-8 rounded-lg shadow-md text-black">
            <h2 className="text-2xl font-semibold mb-4">로그인</h2>
            <p className="text-gray-600 mb-6">
              이미 계정이 있으신가요? 로그인하여 서비스를 이용하세요
            </p>
            <Link
              href="/auth/login"
              className="block w-full bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition"
            >
              로그인하기
            </Link>
          </div>
        </div>

        {/* API 테스트 섹션 */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mt-8">
          <h3 className="text-xl font-semibold mb-4">🧪 API 테스트</h3>
          <div className="space-y-2 text-sm">
            <p>✅ 회원가입 API: <code className="bg-gray-700 px-2 py-1 rounded">POST /api/auth/register</code></p>
            <p>✅ 로그인 API: <code className="bg-gray-700 px-2 py-1 rounded">POST /api/auth/login</code></p>
            <p>✅ Health Check: <code className="bg-gray-700 px-2 py-1 rounded">GET /api/health</code></p>
          </div>
        </div>
      </div>
    </main>
  );
}
