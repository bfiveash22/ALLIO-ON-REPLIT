'use client';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Download, 
  Beaker,
  LogOut,
  RefreshCw,
  Activity,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  signupsByDate: Record<string, number>;
  popularPeptides: Array<{
    peptide: {
      id: string;
      name: string;
      era: string;
    };
    conversationCount: number;
  }>;
  peptideMessageCounts: Record<string, number>;
  recentActivity: Array<{
    id: string;
    userName: string;
    userEmail: string;
    peptideName: string;
    peptideEra: string;
    messageCount: number;
    createdAt: string;
  }>;
}

export default function AdminDashboard({ userName }: { userName: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExport = async (type: 'users' | 'conversations' | 'messages') => {
    setExporting(type);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  // Prepare chart data
  const signupChartData = stats ? Object.entries(stats.signupsByDate).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    signups: count
  })) : [];

  const peptideChartData = stats ? stats.popularPeptides.slice(0, 8).map(p => ({
    name: p.peptide.name.length > 15 ? p.peptide.name.substring(0, 15) + '...' : p.peptide.name,
    conversations: p.conversationCount,
    messages: stats.peptideMessageCounts[p.peptide.id] || 0
  })) : [];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-slate-400 hover:text-cyan-400 transition">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Beaker className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <span className="text-slate-400 hidden sm:block">{userName}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading && !stats ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-6 border border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-cyan-400" />
                  <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
                </div>
                <h3 className="text-slate-400 text-sm">Total Users</h3>
                <p className="text-emerald-400 text-xs mt-1">
                  {stats.activeUsers} active ({Math.round((stats.activeUsers / stats.totalUsers) * 100)}%)
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-6 border border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-8 h-8 text-purple-400" />
                  <span className="text-2xl font-bold text-white">{stats.totalConversations}</span>
                </div>
                <h3 className="text-slate-400 text-sm">Conversations</h3>
                <p className="text-purple-400 text-xs mt-1">
                  {stats.avgMessagesPerConversation} avg messages
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl p-6 border border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                  <span className="text-2xl font-bold text-white">{stats.totalMessages}</span>
                </div>
                <h3 className="text-slate-400 text-sm">Total Messages</h3>
                <p className="text-emerald-400 text-xs mt-1">
                  Across all chats
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-6 border border-slate-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-pink-400" />
                  <span className="text-2xl font-bold text-white">
                    {stats.popularPeptides[0]?.conversationCount || 0}
                  </span>
                </div>
                <h3 className="text-slate-400 text-sm">Top Peptide</h3>
                <p className="text-pink-400 text-xs mt-1 truncate">
                  {stats.popularPeptides[0]?.peptide.name || 'N/A'}
                </p>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Signups Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-6 border border-slate-800"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  User Signups (Last 30 Days)
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={signupChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="signups" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      dot={{ fill: '#06b6d4', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Popular Peptides Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-xl p-6 border border-slate-800"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-purple-400" />
                  Most Popular Peptides
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={peptideChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      style={{ fontSize: '11px' }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="conversations" fill="#a855f7" name="Conversations" />
                    <Bar dataKey="messages" fill="#06b6d4" name="Messages" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Export Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-xl p-6 border border-slate-800"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                Export Data
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleExport('users')}
                  disabled={exporting === 'users'}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition disabled:opacity-50 text-white font-medium"
                >
                  {exporting === 'users' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export Users
                </button>
                <button
                  onClick={() => handleExport('conversations')}
                  disabled={exporting === 'conversations'}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50 text-white font-medium"
                >
                  {exporting === 'conversations' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export Conversations
                </button>
                <button
                  onClick={() => handleExport('messages')}
                  disabled={exporting === 'messages'}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition disabled:opacity-50 text-white font-medium"
                >
                  {exporting === 'messages' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export Messages (Latest 5K)
                </button>
              </div>
              <p className="text-slate-400 text-sm mt-4">
                Download complete data exports as CSV files for analysis in Excel, Google Sheets, or other tools.
              </p>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass rounded-xl p-6 border border-slate-800"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-400" />
                Recent Activity
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {stats.recentActivity.map((activity, index) => (
                  <Link
                    key={activity.id}
                    href={`/admin/conversations/${activity.id}`}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition group cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {activity.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-white font-medium">{activity.userName}</p>
                          <p className="text-slate-400 text-sm truncate">{activity.userEmail}</p>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {new Date(activity.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-cyan-400">→</span>
                        <span className="text-sm text-white">{activity.peptideName}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{activity.messageCount} messages</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
                      <Eye className="w-5 h-5 text-cyan-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center text-slate-400 py-12">
            <p>Failed to load analytics. Please try refreshing.</p>
          </div>
        )}
      </main>
    </div>
  );
}
