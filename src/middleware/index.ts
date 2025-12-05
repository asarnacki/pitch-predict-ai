import { defineMiddleware } from "astro:middleware";
import process from "node:process";

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
  // DEBUG: Log what's available
  console.log("DEBUG middleware env sources:", {
    runtime: !!context.locals.runtime?.env,
    importMetaURL: !!import.meta.env.SUPABASE_URL,
    importMetaKEY: !!import.meta.env.SUPABASE_KEY,
    processURL: !!process.env.SUPABASE_URL,
    processKEY: !!process.env.SUPABASE_KEY,
    processEnvKeys: Object.keys(process.env).filter((k) => k.includes("SUPABASE")),
  });

  // Get env from Cloudflare Workers runtime, import.meta.env, or process.env (for E2E tests)
  const env = context.locals.runtime?.env || {
    SUPABASE_URL: import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL,
    SUPABASE_KEY: import.meta.env.SUPABASE_KEY || process.env.SUPABASE_KEY,
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
