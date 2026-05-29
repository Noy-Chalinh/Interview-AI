import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../../lib/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Code2, Users, LogOut, Plus, ArrowRight, RefreshCw } from 'lucide-react';

interface ApiSession {
  id: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  createdAt: string;
  candidate: { id: string; name: string; email: string };
  evaluation?: { score: number } | null;
}

export function SessionLobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [candidateEmail, setCandidateEmail] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isInterviewer = user?.role === 'interviewer';

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/sessions');
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreateSession = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const body = isInterviewer
        ? { candidateEmail: candidateEmail.trim() }
        : {};
      const { data } = await api.post('/sessions', body);
      setShowCreateModal(false);
      setCandidateEmail('');
      navigate(`/interview/${data.session.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSession = (sessionId?: string) => {
    const id = (sessionId || sessionCode).trim();
    if (!id) return;
    setShowJoinModal(false);
    setSessionCode('');
    navigate(`/interview/${id}`);
  };

  const handleQuickStart = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post('/sessions', {});
      navigate(`/interview/${data.session.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to start session');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: ApiSession['status']) => {
    const map: Record<ApiSession['status'], 'completed' | 'language'> = {
      WAITING: 'language',
      ACTIVE: 'completed',
      COMPLETED: 'language',
      ABANDONED: 'language',
    };
    return <Badge variant={map[status]}>{status.toLowerCase()}</Badge>;
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
              <h1 className="text-lg text-[#F8FAFC]">InterviewAI</h1>
              <p className="text-xs text-[#94A3B8]">Welcome, {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={isInterviewer ? 'completed' : 'language'}>
              {isInterviewer ? 'Interviewer' : 'Candidate'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#10B981] transition-colors cursor-pointer"
            onClick={() => setShowCreateModal(true)}
          >
            <div className="p-3 bg-[#10B981]/10 rounded-lg w-fit mb-4">
              <Plus className="w-6 h-6 text-[#10B981]" />
            </div>
            <h3 className="text-lg text-[#F8FAFC] mb-2">Create Session</h3>
            <p className="text-sm text-[#94A3B8]">
              {isInterviewer
                ? 'Start a new interview by entering a candidate email'
                : 'Start a new practice interview session'}
            </p>
          </div>

          <div
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#10B981] transition-colors cursor-pointer"
            onClick={() => setShowJoinModal(true)}
          >
            <div className="p-3 bg-[#3B82F6]/10 rounded-lg w-fit mb-4">
              <ArrowRight className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <h3 className="text-lg text-[#F8FAFC] mb-2">Join Session</h3>
            <p className="text-sm text-[#94A3B8]">Enter a session ID to join an existing interview</p>
          </div>

          {!isInterviewer && (
            <div
              className={`bg-[#1E293B] border border-[#334155] rounded-xl p-6 transition-colors ${
                submitting ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#10B981] cursor-pointer'
              }`}
              onClick={submitting ? undefined : handleQuickStart}
            >
              <div className="p-3 bg-[#F59E0B]/10 rounded-lg w-fit mb-4">
                <Code2 className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <h3 className="text-lg text-[#F8FAFC] mb-2">Quick Start</h3>
              <p className="text-sm text-[#94A3B8]">Jump into a practice interview immediately</p>
            </div>
          )}
        </div>

        {/* Real sessions list */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg text-[#F8FAFC]">Your Sessions</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={loadSessions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="divide-y divide-[#334155]">
            {loading ? (
              <div className="p-8 text-center text-[#94A3B8]">Loading…</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8]">
                No sessions yet. Create one to get started!
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-[#334155]/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[#F8FAFC]">
                          {session.candidate.name} <span className="text-[#94A3B8]">({session.candidate.email})</span>
                        </h3>
                        {statusBadge(session.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                        <span>ID: {session.id}</span>
                        <span>•</span>
                        <span>{new Date(session.createdAt).toLocaleString()}</span>
                        {session.evaluation && (
                          <>
                            <span>•</span>
                            <span>Score: {session.evaluation.score}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleJoinSession(session.id)}
                      disabled={session.status === 'COMPLETED' || session.status === 'ABANDONED'}
                    >
                      {session.status === 'COMPLETED' ? 'View' : 'Join'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl text-[#F8FAFC] mb-4">Create New Session</h3>
            <div className="space-y-4">
              {isInterviewer ? (
                <div>
                  <label className="block text-sm mb-1.5 text-[#F8FAFC]">Candidate Email</label>
                  <Input
                    type="email"
                    placeholder="candidate@example.com"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-[#94A3B8] mt-2">
                    The candidate must already be registered.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#94A3B8]">
                  Start a practice session as a candidate. The AI interviewer will guide you through it.
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSession}
                  className="flex-1"
                  disabled={submitting || (isInterviewer && !candidateEmail.trim())}
                >
                  {submitting ? 'Creating…' : 'Create Session'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Session Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl text-[#F8FAFC] mb-4">Join Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">Session ID</label>
                <Input
                  type="text"
                  placeholder="e.g., 5f2a…"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowJoinModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => handleJoinSession()}
                  className="flex-1"
                  disabled={!sessionCode.trim()}
                >
                  Join Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
