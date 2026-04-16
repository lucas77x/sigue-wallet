import { findUserById } from '../models/user.js';

/**
 * onRequest hook — populates request.user from session.
 * Safe to run on all routes, including public ones.
 */
export async function loadUser(request) {
  if (!request.session?.userId) return;
  const user = await findUserById(request.session.userId);
  if (!user) {
    await request.session.destroy();
    return;
  }
  // Never expose password_hash to the request context
  request.user = { id: user.id, username: user.username };
}

/**
 * preHandler hook — guards protected routes.
 * Redirects to /login if the user is not authenticated.
 */
export async function requireAuth(request, reply) {
  if (!request.session?.userId) {
    return reply.redirect('/login');
  }
}
