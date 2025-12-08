'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userDescription, setUserDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile');
      const data = await response.json();
      
      if (response.ok) {
        setProfile(data.user);
        setUserDescription(data.user.user_description || '');
      } else {
        console.error('Failed to fetch profile:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_description: userDescription }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('個人簡介更新成功！');
        setProfile(data.user);
        setIsEditing(false);
      } else {
        alert(data.error || '更新失敗');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('更新失敗');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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
            <p className="text-center text-gray-600">無法載入個人資料</p>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">我的個人資料</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-900 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
                  <p className="text-gray-600 text-sm mt-1">{profile.email}</p>
                  
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

              <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <h3 className="font-bold text-gray-900 mb-4">帳戶資訊</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm">餘額</span>
                    <span className="font-bold text-lg text-green-600">
                      ${profile.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">個人簡介</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      ✏️ 編輯
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        簡介內容 (最多 500 字)
                      </label>
                      <textarea
                        value={userDescription}
                        onChange={(e) => setUserDescription(e.target.value)}
                        maxLength={500}
                        rows={6}
                        placeholder="介紹一下你自己吧！例如：你喜歡的音樂類型、參加過的演唱會、收藏票券的興趣等..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 resize-none"
                        disabled={saving}
                      />
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500">
                          {userDescription.length} / 500 字
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveDescription}
                        disabled={saving}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                      >
                        {saving ? '儲存中...' : '💾 儲存'}
                      </button>
                      <button
                        onClick={() => {
                          setUserDescription(profile.user_description || '');
                          setIsEditing(false);
                        }}
                        disabled={saving}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold disabled:opacity-50"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
                    {profile.user_description ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{profile.user_description}</p>
                    ) : (
                      <p className="text-gray-400 italic">尚未設定個人簡介</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">快速連結</h3>
                <div className="grid grid-cols-2 gap-4">
                  <a
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-900 rounded-lg hover:bg-blue-100 transition font-semibold"
                  >
                    📊 我的儀表板
                  </a>
                  <a
                    href="/listings/create"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-900 rounded-lg hover:bg-green-100 transition font-semibold"
                  >
                    ➕ 發布貼文
                  </a>
                  <a
                    href="/tickets/add"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-900 rounded-lg hover:bg-purple-100 transition font-semibold"
                  >
                    🎫 新增票券
                  </a>
                  <a
                    href="/analytics"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-900 rounded-lg hover:bg-orange-100 transition font-semibold"
                  >
                    📈 數據分析
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

