import { defineMiddleware } from "astro:middleware";

import { createServerClient } from "../db/supabase.server.ts";

/**
 * Astro Middleware
 *
 * Handles cookie-based session management with Supabase Auth.
 * Protects routes based on authentication state.
 *
 * Route Protection Logic:
 * - Public routes: /, /login, /register, /reset-password, /update-password
 * - Auth routes (only for logged out users): /login, /register, /reset-password
 * - All other routes require authentication
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Get env from Cloudflare Workers runtime or import.meta.env
  // (import.meta.env loads from .env, .env.local, or .env.test depending on --mode)
  const env = context.locals.runtime?.env || {
    SUPABASE_URL: import.meta.env.SUPABASE_URL,
    SUPABASE_KEY: import.meta.env.SUPABASE_KEY,
  };

  const supabase = createServerClient(context.cookies, env);
  context.locals.supabase = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  context.locals.user = user ?? null;

  const pathname = new URL(context.request.url).pathname;

  if (pathname.startsWith("/api/")) {
    return next();
  }

  const publicRoutes = ["/", "/login", "/register", "/reset-password", "/update-password"];
  const isPublicRoute = publicRoutes.includes(pathname);

  const authRoutes = ["/login", "/register", "/reset-password"];
  const isAuthRoute = authRoutes.includes(pathname);

  if (user && isAuthRoute) {
    return context.redirect("/");
  }

  if (!user && !isPublicRoute) {
    return context.redirect("/login");
  }

  return next();
});
