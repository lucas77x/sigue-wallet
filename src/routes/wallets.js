import {
  getWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
} from '../models/wallet.js';
import { requireAuth } from '../middleware/auth.js';
import { CHAINS, CHAIN_META } from '../config/chains.js';

function parseFormChains(raw) {
  return raw ? [].concat(raw) : [];
}

export default async function walletsRoutes(fastify) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/wallets', async (request, reply) => {
    const wallets = await getWallets(request.session.userId);
    return reply.view('wallets/index.ejs', { wallets, CHAIN_META });
  });

  fastify.get('/wallets/new', async (request, reply) => {
    return reply.view('wallets/form.ejs', { wallet: null, CHAINS, CHAIN_META, error: null });
  });

  fastify.get('/wallets/:id/edit', async (request, reply) => {
    const wallet = await getWalletById(request.params.id, request.session.userId);
    if (!wallet) return reply.redirect('/wallets');
    return reply.view('wallets/form.ejs', { wallet, CHAINS, CHAIN_META, error: null });
  });

  fastify.post('/wallets', async (request, reply) => {
    const { alias, address } = request.body;
    const chains = parseFormChains(request.body.chains);
    if (chains.length === 0) {
      return reply.view('wallets/form.ejs', {
        wallet: null, CHAINS, CHAIN_META,
        error: 'Seleccioná al menos una cadena',
      });
    }
    try {
      await createWallet({ userId: request.session.userId, alias, address, chains });
      return reply.redirect('/wallets');
    } catch (err) {
      return reply.view('wallets/form.ejs', { wallet: null, CHAINS, CHAIN_META, error: err.message });
    }
  });

  fastify.post('/wallets/:id', async (request, reply) => {
    const { alias, address } = request.body;
    const chains = parseFormChains(request.body.chains);
    if (chains.length === 0) {
      const wallet = await getWalletById(request.params.id, request.session.userId);
      return reply.view('wallets/form.ejs', {
        wallet, CHAINS, CHAIN_META,
        error: 'Seleccioná al menos una cadena',
      });
    }
    try {
      await updateWallet(request.params.id, request.session.userId, { alias, address, chains });
      return reply.redirect('/wallets');
    } catch (err) {
      return reply.view('wallets/form.ejs', { wallet: null, CHAINS, CHAIN_META, error: err.message });
    }
  });

  fastify.post('/wallets/:id/delete', async (request, reply) => {
    await deleteWallet(request.params.id, request.session.userId);
    return reply.redirect('/wallets');
  });
}
