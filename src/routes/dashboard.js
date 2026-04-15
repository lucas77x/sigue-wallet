import { getWallets } from '../models/wallet.js';
import { getUserPortfolio } from '../services/portfolio.js';
import { requireAuth } from '../middleware/auth.js';

export default async function dashboardRoutes(fastify) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/dashboard', async (request, reply) => {
    const wallets = await getWallets(request.session.userId);
    const portfolio = await getUserPortfolio(wallets);

    return reply.render('dashboard.ejs', {
      username: request.session.username,
      wallets,
      portfolio,
      selectedWallet: null
    });
  });
}
