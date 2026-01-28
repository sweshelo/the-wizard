'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  checkIsAdmin,
  getSystemConfig,
  updateDailyFreePlays,
  getTickets,
  createTickets,
  getUsers,
  setUserAdmin,
  type CreateTicketRequest,
} from '@/actions/admin';
import type { Ticket, Profile } from '@/type/supabase';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'tickets' | 'users' | 'config'>('tickets');

  // システム設定
  const [dailyFreePlays, setDailyFreePlays] = useState(3);
  const [newDailyFreePlays, setNewDailyFreePlays] = useState(3);

  // チケット
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketCount, setTicketCount] = useState(0);
  const [showUsedTickets, setShowUsedTickets] = useState(true);
  const [newTicketCredits, setNewTicketCredits] = useState(10);
  const [newTicketCount, setNewTicketCount] = useState(1);
  const [newTicketExpiry, setNewTicketExpiry] = useState<'30days' | '90days' | 'never'>('30days');
  const [createdTickets, setCreatedTickets] = useState<{ id: string; code: string }[]>([]);

  // ユーザー
  const [users, setUsers] = useState<(Profile & { credits: number })[]>([]);
  const [userCount, setUserCount] = useState(0);

  // ローディング・エラー
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 管理者チェック
  useEffect(() => {
    const checkAdmin = async () => {
      const result = await checkIsAdmin();
      setIsAdmin(result.isAdmin);
      if (!result.isAdmin) {
        router.push('/entrance');
      }
    };
    checkAdmin();
  }, [router]);

  // データ読み込み
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, activeTab, showUsedTickets]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'config') {
        const config = await getSystemConfig();
        setDailyFreePlays(config.dailyFreePlays);
        setNewDailyFreePlays(config.dailyFreePlays);
      } else if (activeTab === 'tickets') {
        const result = await getTickets({ showUsed: showUsedTickets });
        setTickets(result.tickets);
        setTicketCount(result.total);
      } else if (activeTab === 'users') {
        const result = await getUsers();
        setUsers(result.users);
        setUserCount(result.total);
      }
    } catch {
      setError('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 設定更新
  const handleUpdateConfig = async () => {
    setError(null);
    setSuccessMessage(null);

    const result = await updateDailyFreePlays(newDailyFreePlays);
    if (result.success) {
      setDailyFreePlays(newDailyFreePlays);
      setSuccessMessage('設定を更新しました');
    } else {
      setError(result.message ?? 'エラーが発生しました');
    }
  };

  // チケット発行
  const handleCreateTickets = async () => {
    setError(null);
    setSuccessMessage(null);
    setCreatedTickets([]);

    const expiresAt =
      newTicketExpiry === 'never'
        ? null
        : newTicketExpiry === '90days'
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const request: CreateTicketRequest = {
      credits: newTicketCredits,
      count: newTicketCount,
      expiresAt,
    };

    const result = await createTickets(request);
    if (result.success) {
      setCreatedTickets(result.tickets);
      setSuccessMessage(`${result.tickets.length}件のチケットを発行しました`);
      loadData();
    } else {
      setError(result.message ?? 'エラーが発生しました');
    }
  };

  // 管理者権限変更
  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    const result = await setUserAdmin(userId, !currentIsAdmin);
    if (result.success) {
      loadData();
    } else {
      setError(result.message ?? 'エラーが発生しました');
    }
  };

  // コードをコピー
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('コピーしました');
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">管理者ダッシュボード</h1>
          <Link
            href="/entrance"
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            エントランスへ戻る
          </Link>
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-6">
          {(['tickets', 'users', 'config'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab === 'tickets'
                ? 'チケット管理'
                : tab === 'users'
                  ? 'ユーザー管理'
                  : 'システム設定'}
            </button>
          ))}
        </div>

        {/* メッセージ */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-600 text-red-200 rounded-md">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-900 border border-green-600 text-green-200 rounded-md">
            {successMessage}
          </div>
        )}

        {/* チケット管理 */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            {/* チケット発行フォーム */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-white mb-4">チケット発行</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">クレジット数</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newTicketCredits}
                    onChange={e => setNewTicketCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">発行枚数</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTicketCount}
                    onChange={e => setNewTicketCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">有効期限</label>
                  <select
                    value={newTicketExpiry}
                    onChange={e =>
                      setNewTicketExpiry(e.target.value as '30days' | '90days' | 'never')
                    }
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-md"
                  >
                    <option value="30days">30日間</option>
                    <option value="90days">90日間</option>
                    <option value="never">無期限</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCreateTickets}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    発行
                  </button>
                </div>
              </div>

              {/* 発行されたチケット */}
              {createdTickets.length > 0 && (
                <div className="mt-4 p-4 bg-gray-700 rounded-md">
                  <h3 className="text-white font-medium mb-2">発行されたチケットコード:</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {createdTickets.map(ticket => (
                      <div key={ticket.id} className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1 bg-gray-800 text-green-400 rounded font-mono">
                          {ticket.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(ticket.code)}
                          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
                        >
                          コピー
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdTickets.map(t => t.code).join('\n'))}
                    className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    全てコピー
                  </button>
                </div>
              )}
            </div>

            {/* チケット一覧 */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">チケット一覧 ({ticketCount}件)</h2>
                <label className="flex items-center gap-2 text-gray-400">
                  <input
                    type="checkbox"
                    checked={showUsedTickets}
                    onChange={e => setShowUsedTickets(e.target.checked)}
                    className="rounded"
                  />
                  使用済みを表示
                </label>
              </div>

              {isLoading ? (
                <div className="text-gray-400">読み込み中...</div>
              ) : tickets.length === 0 ? (
                <div className="text-gray-400">チケットがありません</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2">コード</th>
                        <th className="text-left py-2">クレジット</th>
                        <th className="text-left py-2">状態</th>
                        <th className="text-left py-2">有効期限</th>
                        <th className="text-left py-2">作成日</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(ticket => (
                        <tr key={ticket.id} className="border-b border-gray-700">
                          <td className="py-2">
                            <code className="text-green-400 font-mono">{ticket.code}</code>
                          </td>
                          <td className="py-2 text-white">{ticket.credits}</td>
                          <td className="py-2">
                            {ticket.owner_id ? (
                              <span className="text-gray-400">使用済み</span>
                            ) : ticket.expires_at && new Date(ticket.expires_at) < new Date() ? (
                              <span className="text-red-400">期限切れ</span>
                            ) : (
                              <span className="text-green-400">有効</span>
                            )}
                          </td>
                          <td className="py-2 text-gray-400">
                            {ticket.expires_at
                              ? new Date(ticket.expires_at).toLocaleDateString('ja-JP')
                              : '無期限'}
                          </td>
                          <td className="py-2 text-gray-400">
                            {new Date(ticket.created_at).toLocaleDateString('ja-JP')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ユーザー管理 */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">ユーザー一覧 ({userCount}件)</h2>

            {isLoading ? (
              <div className="text-gray-400">読み込み中...</div>
            ) : users.length === 0 ? (
              <div className="text-gray-400">ユーザーがいません</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2">ユーザー</th>
                      <th className="text-left py-2">Discord ID</th>
                      <th className="text-left py-2">クレジット</th>
                      <th className="text-left py-2">管理者</th>
                      <th className="text-left py-2">登録日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-700">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {user.avatar_url && (
                              <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                            )}
                            <span className="text-white">{user.discord_username}</span>
                          </div>
                        </td>
                        <td className="py-2 text-gray-400">{user.discord_id}</td>
                        <td className="py-2 text-white">{user.credits}</td>
                        <td className="py-2">
                          <button
                            onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                            className={`px-2 py-1 rounded text-xs ${
                              user.is_admin
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-600 text-gray-300'
                            }`}
                          >
                            {user.is_admin ? '管理者' : '一般'}
                          </button>
                        </td>
                        <td className="py-2 text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('ja-JP')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* システム設定 */}
        {activeTab === 'config' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">システム設定</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  1日の無料プレイ回数 (現在: {dailyFreePlays}回)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newDailyFreePlays}
                    onChange={e => setNewDailyFreePlays(Number(e.target.value))}
                    className="w-32 px-3 py-2 bg-gray-700 text-white rounded-md"
                  />
                  <button
                    onClick={handleUpdateConfig}
                    disabled={newDailyFreePlays === dailyFreePlays}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    更新
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
