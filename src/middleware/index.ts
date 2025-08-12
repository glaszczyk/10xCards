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
  "/generate", // Add generate to public paths
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

    // Get cookies from request
    const cookies = request.headers.get("cookie");
    console.log("Middleware - Cookies:", cookies);

    // Parse cookies to see what we have
    if (cookies) {
      const cookieArray = cookies.split(";").map((c) => c.trim());
      console.log("Middleware - Parsed cookies:", cookieArray);

      // Check for Supabase specific cookies
      const supabaseCookies = cookieArray.filter(
        (c) => c.startsWith("sb-") || c.startsWith("supabase-auth-token")
      );
      console.log("Middleware - Supabase cookies:", supabaseCookies);
    }

    // Check for Supabase auth cookies instead of getSession()
    const hasAuthCookie =
      cookies &&
      (cookies.includes("sb-") || cookies.includes("supabase-auth-token"));

    console.log("Middleware - hasAuthCookie result:", hasAuthCookie);

    // Try to get session, but don't rely on it for middleware
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    // Debug: log session info
    console.log("Middleware - Session check:", {
      hasSession: !!session,
      hasAuthCookie: hasAuthCookie,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      pathname: new URL(request.url).pathname,
      cookies: cookies,
    });

    if (session) {
      (locals as any).user = session.user;
      (locals as any).session = session;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Tymczasowo wyłączamy middleware dla chronionych tras
    // Pozwalamy na dostęp do wszystkich tras, a autoryzację obsługuje MainLayout
    console.log("Middleware - Allowing access to:", pathname);

    // Jeśli użytkownik ma cookie auth i próbuje wejść na stronę auth
    if (hasAuthCookie && isAuthPath(pathname)) {
      return redirect("/generate");
    }

    return next();
  }
);
