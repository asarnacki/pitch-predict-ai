import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

/**
 * Astro Middleware
 *
 * Sets up Supabase client and authenticated user in request context.
 * Makes them available via context.locals in all API endpoints.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  const authHeader = context.request.headers.get('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser(token);

    if (user && !error) {
      context.locals.user = user;
    }
  }

  return next();
});

