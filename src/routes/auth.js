import { findUserByUsername, verifyPassword } from '../models/user.js';

export default async function authRoutes(fastify) {
  fastify.get('/login', async (request, reply) => {
    return reply.view('login.ejs', { error: null });
  });

  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;
    const user = await findUserByUsername(username);

    if (!user) {
      return reply.view('login.ejs', { error: 'Usuario o contraseña inválidos' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return reply.view('login.ejs', { error: 'Usuario o contraseña inválidos' });
    }

    request.session.userId = user.id;
    request.session.username = user.username;
    return reply.redirect('/dashboard');
  });

  fastify.get('/logout', async (request, reply) => {
    request.session.destroy();
    return reply.redirect('/login');
  });
}
