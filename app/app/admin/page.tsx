'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminPage() {
  const { user, loading: authLoading, isOperator } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'events' | 'listings' | 'users'>('events');
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Listing filters and pagination
  const [listingStatusFilter, setListingStatusFilter] = useState<string>('all');
  const [listingSearchTerm, setListingSearchTerm] = useState<string>('');
  const [listingPage, setListingPage] = useState<number>(1);
  const [listingTotalCount, setListingTotalCount] = useState<number>(0);
  const listingsPerPage = 50; // 每頁顯示 50 筆

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
    } else if (!authLoading && user && !isOperator) {
      alert('您沒有權限訪問此頁面');
      router.push('/');
    }
  }, [user, authLoading, isOperator, router]);

  useEffect(() => {
    if (user && isOperator) {
      if (activeTab === 'listings') {
        fetchListings();
      } else if (activeTab === 'users') {
        fetchUsers();
      }
    }
  }, [user, isOperator, activeTab, listingStatusFilter, listingPage]);
  
  // Reset to page 1 when filter changes
  useEffect(() => {
    if (activeTab === 'listings') {
      setListingPage(1);
    }
  }, [listingStatusFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (listingStatusFilter !== 'all') {
        params.append('status', listingStatusFilter);
      }
      params.append('limit', listingsPerPage.toString());
      params.append('offset', ((listingPage - 1) * listingsPerPage).toString());
      
      const url = `/api/admin/listings${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setListings(data.listings || []);
      
      // Get total count for pagination
      if (data.pagination?.total !== undefined) {
        setListingTotalCount(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    if (!confirm(`確定要將此用戶狀態更改為 ${newStatus} 嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '更新狀態失敗');
        return;
      }

      alert('用戶狀態更新成功！');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('更新狀態失敗');
    }
  };

  const handleUpdateListingStatus = async (listingId: number, newStatus: string) => {
    const statusText = newStatus === 'Canceled' ? '取消' : newStatus === 'Expired' ? '過期' : '啟用';
    if (!confirm(`確定要將此貼文狀態更改為「${statusText}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '更新貼文狀態失敗');
        return;
      }

      alert('貼文狀態更新成功！');
      fetchListings(); // Refresh the list
    } catch (error) {
      console.error('Failed to update listing status:', error);
      alert('更新貼文狀態失敗');
    }
  };

  const handleDeleteListing = async (listingId: number) => {
    if (!confirm('確定要刪除此貼文嗎？貼文將被標記為「已刪除」狀態。')) {
      return;
    }

    try {
      // Use PATCH to mark as Deleted instead of actual deletion
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Deleted' }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '刪除貼文失敗');
        return;
      }

      alert('貼文已標記為刪除！');
      fetchListings(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert('刪除貼文失敗');
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

  if (authLoading || !user || !isOperator) {
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
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === 'users'
                  ? 'text-blue-900 border-b-2 border-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              用戶管理
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
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    貼文管理
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    總共 <span className="font-bold text-blue-600">{listingTotalCount.toLocaleString()}</span> 筆貼文
                    {listingStatusFilter !== 'all' && (
                      <span className="ml-2">
                        （目前篩選: <span className="font-semibold">{
                          listingStatusFilter === 'Active' ? '進行中' :
                          listingStatusFilter === 'Completed' ? '已完成' :
                          listingStatusFilter === 'Canceled' ? '已取消' : '已過期'
                        }</span>）
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={fetchListings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  🔄 重新整理
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      狀態篩選：
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: '全部', color: 'bg-gray-100 text-gray-700' },
                        { value: 'Active', label: '進行中', color: 'bg-green-100 text-green-700' },
                        { value: 'Completed', label: '已完成', color: 'bg-blue-100 text-blue-700' },
                        { value: 'Canceled', label: '已取消', color: 'bg-red-100 text-red-700' },
                        { value: 'Expired', label: '已過期', color: 'bg-gray-100 text-gray-700' },
                        { value: 'Deleted', label: '已刪除', color: 'bg-black text-white' },
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setListingStatusFilter(filter.value)}
                          className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                            listingStatusFilter === filter.value
                              ? 'ring-2 ring-blue-900 ' + filter.color
                              : filter.color + ' opacity-60 hover:opacity-100'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      搜尋：
                    </label>
                    <input
                      type="text"
                      value={listingSearchTerm}
                      onChange={(e) => setListingSearchTerm(e.target.value)}
                      placeholder="搜尋活動名稱、用戶名稱或內容..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Pagination Controls */}
              {!loading && listingTotalCount > 0 && (
                <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600">
                    顯示第 <span className="font-bold">{((listingPage - 1) * listingsPerPage) + 1}</span> 
                    {' '}到{' '}
                    <span className="font-bold">{Math.min(listingPage * listingsPerPage, listingTotalCount)}</span>
                    {' '}筆 (共 {listingTotalCount.toLocaleString()} 筆)
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setListingPage(1)}
                      disabled={listingPage === 1}
                      className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      ⏮ 第一頁
                    </button>
                    <button
                      onClick={() => setListingPage(p => Math.max(1, p - 1))}
                      disabled={listingPage === 1}
                      className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      ← 上一頁
                    </button>
                    
                    <div className="px-4 py-1 bg-blue-600 text-white rounded text-sm font-semibold">
                      第 {listingPage} / {Math.ceil(listingTotalCount / listingsPerPage)} 頁
                    </div>
                    
                    <button
                      onClick={() => setListingPage(p => p + 1)}
                      disabled={listingPage >= Math.ceil(listingTotalCount / listingsPerPage)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      下一頁 →
                    </button>
                    <button
                      onClick={() => setListingPage(Math.ceil(listingTotalCount / listingsPerPage))}
                      disabled={listingPage >= Math.ceil(listingTotalCount / listingsPerPage)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      最後頁 ⏭
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    跳到第 
                    <input
                      type="number"
                      min="1"
                      max={Math.ceil(listingTotalCount / listingsPerPage)}
                      value={listingPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= Math.ceil(listingTotalCount / listingsPerPage)) {
                          setListingPage(page);
                        }
                      }}
                      className="mx-2 w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    頁
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                  <p className="mt-4 text-gray-600">載入中...</p>
                </div>
              ) : listings.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  {listingStatusFilter === 'all' ? '目前沒有貼文' : `沒有「${
                    listingStatusFilter === 'Active' ? '進行中' :
                    listingStatusFilter === 'Completed' ? '已完成' :
                    listingStatusFilter === 'Canceled' ? '已取消' : '已過期'
                  }」的貼文`}
                </p>
              ) : (
                <>
                  {listingSearchTerm && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      🔍 搜尋「<span className="font-semibold">{listingSearchTerm}</span>」
                      - 找到 {listings.filter((listing) => {
                        const searchLower = listingSearchTerm.toLowerCase();
                        return (
                          listing.event_name?.toLowerCase().includes(searchLower) ||
                          listing.username?.toLowerCase().includes(searchLower) ||
                          listing.content?.toLowerCase().includes(searchLower) ||
                          listing.venue?.toLowerCase().includes(searchLower)
                        );
                      }).length} 筆結果
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {listings
                      .filter((listing) => {
                        // Client-side search filter
                        if (!listingSearchTerm) return true;
                        const searchLower = listingSearchTerm.toLowerCase();
                        return (
                          listing.event_name?.toLowerCase().includes(searchLower) ||
                          listing.username?.toLowerCase().includes(searchLower) ||
                          listing.content?.toLowerCase().includes(searchLower) ||
                          listing.venue?.toLowerCase().includes(searchLower)
                        );
                      })
                      .map((listing) => (
                    <div
                      key={listing.listing_id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start gap-4">
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
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                listing.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : listing.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : listing.status === 'Canceled'
                                  ? 'bg-red-100 text-red-700'
                                  : listing.status === 'Deleted'
                                  ? 'bg-black text-white'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {listing.status === 'Active' ? '進行中' : 
                               listing.status === 'Completed' ? '已完成' : 
                               listing.status === 'Canceled' ? '已取消' : 
                               listing.status === 'Deleted' ? '已刪除' : '已過期'}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 mb-1">
                            {listing.event_name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            📍 {listing.venue}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            👤 <a 
                              href={`/users/${listing.user_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            >
                              {listing.username}
                            </a> ({listing.email})
                          </p>
                          {listing.content && (
                            <p className="text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                              {listing.content}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>📅 發布於: {new Date(listing.created_at).toLocaleString('zh-TW')}</span>
                            <span>💼 交易數: {listing.trade_count}</span>
                          </div>
                        </div>
                        
                        {/* Admin Actions */}
                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <a
                            href={`/listings/${listing.listing_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition text-center"
                          >
                            查看詳情
                          </a>
                          
                          {listing.status === 'Active' && (
                            <>
                              <button
                                onClick={() => handleUpdateListingStatus(listing.listing_id, 'Canceled')}
                                className="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 transition"
                              >
                                標記為取消
                              </button>
                              <button
                                onClick={() => handleUpdateListingStatus(listing.listing_id, 'Expired')}
                                className="px-3 py-1 text-xs font-medium text-white bg-gray-600 rounded hover:bg-gray-700 transition"
                              >
                                標記為過期
                              </button>
                            </>
                          )}
                          
                          {(listing.status === 'Canceled' || listing.status === 'Expired') && (
                            <button
                              onClick={() => handleUpdateListingStatus(listing.listing_id, 'Active')}
                              className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
                            >
                              恢復為進行中
                            </button>
                          )}
                          
                          {listing.status !== 'Completed' && listing.status !== 'Deleted' && (
                            <button
                              onClick={() => handleDeleteListing(listing.listing_id)}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition"
                            >
                              標記為刪除
                            </button>
                          )}
                          
                          {listing.status === 'Deleted' && (
                            <button
                              onClick={() => handleUpdateListingStatus(listing.listing_id, 'Active')}
                              className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
                            >
                              恢復貼文
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                  
                  {/* Bottom Pagination */}
                  {!loading && listingTotalCount > listingsPerPage && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button
                        onClick={() => setListingPage(p => Math.max(1, p - 1))}
                        disabled={listingPage === 1}
                        className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        ← 上一頁
                      </button>
                      
                      <div className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-semibold">
                        第 {listingPage} / {Math.ceil(listingTotalCount / listingsPerPage)} 頁
                      </div>
                      
                      <button
                        onClick={() => setListingPage(p => p + 1)}
                        disabled={listingPage >= Math.ceil(listingTotalCount / listingsPerPage)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        下一頁 →
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Statistics - Current Page */}
              {!loading && listings.length > 0 && (
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-3">📊 當前頁面統計 ({listings.length} 筆)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {listings.filter(l => l.status === 'Active').length}
                      </p>
                      <p className="text-xs text-gray-600">進行中</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {listings.filter(l => l.status === 'Completed').length}
                      </p>
                      <p className="text-xs text-gray-600">已完成</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {listings.filter(l => l.status === 'Canceled').length}
                      </p>
                      <p className="text-xs text-gray-600">已取消</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">
                        {listings.filter(l => l.status === 'Expired').length}
                      </p>
                      <p className="text-xs text-gray-600">已過期</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {listings.reduce((sum, l) => sum + parseInt(l.trade_count || 0), 0)}
                      </p>
                      <p className="text-xs text-gray-600">本頁交易數</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    💡 提示：這是當前頁面的統計。使用狀態篩選按鈕可以查看特定狀態的所有貼文。
                  </p>
                </div>
              )}

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">💡 管理說明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <span className="font-semibold">狀態篩選</span>: 點擊上方按鈕可以篩選不同狀態的貼文</li>
                  <li>• <span className="font-semibold">搜尋功能</span>: 可搜尋活動名稱、用戶名稱、場地或內容</li>
                  <li>• <span className="font-semibold">查看詳情</span>: 在新分頁開啟貼文詳細頁面</li>
                  <li>• <span className="font-semibold">標記為取消/過期</span>: 將進行中的貼文標記為取消或過期狀態</li>
                  <li>• <span className="font-semibold">恢復為進行中</span>: 將已取消或過期的貼文恢復為進行中</li>
                  <li>• <span className="font-semibold">刪除貼文</span>: 永久刪除沒有交易記錄的貼文（已完成或有交易的貼文無法刪除）</li>
                  <li>• <span className="font-semibold">建議</span>: 對於違規內容，先標記為取消，確認無問題後再刪除</li>
                </ul>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                用戶管理 ({users.length})
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                  <p className="mt-4 text-gray-600">載入中...</p>
                </div>
              ) : users.length === 0 ? (
                <p className="text-gray-600 text-center py-8">目前沒有用戶</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">用戶名</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">電子郵件</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">狀態</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">餘額</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">角色</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">票券/貼文/交易</th>
                        <th className="px-4 py-3 text-sm font-semibold text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((userItem) => (
                        <tr key={userItem.user_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {userItem.username}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {userItem.email}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                userItem.status === 'Active'
                                  ? 'bg-green-100 text-green-700'
                                  : userItem.status === 'Suspended'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {userItem.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            ${userItem.balance.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {userItem.roles.map((role: string) => (
                                <span
                                  key={role}
                                  className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {userItem.ticket_count} / {userItem.listing_count} / {userItem.trade_count}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {userItem.status !== 'Suspended' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(userItem.user_id, 'Suspended')}
                                  className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition"
                                >
                                  停權
                                </button>
                              )}
                              {userItem.status === 'Suspended' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(userItem.user_id, 'Active')}
                                  className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
                                >
                                  啟用
                                </button>
                              )}
                              {userItem.status !== 'Warning' && userItem.status !== 'Suspended' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(userItem.user_id, 'Warning')}
                                  className="px-3 py-1 text-xs font-medium text-white bg-yellow-600 rounded hover:bg-yellow-700 transition"
                                >
                                  警告
                                </button>
                              )}
                              {userItem.status === 'Warning' && (
                                <button
                                  onClick={() => handleUpdateUserStatus(userItem.user_id, 'Active')}
                                  className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition"
                                >
                                  解除警告
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2">用戶狀態說明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <span className="font-semibold">Active</span>: 正常使用中的用戶</li>
                  <li>• <span className="font-semibold">Suspended</span>: 已被停權，無法進行任何操作</li>
                  <li>• <span className="font-semibold">Warning</span>: 收到警告的用戶，可繼續使用但需注意行為</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

