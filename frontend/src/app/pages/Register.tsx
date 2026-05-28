import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Code2, User, Briefcase } from 'lucide-react';

export function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidate' as UserRole,
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(formData.email, formData.password, formData.name, formData.role);
    navigate('/lobby');
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
      
      {/* Register card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-[#1E293B] rounded-2xl p-8 shadow-2xl border border-[#334155]">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-[#10B981] rounded-lg">
              <Code2 className="w-6 h-6 text-[#0F172A]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#F8FAFC]">InterviewAI</h1>
          </div>

          <h2 className="text-xl text-[#F8FAFC] mb-6 text-center">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5 text-[#F8FAFC]">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-[#F8FAFC]">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5 text-[#F8FAFC]">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm mb-3 text-[#F8FAFC]">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'candidate' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'candidate'
                      ? 'border-[#10B981] bg-[#10B981]/10'
                      : 'border-[#334155] bg-transparent hover:border-[#94A3B8]'
                  }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-2 ${
                    formData.role === 'candidate' ? 'text-[#10B981]' : 'text-[#94A3B8]'
                  }`} />
                  <div className={`text-sm ${
                    formData.role === 'candidate' ? 'text-[#10B981]' : 'text-[#F8FAFC]'
                  }`}>
                    Candidate
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'interviewer' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'interviewer'
                      ? 'border-[#10B981] bg-[#10B981]/10'
                      : 'border-[#334155] bg-transparent hover:border-[#94A3B8]'
                  }`}
                >
                  <Briefcase className={`w-6 h-6 mx-auto mb-2 ${
                    formData.role === 'interviewer' ? 'text-[#10B981]' : 'text-[#94A3B8]'
                  }`} />
                  <div className={`text-sm ${
                    formData.role === 'interviewer' ? 'text-[#10B981]' : 'text-[#F8FAFC]'
                  }`}>
                    Interviewer
                  </div>
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#94A3B8]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#10B981] hover:text-[#059669] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
