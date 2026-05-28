import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Code2, Search, Filter, TrendingUp, TrendingDown, Minus, Mail, Calendar } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  totalInterviews: number;
  averageScore: number;
  lastInterview: string;
  topLanguage: string;
  trend: 'up' | 'down' | 'stable';
  status: 'active' | 'inactive';
}

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    totalInterviews: 5,
    averageScore: 87,
    lastInterview: '2026-05-26',
    topLanguage: 'Python',
    trend: 'up',
    status: 'active',
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    totalInterviews: 8,
    averageScore: 92,
    lastInterview: '2026-05-25',
    topLanguage: 'JavaScript',
    trend: 'up',
    status: 'active',
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    totalInterviews: 3,
    averageScore: 78,
    lastInterview: '2026-05-24',
    topLanguage: 'Java',
    trend: 'stable',
    status: 'active',
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@email.com',
    totalInterviews: 6,
    averageScore: 85,
    lastInterview: '2026-05-23',
    topLanguage: 'Python',
    trend: 'down',
    status: 'active',
  },
  {
    id: '5',
    name: 'Jessica Martinez',
    email: 'jmartinez@email.com',
    totalInterviews: 4,
    averageScore: 81,
    lastInterview: '2026-05-22',
    topLanguage: 'C++',
    trend: 'up',
    status: 'active',
  },
  {
    id: '6',
    name: 'Alex Thompson',
    email: 'athompson@email.com',
    totalInterviews: 7,
    averageScore: 89,
    lastInterview: '2026-05-20',
    topLanguage: 'JavaScript',
    trend: 'stable',
    status: 'active',
  },
  {
    id: '7',
    name: 'Priya Patel',
    email: 'priya.p@email.com',
    totalInterviews: 2,
    averageScore: 73,
    lastInterview: '2026-05-18',
    topLanguage: 'Python',
    trend: 'up',
    status: 'inactive',
  },
  {
    id: '8',
    name: 'James Wilson',
    email: 'jwilson@email.com',
    totalInterviews: 9,
    averageScore: 94,
    lastInterview: '2026-05-26',
    topLanguage: 'Go',
    trend: 'up',
    status: 'active',
  },
];

export function Candidates() {
  const { user } = useAuth();
  const [candidates] = useState<Candidate[]>(mockCandidates);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'interviews' | 'recent'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredCandidates = candidates
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'score': return b.averageScore - a.averageScore;
        case 'interviews': return b.totalInterviews - a.totalInterviews;
        case 'recent': return new Date(b.lastInterview).getTime() - new Date(a.lastInterview).getTime();
        default: return 0;
      }
    });

  const stats = {
    total: candidates.length,
    active: candidates.filter(c => c.status === 'active').length,
    avgScore: Math.round(candidates.reduce((sum, c) => sum + c.averageScore, 0) / candidates.length),
    topPerformers: candidates.filter(c => c.averageScore >= 90).length,
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-[#10B981]" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-[#EF4444]" />;
      default: return <Minus className="w-4 h-4 text-[#94A3B8]" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#10B981]';
    if (score >= 75) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      {/* Header */}
      <div className="border-b border-[#334155] bg-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#10B981] rounded-lg">
              <Code2 className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-lg text-[#F8FAFC]">Candidates</h1>
              <p className="text-xs text-[#94A3B8]">{stats.total} total candidates</p>
            </div>
          </div>

          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <p className="text-sm text-[#94A3B8] mb-1">Total Candidates</p>
            <p className="text-3xl text-[#F8FAFC]">{stats.total}</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <p className="text-sm text-[#94A3B8] mb-1">Active</p>
            <p className="text-3xl text-[#10B981]">{stats.active}</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <p className="text-sm text-[#94A3B8] mb-1">Average Score</p>
            <p className="text-3xl text-[#F8FAFC]">{stats.avgScore}%</p>
          </div>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <p className="text-sm text-[#94A3B8] mb-1">Top Performers</p>
            <p className="text-3xl text-[#F8FAFC]">{stats.topPerformers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          >
            <option value="recent">Most Recent</option>
            <option value="score">Highest Score</option>
            <option value="interviews">Most Interviews</option>
            <option value="name">Name (A-Z)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Candidates Table */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0F172A]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Interviews
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Top Language
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Last Interview
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-[#334155]/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-[#F8FAFC]">{candidate.name}</div>
                        <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                          <Mail className="w-3 h-3" />
                          {candidate.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                      {candidate.totalInterviews}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-semibold ${getScoreColor(candidate.averageScore)}`}>
                        {candidate.averageScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="language">{candidate.topLanguage}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-[#94A3B8]">
                        <Calendar className="w-4 h-4" />
                        {candidate.lastInterview}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTrendIcon(candidate.trend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={candidate.status === 'active' ? 'completed' : 'language'}>
                        {candidate.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/candidate/${candidate.id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCandidates.length === 0 && (
            <div className="p-12 text-center text-[#94A3B8]">
              No candidates found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
