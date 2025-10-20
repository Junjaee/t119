import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '교사119 | Teacher119',
  description: '교사 권익 보호 통합 지원 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
