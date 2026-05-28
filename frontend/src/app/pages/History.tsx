import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Search, Filter, ChevronLeft, ChevronRight, Code2 } from 'lucide-react';

const sessionsData = [
  {
    id: '1',
    date: '2026-05-26',
    time: '14:30',
    duration: '58m',
    score: 85,
    status: 'completed',
    language: 'Python',
    problemType: 'Two Sum',
  },
  {
    id: '2',
    date: '2026-05-25',
    time: '10:15',
    duration: '60m',
    score: 91,
    status: 'completed',
    language: 'JavaScript',
    problemType: 'Binary Search',
  },
  {
    id: '3',
    date: '2026-05-24',
    time: '16:45',
    duration: '55m',
    score: 88,
    status: 'completed',
    language: 'Python',
    problemType: 'Linked List',
  },
  {
    id: '4',
    date: '2026-05-22',
    time: '11:00',
    duration: '60m',
    score: 82,
    status: 'completed',
    language: 'Java',
    problemType: 'Tree Traversal',
  },
  {
    id: '5',
    date: '2026-05-20',
    time: '15:30',
    duration: '52m',
    score: 75,
    status: 'completed',
    language: 'C++',
    problemType: 'Dynamic Programming',
  },
  {
    id: '6',
    date: '2026-05-18',
    time: '13:20',
    duration: '60m',
    score: 79,
    status: 'completed',
    language: 'Python',
    problemType: 'Graph Algorithm',
  },
  {
    id: '7',
    date: '2026-05-16',
    time: '09:45',
    duration: '58m',
    score: 86,
    status: 'completed',
    language: 'JavaScript',
    problemType: 'String Manipulation',
  },
  {
    id: '8',
    date: '2026-05-14',
    time: '14:00',
    duration: '55m',
    score: 90,
    status: 'completed',
    language: 'Python',
    problemType: 'Array Operations',
  },
];

export function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredSessions = sessionsData.filter((session) => {
    const matchesSearch = session.problemType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguage === 'all' || session.language === selectedLanguage;
    return matchesSearch && matchesLanguage;
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

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
                placeholder="Search by problem type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#10B981]"
            >
              <option value="all">All Languages</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Java">Java</option>
              <option value="C++">C++</option>
              <option value="Go">Go</option>
            </select>
          </div>
        </div>

        {/* Sessions table */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0F172A]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Problem Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs text-[#94A3B8] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {paginatedSessions.length > 0 ? (
                  paginatedSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-[#334155]/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#F8FAFC]">{session.date}</div>
                        <div className="text-xs text-[#94A3B8]">{session.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                        {session.problemType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="language">{session.language}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#F8FAFC]">
                        {session.duration}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="score">{session.score}%</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="completed">Completed</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/evaluation/${session.id}`}>
                          <Button variant="ghost" size="sm">
                            View Report
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-[#94A3B8]">
                      No sessions found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
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
