'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Ticket {
  ticket_id: number;
  seat_area: string;
  seat_number: string;
  price: number;
  status: string;
}

interface Listing {
  listing_id: number;
  user_id: number;
  username: string;
  event_id: number;
  event_name: string;
  venue: string;
  event_date: string;
  content: string;
  status: string;
  type: 'Sell' | 'Buy' | 'Exchange';
  created_at: string;
  offered_tickets?: Ticket[];
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchListings();
  }, [filter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let url = '/api/listings?status=Active';
      if (filter !== 'all') {
        url += `&type=${filter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">所有貼文</h1>
            <Link
              href="/listings/create"
              className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-semibold"
            >
              ➕ 建立貼文
            </Link>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all'
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('Sell')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'Sell'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-green-50 border border-gray-300'
              }`}
            >
              售票
            </button>
            <button
              onClick={() => setFilter('Buy')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'Buy'
                  ? 'bg-blue-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
              }`}
            >
              收票
            </button>
            <button
              onClick={() => setFilter('Exchange')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'Exchange'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-300'
              }`}
            >
              換票
            </button>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-gray-600">沒有找到貼文</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link
                  key={listing.listing_id}
                  href={`/listings/${listing.listing_id}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 block"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        listing.type === 'Sell'
                          ? 'bg-green-100 text-green-700'
                          : listing.type === 'Buy'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {listing.type === 'Sell' ? '售票' : listing.type === 'Buy' ? '收票' : '換票'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {listing.event_name}
                  </h3>
                  
                  <p className="text-gray-600 mb-2">
                    📍 {listing.venue}
                  </p>

                  <p className="text-sm text-gray-500 mb-3">
                    🗓️ {formatDate(listing.event_date)}
                  </p>

                  {listing.content && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {listing.content}
                    </p>
                  )}

                  {/* Display ticket prices if available */}
                  {listing.offered_tickets && listing.offered_tickets.length > 0 && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-600 mb-2">提供的票券：</p>
                      <div className="space-y-1">
                        {listing.offered_tickets.slice(0, 3).map((ticket) => (
                          <div key={ticket.ticket_id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">
                              {ticket.seat_area}區 {ticket.seat_number}號
                            </span>
                            <span className="font-semibold text-green-600">
                              ${ticket.price.toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {listing.offered_tickets.length > 3 && (
                          <p className="text-xs text-gray-500 mt-1">
                            +{listing.offered_tickets.length - 3} 張票券
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>by {listing.username}</span>
                      <span>{new Date(listing.created_at).toLocaleDateString('zh-TW')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

