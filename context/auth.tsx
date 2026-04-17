import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  placardCount?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'agent@test.com': {
    password: 'password',
    user: {
      id: '1',
      email: 'agent@test.com',
      name: 'Jane Smith',
      role: 'agent',
      phone: '555-123-4567',
      placardCount: 12,
    },
  },
  'admin@test.com': {
    password: 'password',
    user: {
      id: '2',
      email: 'admin@test.com',
      name: 'Mike Johnson',
      role: 'admin',
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 700));
      const record = MOCK_USERS[email.toLowerCase()];
      if (!record || record.password !== password) {
        throw new Error('Invalid email or password.');
      }
      setUser(record.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
