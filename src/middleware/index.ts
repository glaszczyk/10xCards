import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

const publicPaths = ["/", "/login", "/register", "/about", "/api"];

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
    const isPublicPath = publicPaths.some(
      (path) => url.pathname === path || url.pathname.startsWith(path + "/")
    );

    if (!isPublicPath && !session) {
      return redirect("/login?redirectTo=" + encodeURIComponent(url.pathname));
    }

    return next();
  }
);
