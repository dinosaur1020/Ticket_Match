'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function PublicUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const userId = params.id as string;

  useEffect(() => {
    fetchProfile();
    fetchUserListings();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.user);
      } else {
        console.error('Failed to fetch profile:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListings = async () => {
    setLoadingListings(true);
    try {
      // Fetch active listings from this user
      const response = await fetch(`/api/listings?status=Active&limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter to only show this user's listings (convert userId string to match)
        const userListings = data.listings.filter((l: any) => l.user_id.toString() === userId || l.user_id === userId);
        setListings(userListings);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  const isOwnProfile = currentUser && currentUser.user_id.toString() === userId;

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
              <p className="mt-4 text-gray-600">載入中...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">用戶不存在</h2>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                返回
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* Back button and own profile notice */}
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← 返回
            </button>
            {isOwnProfile && (
              <a
                href="/profile"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                編輯個人資料
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-900 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          profile.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : profile.status === 'Suspended'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {profile.status === 'Active' ? '正常' : profile.status === 'Suspended' ? '停權' : '警告'}
                      </span>
                    </div>
                    
                    {profile.roles && profile.roles.length > 0 && (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {profile.roles.map((role: string) => (
                          <span
                            key={role}
                            className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
                          >
                            {role === 'Operator' ? '管理員' : '用戶'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">📊 統計資料</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">進行中貼文</span>
                    <span className="font-bold text-lg text-green-600">
                      {profile.stats.active_listings}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">已完成貼文</span>
                    <span className="font-bold text-lg text-blue-600">
                      {profile.stats.completed_listings}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">擁有票券</span>
                    <span className="font-bold text-lg text-purple-600">
                      {profile.stats.active_tickets}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">總交易數</span>
                    <span className="font-bold text-lg text-orange-600">
                      {profile.stats.total_trades}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm">加入時間</span>
                    <span className="text-gray-900 text-sm">
                      {new Date(profile.created_at).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">關於我</h3>
                <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
                  {profile.user_description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{profile.user_description}</p>
                  ) : (
                    <p className="text-gray-400 italic">此用戶尚未設定個人簡介</p>
                  )}
                </div>
              </div>

              {/* Active Listings */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  最近的貼文 ({listings.length})
                </h3>

                {loadingListings ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                  </div>
                ) : listings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">目前沒有進行中的貼文</p>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <a
                        key={listing.listing_id}
                        href={`/listings/${listing.listing_id}`}
                        className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
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
                            </div>
                            <h4 className="font-bold text-gray-900 mb-1">
                              {listing.event_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              📍 {listing.venue}
                            </p>
                            {listing.content && (
                              <p className="text-gray-700 mt-2 text-sm line-clamp-2">
                                {listing.content}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(listing.created_at).toLocaleDateString('zh-TW')}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {listings.length > 0 && (
                  <div className="mt-4 text-center">
                    <a
                      href={`/listings?user=${userId}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      查看所有貼文 →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

