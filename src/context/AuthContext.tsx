'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  enrollMFA: () => Promise<{ data: any; error: any }>;
  verifyMFA: (factorId: string, code: string) => Promise<{ error: any }>;
  unenrollMFA: (factorId: string) => Promise<{ error: any }>;
  getMFAFactors: () => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const enrollMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Raising My Rescue 2FA'
    });
    return { data, error };
  };

  const verifyMFA = async (factorId: string, code: string) => {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: '', // This will be set during the challenge process
      code
    });
    return { error };
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    return { error };
  };

  const getMFAFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { data, error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    enrollMFA,
    verifyMFA,
    unenrollMFA,
    getMFAFactors,
  };

  return (
    <AuthContext.Provider value={value}>
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
