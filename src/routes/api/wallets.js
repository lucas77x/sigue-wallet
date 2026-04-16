import { getWallets, getWalletById, createWallet, updateWallet, deleteWallet } from '../../models/wallet.js';

export default async function apiWallets(fastify) {
  fastify.addHook('preHandler', async (request, reply) => {
    if (!request.session.userId) return reply.status(401).send({ error: 'Unauthorized' });
  });

  fastify.get('/', async (request) => {
    return getWallets(request.session.userId);
  });

  fastify.get('/:id', async (request, reply) => {
    const wallet = await getWalletById(request.params.id, request.session.userId);
    if (!wallet) return reply.status(404).send({ error: 'Not found' });
    return wallet;
  });

  fastify.post('/', async (request) => {
    const { alias, address, chains } = request.body;
    return createWallet({ userId: request.session.userId, alias, address, chains });
  });

  fastify.put('/:id', async (request) => {
    const { alias, address, chains } = request.body;
    return updateWallet(request.params.id, request.session.userId, { alias, address, chains });
  });

  fastify.delete('/:id', async (request) => {
    return deleteWallet(request.params.id, request.session.userId);
  });
}
