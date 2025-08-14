import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/api",
  "/about",
];

// Dodaj funkcję sprawdzającą ścieżki auth
const isAuthPath = (pathname: string) => {
  return pathname.startsWith("/auth/");
};

const isPublicPath = (pathname: string) => {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
};

export const onRequest = defineMiddleware(
  async (
    {
      locals,
      request,
      redirect,
    }: { locals: App.Locals; request: Request; redirect: Function },
    next
  ) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Ustaw Supabase client w locals
    (locals as any).supabase = supabaseClient;

    // Sprawdź cookies dla autoryzacji
    const cookies = request.headers.get("cookie");
    const hasAuthCookie =
      cookies &&
      (cookies.includes("sb-") || cookies.includes("supabase-auth-token"));

    // Jeśli użytkownik ma cookie auth, spróbuj pobrać sesję
    let authInfo: {
      hasAuthCookie: boolean;
      isAuthenticated: boolean;
      user: any;
      session: any;
    } = {
      hasAuthCookie: !!hasAuthCookie,
      isAuthenticated: false,
      user: null,
      session: null,
    };

    if (hasAuthCookie) {
      try {
        // Pobierz sesję przez Supabase
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession();

        if (session && !error) {
          authInfo = {
            hasAuthCookie: true,
            isAuthenticated: true,
            user: session.user,
            session: session,
          };
        } else {
          authInfo = {
            hasAuthCookie: true,
            isAuthenticated: false,
            user: null,
            session: null,
          };
        }
      } catch (error) {
        authInfo = {
          hasAuthCookie: true,
          isAuthenticated: false,
          user: null,
          session: null,
        };
      }
    }

    // Ustaw dane w locals - dostępne dla stron Astro i React
    (locals as any).auth = authInfo;
    (locals as any).hasAuthCookie = hasAuthCookie;
    (locals as any).isPublicPath = isPublicPath(pathname);
    (locals as any).isAuthenticated = authInfo.isAuthenticated;
    (locals as any).user = authInfo.user;
    (locals as any).session = authInfo.session;

    // Jeśli użytkownik jest zalogowany i próbuje wejść na stronę auth
    if (authInfo.isAuthenticated && isAuthPath(pathname)) {
      return redirect("/generate");
    }

    // Pozwól na dostęp do wszystkich tras - React będzie obsługiwał autoryzację
    return next();
  }
);
