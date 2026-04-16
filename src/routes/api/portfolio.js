import { getWallets, getWalletById } from '../../models/wallet.js';
import { getUserPortfolio } from '../../services/portfolio.js';

export default async function apiPortfolio(fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    if (!request.session.userId) return reply.status(401).send({ error: 'Unauthorized' });
  });

  fastify.get('/', async (request) => {
    const wallets = await getWallets(request.session.userId);
    const portfolio = await getUserPortfolio(wallets);
    return { wallets, portfolio };
  });

  fastify.get('/wallet/:id', async (request, reply) => {
    const wallet = await getWalletById(request.params.id, request.session.userId);
    if (!wallet) return reply.status(404).send({ error: 'Not found' });
    const [result] = await getUserPortfolio([wallet]);
    return { wallet, balances: result.balances };
  });
}
