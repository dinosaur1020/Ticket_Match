'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading, isOperator } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="animate-pulse">Loading...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition">
            🎫 Ticket Match
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link
                  href="/events"
                  className={`hover:text-blue-200 transition ${
                    pathname === '/events' ? 'font-bold' : ''
                  }`}
                >
                  活動列表
                </Link>
                <Link
                  href="/listings"
                  className={`hover:text-blue-200 transition ${
                    pathname.startsWith('/listings') ? 'font-bold' : ''
                  }`}
                >
                  所有貼文
                </Link>
                <Link
                  href="/dashboard"
                  className={`hover:text-blue-200 transition ${
                    pathname === '/dashboard' ? 'font-bold' : ''
                  }`}
                >
                  個人管理
                </Link>
                <Link
                  href="/profile"
                  className={`hover:text-blue-200 transition ${
                    pathname === '/profile' ? 'font-bold' : ''
                  }`}
                >
                  我的資料
                </Link>
                {isOperator && (
                  <Link
                    href="/admin"
                    className={`hover:text-blue-200 transition ${
                      pathname.startsWith('/admin') ? 'font-bold' : ''
                    }`}
                  >
                    後台管理
                  </Link>
                )}
                <Link
                  href="/analytics"
                  className={`hover:text-blue-200 transition ${
                    pathname === '/analytics' ? 'font-bold' : ''
                  }`}
                >
                  數據分析
                </Link>
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-blue-400">
                  <span className="text-sm">
                    {user.username} | 餘額: ${user.balance.toFixed(2)}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-semibold"
                  >
                    登出
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-200 transition"
                >
                  登入
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-900 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-semibold"
                >
                  註冊
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

