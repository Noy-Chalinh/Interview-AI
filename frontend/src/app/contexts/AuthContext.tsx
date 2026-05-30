import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { disconnectSocket } from '../../lib/socket';

export type UserRole = 'candidate' | 'interviewer';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toApiRole(role: UserRole): 'CANDIDATE' | 'INTERVIEWER' {
  return role === 'candidate' ? 'CANDIDATE' : 'INTERVIEWER';
}

function fromApiRole(role: string): UserRole {
  return role === 'INTERVIEWER' ? 'interviewer' : 'candidate';
}

interface JwtClaims {
  userId: string;
  email: string;
  role: string;
  exp?: number;
}

// Decode a JWT payload (no verification — just to read identity/role/expiry on
// the client). Returns null if the token is malformed.
function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

function normalizeUser(raw: any): User {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    role: fromApiRole(raw.role),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (!token) {
      // No token → not authenticated, drop any orphaned user object.
      localStorage.removeItem('user');
      return;
    }

    const claims = decodeJwt(token);
    if (!claims || (claims.exp && claims.exp * 1000 < Date.now())) {
      // Token missing/expired/malformed → clear stale auth so the UI and the
      // backend can never disagree about who is logged in.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return;
    }

    // The token is the source of truth for identity and role. The stored user
    // object only supplies the display name, and only if it matches the token.
    let stored: User | null = null;
    try {
      stored = userData ? (JSON.parse(userData) as User) : null;
    } catch {
      stored = null;
    }

    const fromToken: User = {
      id: claims.userId,
      email: claims.email,
      name: stored && stored.id === claims.userId ? stored.name : claims.email,
      role: fromApiRole(claims.role),
    };
    localStorage.setItem('user', JSON.stringify(fromToken));
    setUser(fromToken);
  }, []);

  // Role is a property of the account (set at registration) and comes from the
  // server, never chosen at login — so the JWT and the UI can never disagree.
  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const u = normalizeUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      role: toApiRole(role),
    });
    const u = normalizeUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore — log out locally regardless
    }
    disconnectSocket();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
