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
  earliest_date: string;
  latest_date: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/events?${params}`);
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

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

                  {event.session_count > 0 && (
                    <p className="text-sm text-gray-500">
                      🗓️ {event.session_count} 場次
                      {event.earliest_date && (
                        <> • {formatDate(event.earliest_date)}</>
                      )}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

