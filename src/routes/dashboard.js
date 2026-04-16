import { getWallets } from '../models/wallet.js';
import { requireAuth } from '../middleware/auth.js';

export default async function dashboardRoutes(fastify) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/dashboard', async (request, reply) => {
    const wallets = await getWallets(request.session.userId);

    return reply.view('dashboard.ejs', {
      username: request.user?.username ?? request.session.username,
      wallets,
    });
  });
}
