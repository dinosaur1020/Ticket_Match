'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function DashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tickets' | 'listings' | 'trades'>('tickets');
  const [tickets, setTickets] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tickets') {
        const response = await fetch('/api/tickets/my');
        const data = await response.json();
        setTickets(data.tickets || []);
      } else if (activeTab === 'trades') {
        const response = await fetch('/api/trades/my');
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTrade = async (tradeId: number) => {
    if (!confirm('確定要確認此交易嗎？')) return;

    try {
      const response = await fetch(`/api/trades/${tradeId}/confirm`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        await fetchData();
        await refreshUser();
      } else {
        alert(data.error || '確認交易失敗');
      }
    } catch (error) {
      console.error('Failed to confirm trade:', error);
      alert('確認交易失敗');
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

  if (authLoading || !user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">我的票券管理</h1>
            <div className="text-right">
              <p className="text-sm text-gray-600">目前餘額</p>
              <p className="text-3xl font-bold text-blue-900">
                ${user.balance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === 'tickets'
                  ? 'text-blue-900 border-b-2 border-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              我的票券
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === 'trades'
                  ? 'text-blue-900 border-b-2 border-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              我的交易
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          ) : (
            <>
              {/* Tickets Tab */}
              {activeTab === 'tickets' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    我的票券 ({tickets.length})
                  </h2>
                  {tickets.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">目前沒有票券</p>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.ticket_id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {ticket.event_name}
                              </h3>
                              <p className="text-gray-600">📍 {ticket.venue}</p>
                              <p className="text-gray-600">
                                🗓️ {formatDateTime(ticket.start_time)}
                              </p>
                              <p className="text-gray-600">
                                💺 {ticket.seat_area} {ticket.seat_number}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                  ticket.status === 'Active'
                                    ? 'bg-green-100 text-green-700'
                                    : ticket.status === 'Locked'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : ticket.status === 'Completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {ticket.status}
                              </span>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                ${ticket.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Trades Tab */}
              {activeTab === 'trades' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    我的交易 ({trades.length})
                  </h2>
                  {trades.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">目前沒有交易</p>
                  ) : (
                    <div className="space-y-4">
                      {trades.map((trade) => (
                        <div
                          key={trade.trade_id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {trade.event_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                類型: {trade.listing_type === 'Sell' ? '售票' : trade.listing_type === 'Buy' ? '收票' : '換票'}
                              </p>
                              <p className="text-sm text-gray-600">
                                我的角色: {trade.my_role === 'buyer' ? '買方' : '賣方'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                  trade.status === 'Completed'
                                    ? 'bg-green-100 text-green-700'
                                    : trade.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : trade.status === 'Canceled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {trade.status}
                              </span>
                              <p className="mt-2 text-lg font-bold text-gray-900">
                                ${trade.agreed_price.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Participants */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">參與者：</p>
                            <div className="flex gap-2">
                              {trade.participants.map((p: any) => (
                                <span
                                  key={p.user_id}
                                  className={`text-xs px-2 py-1 rounded ${
                                    p.confirmed
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {p.username} ({p.role}) {p.confirmed ? '✓' : '○'}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Action Button */}
                          {trade.status === 'Pending' && !trade.my_confirmed && (
                            <button
                              onClick={() => handleConfirmTrade(trade.trade_id)}
                              className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-800 transition font-semibold"
                            >
                              確認交易
                            </button>
                          )}

                          {trade.status === 'Pending' && trade.my_confirmed && (
                            <p className="text-center text-sm text-gray-600 py-2">
                              等待對方確認...
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

