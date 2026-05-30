import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../../lib/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Code2, Users, LogOut, Plus, ArrowRight, RefreshCw, Copy, Check } from 'lucide-react';

interface ApiSession {
  id: string;
  roomCode: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  createdAt: string;
  candidate: { id: string; name: string; email: string } | null;
  evaluation?: { score: number } | null;
  _count?: { children: number };
}

export function SessionLobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  // After interviewer creates a session, show the room code to share
  const [createdSession, setCreatedSession] = useState<ApiSession | null>(null);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const { data } = await api.post('/sessions', {});
      if (isInterviewer) {
        // Show the room code modal so the interviewer can share it
        setCreatedSession(data.session);
        setShowCreateModal(false);
        loadSessions();
      } else {
        // Candidate goes straight into their practice session
        navigate(`/interview/${data.session.id}`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSession = async () => {
    const code = roomCode.trim();
    if (!code) return;
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await api.post('/sessions/join', { roomCode: code });
      setShowJoinModal(false);
      setRoomCode('');
      navigate(`/interview/${data.session.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid or expired room code');
    } finally {
      setSubmitting(false);
    }
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

  const handleCopyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Interviewers go to their room (roster + observe); candidates go to the
  // interview room where they talk to the AI.
  const goToSession = (sessionId: string) => {
    if (isInterviewer) navigate(`/room/${sessionId}`);
    else navigate(`/interview/${sessionId}`);
  };

  const handleEnterRoom = (sessionId: string) => {
    setCreatedSession(null);
    goToSession(sessionId);
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
                ? 'Generate a room code and share it with a candidate'
                : 'Start a new private practice interview session'}
            </p>
          </div>

          <div
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#10B981] transition-colors cursor-pointer"
            onClick={() => { setError(null); setShowJoinModal(true); }}
          >
            <div className="p-3 bg-[#3B82F6]/10 rounded-lg w-fit mb-4">
              <ArrowRight className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <h3 className="text-lg text-[#F8FAFC] mb-2">Join Session</h3>
            <p className="text-sm text-[#94A3B8]">
              {isInterviewer
                ? 'Enter your session to monitor the candidate'
                : 'Enter the room code shared by your interviewer'}
            </p>
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

        {/* Sessions list */}
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
                          {isInterviewer
                            ? <>Interview Room <span className="text-[#94A3B8]">
                                ({session._count?.children ?? 0} candidate{(session._count?.children ?? 0) === 1 ? '' : 's'})
                              </span></>
                            : session.candidate
                              ? <>{session.candidate.name} <span className="text-[#94A3B8]">({session.candidate.email})</span></>
                              : <span className="text-[#94A3B8]">Awaiting candidate…</span>
                          }
                        </h3>
                        {statusBadge(session.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                        <span>Room: <code className="text-[#10B981]">{session.roomCode}</code></span>
                        <span>•</span>
                        <span>{new Date(session.createdAt).toLocaleString()}</span>
                        {session.evaluation && (
                          <>
                            <span>•</span>
                            <span>Score: {session.evaluation.score}%</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => goToSession(session.id)}
                      disabled={!isInterviewer && (session.status === 'COMPLETED' || session.status === 'ABANDONED')}
                    >
                      {isInterviewer
                        ? (session.status === 'COMPLETED' ? 'View Roster' : 'Enter Room')
                        : (session.status === 'COMPLETED' ? 'View' : 'Join')}
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
            <p className="text-sm text-[#94A3B8] mb-6">
              {isInterviewer
                ? 'A room code will be generated. Share it with your candidate so they can join.'
                : 'Start a private practice session. The AI interviewer will guide you through it.'}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1" disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateSession} className="flex-1" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Session'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Room Code Modal — shown to interviewer after session is created */}
      {createdSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl text-[#F8FAFC] mb-2">Session Created</h3>
            <p className="text-sm text-[#94A3B8] mb-6">
              Share this room code with the candidate. They can enter it on the lobby page to join.
            </p>
            <div className="flex items-center gap-3 bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 mb-6">
              <code className="flex-1 text-2xl tracking-widest text-[#10B981]">
                {createdSession.roomCode}
              </code>
              <button
                onClick={() => handleCopyRoomCode(createdSession.roomCode)}
                className="text-[#94A3B8] hover:text-[#10B981] transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setCreatedSession(null)} className="flex-1">
                Close
              </Button>
              <Button onClick={() => handleEnterRoom(createdSession.id)} className="flex-1">
                Enter Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Session Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => { setShowJoinModal(false); setError(null); }}
        >
          <div
            className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl text-[#F8FAFC] mb-4">
              {isInterviewer ? 'Enter Your Session' : 'Join with Room Code'}
            </h3>
            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#EF4444]">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">Room Code</label>
                <Input
                  type="text"
                  placeholder="Enter room code…"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => { setShowJoinModal(false); setError(null); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleJoinSession} className="flex-1" disabled={!roomCode.trim() || submitting}>
                  {submitting ? 'Joining…' : 'Join Session'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
