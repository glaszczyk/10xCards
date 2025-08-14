import { supabaseClient } from "@/db/supabase.client";
import type { AuthSession, Profile } from "@/types";
import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

// Auth Context
export const AuthContext = createContext<AuthSession>({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  refreshProfile: async () => {},
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Funkcja do odświeżania profilu
  const refreshProfile = async () => {
    if (user) {
      try {
        const profileData = await getUserProfile(user.id);
        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (mounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await refreshProfile();
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthSession = {
    user: user ? {
      id: user.id,
      email: user.email || '',
      created_at: user.created_at
    } : null,
    profile,
    isLoading,
    isAuthenticated: !!user,
    refreshProfile,
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
  
  // Poczekaj chwilę na aktualizację stanu auth
  // Supabase auth state change może być asynchroniczny
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Sprawdź czy sesja jest ustawiona
  const { data: { session } } = await supabaseClient.auth.getSession();
  
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
  try {
    const { error } = await supabaseClient.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Poczekaj chwilę na usunięcie cookies
    // Supabase usuwa cookies asynchronicznie
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Sprawdź czy cookies zostały usunięte
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // Po wylogowaniu przekieruj na stronę główną
    window.location.href = "/";
    
  } catch (error) {
    // W przypadku błędu, przekieruj i tak
    window.location.href = "/";
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

// OTP (One-Time Password) authentication
export async function signInWithOtp(email: string) {
  const { data, error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Automatycznie utwórz użytkownika jeśli nie istnieje
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

// Verify OTP code
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabaseClient.auth.verifyOtp({
    email,
    token,
    type: 'magiclink',
  });

  if (error) throw new Error(error.message);
  return data;
}

// Reset password
export async function resetPassword(email: string) {
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    }
  );

  if (error) throw new Error(error.message);
  return data;
}

// Update password
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabaseClient.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
  return data;
}

// Get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Profile>
) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function redirectIfAuthenticated(user: User | null, targetPath = "/generate") {
  if (user) {
    // TODO: Na kolejnym etapie - implement redirect logic
    // For now, return boolean for conditional rendering
    return true;
  }
  return false;
}