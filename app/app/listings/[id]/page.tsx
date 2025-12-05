'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface Listing {
  listing_id: number;
  user_id: number;
  username: string;
  seller_id: number;
  event_id: number;
  event_name: string;
  venue: string;
  event_description?: string;
  event_date: string;
  content?: string;
  status: string;
  type: 'Sell' | 'Buy' | 'Exchange';
  offered_ticket_ids?: number[];
  offered_tickets?: any[];
  created_at: string;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [paymentDirection, setPaymentDirection] = useState<'i_pay' | 'they_pay'>('i_pay');

  useEffect(() => {
    fetchListingDetail();
    if (user) {
      fetchMyTickets();
    }
  }, [params.id, user]);

  const fetchListingDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/listings/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setListing(data.listing);
        setEditContent(data.listing.content || '');
        setEditStatus(data.listing.status);
      } else {
        console.error('Failed to fetch listing:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTickets = async () => {
    try {
      const response = await fetch('/api/tickets/my');
      const data = await response.json();
      
      if (response.ok) {
        // Filter only active tickets
        setMyTickets((data.tickets || []).filter((t: any) => t.status === 'Active'));
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const handleInitiateTrade = async () => {
    if (!user) {
      alert('請先登入');
      router.push('/login');
      return;
    }

    if (agreedPrice === '') {
      alert('請輸入交易金額（換票可輸入0）');
      return;
    }

    let priceValue = parseFloat(agreedPrice);
    if (priceValue < 0) {
      alert('交易金額不能為負數');
      return;
    }

    // For Exchange: if they_pay, use negative price to indicate direction
    if (listing?.type === 'Exchange' && paymentDirection === 'they_pay') {
      priceValue = -priceValue;
    }

    // Validation based on listing type
    if (listing?.type === 'Buy' && selectedTickets.length === 0) {
      alert('請選擇至少一張票券');
      return;
    }

    if (listing?.type === 'Exchange' && selectedTickets.length === 0) {
      alert('請選擇您要提供的票券');
      return;
    }

    setTradeLoading(true);

    try {
      let ticketIds: number[] = [];
      let listingOwnerTicketIds: number[] = [];

      if (listing?.type === 'Sell') {
        // For Sell listings, use offered_ticket_ids from listing
        ticketIds = [];
        listingOwnerTicketIds = listing.offered_ticket_ids || [];
      } else if (listing?.type === 'Buy') {
        // For Buy listings, initiator provides tickets
        ticketIds = selectedTickets;
        listingOwnerTicketIds = [];
      } else if (listing?.type === 'Exchange') {
        // For Exchange, both parties provide tickets
        ticketIds = selectedTickets;
        listingOwnerTicketIds = listing.offered_ticket_ids || [];
      }

      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing?.listing_id,
          agreed_price: priceValue,
          ticket_ids: ticketIds,
          listing_owner_ticket_ids: listingOwnerTicketIds,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('交易建立成功！請前往「我的交易」查看');
        router.push('/dashboard');
      } else {
        alert(data.error || '建立交易失敗');
      }
    } catch (error) {
      console.error('Failed to initiate trade:', error);
      alert('建立交易失敗');
    } finally {
      setTradeLoading(false);
    }
  };

  const toggleTicket = (ticketId: number) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleUpdateListing = async () => {
    if (!listing) return;

    try {
      const response = await fetch(`/api/listings/${listing.listing_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          status: editStatus,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('貼文更新成功！');
        setIsEditing(false);
        fetchListingDetail(); // Refresh the listing
      } else {
        alert(data.error || '更新失敗');
      }
    } catch (error) {
      console.error('Failed to update listing:', error);
      alert('更新失敗');
    }
  };

  const handleDeleteListing = async () => {
    if (!listing) return;

    if (!confirm('確定要刪除此貼文嗎？此操作無法復原。')) {
      return;
    }

    try {
      const response = await fetch(`/api/listings/${listing.listing_id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('貼文已刪除');
        router.push('/listings');
      } else {
        alert(data.error || '刪除失敗');
      }
    } catch (error) {
      console.error('Failed to delete listing:', error);
      alert('刪除失敗');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(listing?.content || '');
    setEditStatus(listing?.status || '');
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

  if (!listing) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-xl mb-4">找不到此貼文</p>
            <button
              onClick={() => router.push('/listings')}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition"
            >
              返回貼文列表
            </button>
          </div>
        </div>
      </>
    );
  }

  const isOwnListing = user?.user_id === listing.seller_id;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Listing Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
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
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    listing.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {listing.status}
                </span>
              </div>

              {/* Edit/Delete Buttons for Owner */}
              {isOwnListing && listing.status !== 'Completed' && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
                  >
                    編輯
                  </button>
                  <button
                    onClick={handleDeleteListing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-semibold"
                  >
                    刪除
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {listing.event_name}
            </h1>

            <div className="space-y-2 text-gray-700 mb-4">
              <p className="flex items-center gap-2">
                <span className="font-semibold">場地：</span>
                <span>{listing.venue}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">時間：</span>
                <span>{formatDateTime(listing.event_date)}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">發文者：</span>
                <span>{listing.username}</span>
              </p>
            </div>

            {listing.event_description && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{listing.event_description}</p>
              </div>
            )}

            {/* Edit Mode */}
            {isEditing && isOwnListing ? (
              <div className="mt-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">編輯貼文</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        貼文內容
                      </label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                        rows={4}
                        placeholder="輸入貼文內容..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        狀態
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                      >
                        <option value="Active">Active</option>
                        <option value="Canceled">Canceled</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        將狀態改為「Canceled」會讓貼文不再顯示在列表中
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateListing}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                      >
                        儲存變更
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              listing.content && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-2">貼文內容：</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{listing.content}</p>
                </div>
              )
            )}

            {/* Display Offered Tickets */}
            {listing.offered_tickets && listing.offered_tickets.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {listing.type === 'Sell' ? '出售票券：' : '提供票券：'}
                </h3>
                <div className="space-y-3">
                  {listing.offered_tickets.map((ticket: any) => (
                    <div
                      key={ticket.ticket_id}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-green-300"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {ticket.event_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          📍 {ticket.venue}
                        </p>
                        <p className="text-sm text-gray-600">
                          🎫 {ticket.seat_area}區 {ticket.seat_number}號
                        </p>
                        {ticket.start_time && (
                          <p className="text-xs text-gray-500 mt-1">
                            🗓️ {formatDateTime(ticket.start_time)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${ticket.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">票券價格</p>
                      </div>
                    </div>
                  ))}
                </div>
                {listing.offered_tickets.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <p className="text-right font-semibold text-gray-900">
                      總計: ${listing.offered_tickets.reduce((sum: number, t: any) => sum + t.price, 0).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              發布時間：{new Date(listing.created_at).toLocaleString('zh-TW')}
            </p>
          </div>

          {/* Trade Initiation Section */}
          {user && !isOwnListing && listing.status === 'Active' && !isEditing && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">發起交易</h2>

              {/* Price Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  協議金額 *
                </label>

                {/* Payment Direction for Exchange */}
                {listing.type === 'Exchange' && (
                  <div className="mb-3">
                    <div className="flex gap-3">
                      <label className="flex-1">
                        <input
                          type="radio"
                          name="paymentDirection"
                          value="i_pay"
                          checked={paymentDirection === 'i_pay'}
                          onChange={(e) => setPaymentDirection(e.target.value as 'i_pay' | 'they_pay')}
                          className="mr-2"
                        />
                        <span className="text-gray-900">我給對方錢（補差價）</span>
                      </label>
                      <label className="flex-1">
                        <input
                          type="radio"
                          name="paymentDirection"
                          value="they_pay"
                          checked={paymentDirection === 'they_pay'}
                          onChange={(e) => setPaymentDirection(e.target.value as 'i_pay' | 'they_pay')}
                          className="mr-2"
                        />
                        <span className="text-gray-900">對方給我錢（收差價）</span>
                      </label>
                    </div>
                  </div>
                )}

                <input
                  type="number"
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                  placeholder="輸入交易金額"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900"
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {listing.type === 'Sell' 
                    ? '您需要支付的金額' 
                    : listing.type === 'Buy'
                    ? '您將收到的金額'
                    : paymentDirection === 'i_pay'
                    ? '您將支付給對方的金額（輸入0表示等價交換）'
                    : '對方將支付給您的金額（輸入0表示等價交換）'
                  }
                </p>
              </div>

              {/* Ticket Selection (for Buy and Exchange listings) */}
              {(listing.type === 'Buy' || listing.type === 'Exchange') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    選擇您要提供的票券 *
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    {listing.type === 'Buy' 
                      ? '此買家想要收購票券，請選擇您要出售的票券'
                      : '請選擇您想用來交換的票券'}
                  </p>
                  {myTickets.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-3">您目前沒有可用的票券</p>
                      <button
                        onClick={() => router.push('/tickets/add')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        立即新增票券
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myTickets.map((ticket) => (
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
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Exchange: Show tickets offered by listing owner */}
              {listing.type === 'Exchange' && listing.offered_tickets && listing.offered_tickets.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    對方提供的票券
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    以下是對方願意交換的票券：
                  </p>
                  <div className="space-y-2">
                    {listing.offered_tickets.map((ticket: any) => (
                      <div
                        key={ticket.ticket_id}
                        className="flex items-center gap-3 p-3 border border-blue-300 bg-blue-50 rounded-lg"
                      >
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
                        <span className="text-green-600 font-semibold">✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {listing.type === 'Exchange' && (!listing.offered_tickets || listing.offered_tickets.length === 0) && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 此換票貼文尚未指定提供的票券
                  </p>
                </div>
              )}

              {/* Info for different listing types */}
              {listing.type === 'Sell' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ℹ️ 此為售票貼文，賣家會提供票券。您只需支付協議金額即可。
                  </p>
                </div>
              )}
              
              {listing.type === 'Exchange' && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 mb-2">
                    ℹ️ 此為換票貼文，雙方交換票券。
                  </p>
                  <p className="text-sm text-orange-800">
                    • 輸入0表示等價交換（不涉及金錢）<br />
                    • 選擇「我給對方錢」表示您要補差價給對方<br />
                    • 選擇「對方給我錢」表示對方要補差價給您
                  </p>
                </div>
              )}

              {/* Balance Check */}
              {(listing.type === 'Sell' || (listing.type === 'Exchange' && paymentDirection === 'i_pay' && parseFloat(agreedPrice || '0') > 0)) && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    目前餘額：<span className="font-bold">${user.balance.toFixed(2)}</span>
                  </p>
                  {agreedPrice && parseFloat(agreedPrice) > user.balance && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ 餘額不足！請充值或降低交易金額
                    </p>
                  )}
                </div>
              )}

              {listing.type === 'Exchange' && paymentDirection === 'they_pay' && parseFloat(agreedPrice || '0') > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ 您將收到：<span className="font-bold">${parseFloat(agreedPrice).toFixed(2)}</span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleInitiateTrade}
                disabled={
                  tradeLoading || 
                  (listing.type === 'Buy' && selectedTickets.length === 0) ||
                  (listing.type === 'Exchange' && selectedTickets.length === 0) ||
                  (listing.type === 'Exchange' && (!listing.offered_tickets || listing.offered_tickets.length === 0))
                }
                className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tradeLoading ? '建立中...' : '確認發起交易'}
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                發起交易後，需要雙方確認才會完成票券轉移與金額交換
              </p>
            </div>
          )}

          {isOwnListing && !isEditing && listing.status === 'Active' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <p className="text-yellow-800">這是您自己的貼文，無法與自己交易</p>
              <p className="text-yellow-700 text-sm mt-2">使用上方的「編輯」或「刪除」按鈕來管理您的貼文</p>
            </div>
          )}

          {!user && listing.status === 'Active' && !isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-800 mb-4">請先登入以發起交易</p>
              <button
                onClick={() => router.push('/login')}
                className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition font-semibold"
              >
                前往登入
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

