import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../../lib/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Code2, TrendingUp, Award, Code, Menu, BookOpen, Settings } from 'lucide-react';

interface ApiSession {
  id: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  candidate: { id: string; name: string; email: string };
  evaluation?: { score: number } | null;
}

function getDurationMinutes(session: ApiSession): number | null {
  if (!session.startedAt || !session.endedAt) return null;
  return Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000);
}

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sessions')
      .then(({ data }) => setSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');

  const avgScore = completedSessions.length > 0
    ? Math.round(
        completedSessions.reduce((sum, s) => sum + (s.evaluation?.score ?? 0), 0) / completedSessions.length
      )
    : 0;

  // Language distribution from completed sessions (no language stored per session — show session counts)
  // Score trend: last 5 completed sessions by date
  const scoreTrend = completedSessions
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-5)
    .map((s) => ({
      name: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: s.evaluation?.score ?? 0,
    }));

  // Status distribution for pie chart
  const statusCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    COMPLETED: '#10B981',
    ACTIVE: '#3B82F6',
    WAITING: '#F59E0B',
    ABANDONED: '#EF4444',
  };

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0) + name.slice(1).toLowerCase(),
    value,
    color: statusColors[name] ?? '#94A3B8',
  }));

  const statsData = [
    { icon: Code2, label: 'Total Sessions', value: String(sessions.length), color: '#10B981' },
    { icon: Award, label: 'Average Score', value: completedSessions.length ? `${avgScore}%` : '—', color: '#10B981' },
    { icon: Code, label: 'Completed', value: String(completedSessions.length), color: '#10B981' },
  ];

  const recentSessions = completedSessions
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const sidebarItems = user?.role === 'interviewer'
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: Code2, active: true },
        { name: 'Questions', path: '/questions', icon: BookOpen, active: false },
        { name: 'New Session', path: '/lobby', icon: Code, active: false },
        { name: 'History', path: '/history', icon: TrendingUp, active: false },
        { name: 'Settings', path: '/settings', icon: Settings, active: false },
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: Code2, active: true },
        { name: 'New Session', path: '/lobby', icon: Code, active: false },
        { name: 'History', path: '/history', icon: TrendingUp, active: false },
      ];

  return (
    <div className="h-screen flex" style={{ background: '#0F172A' }}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} border-r border-[#334155] bg-[#1E293B] transition-all duration-300 overflow-hidden`}>
        <div className="p-4 border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#10B981] rounded-lg">
              <Code2 className="w-5 h-5 text-[#0F172A]" />
            </div>
            <h1 className="text-lg text-[#F8FAFC]">InterviewAI</h1>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  item.active
                    ? 'bg-[#10B981] text-[#0F172A]'
                    : 'text-[#94A3B8] hover:bg-[#334155] hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-[#F8FAFC]" />
              </button>
              <h1 className="text-3xl text-[#F8FAFC]">Analytics Dashboard</h1>
            </div>
            <Button onClick={() => navigate('/lobby')}>
              Start New Interview
            </Button>
          </div>

          {loading ? (
            <div className="text-center text-[#94A3B8] py-16">Loading…</div>
          ) : (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statsData.map((stat) => (
                  <div key={stat.label} className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[#94A3B8] mb-1">{stat.label}</p>
                        <p className="text-3xl text-[#F8FAFC]">{stat.value}</p>
                      </div>
                      <div className="p-3 bg-[#10B981]/10 rounded-lg">
                        <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Bar chart */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                  <h3 className="text-lg text-[#F8FAFC] mb-4">Score Trend</h3>
                  {scoreTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={scoreTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94A3B8" />
                        <YAxis stroke="#94A3B8" domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1E293B',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#F8FAFC',
                          }}
                        />
                        <Bar dataKey="score" fill="#10B981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-[#94A3B8]">
                      No completed sessions yet
                    </div>
                  )}
                </div>

                {/* Pie chart */}
                <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                  <h3 className="text-lg text-[#F8FAFC] mb-4">Session Status</h3>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1E293B',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#F8FAFC',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-[#94A3B8]">
                      No sessions yet
                    </div>
                  )}
                </div>
              </div>

              {/* Sessions table */}
              <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
                <div className="p-6 border-b border-[#334155]">
                  <h3 className="text-lg text-[#F8FAFC]">Recent Completed Sessions</h3>
                </div>
                <div className="overflow-x-auto">
                  {recentSessions.length === 0 ? (
                    <div className="p-8 text-center text-[#94A3B8]">No completed sessions yet</div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-[#0F172A]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Candidate</th>
                          <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Score</th>
                          <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155]">
                        {recentSessions.map((session) => {
                          const dur = getDurationMinutes(session);
                          return (
                            <tr key={session.id} className="hover:bg-[#334155]/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                                {new Date(session.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                                {session.candidate.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                                {dur != null ? `${dur}m` : '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {session.evaluation ? (
                                  <Badge variant="score">{session.evaluation.score}%</Badge>
                                ) : (
                                  <span className="text-sm text-[#94A3B8]">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="completed">Completed</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                  to={`/evaluation/${session.id}`}
                                  className="text-[#10B981] hover:text-[#059669] text-sm transition-colors"
                                >
                                  View Report
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
