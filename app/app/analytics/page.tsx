'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

export default function AnalyticsPage() {
  const [activeAnalytic, setActiveAnalytic] = useState<string>('popular-events');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('7'); // days for browsing trends
  const [viewType, setViewType] = useState<string>('both'); // for popular-views: 'both', 'event', 'listing'

  const analytics = [
    { id: 'popular-events', name: '熱門活動排行', endpoint: '/api/analytics/popular-events' },
    { id: 'ticket-flow', name: '票券流動分析', endpoint: '/api/analytics/ticket-flow' },
    { id: 'conversion', name: '活動轉換率', endpoint: '/api/analytics/conversion' },
    { id: 'search-keywords', name: '熱門搜尋關鍵字', endpoint: '/api/analytics/search-keywords' },
    { id: 'browsing-trends', name: '瀏覽趨勢', endpoint: '/api/analytics/browsing-trends' },
    { id: 'popular-views', name: '熱門瀏覽內容', endpoint: '/api/analytics/popular-views' },
    { id: 'user-browsing', name: '我的瀏覽記錄', endpoint: '/api/analytics/user-browsing' },
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [activeAnalytic, timeRange, viewType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const analytic = analytics.find((a) => a.id === activeAnalytic);
      if (analytic) {
        let url = analytic.endpoint;
        
        // Add time range parameter for browsing trends
        if (activeAnalytic === 'browsing-trends' && timeRange !== 'all') {
          url += `?days=${timeRange}`;
        }
        
        // Add type parameter for popular views
        if (activeAnalytic === 'popular-views') {
          url += `?type=${viewType}`;
        }
        
        const response = await fetch(url);
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

    // popular-views has different data structure (events/listings instead of data)
    if (!data) {
      return <p className="text-center text-gray-600 py-12">無資料</p>;
    }
    
    if (activeAnalytic !== 'popular-views' && !data.data) {
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
            {data.data && data.data.map((item: any) => (
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
                    <p className="text-lg font-bold text-blue-900">{item.active_listings || 0}</p>
                    <p className="text-xs text-gray-600">進行中</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{item.completed_listings || 0}</p>
                    <p className="text-xs text-gray-600">已完成</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{item.canceled_listings || 0}</p>
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

      case 'browsing-trends':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-6">期間：{data.period}</p>
            <div className="space-y-3">
              {data.data && data.data.length > 0 ? (
                data.data.map((item: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-semibold text-gray-900">{item.date}</p>
                      <p className="text-xl font-bold text-blue-900">{item.total_views}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">活動瀏覽</span>
                        <span className="font-bold text-green-600">{item.event_views}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">貼文瀏覽</span>
                        <span className="font-bold text-orange-600">{item.listing_views}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-600 py-8">該期間沒有瀏覽記錄</p>
              )}
            </div>
          </div>
        );

      case 'popular-views':
        return (
          <div className="space-y-8">
            {/* Popular Events */}
            {data.events && data.events.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 最多瀏覽的活動</h3>
                <div className="space-y-3">
                  {data.events.map((item: any, idx: number) => (
                    <div key={item.event_id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-blue-900 w-8">#{idx + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-900">{item.event_name}</p>
                          <p className="text-sm text-gray-600">{item.venue}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{item.view_count}</p>
                        <p className="text-xs text-gray-600">{item.unique_users} 位使用者</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Listings */}
            {data.listings && data.listings.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 最多瀏覽的貼文</h3>
                <div className="space-y-3">
                  {data.listings.map((item: any, idx: number) => (
                    <div key={item.listing_id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-orange-600 w-8">#{idx + 1}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.listing_type === 'Sell'
                                  ? 'bg-green-100 text-green-700'
                                  : item.listing_type === 'Buy'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {item.listing_type === 'Sell' ? '售票' : item.listing_type === 'Buy' ? '收票' : '換票'}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">{item.event_name}</p>
                          <p className="text-sm text-gray-600">{item.venue}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">{item.view_count}</p>
                        <p className="text-xs text-gray-600">{item.unique_users} 位使用者</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!data.events || data.events.length === 0) && (!data.listings || data.listings.length === 0) && (
              <p className="text-center text-gray-600 py-8">目前沒有瀏覽記錄</p>
            )}
          </div>
        );

      case 'user-browsing':
        return (
          <div className="space-y-3">
            {data.data && data.data.length > 0 ? (
              data.data.map((item: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.type === 'event'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {item.type === 'event' ? '活動' : '貼文'}
                        </span>
                        {item.listing_type && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.listing_type === 'Sell'
                                ? 'bg-green-100 text-green-700'
                                : item.listing_type === 'Buy'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {item.listing_type === 'Sell' ? '售票' : item.listing_type === 'Buy' ? '收票' : '換票'}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.venue}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString('zh-TW', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 py-8">尚無瀏覽記錄</p>
            )}
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

          {/* Time Range Selector (only for browsing trends) */}
          {activeAnalytic === 'browsing-trends' && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">時間範圍：</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: '7', label: '最近 7 天' },
                  { value: '30', label: '最近 30 天' },
                  { value: '90', label: '最近 90 天' },
                  { value: 'all', label: '全部時間' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      timeRange === option.value
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View Type Selector (only for popular views) */}
          {activeAnalytic === 'popular-views' && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">顯示內容：</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'both', label: '全部顯示', icon: '📊' },
                  { value: 'event', label: '只顯示活動', icon: '🎭' },
                  { value: 'listing', label: '只顯示貼文', icon: '📝' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setViewType(option.value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      viewType === option.value
                        ? 'bg-blue-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

