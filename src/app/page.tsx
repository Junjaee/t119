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
        <div className="bg-white p-8 rounded-lg shadow-md text-black">
          <h2 className="text-2xl font-semibold mb-4">시작하기</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Supabase 프로젝트 생성:{' '}
              <a
                href="https://supabase.com/dashboard"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                supabase.com/dashboard
              </a>
            </li>
            <li>
              <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code>{' '}
              파일에 Supabase URL과 API 키 설정
            </li>
            <li>
              데이터베이스 마이그레이션 실행:{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">
                supabase/migrations/
              </code>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
