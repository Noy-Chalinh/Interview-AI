import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Code2, TrendingUp, Award, Code, Menu, Users, BookOpen, Settings } from 'lucide-react';

const statsData = [
  { icon: Code2, label: 'Total Interviews', value: '24', color: '#10B981' },
  { icon: Award, label: 'Average Score', value: '85%', color: '#10B981' },
  { icon: Code, label: 'Most Used Language', value: 'Python', color: '#10B981' },
];

const scoreData = [
  { name: 'May 20', score: 75 },
  { name: 'May 22', score: 82 },
  { name: 'May 24', score: 88 },
  { name: 'May 25', score: 91 },
  { name: 'May 26', score: 85 },
];

const languageData = [
  { name: 'Python', value: 45, color: '#10B981' },
  { name: 'JavaScript', value: 30, color: '#3B82F6' },
  { name: 'Java', value: 15, color: '#F59E0B' },
  { name: 'C++', value: 10, color: '#8B5CF6' },
];

const sessionsData = [
  {
    id: '1',
    date: '2026-05-26',
    duration: '58m',
    score: 85,
    status: 'completed',
    language: 'Python',
  },
  {
    id: '2',
    date: '2026-05-25',
    duration: '60m',
    score: 91,
    status: 'completed',
    language: 'JavaScript',
  },
  {
    id: '3',
    date: '2026-05-24',
    duration: '55m',
    score: 88,
    status: 'completed',
    language: 'Python',
  },
  {
    id: '4',
    date: '2026-05-22',
    duration: '60m',
    score: 82,
    status: 'completed',
    language: 'Java',
  },
];

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Role-based sidebar items
  const sidebarItems = user?.role === 'interviewer'
    ? [
        { name: 'Dashboard', path: '/dashboard', icon: Code2, active: true },
        { name: 'Questions', path: '/questions', icon: BookOpen, active: false },
        { name: 'Candidates', path: '/candidates', icon: Users, active: false },
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

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statsData.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#1E293B] border border-[#334155] rounded-xl p-6"
              >
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
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
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
            </div>

            {/* Pie chart */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
              <h3 className="text-lg text-[#F8FAFC] mb-4">Language Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={languageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {languageData.map((entry) => (
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
            </div>
          </div>

          {/* Sessions table */}
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-lg text-[#F8FAFC]">Recent Sessions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0F172A]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {sessionsData.map((session) => (
                    <tr key={session.id} className="hover:bg-[#334155]/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                        {session.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                        {session.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="language">{session.language}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="score">{session.score}%</Badge>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
