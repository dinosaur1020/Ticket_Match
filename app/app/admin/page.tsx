'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminPage() {
  const { user, loading: authLoading, isBusinessOperator } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'listings'>('events');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states for creating event
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [performers, setPerformers] = useState<string[]>(['']);
  const [eventTimes, setEventTimes] = useState<{start_time: string, end_time: string}[]>([
    {start_time: '', end_time: ''}
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isBusinessOperator) {
      alert('您沒有權限訪問此頁面');
      router.push('/');
    }
  }, [user, authLoading, isBusinessOperator, router]);

  useEffect(() => {
    if (user && isBusinessOperator && activeTab === 'listings') {
      fetchListings();
    }
  }, [user, isBusinessOperator, activeTab]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/listings');
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Performer management functions
  const addPerformer = () => {
    setPerformers([...performers, '']);
  };

  const removePerformer = (index: number) => {
    if (performers.length > 1) {
      setPerformers(performers.filter((_, i) => i !== index));
    }
  };

  const updatePerformer = (index: number, value: string) => {
    const updated = [...performers];
    updated[index] = value;
    setPerformers(updated);
  };

  // Event time management functions
  const addEventTime = () => {
    setEventTimes([...eventTimes, {start_time: '', end_time: ''}]);
  };

  const removeEventTime = (index: number) => {
    if (eventTimes.length > 1) {
      setEventTimes(eventTimes.filter((_, i) => i !== index));
    }
  };

  const updateEventTime = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const updated = [...eventTimes];
    updated[index][field] = value;
    setEventTimes(updated);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create event
      const eventResponse = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_name: eventName, venue, description }),
      });

      const eventData = await eventResponse.json();

      if (!eventResponse.ok) {
        alert(eventData.error || '建立活動失敗');
        return;
      }

      const eventId = eventData.event.event_id;

      // Add performers
      const validPerformers = performers.filter(p => p.trim() !== '');
      for (const performer of validPerformers) {
        try {
          await fetch('/api/performers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId, performer: performer.trim() }),
          });
        } catch (error) {
          console.error('Failed to add performer:', performer, error);
        }
      }

      // Add event times
      const validEventTimes = eventTimes.filter(et => et.start_time.trim() !== '');
      for (const eventTime of validEventTimes) {
        try {
          await fetch('/api/eventtimes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: eventId,
              start_time: eventTime.start_time,
              end_time: eventTime.end_time || null
            }),
          });
        } catch (error) {
          console.error('Failed to add event time:', eventTime, error);
        }
      }

      alert('活動建立成功！');
      setEventName('');
      setVenue('');
      setDescription('');
      setPerformers(['']);
      setEventTimes([{start_time: '', end_time: ''}]);
      setShowEventForm(false);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('建立活動失敗');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || !isBusinessOperator) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">後台管理</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === 'events'
                  ? 'text-blue-900 border-b-2 border-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              活動管理
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === 'listings'
                  ? 'text-blue-900 border-b-2 border-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              貼文管理
            </button>
          </div>

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-8">
              {/* Create Event Button */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-semibold"
                >
                  {showEventForm ? '取消' : '建立新活動'}
                </button>

                {/* Create Event Form */}
                {showEventForm && (
                  <form onSubmit={handleCreateEvent} className="mt-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        活動名稱 *
                      </label>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        場地 *
                      </label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                        required
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        描述
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                        rows={4}
                        disabled={loading}
                      />
                    </div>

                    {/* Performers Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          表演者
                        </label>
                        <button
                          type="button"
                          onClick={addPerformer}
                          className="text-sm text-blue-900 hover:text-blue-800 font-medium"
                          disabled={loading}
                        >
                          + 新增表演者
                        </button>
                      </div>
                      <div className="space-y-2">
                        {performers.map((performer, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={performer}
                              onChange={(e) => updatePerformer(index, e.target.value)}
                              placeholder="表演者名稱"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                              disabled={loading}
                            />
                            {performers.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePerformer(index)}
                                className="px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50"
                                disabled={loading}
                              >
                                移除
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Event Times Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          活動場次 *
                        </label>
                        <button
                          type="button"
                          onClick={addEventTime}
                          className="text-sm text-blue-900 hover:text-blue-800 font-medium"
                          disabled={loading}
                        >
                          + 新增場次
                        </button>
                      </div>
                      <div className="space-y-3">
                        {eventTimes.map((eventTime, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-gray-700">場次 {index + 1}</span>
                              {eventTimes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeEventTime(index)}
                                  className="text-sm text-red-600 hover:text-red-700"
                                  disabled={loading}
                                >
                                  移除
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  開始時間 *
                                </label>
                                <input
                                  type="datetime-local"
                                  value={eventTime.start_time}
                                  onChange={(e) => updateEventTime(index, 'start_time', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 text-sm"
                                  required
                                  disabled={loading}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  結束時間 (選填)
                                </label>
                                <input
                                  type="datetime-local"
                                  value={eventTime.end_time}
                                  onChange={(e) => updateEventTime(index, 'end_time', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 text-sm"
                                  disabled={loading}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                    >
                      {loading ? '建立中...' : '確認建立'}
                    </button>
                  </form>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-2">管理說明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 建立活動時可同時設定表演者和活動場次</li>
                  <li>• 可新增多個表演者和多個活動場次</li>
                  <li>• 可在活動列表頁面查看所有活動</li>
                  <li>• 如需編輯或刪除活動，請使用對應的 API 端點</li>
                </ul>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                所有貼文 ({listings.length})
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                  <p className="mt-4 text-gray-600">載入中...</p>
                </div>
              ) : listings.length === 0 ? (
                <p className="text-gray-600 text-center py-8">目前沒有貼文</p>
              ) : (
                <div className="space-y-4">
                  {listings.map((listing) => (
                    <div
                      key={listing.listing_id}
                      className="border border-gray-200 rounded-lg p-4"
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
                              {listing.type}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                listing.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : listing.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {listing.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1">
                            {listing.event_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            by {listing.username} ({listing.email})
                          </p>
                          {listing.content && (
                            <p className="text-gray-700 mt-2">{listing.content}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            交易數: {listing.trade_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

