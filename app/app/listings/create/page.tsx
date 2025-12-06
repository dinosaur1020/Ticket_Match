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

export default function CreateListingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const eventDropdownRef = useRef<HTMLDivElement>(null);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTimes, setEventTimes] = useState<EventTime[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedEventDate, setSelectedEventDate] = useState<string>('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'Sell' | 'Buy' | 'Exchange'>('Sell');
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  
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
    if (user) {
      fetchMyTickets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventTimes(parseInt(selectedEventId));
    } else {
      setEventTimes([]);
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
    }
  };

  const fetchMyTickets = async () => {
    try {
      const response = await fetch('/api/tickets/my');
      const data = await response.json();
      if (response.ok) {
        setMyTickets((data.tickets || []).filter((t: any) => t.status === 'Active'));
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEventId || !selectedEventDate) {
      alert('請選擇活動和日期');
      return;
    }

    if ((type === 'Exchange' || type === 'Sell') && selectedTickets.length === 0) {
      alert(`${type === 'Exchange' ? '換票' : '售票'}貼文需要選擇至少一張票券`);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: parseInt(selectedEventId),
          event_date: selectedEventDate,
          content: content || null,
          type,
          offered_ticket_ids: (type === 'Exchange' || type === 'Sell') ? selectedTickets : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('貼文建立成功！');
        router.push('/listings');
      } else {
        alert(data.error || '建立貼文失敗');
      }
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('建立貼文失敗');
    } finally {
      setLoading(false);
    }
  };

  const toggleTicket = (ticketId: number) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
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

  // Filter events by search
  const filteredEvents = events.filter(event => 
    event.event_name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.venue.toLowerCase().includes(eventSearch.toLowerCase())
  );

  // Filter tickets for selected event
  const relevantTickets = myTickets.filter(ticket => 
    !selectedEventId || ticket.event_id === parseInt(selectedEventId)
  );

  const handleEventSelect = (eventId: number, eventName: string, venue: string) => {
    setSelectedEventId(eventId.toString());
    setEventSearch(`${eventName} - ${venue}`);
    setShowEventDropdown(false);
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">建立新貼文</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Listing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  貼文類型 *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('Sell')}
                    className={`p-4 border-2 rounded-lg font-semibold transition ${
                      type === 'Sell'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    售票 (Sell)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Buy')}
                    className={`p-4 border-2 rounded-lg font-semibold transition ${
                      type === 'Buy'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    收票 (Buy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('Exchange')}
                    className={`p-4 border-2 rounded-lg font-semibold transition ${
                      type === 'Exchange'
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-gray-300 hover:border-orange-300'
                    }`}
                  >
                    換票 (Exchange)
                  </button>
                </div>
              </div>

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

              {/* Event Date Selection */}
              {selectedEventId && eventTimes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選擇場次日期 *
                  </label>
                  <select
                    value={selectedEventDate}
                    onChange={(e) => setSelectedEventDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                    required
                  >
                    <option value="">-- 請選擇場次 --</option>
                    {eventTimes.map((et) => (
                      <option key={et.eventtime_id} value={et.start_time}>
                        {formatDateTime(et.start_time)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ticket Selection (for Sell and Exchange) */}
              {(type === 'Sell' || type === 'Exchange') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選擇要提供的票券 *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    {type === 'Sell' 
                      ? '選擇您要出售的票券' 
                      : '選擇您願意用來交換的票券'}
                  </p>
                  {relevantTickets.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 mb-3">
                        {selectedEventId 
                          ? '您沒有此活動的可用票券' 
                          : '請先選擇活動，或新增票券'}
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push('/tickets/add')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        立即新增票券
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {relevantTickets.map((ticket) => (
                        <label
                          key={ticket.ticket_id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                            selectedTickets.includes(ticket.ticket_id)
                              ? 'border-blue-900 bg-blue-50'
                              : 'border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket.ticket_id)}
                            onChange={() => toggleTicket(ticket.ticket_id)}
                            className="w-4 h-4 text-blue-900 rounded"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {ticket.event_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {ticket.seat_area} {ticket.seat_number} - ${ticket.price}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(ticket.start_time)}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    已選擇 {selectedTickets.length} 張票券
                  </p>
                </div>
              )}

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  貼文內容
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    type === 'Sell' 
                      ? '說明票券詳情、價格等...' 
                      : type === 'Buy'
                      ? '說明您想要的票券條件、價格等...'
                      : '說明交換條件、是否願意補差價等...'
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 resize-none"
                />
              </div>

              {/* Info Box */}
              <div className={`p-4 rounded-lg border ${
                type === 'Sell' 
                  ? 'bg-green-50 border-green-200'
                  : type === 'Buy'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <p className={`text-sm ${
                  type === 'Sell' 
                    ? 'text-green-800'
                    : type === 'Buy'
                    ? 'text-blue-800'
                    : 'text-orange-800'
                }`}>
                  {type === 'Sell' && '💡 售票貼文：其他用戶可以看到您提供的票券並發起交易'}
                  {type === 'Buy' && '💡 收票貼文：說明您想要的票券條件，其他用戶可以用他們的票券回應'}
                  {type === 'Exchange' && '💡 換票貼文：其他用戶可以看到您的票券，並用他們的票券來交換'}
                </p>
              </div>

              {/* Submit Buttons */}
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
                  {loading ? '建立中...' : '確認建立'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

