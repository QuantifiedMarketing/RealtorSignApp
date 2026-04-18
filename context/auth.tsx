import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'agent' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  brokerage?: string;
  placardCount: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) {
    console.warn('[auth] fetchProfile failed:', error?.message, 'userId:', userId);
    return null;
  }
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone ?? undefined,
    brokerage: data.brokerage ?? undefined,
    placardCount: data.placard_count ?? 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load the initial session directly — this runs outside the auth lock.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setIsLoading(false);
    });

    // Watch for subsequent sign-in / sign-out events.
    // IMPORTANT: do NOT call supabase.from() synchronously inside this callback —
    // the SDK holds an internal auth lock during the callback and any database
    // call that needs the session will deadlock. Defer with setTimeout(0).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const userId = session.user.id;
        setTimeout(async () => {
          const profile = await fetchProfile(userId);
          setUser(profile);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    setUser(null);
    await supabase.auth.signOut();
  };

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
