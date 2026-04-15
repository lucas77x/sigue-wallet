import { getWallets, getWalletById, createWallet, updateWallet, deleteWallet } from '../models/wallet.js';
import { requireAuth } from '../middleware/auth.js';

export default async function walletsRoutes(fastify) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/wallets', async (request, reply) => {
    const wallets = await getWallets(request.session.userId);
    return reply.render('wallets/index.ejs', { wallets });
  });

  fastify.get('/wallets/new', async (request, reply) => {
    return reply.render('wallets/form.ejs', { wallet: null, error: null });
  });

  fastify.get('/wallets/:id/edit', async (request, reply) => {
    const wallet = await getWalletById(request.params.id, request.session.userId);
    if (!wallet) return reply.redirect('/wallets');
    return reply.render('wallets/form.ejs', { wallet, error: null });
  });

  fastify.post('/wallets', async (request, reply) => {
    const { alias, address, chain } = request.body;
    try {
      await createWallet({ userId: request.session.userId, alias, address, chain });
      return reply.redirect('/wallets');
    } catch (err) {
      return reply.render('wallets/form.ejs', { wallet: null, error: err.message });
    }
  });

  fastify.post('/wallets/:id', async (request, reply) => {
    const { alias, address, chain } = request.body;
    try {
      await updateWallet(request.params.id, request.session.userId, { alias, address, chain });
      return reply.redirect('/wallets');
    } catch (err) {
      return reply.render('wallets/form.ejs', { wallet: null, error: err.message });
    }
  });

  fastify.post('/wallets/:id/delete', async (request, reply) => {
    await deleteWallet(request.params.id, request.session.userId);
    return reply.redirect('/wallets');
  });
}
