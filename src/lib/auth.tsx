/**
 * Auth context — wraps Supabase auth so any component can call useAuth()
 * to get the current user and session without prop-drilling.
 *
 * Usage:
 *   const { user, session, loading } = useAuth();
 *
 * Provided by <AuthProvider> in __root.tsx → RootComponent.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// ---- Types ----

export interface AuthState {
  /** null while loading or when not signed in */
  user: User | null;
  /** null while loading or when not signed in */
  session: Session | null;
  /** true only on the very first render before the session is resolved */
  loading: boolean;
}

// ---- Context ----

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
});

// ---- Provider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // 1. Hydrate from localStorage immediately (synchronous cache hit)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    // 2. Keep in sync with sign-in / sign-out / token refresh events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

// ---- Hook ----

export const useAuth = () => useContext(AuthContext);
