import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, Eye, EyeOff, UserCircle, Briefcase } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, role);
      navigate('/lobby');
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Login failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0F172A' }}>
      {/* Dot grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #94A3B8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#1E293B] rounded-2xl p-8 shadow-2xl border border-[#334155]">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-[#10B981] rounded-lg">
              <Code2 className="w-6 h-6 text-[#0F172A]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#F8FAFC]">InterviewAI</h1>
          </div>

          <h2 className="text-xl text-[#F8FAFC] mb-6 text-center">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5 text-[#F8FAFC]">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('candidate')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    role === 'candidate'
                      ? 'bg-[#10B981] border-[#10B981] text-[#0F172A]'
                      : 'bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:border-[#10B981]'
                  }`}
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="text-sm">Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('interviewer')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    role === 'interviewer'
                      ? 'bg-[#10B981] border-[#10B981] text-[#0F172A]'
                      : 'bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:border-[#10B981]'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                  <span className="text-sm">Interviewer</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-[#F8FAFC]">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-[#F8FAFC]">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-sm text-[#EF4444]">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-6" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#94A3B8]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#10B981] hover:text-[#059669] transition-colors">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
