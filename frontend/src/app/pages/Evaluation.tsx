import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ArrowLeft, Sparkles, MessageSquare, Code2, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

interface EvaluationMetrics {
  communication: number;
  problem_solving: number;
  code_quality: number;
  technical_knowledge: number;
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
}

interface Evaluation {
  id: string;
  score: number;
  feedback: string;
  metrics: EvaluationMetrics;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  candidate: { id: string; name: string; email: string } | null;
  evaluation: Evaluation | null;
  messages: Message[];
}

function CircularProgress({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#334155" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#10B981" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl text-[#F8FAFC]">{score}<span className="text-sm text-[#94A3B8]">/10</span></span>
      </div>
    </div>
  );
}

function getDuration(session: Session): string {
  if (!session.startedAt || !session.endedAt) return '—';
  const mins = Math.round(
    (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
  );
  return `${mins}m`;
}

export function Evaluation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/sessions/${id}`)
      .then(({ data }) => setSession(data.session))
      .catch((err) => setError(err?.response?.data?.error || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <p className="text-[#94A3B8]">Loading evaluation…</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
        <div className="text-center">
          <p className="text-[#EF4444] mb-4">{error || 'Session not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const evaluation = session.evaluation;
  const metrics = evaluation?.metrics;

  const metricEntries = metrics
    ? [
        { name: 'Communication', score: metrics.communication },
        { name: 'Problem Solving', score: metrics.problem_solving },
        { name: 'Code Quality', score: metrics.code_quality },
        { name: 'Technical Knowledge', score: metrics.technical_knowledge },
      ].filter((m) => m.score != null)
    : [];

  const strengths: string[] = metrics?.strengths ?? [];
  const improvements: string[] = metrics?.improvements ?? [];

  // Build a simple timeline from messages
  const timeline = session.messages.slice(0, 10).map((msg) => ({
    time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    event: msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content,
    type: msg.role === 'USER' ? 'discussion' : 'code',
  }));

  return (
    <div className="min-h-screen" style={{ background: '#0F172A' }}>
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl text-[#F8FAFC] mb-2">Interview Evaluation</h1>
              <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                <span>{session.candidate?.name ?? 'Unknown candidate'}</span>
                <span>•</span>
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>{getDuration(session)}</span>
              </div>
            </div>
            {evaluation && (
              <Badge variant="score" className="text-lg px-4 py-2">
                Overall: {evaluation.score}%
              </Badge>
            )}
          </div>
        </div>

        {!evaluation ? (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-8 text-center text-[#94A3B8]">
            No evaluation available for this session yet.
          </div>
        ) : (
          <>
            {/* Metric cards */}
            {metricEntries.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metricEntries.map((metric) => (
                  <div key={metric.name} className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 flex flex-col items-center">
                    <h3 className="text-sm text-[#94A3B8] mb-4 text-center">{metric.name}</h3>
                    <CircularProgress score={metric.score} />
                  </div>
                ))}
              </div>
            )}

            {/* AI Feedback */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-[#10B981]/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-[#10B981]" />
                </div>
                <h2 className="text-xl text-[#F8FAFC]">AI Feedback</h2>
              </div>
              <p className="text-[#94A3B8] leading-relaxed">{evaluation.feedback}</p>
            </div>

            {/* Strengths & Improvements */}
            {(strengths.length > 0 || improvements.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {strengths.length > 0 && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                      <h2 className="text-lg text-[#F8FAFC]">Strengths</h2>
                    </div>
                    <ul className="space-y-2">
                      {strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                          <span className="text-[#10B981] mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {improvements.length > 0 && (
                  <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                      <h2 className="text-lg text-[#F8FAFC]">Areas for Improvement</h2>
                    </div>
                    <ul className="space-y-2">
                      {improvements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                          <span className="text-[#F59E0B] mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Message Timeline */}
        {timeline.length > 0 && (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-[#10B981]/10 rounded-lg">
                <Lightbulb className="w-5 h-5 text-[#10B981]" />
              </div>
              <h2 className="text-xl text-[#F8FAFC]">Conversation Highlights</h2>
            </div>

            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-[#334155] mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm text-[#10B981] font-mono">{item.time}</span>
                      {item.type === 'discussion' ? (
                        <MessageSquare className="w-4 h-4 text-[#94A3B8]" />
                      ) : (
                        <Code2 className="w-4 h-4 text-[#94A3B8]" />
                      )}
                    </div>
                    <p className="text-sm text-[#F8FAFC]">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
