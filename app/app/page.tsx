'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              歡迎來到 Ticket Match
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              最安全、最便利的票券交易撮合平台
            </p>
            {!user ? (
              <div className="flex gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition font-semibold text-lg"
                >
                  立即註冊
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-blue-900 border-2 border-blue-900 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold text-lg"
                >
                  登入
                </Link>
              </div>
            ) : (
              <div className="flex gap-4 justify-center">
                <Link
                  href="/events"
                  className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition font-semibold text-lg"
                >
                  瀏覽活動
                </Link>
                <Link
                  href="/listings"
                  className="inline-block bg-white text-blue-900 border-2 border-blue-900 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-semibold text-lg"
                >
                  所有貼文
                </Link>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">豐富活動</h3>
              <p className="text-gray-600">
                涵蓋演唱會、音樂節、戲劇等各類型活動票券
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">安全交易</h3>
              <p className="text-gray-600">
                完整的交易管理系統，保障買賣雙方權益
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">彈性定價</h3>
              <p className="text-gray-600">
                支援售票、收票、換票，價格由雙方協商決定
              </p>
            </div>
          </div>

          {/* System Features */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
              系統特色
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">多人併行操作</h4>
                  <p className="text-gray-600">支援多用戶同時交易，確保資料一致性</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">交易管理</h4>
                  <p className="text-gray-600">完整的交易流程與併行控制機制</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">即時搜尋</h4>
                  <p className="text-gray-600">快速搜尋活動與票券，支援關鍵字搜尋</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">數據分析</h4>
                  <p className="text-gray-600">豐富的數據分析功能，洞察市場趨勢</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
