'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Event {
  event_id: number;
  event_name: string;
  venue: string;
  description: string;
  performers: string[];
  session_count: number;
  listing_count: number;
  earliest_date: string;
  latest_date: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const fetchEvents = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((page - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      setEvents(data.events);
      
      // 使用API返回的總數
      if (data.pagination?.total) {
        setTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchEvents(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">活動列表</h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜尋活動名稱、場地或表演者..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
              />
              <button
                type="submit"
                className="bg-blue-900 text-white px-8 py-3 rounded-lg hover:bg-blue-800 transition font-semibold"
              >
                搜尋
              </button>
            </div>
          </form>

          {/* Results Summary */}
          {!loading && events.length > 0 && (
            <div className="mb-4 flex justify-between items-center">
              <p className="text-gray-600">
                顯示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} 筆，共約 {totalCount}+ 個活動
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-900"
              >
                <option value={20}>每頁 20 筆</option>
                <option value={50}>每頁 50 筆</option>
                <option value={100}>每頁 100 筆</option>
              </select>
            </div>
          )}

          {/* Events Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-gray-600">沒有找到活動</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Link
                    key={event.event_id}
                    href={`/events/${event.event_id}`}
                    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 block"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {event.event_name}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      📍 {event.venue}
                    </p>
                    
                    {event.performers && event.performers.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">表演者：</p>
                        <div className="flex flex-wrap gap-2">
                          {event.performers.slice(0, 3).map((performer, idx) => (
                            <span
                              key={idx}
                              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                            >
                              {performer}
                            </span>
                          ))}
                          {event.performers.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{event.performers.length - 3} 更多
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {event.session_count > 0 && (
                        <p className="text-sm text-gray-500">
                          🗓️ {event.session_count} 場次
                          {event.earliest_date && (
                            <> • {formatDate(event.earliest_date)}</>
                          )}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          event.listing_count > 0
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          📋 {event.listing_count || 0} 個貼文
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  {/* Page Info */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      第 <span className="font-semibold text-blue-900">{currentPage}</span> 頁 / 共 <span className="font-semibold text-blue-900">{totalPages}</span> 頁
                    </p>
                  </div>

                  <div className="flex justify-center items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
                    >
                      第一頁
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
                    >
                      上一頁
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 7) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 4) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNumber = totalPages - 6 + i;
                      } else {
                        pageNumber = currentPage - 3 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-4 py-2 rounded-lg ${
                            currentPage === pageNumber
                              ? 'bg-blue-900 text-white font-bold'
                              : 'border border-gray-300 hover:bg-gray-50 text-gray-900'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    {totalPages > 7 && currentPage < totalPages - 3 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
                    >
                      下一頁
                    </button>

                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
                    >
                      最後一頁
                    </button>
                  </div>

                  {/* Quick Jump */}
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <label className="text-sm text-gray-600">跳至：</label>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      placeholder="頁碼"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-900"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const page = parseInt((e.target as HTMLInputElement).value);
                          if (page >= 1 && page <= totalPages) {
                            handlePageChange(page);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <span className="text-sm text-gray-600">頁</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

