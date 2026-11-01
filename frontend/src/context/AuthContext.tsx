/**
 * Authentication Context Provider
 * Supports Supabase Google OAuth and Email/Password Authentication
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Check local storage fallback for offline demo
      const savedUser = localStorage.getItem('signbridge_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser({
            id: 'demo-user-id',
            email: parsed.email,
            user_metadata: { full_name: parsed.name || parsed.email.split('@')[0] },
          } as unknown as User);
        } catch {
          // Ignore invalid cached user
        }
      }
      setLoading(false);
      return;
    }

    // Get current session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user?.email) {
        localStorage.setItem(
          'signbridge_user',
          JSON.stringify({
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          })
        );
      } else {
        localStorage.removeItem('signbridge_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env'),
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/studio`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      // Offline fallback demo sign-in
      setUser({
        id: 'demo-user-id',
        email,
        user_metadata: { full_name: email.split('@')[0] },
      } as unknown as User);
      localStorage.setItem('signbridge_user', JSON.stringify({ email, name: email.split('@')[0] }));
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string): Promise<{ error: Error | null }> => {
    if (!isSupabaseConfigured) {
      setUser({
        id: 'demo-user-id',
        email,
        user_metadata: { full_name: fullName || email.split('@')[0] },
      } as unknown as User);
      localStorage.setItem('signbridge_user', JSON.stringify({ email, name: fullName || email.split('@')[0] }));
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    localStorage.removeItem('signbridge_user');
    setUser(null);
    setSession(null);

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signOut();
        return { error };
      } catch (err) {
        return { error: err as Error };
      }
    }
    return { error: null };
  };

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [user, session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
