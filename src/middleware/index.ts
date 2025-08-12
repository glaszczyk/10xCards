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
    (locals as any).supabase = supabaseClient;
    (locals as any).user = null;
    (locals as any).session = null;

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (session) {
      (locals as any).user = session.user;
      (locals as any).session = session;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Jeśli użytkownik jest zalogowany i próbuje wejść na stronę auth
    if (session && isAuthPath(pathname)) {
      return redirect("/generate");
    }

    // Jeśli użytkownik nie jest zalogowany i próbuje wejść na chronioną trasę
    if (!session && !isPublicPath(pathname)) {
      return redirect(`/auth/login?redirectTo=${encodeURIComponent(pathname)}`);
    }

    return next();
  }
);
