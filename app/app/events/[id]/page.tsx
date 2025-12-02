'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function EventDetailPage() {
  const params = useParams();
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`);
        const data = await response.json();
        setEventData(data);
      } catch (error) {
        console.error('Failed to fetch event details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [params.id]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        </div>
      </>
    );
  }

  if (!eventData) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <p className="text-gray-600">找不到活動資料</p>
        </div>
      </>
    );
  }

  const { event, event_times, listings } = eventData;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.event_name}</h1>
            <p className="text-xl text-gray-600 mb-4">📍 {event.venue}</p>
            
            {event.performers && event.performers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">表演者：</p>
                <div className="flex flex-wrap gap-2">
                  {event.performers.map((performer: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {performer}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {event.description && (
              <p className="text-gray-700 mt-4">{event.description}</p>
            )}
          </div>

          {/* Event Times */}
          {event_times && event_times.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">場次時間</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {event_times.map((time: any) => (
                  <div key={time.eventtime_id} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">
                      🗓️ {formatDateTime(time.start_time)}
                    </p>
                    {time.end_time && (
                      <p className="text-sm text-gray-600">至 {formatDateTime(time.end_time)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listings */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              可用貼文 ({listings?.length || 0})
            </h2>
            
            {listings && listings.length > 0 ? (
              <div className="space-y-4">
                {listings.map((listing: any) => (
                  <Link
                    key={listing.listing_id}
                    href={`/listings/${listing.listing_id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-blue-900 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              listing.type === 'Sell'
                                ? 'bg-green-100 text-green-700'
                                : listing.type === 'Buy'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {listing.type === 'Sell' ? '售票' : listing.type === 'Buy' ? '收票' : '換票'}
                          </span>
                          <span className="text-gray-600">by {listing.username}</span>
                        </div>
                        {listing.content && (
                          <p className="text-gray-700 mb-2">{listing.content}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(listing.created_at).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">目前沒有可用的貼文</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

