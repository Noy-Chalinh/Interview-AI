import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import { Code2, Users, LogOut, Plus, ArrowRight } from 'lucide-react';

interface SessionRoom {
  id: string;
  name: string;
  host: string;
  participants: number;
  language: string;
  status: 'waiting' | 'active';
  createdAt: Date;
}

const mockSessions: SessionRoom[] = [
  {
    id: 'room-abc123',
    name: 'Frontend Developer Interview',
    host: 'interviewer@company.com',
    participants: 2,
    language: 'JavaScript',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'room-def456',
    name: 'Python Backend Assessment',
    host: 'tech-lead@startup.com',
    participants: 1,
    language: 'Python',
    status: 'waiting',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
];

export function SessionLobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [availableSessions] = useState<SessionRoom[]>(mockSessions);

  const handleCreateSession = () => {
    if (!sessionName.trim()) return;

    // Generate random session ID
    const sessionId = 'room-' + Math.random().toString(36).substring(2, 9);

    // In production, this would create a session via API
    localStorage.setItem('currentSession', JSON.stringify({
      id: sessionId,
      name: sessionName,
      host: user?.email,
      role: user?.role,
    }));

    navigate(`/interview/${sessionId}`);
  };

  const handleJoinSession = (sessionId?: string) => {
    const id = sessionId || sessionCode;
    if (!id.trim()) return;

    // In production, this would verify and join session via API
    localStorage.setItem('currentSession', JSON.stringify({
      id,
      role: user?.role,
    }));

    navigate(`/interview/${id}`);
  };

  const handleQuickStart = () => {
    // Create a quick session for instant interview
    const sessionId = 'room-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('currentSession', JSON.stringify({
      id: sessionId,
      name: 'Quick Interview Session',
      host: user?.email,
      role: user?.role,
    }));
    navigate(`/interview/${sessionId}`);
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
            <Badge variant={user?.role === 'interviewer' ? 'completed' : 'language'}>
              {user?.role === 'interviewer' ? 'Interviewer' : 'Candidate'}
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
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#10B981] transition-colors cursor-pointer"
               onClick={() => setShowCreateModal(true)}>
            <div className="p-3 bg-[#10B981]/10 rounded-lg w-fit mb-4">
              <Plus className="w-6 h-6 text-[#10B981]" />
            </div>
            <h3 className="text-lg text-[#F8FAFC] mb-2">Create Session</h3>
            <p className="text-sm text-[#94A3B8]">Start a new interview room and invite participants</p>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#10B981] transition-colors cursor-pointer"
               onClick={() => setShowJoinModal(true)}>
            <div className="p-3 bg-[#3B82F6]/10 rounded-lg w-fit mb-4">
              <ArrowRight className="w-6 h-6 text-[#3B82F6]" />
            </div>
            <h3 className="text-lg text-[#F8FAFC] mb-2">Join Session</h3>
            <p className="text-sm text-[#94A3B8]">Enter a session code to join an existing interview</p>
          </div>

          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#10B981] transition-colors cursor-pointer"
               onClick={handleQuickStart}>
            <div className="p-3 bg-[#F59E0B]/10 rounded-lg w-fit mb-4">
              <Code2 className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <h3 className="text-lg text-[#F8FAFC] mb-2">Quick Start</h3>
            <p className="text-sm text-[#94A3B8]">Jump into a practice interview immediately</p>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg text-[#F8FAFC]">Available Sessions</h2>
            </div>
          </div>

          <div className="divide-y divide-[#334155]">
            {availableSessions.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8]">
                No active sessions available. Create one to get started!
              </div>
            ) : (
              availableSessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-[#334155]/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[#F8FAFC]">{session.name}</h3>
                        <Badge variant={session.status === 'active' ? 'completed' : 'language'}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                        <span>Host: {session.host}</span>
                        <span>•</span>
                        <span>{session.participants} participant(s)</span>
                        <span>•</span>
                        <span>{session.language}</span>
                        <span>•</span>
                        <span>ID: {session.id}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleJoinSession(session.id)}>
                      Join
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl text-[#F8FAFC] mb-4">Create New Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">Session Name</label>
                <Input
                  type="text"
                  placeholder="e.g., Frontend Developer Interview"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateSession} className="flex-1" disabled={!sessionName.trim()}>
                  Create Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Session Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowJoinModal(false)}>
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl text-[#F8FAFC] mb-4">Join Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1.5 text-[#F8FAFC]">Session Code</label>
                <Input
                  type="text"
                  placeholder="e.g., room-abc123"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowJoinModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => handleJoinSession()} className="flex-1" disabled={!sessionCode.trim()}>
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
