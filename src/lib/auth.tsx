import { supabaseClient } from "@/db/supabase.client";
import type { AuthSession } from "@/types";
import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

// Auth Context
export const AuthContext = createContext<AuthSession>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

// Auth Provider Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthSession = {
    user: user ? {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at
    } : null,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Auth helper functions
export async function signIn(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  
  if (error) {
    throw new Error(error.message);
  }
}

// Auth guards for page-level protection
export function requireAuth(user: User | null): User {
  if (!user) {
    // TODO: Na kolejnym etapie - implement redirect logic
    // For now, throw error that can be caught by ErrorBoundary
    throw new Error("Authentication required");
  }
  return user;
}

export function redirectIfAuthenticated(user: User | null, targetPath = "/generate") {
  if (user) {
    // TODO: Na kolejnym etapie - implement redirect logic
    // For now, return boolean for conditional rendering
    return true;
  }
  return false;
}