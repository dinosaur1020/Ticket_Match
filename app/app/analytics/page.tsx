'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

export default function AnalyticsPage() {
  const [activeAnalytic, setActiveAnalytic] = useState<string>('popular-events');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const analytics = [
    { id: 'popular-events', name: '熱門活動排行', endpoint: '/api/analytics/popular-events' },
    { id: 'user-income', name: '使用者收入排行', endpoint: '/api/analytics/user-income' },
    { id: 'ticket-flow', name: '票券流動分析', endpoint: '/api/analytics/ticket-flow' },
    { id: 'conversion', name: '活動轉換率', endpoint: '/api/analytics/conversion' },
    { id: 'search-keywords', name: '熱門搜尋關鍵字', endpoint: '/api/analytics/search-keywords' },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [activeAnalytic]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const analytic = analytics.find((a) => a.id === activeAnalytic);
      if (analytic) {
        const response = await fetch(analytic.endpoint);
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAnalyticContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      );
    }

    if (!data || !data.data) {
      return <p className="text-center text-gray-600 py-12">無資料</p>;
    }

    switch (activeAnalytic) {
      case 'popular-events':
        return (
          <div className="space-y-3">
            {data.data.map((item: any, idx: number) => (
              <div key={item.event_id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-900 w-8">#{idx + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{item.event_name}</p>
                    <p className="text-sm text-gray-600">{item.venue}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{item.listing_count}</p>
                  <p className="text-sm text-gray-600">貼文數</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'user-income':
        return (
          <div className="space-y-3">
            {data.data.map((item: any, idx: number) => (
              <div key={item.user_id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-900 w-8">#{idx + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{item.username}</p>
                    <p className="text-sm text-gray-600">{item.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">${item.total_income.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">總收入</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'ticket-flow':
        return (
          <div className="space-y-3">
            {data.data.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{item.from_username}</p>
                    <p className="text-xs text-gray-500">轉出</p>
                  </div>
                  <span className="text-2xl">→</span>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{item.to_username}</p>
                    <p className="text-xs text-gray-500">轉入</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{item.transfer_count}</p>
                  <p className="text-sm text-gray-600">次數</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'conversion':
        return (
          <div className="space-y-3">
            {data.data.map((item: any) => (
              <div key={item.event_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.event_name}</p>
                    <p className="text-sm text-gray-600">{item.venue}</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-900">{item.conversion_rate}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-900">{item.active_listings}</p>
                    <p className="text-xs text-gray-600">進行中</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{item.completed_listings}</p>
                    <p className="text-xs text-gray-600">已完成</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{item.canceled_listings}</p>
                    <p className="text-xs text-gray-600">已取消</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'search-keywords':
        return (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.data.map((item: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-900 mb-2">{item.search_count}</p>
                <p className="font-semibold text-gray-900">{item.keyword || '(無關鍵字)'}</p>
                <p className="text-xs text-gray-600">搜尋次數</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">數據分析</h1>

          {/* Analytics Tabs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {analytics.map((analytic) => (
              <button
                key={analytic.id}
                onClick={() => setActiveAnalytic(analytic.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  activeAnalytic === analytic.id
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                }`}
              >
                {analytic.name}
              </button>
            ))}
          </div>

          {/* Analytics Content */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{data?.title}</h2>
            {renderAnalyticContent()}
          </div>
        </div>
      </main>
    </>
  );
}

