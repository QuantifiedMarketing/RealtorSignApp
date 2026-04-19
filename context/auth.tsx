import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export type UserRole = 'agent' | 'admin';
export type PanelWidth = 'up_to_24_inches' | 'over_24_inches';
export type PostColour = 'black' | 'white';
export type PanelOrientation = 'portrait' | 'landscape';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  brokerage?: string;
  brokerageAddress?: string;
  profilePhotoUrl?: string;
  defaultPanelWidth?: PanelWidth;
  defaultPostColour?: PostColour;
  defaultPanelOrientation?: PanelOrientation;
  panelCount: number;
}

export interface ProfileUpdates {
  name?: string;
  phone?: string;
  brokerage?: string;
  brokerageAddress?: string;
  profilePhotoUrl?: string;
  defaultPanelWidth?: PanelWidth;
  defaultPostColour?: PostColour;
  defaultPanelOrientation?: PanelOrientation;
}

export function isProfileComplete(user: User): boolean {
  return !!(
    user.phone &&
    user.brokerage &&
    user.brokerageAddress &&
    user.defaultPanelWidth &&
    user.defaultPostColour &&
    user.defaultPanelOrientation
  );
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<{ needsVerification: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<void>;
  refreshProfile: () => Promise<void>;
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
    brokerageAddress: data.brokerage_address ?? undefined,
    profilePhotoUrl: data.profile_photo_url ?? undefined,
    defaultPanelWidth: data.default_panel_width ?? undefined,
    defaultPostColour: data.default_post_colour ?? undefined,
    defaultPanelOrientation: data.default_panel_orientation ?? undefined,
    panelCount: data.panel_count ?? 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setIsLoading(false);
    });

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

  const register = async (email: string, password: string): Promise<{ needsVerification: boolean }> => {
    const emailRedirectTo = Linking.createURL('email-verified');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) throw new Error(error.message);
    // Supabase returns an empty identities array (rather than an error) when the
    // email is already registered, to prevent email enumeration.
    if (!data.user?.identities || data.user.identities.length === 0) {
      throw new Error('email-already-exists');
    }
    return { needsVerification: !data.session };
  };

  const resetPassword = async (email: string) => {
    const redirectTo = Linking.createURL('reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
  };

  const updateProfile = async (updates: ProfileUpdates) => {
    if (!user) return;

    const dbRow: Record<string, unknown> = {};
    if (updates.name !== undefined) dbRow.name = updates.name;
    if (updates.phone !== undefined) dbRow.phone = updates.phone;
    if (updates.brokerage !== undefined) dbRow.brokerage = updates.brokerage;
    if (updates.brokerageAddress !== undefined) dbRow.brokerage_address = updates.brokerageAddress;
    if (updates.profilePhotoUrl !== undefined) dbRow.profile_photo_url = updates.profilePhotoUrl;
    if (updates.defaultPanelWidth !== undefined) dbRow.default_panel_width = updates.defaultPanelWidth;
    if (updates.defaultPostColour !== undefined) dbRow.default_post_colour = updates.defaultPostColour;
    if (updates.defaultPanelOrientation !== undefined) dbRow.default_panel_orientation = updates.defaultPanelOrientation;

    const { error } = await supabase.from('users').update(dbRow).eq('id', user.id);
    if (error) throw new Error(error.message);

    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profile = await fetchProfile(user.id);
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, resetPassword, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
