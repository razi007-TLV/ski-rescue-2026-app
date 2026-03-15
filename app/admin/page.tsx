'use client';

import { useState } from 'react';
import { fetchActivityLog, type ActivityLogEntry } from '@/lib/supabase';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/log?password=${encodeURIComponent(password)}`);
      if (!res.ok) {
        setError('Wrong password');
        setLoading(false);
        return;
      }
      const data = await fetchActivityLog();
      setEntries(data);
      setAuthenticated(true);
    } catch {
      setError('Failed to fetch logs');
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setLoading(true);
    const data = await fetchActivityLog();
    setEntries(data);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const actionColor = (action: string) => {
    if (action === 'login') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    if (action === 'logout' || action === 'page_load') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    if (action.startsWith('add')) return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    if (action.startsWith('delete')) return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    if (action === 'tab_switch' || action === 'currency_switch') return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
    if (action === 'quick_settle') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const loginCounts = entries.reduce<Record<string, number>>((acc, e) => {
    if (e.action === 'login') acc[e.user_name] = (acc[e.user_name] || 0) + 1;
    return acc;
  }, {});

  const actionCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1;
    return acc;
  }, {});

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
            Admin Panel
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
            Enter password to view activity log
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : 'View Logs'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            Activity Log
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setAuthenticated(false)}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Lock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Events</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{entries.length}</p>
          </div>
          {Object.entries(loginCounts).map(([user, count]) => (
            <div key={user} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <p className="text-xs text-gray-500 dark:text-gray-400">{user} logins</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{count}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(actionCounts).map(([action, count]) => (
            <div key={action} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <p className="text-xs text-gray-500 dark:text-gray-400">{action}</p>
              <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{count}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Time</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">User</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No activity recorded yet
                    </td>
                  </tr>
                )}
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {entry.ts ? formatDate(entry.ts) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {entry.user_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColor(entry.action)}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {entry.details ? JSON.stringify(entry.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
