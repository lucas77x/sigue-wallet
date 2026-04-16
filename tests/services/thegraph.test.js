import { describe, it, expect, vi, beforeEach } from 'vitest';

// Explicit factory mock needed — axios default export is a callable with methods
vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import axios from 'axios';
import { getWalletBalances, getPortfolioBalances } from '../../src/services/thegraph.js';

const MOCK_ADDRESS = '0x88a700a156935697a73c986adbfa0032ef8a7e25';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWalletBalances', () => {
  it('returns empty array for unsupported chains (fantom)', async () => {
    const result = await getWalletBalances(MOCK_ADDRESS, 'fantom');
    expect(result).toEqual([]);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('returns empty array for unsupported chains (sonic)', async () => {
    const result = await getWalletBalances(MOCK_ADDRESS, 'sonic');
    expect(result).toEqual([]);
  });

  it('calls the correct Token API endpoint with proper auth header', async () => {
    axios.get.mockResolvedValueOnce({ data: { data: [] } });

    await getWalletBalances(MOCK_ADDRESS, 'ethereum');

    expect(axios.get).toHaveBeenCalledWith(
      'https://token-api.thegraph.com/v1/evm/balances',
      expect.objectContaining({
        params: { network_id: 'mainnet', address: MOCK_ADDRESS.toLowerCase() },
        headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Bearer/) }),
      })
    );
  });

  it('maps the API response to the expected token shape', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            symbol: 'ETH',
            name: 'Ether',
            balance: '1000000000000000000', // 1 ETH in wei
            decimals: 18,
            contract: null,
            price_usd: 2000,
            value_usd: 2000,
          },
        ],
      },
    });

    const [token] = await getWalletBalances(MOCK_ADDRESS, 'ethereum');
    expect(token.symbol).toBe('ETH');
    expect(token.balance).toBe('1.0000');
    expect(token.priceUsd).toBe(2000);
    expect(token.valueUsd).toBe(2000);
    expect(token.chain).toBe('ethereum');
  });

  it('returns empty array on 404 (address has no tokens)', async () => {
    const err = Object.assign(new Error('Not Found'), { response: { status: 404 } });
    axios.get.mockRejectedValueOnce(err);

    const result = await getWalletBalances(MOCK_ADDRESS, 'ethereum');
    expect(result).toEqual([]);
  });

  it('returns empty array on network error (graceful degradation)', async () => {
    axios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await getWalletBalances(MOCK_ADDRESS, 'polygon');
    expect(result).toEqual([]);
  });

  it('returns empty array when API returns no data field', async () => {
    axios.get.mockResolvedValueOnce({ data: {} });

    const result = await getWalletBalances(MOCK_ADDRESS, 'bsc');
    expect(result).toEqual([]);
  });

  it('uses correct network IDs for each supported chain', async () => {
    const chains = [
      ['ethereum', 'mainnet'],
      ['bsc', 'bsc'],
      ['polygon', 'matic'],
      ['avalanche', 'avalanche'],
      ['optimism', 'optimism'],
      ['arbitrum', 'arbitrum-one'],
    ];

    for (const [chain, expectedNetworkId] of chains) {
      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      await getWalletBalances(MOCK_ADDRESS, chain);
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ params: expect.objectContaining({ network_id: expectedNetworkId }) })
      );
    }
  });
});

describe('getPortfolioBalances', () => {
  it('enriches each wallet with its balances', async () => {
    axios.get.mockResolvedValue({ data: { data: [] } });

    const wallets = [
      { id: 1, address: '0x111', chains: ['ethereum'] },
      { id: 2, address: '0x222', chains: ['polygon'] },
    ];

    const result = await getPortfolioBalances(wallets);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, balances: [] });
    expect(result[1]).toMatchObject({ id: 2, balances: [] });
  });

  it('fetches all chains across all wallets in parallel', async () => {
    let callCount = 0;
    axios.get.mockImplementation(() => {
      callCount++;
      return Promise.resolve({ data: { data: [] } });
    });

    const wallets = [
      { id: 1, address: '0xaaa', chains: ['ethereum'] },
      { id: 2, address: '0xbbb', chains: ['bsc'] },
      { id: 3, address: '0xccc', chains: ['polygon', 'arbitrum'] },
    ];

    await getPortfolioBalances(wallets);
    expect(callCount).toBe(4); // 1 + 1 + 2
  });

  it('flattens balances from multiple chains into a single array', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { data: [{ symbol: 'ETH', balance: '1000000000000000000', decimals: 18 }] } })
      .mockResolvedValueOnce({ data: { data: [{ symbol: 'MATIC', balance: '5000000000000000000', decimals: 18 }] } });

    const wallets = [{ id: 1, address: '0xmulti', chains: ['ethereum', 'polygon'] }];
    const [result] = await getPortfolioBalances(wallets);
    expect(result.balances).toHaveLength(2);
    expect(result.balances[0].symbol).toBe('ETH');
    expect(result.balances[1].symbol).toBe('MATIC');
  });
});
