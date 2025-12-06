'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface Event {
  event_id: number;
  event_name: string;
  venue: string;
}

interface EventTime {
  eventtime_id: number;
  event_id: number;
  start_time: string;
  end_time?: string;
}

export default function AddTicketPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTimes, setEventTimes] = useState<EventTime[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEventTimeId, setSelectedEventTimeId] = useState<string>('');
  const [seatArea, setSeatArea] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventSearch, setEventSearch] = useState('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventTimes(parseInt(selectedEventId));
    } else {
      setEventTimes([]);
      setSelectedEventTimeId('');
    }
  }, [selectedEventId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventDropdownRef.current && !eventDropdownRef.current.contains(event.target as Node)) {
        setShowEventDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch('/api/events?limit=1000');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      alert('載入活動失敗');
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchEventTimes = async (eventId: number) => {
    try {
      const response = await fetch(`/api/eventtimes?event_id=${eventId}`);
      const data = await response.json();
      setEventTimes(data.eventTimes || []);
    } catch (error) {
      console.error('Failed to fetch event times:', error);
      alert('載入場次失敗');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventTimeId || !seatArea || !seatNumber || !price) {
      alert('請填寫所有必填欄位');
      return;
    }

    if (parseFloat(price) < 0) {
      alert('票價不能為負數');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventtime_id: parseInt(selectedEventTimeId),
          seat_area: seatArea,
          seat_number: seatNumber,
          price: parseFloat(price),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('票券新增成功！');
        router.push('/dashboard');
      } else {
        alert(data.error || '新增票券失敗');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('新增票券失敗');
    } finally {
      setLoading(false);
    }
  };

  // Filter events by search
  const filteredEvents = events.filter(event => 
    event.event_name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.venue.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const handleEventSelect = (eventId: number, eventName: string, venue: string) => {
    setSelectedEventId(eventId.toString());
    setEventSearch(`${eventName} - ${venue}`);
    setShowEventDropdown(false);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">新增票券</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Selection with Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選擇活動 *
                </label>
                {eventsLoading ? (
                  <p className="text-gray-600">載入活動中...</p>
                ) : (
                  <div className="relative" ref={eventDropdownRef}>
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => {
                        setEventSearch(e.target.value);
                        setShowEventDropdown(true);
                        if (!e.target.value) {
                          setSelectedEventId('');
                        }
                      }}
                      onFocus={() => setShowEventDropdown(true)}
                      placeholder="搜尋活動名稱或場地..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                      required
                    />
                    {showEventDropdown && filteredEvents.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredEvents.map((event) => (
                          <div
                            key={event.event_id}
                            onClick={() => handleEventSelect(event.event_id, event.event_name, event.venue)}
                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                              selectedEventId === event.event_id.toString() ? 'bg-blue-100' : ''
                            }`}
                          >
                            <p className="font-semibold text-gray-900">{event.event_name}</p>
                            <p className="text-sm text-gray-600">📍 {event.venue}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {showEventDropdown && eventSearch && filteredEvents.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                        <p className="text-gray-600 text-center">找不到符合的活動</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Event Time Selection */}
              {selectedEventId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選擇場次 *
                  </label>
                  <select
                    value={selectedEventTimeId}
                    onChange={(e) => setSelectedEventTimeId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">-- 請選擇場次 --</option>
                    {eventTimes.map((et) => (
                      <option key={et.eventtime_id} value={et.eventtime_id}>
                        {formatDateTime(et.start_time)}
                        {et.end_time && ` - ${formatDateTime(et.end_time)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Seat Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  座位區域 *
                </label>
                <input
                  type="text"
                  value={seatArea}
                  onChange={(e) => setSeatArea(e.target.value)}
                  placeholder="例如：A區、搖滾區、VIP"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              {/* Seat Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  座位號碼 *
                </label>
                <input
                  type="text"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  placeholder="例如：12排8號、01、搖滾區A"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  票價 *
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="輸入票價"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ 新增的票券將會自動加入您的帳戶，狀態為「Active」。您可以在「個人管理」中查看。
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '新增中...' : '確認新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

