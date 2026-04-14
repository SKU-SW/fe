import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/character', label: 'AI 캐릭터 설정' },
  { href: '/chat-analysis', label: '채팅 분석' },
  { href: '/proactive', label: '선제 반응' },
  { href: '/game', label: '게임 연동' },
  { href: '/safety', label: '안전 관리' },
  { href: '/stats', label: '방송 통계' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-60 shrink-0 bg-white shadow-sm">
        <div className="px-6 py-5">
          <span className="text-lg font-bold text-indigo-600">SWproject</span>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b bg-white px-6 shadow-sm">
          <span className="text-sm text-gray-500">SWproject 대시보드</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
