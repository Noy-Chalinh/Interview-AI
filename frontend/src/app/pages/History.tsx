import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Search, ChevronLeft, ChevronRight, Code2 } from 'lucide-react';

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
  return Math.round(
    (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
  );
}

export function History() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    api.get('/sessions')
      .then(({ data }) => setSessions(data.sessions || []))
      .catch((err) => setError(err?.response?.data?.error || 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || session.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

  const statusBadgeVariant = (status: ApiSession['status']) => {
    if (status === 'COMPLETED') return 'completed';
    return 'language';
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[#10B981] rounded-lg">
              <Code2 className="w-6 h-6 text-[#0F172A]" />
            </div>
            <h1 className="text-3xl text-[#F8FAFC]">Session History</h1>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <Input
                type="text"
                placeholder="Search by name, email, or session ID…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="ACTIVE">Active</option>
              <option value="WAITING">Waiting</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
          </div>
        </div>

        {/* Sessions table */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#94A3B8]">Loading…</div>
          ) : error ? (
            <div className="p-8 text-center text-[#EF4444]">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0F172A]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {paginatedSessions.length > 0 ? (
                    paginatedSessions.map((session) => {
                      const dur = getDurationMinutes(session);
                      return (
                        <tr key={session.id} className="hover:bg-[#334155]/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-[#F8FAFC]">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-[#94A3B8]">
                              {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-[#F8FAFC]">{session.candidate.name}</div>
                            <div className="text-xs text-[#94A3B8]">{session.candidate.email}</div>
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
                            <Badge variant={statusBadgeVariant(session.status)}>
                              {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {session.status === 'COMPLETED' ? (
                              <Link to={`/evaluation/${session.id}`}>
                                <Button variant="ghost" size="sm">View Report</Button>
                              </Link>
                            ) : session.status === 'ACTIVE' || session.status === 'WAITING' ? (
                              <Link to={`/interview/${session.id}`}>
                                <Button variant="ghost" size="sm">Rejoin</Button>
                              </Link>
                            ) : (
                              <span className="text-sm text-[#94A3B8]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[#94A3B8]">
                        No sessions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#334155]">
              <div className="text-sm text-[#94A3B8]">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSessions.length)} of{' '}
                {filteredSessions.length} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-[#10B981] text-[#0F172A]'
                        : 'bg-transparent text-[#F8FAFC] hover:bg-[#334155]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
