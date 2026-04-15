export async function requireAuth(request, reply) {
  if (!request.session.userId) {
    return reply.redirect('/login');
  }
}
