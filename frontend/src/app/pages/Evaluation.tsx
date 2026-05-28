import { Link } from 'react-router';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ArrowLeft, Sparkles, MessageSquare, Code2, Lightbulb } from 'lucide-react';

const evaluationData = {
  candidate: 'John Doe',
  date: '2026-05-26',
  duration: '58m',
  overallScore: 85,
  metrics: [
    { name: 'Communication', score: 88, color: '#10B981' },
    { name: 'Problem Solving', score: 85, color: '#10B981' },
    { name: 'Code Quality', score: 82, color: '#10B981' },
  ],
  feedback: 'The candidate demonstrated strong problem-solving skills and clear communication throughout the interview. They approached the problem methodically, starting with clarifying questions and discussing different approaches before implementing a solution. The code was well-structured and readable. Areas for improvement include optimizing the time complexity and adding more edge case handling.',
  timeline: [
    { time: '00:05', event: 'Problem statement discussed', type: 'discussion' },
    { time: '00:12', event: 'Started coding solution', type: 'code' },
    { time: '00:28', event: 'First test run - partial success', type: 'test' },
    { time: '00:35', event: 'Asked clarifying question about edge cases', type: 'discussion' },
    { time: '00:42', event: 'Refactored solution', type: 'code' },
    { time: '00:50', event: 'All test cases passed', type: 'success' },
    { time: '00:55', event: 'Discussed time complexity', type: 'discussion' },
  ],
};

function CircularProgress({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#334155"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl text-[#F8FAFC]">{score}%</span>
      </div>
    </div>
  );
}

export function Evaluation() {
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
                <span>{evaluationData.candidate}</span>
                <span>•</span>
                <span>{evaluationData.date}</span>
                <span>•</span>
                <span>{evaluationData.duration}</span>
              </div>
            </div>
            <Badge variant="score" className="text-lg px-4 py-2">
              Overall: {evaluationData.overallScore}%
            </Badge>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {evaluationData.metrics.map((metric) => (
            <div
              key={metric.name}
              className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 flex flex-col items-center"
            >
              <h3 className="text-sm text-[#94A3B8] mb-4">{metric.name}</h3>
              <CircularProgress score={metric.score} />
            </div>
          ))}
        </div>

        {/* AI Feedback */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-[#10B981]/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-[#10B981]" />
            </div>
            <h2 className="text-xl text-[#F8FAFC]">AI Feedback</h2>
          </div>
          <p className="text-[#94A3B8] leading-relaxed">{evaluationData.feedback}</p>
        </div>

        {/* Activity Timeline */}
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-[#10B981]/10 rounded-lg">
              <Lightbulb className="w-5 h-5 text-[#10B981]" />
            </div>
            <h2 className="text-xl text-[#F8FAFC]">Activity Timeline</h2>
          </div>

          <div className="space-y-4">
            {evaluationData.timeline.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                  {index < evaluationData.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-[#10B981] mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm text-[#10B981] font-mono">{item.time}</span>
                    {item.type === 'discussion' && <MessageSquare className="w-4 h-4 text-[#94A3B8]" />}
                    {item.type === 'code' && <Code2 className="w-4 h-4 text-[#94A3B8]" />}
                    {item.type === 'success' && <Sparkles className="w-4 h-4 text-[#10B981]" />}
                  </div>
                  <p className="text-sm text-[#F8FAFC]">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
