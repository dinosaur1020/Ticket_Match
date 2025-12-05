'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

interface Participant {
  user_id: number;
  username: string;
  email: string;
  role: string;
  confirmed: boolean;
  confirmed_at?: string;
}

interface Ticket {
  ticket_id: number;
  from_user_id: number;
  to_user_id: number;
  from_username: string;
  to_username: string;
  seat_area: string;
  seat_number: string;
  price: number;
  ticket_status: string;
  ticket_event_name: string;
  ticket_venue: string;
  start_time: string;
  end_time?: string;
}

interface BalanceLog {
  log_id: number;
  user_id: number;
  username: string;
  change: number;
  reason: string;
  created_at: string;
}

interface Trade {
  trade_id: number;
  listing_id: number;
  status: string;
  agreed_price: number;
  created_at: string;
  updated_at: string;
  listing_type: string;
  listing_content?: string;
  event_date: string;
  event_name: string;
  venue: string;
  event_description?: string;
  participants: Participant[];
  tickets: Ticket[];
  balance_logs: BalanceLog[];
  my_role: string;
  my_confirmed: boolean;
  my_confirmed_at?: string;
}

export default function TradeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTradeDetail();
  }, [params.id]);

  const fetchTradeDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trades/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setTrade(data.trade);
      } else {
        console.error('Failed to fetch trade:', data.error);
        alert(data.error || '無法載入交易詳情');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch trade:', error);
      alert('載入交易詳情失敗');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTrade = async () => {
    if (!confirm('確定要確認此交易嗎？確認後您的票券將被鎖定。')) return;

    try {
      const response = await fetch(`/api/trades/${trade?.trade_id}/confirm`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        await fetchTradeDetail();
        await refreshUser();
      } else {
        alert(data.error || '確認交易失敗');
      }
    } catch (error) {
      console.error('Failed to confirm trade:', error);
      alert('確認交易失敗');
    }
  };

  const handleCancelTrade = async () => {
    if (!confirm('確定要取消此交易嗎？您的票券將被解鎖。')) return;

    try {
      const response = await fetch(`/api/trades/${trade?.trade_id}/cancel`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        await fetchTradeDetail();
        await refreshUser();
      } else {
        alert(data.error || '取消交易失敗');
      }
    } catch (error) {
      console.error('Failed to cancel trade:', error);
      alert('取消交易失敗');
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'buyer': return '買方';
      case 'seller': return '賣方';
      case 'exchanger': return '換票方';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Canceled': return 'bg-red-100 text-red-700';
      case 'Disputed': return 'bg-orange-100 text-orange-700';
      case 'Expired': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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

  if (!trade) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 text-xl mb-4">找不到此交易</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition"
            >
              返回控制台
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-900 hover:text-blue-700 font-semibold"
            >
              ← 返回控制台
            </button>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(trade.status)}`}>
              {trade.status}
            </span>
          </div>

          {/* Trade Overview */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">交易詳情 #{trade.trade_id}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">活動資訊</h3>
                <p className="text-xl font-bold text-gray-900">{trade.event_name}</p>
                <p className="text-gray-600">📍 {trade.venue}</p>
                <p className="text-gray-600">🗓️ {formatDateTime(trade.event_date)}</p>
                {trade.event_description && (
                  <p className="text-sm text-gray-600 mt-2">{trade.event_description}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">交易資訊</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">類型：</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm font-semibold ${
                      trade.listing_type === 'Sell' ? 'bg-green-100 text-green-700' :
                      trade.listing_type === 'Buy' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {trade.listing_type === 'Sell' ? '售票' : trade.listing_type === 'Buy' ? '收票' : '換票'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">協議金額：</span>
                    <span className={`ml-2 text-2xl font-bold ${
                      trade.agreed_price === 0 ? 'text-gray-600' :
                      trade.agreed_price > 0 ? 'text-blue-900' : 'text-green-600'
                    }`}>
                      {trade.agreed_price === 0 ? '等價交換' :
                       `$${Math.abs(trade.agreed_price).toLocaleString()}`}
                    </span>
                    {trade.listing_type === 'Exchange' && trade.agreed_price !== 0 && (
                      <span className="ml-2 text-sm text-gray-600">
                        {(() => {
                          const isListingOwner = trade.participants[0]?.user_id === user?.user_id;
                          const amount = Math.abs(trade.agreed_price);

                          if (trade.agreed_price > 0) {
                            // 正數：發起人（participants[1]）付錢給貼文主（participants[0]）
                            return isListingOwner ? `(對方付款 $${amount.toLocaleString()} 給您)` : `(您付款 $${amount.toLocaleString()} 給對方)`;
                          } else {
                            // 負數：貼文主（participants[0]）付錢給發起人（participants[1]）
                            return isListingOwner ? `(您付款 $${amount.toLocaleString()} 給對方)` : `(對方付款 $${amount.toLocaleString()} 給您)`;
                          }
                        })()}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">我的角色：</span>
                    <span className="ml-2 font-semibold text-gray-900">{getRoleLabel(trade.my_role)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">建立時間：</span>
                    <span className="ml-2 text-gray-900">{formatDateTime(trade.created_at)}</span>
                  </div>
                  {trade.updated_at !== trade.created_at && (
                    <div>
                      <span className="text-sm text-gray-600">更新時間：</span>
                      <span className="ml-2 text-gray-900">{formatDateTime(trade.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {trade.listing_content && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">貼文內容：</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{trade.listing_content}</p>
              </div>
            )}

            {/* View Listing Button */}
            <div className="mt-4">
              <button
                onClick={() => router.push(`/listings/${trade.listing_id}`)}
                className="text-blue-900 hover:text-blue-700 font-semibold text-sm"
              >
                查看原始貼文 →
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">參與者</h2>
            <div className="space-y-3">
              {trade.participants.map((participant) => (
                <div
                  key={participant.user_id}
                  className={`p-4 rounded-lg border-2 ${
                    participant.user_id === user?.user_id
                      ? 'border-blue-900 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">
                        {participant.username}
                        {participant.user_id === user?.user_id && (
                          <span className="ml-2 text-blue-900 text-sm">(您)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        角色: {getRoleLabel(participant.role)}
                      </p>
                    </div>
                    <div className="text-right">
                      {participant.confirmed ? (
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                            ✓ 已確認
                          </span>
                          {participant.confirmed_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDateTime(participant.confirmed_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                          ○ 未確認
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">票券轉移</h2>
            {trade.tickets.length === 0 ? (
              <p className="text-gray-600 text-center py-4">此交易不涉及票券轉移</p>
            ) : (
              <div className="space-y-4">
                {trade.tickets.map((ticket) => (
                  <div
                    key={ticket.ticket_id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">
                          {ticket.ticket_event_name}
                        </h3>
                        <p className="text-sm text-gray-600">📍 {ticket.ticket_venue}</p>
                        <p className="text-sm text-gray-600">
                          🗓️ {formatDateTime(ticket.start_time)}
                        </p>
                        <p className="text-sm text-gray-600">
                          💺 {ticket.seat_area}區 {ticket.seat_number}號
                        </p>
                        <p className="text-lg font-bold text-blue-900 mt-2">
                          ${ticket.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          ticket.ticket_status === 'Active' ? 'bg-green-100 text-green-700' :
                          ticket.ticket_status === 'Locked' ? 'bg-yellow-100 text-yellow-700' :
                          ticket.ticket_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ticket.ticket_status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">從</p>
                          <p className={`font-semibold ${
                            ticket.from_user_id === user?.user_id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {ticket.from_username}
                            {ticket.from_user_id === user?.user_id && ' (您)'}
                          </p>
                        </div>
                        <div className="text-2xl text-gray-400">→</div>
                        <div className="text-left">
                          <p className="text-sm text-gray-600">到</p>
                          <p className={`font-semibold ${
                            ticket.to_user_id === user?.user_id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {ticket.to_username}
                            {ticket.to_user_id === user?.user_id && ' (您)'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Balance Logs */}
          {trade.balance_logs.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">金額變動記錄</h2>
              <div className="space-y-2">
                {trade.balance_logs.map((log) => (
                  <div
                    key={log.log_id}
                    className={`p-3 rounded-lg ${
                      log.user_id === user?.user_id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {log.username}
                          {log.user_id === user?.user_id && ' (您)'}
                        </p>
                        <p className="text-sm text-gray-600">{log.reason}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(log.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          log.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.change > 0 ? '+' : ''}${log.change.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {trade.status === 'Pending' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">操作</h2>
              
              {!trade.my_confirmed ? (
                <div className="space-y-3">
                  <p className="text-gray-700 mb-4">
                    請確認交易資訊無誤後，點擊「確認交易」按鈕。確認後您的票券將被鎖定，直到交易完成或取消。
                  </p>
                  <button
                    onClick={handleConfirmTrade}
                    className="w-full bg-blue-900 text-white py-3 rounded-lg hover:bg-blue-800 transition font-semibold text-lg"
                  >
                    ✓ 確認交易
                  </button>
                  <button
                    onClick={handleCancelTrade}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    ✗ 取消交易
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-semibold">✓ 您已確認此交易</p>
                    <p className="text-sm text-green-700 mt-1">等待對方確認...</p>
                  </div>
                  <button
                    onClick={handleCancelTrade}
                    className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    ✗ 取消交易
                  </button>
                </div>
              )}
            </div>
          )}

          {trade.status === 'Completed' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-green-800 font-semibold text-lg">✓ 交易已完成</p>
              <p className="text-green-700 mt-2">票券已轉移，金額已結算</p>
            </div>
          )}

          {trade.status === 'Canceled' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-800 font-semibold text-lg">✗ 交易已取消</p>
              <p className="text-red-700 mt-2">所有票券已解鎖</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

