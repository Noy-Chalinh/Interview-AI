import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { api } from '../../lib/api';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ArrowLeft, Users, RefreshCw, Award } from 'lucide-react';

interface RosterCandidate {
  id: string;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  candidate: { id: string; name: string; email: string } | null;
  evaluation: { id: string; score: number } | null;
  _count: { messages: number; submissions: number };
}

interface RoomInfo {
  id: string;
  roomCode: string;
  status: string;
  createdAt?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return '#10B981';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

export function RoomResults() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [candidates, setCandidates] = useState<RosterCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!roomId) return;
    try {
      const { data } = await api.get(`/sessions/${roomId}/roster`);
      setRoom(data.room);
      setCandidates(data.candidates ?? []);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
  }, [load]);

  const evaluated = candidates.filter((c) => c.evaluation);
  const avg = evaluated.length
    ? Math.round(evaluated.reduce((s, c) => s + (c.evaluation?.score ?? 0), 0) / evaluated.length)
    : null;

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl text-[#F8FAFC] mb-2">Interview Results</h1>
              <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {candidates.length} candidate{candidates.length === 1 ? '' : 's'}
                </span>
                {room && (
                  <>
                    <span>•</span>
                    <span>Room: <code className="text-[#10B981]">{room.roomCode}</code></span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {avg != null && (
                <Badge variant="score" className="text-lg px-4 py-2">
                  <Award className="w-4 h-4 mr-1 inline" /> Avg: {avg}%
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="text-center text-[#94A3B8] py-16">Loading results…</div>
        ) : error ? (
          <div className="text-center text-[#EF4444] py-16">{error}</div>
        ) : candidates.length === 0 ? (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center text-[#94A3B8]">
            No candidates joined this interview.
          </div>
        ) : (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#334155]">
              {candidates.map((c) => {
                const score = c.evaluation?.score;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-5 hover:bg-[#334155]/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{
                          background: score != null ? `${scoreColor(score)}20` : '#33415540',
                          color: score != null ? scoreColor(score) : '#94A3B8',
                        }}
                      >
                        {score != null ? `${score}%` : '—'}
                      </div>
                      <div>
                        <p className="text-[#F8FAFC]">{c.candidate?.name ?? 'Unknown candidate'}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {c.candidate?.email ?? ''} · {c._count.messages} messages · {c._count.submissions} submissions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={c.status === 'COMPLETED' ? 'completed' : 'language'}>
                        {c.status.toLowerCase()}
                      </Badge>
                      {c.evaluation ? (
                        <Link to={`/evaluation/${c.id}`}>
                          <Button size="sm">View Report</Button>
                        </Link>
                      ) : (
                        <span className="text-sm text-[#94A3B8]">Not evaluated</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
