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
        params: { network: 'mainnet', address: MOCK_ADDRESS.toLowerCase() },
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
            amount: '1000000000000000000', // 1 ETH in wei — real API field
            decimals: 18,
            contract: null,
            value: 2000,                  // real API field (USD)
          },
        ],
      },
    });

    const [token] = await getWalletBalances(MOCK_ADDRESS, 'ethereum');
    expect(token.symbol).toBe('ETH');
    expect(token.balance).toBe('1.0000');
    expect(token.valueUsd).toBe(2000);
    expect(token.chain).toBe('ethereum');
  });

  it('formats balance correctly using BigInt to avoid float64 precision loss', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          // 2.5 USDC — 6 decimals, small value
          { symbol: 'USDC', name: 'USD Coin', amount: '2500000', decimals: 6, value: 2.5 },
        ],
      },
    });

    const [token] = await getWalletBalances(MOCK_ADDRESS, 'ethereum');
    expect(token.balance).toBe('2.5000');
  });

  it('filters out tokens with URL patterns in name (phishing airdrops)', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          { symbol: 'VISIT', name: 'Visit https://scam.com to claim', amount: '250000000000000000000000', decimals: 18, value: 250000 },
          { symbol: 'ETH', name: 'Ether', amount: '1000000000000000000', decimals: 18, value: 2000 },
        ],
      },
    });

    const result = await getWalletBalances(MOCK_ADDRESS, 'ethereum');
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('ETH');
  });

  it('filters out tokens with "claim" pattern in name', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          { symbol: 'CLM', name: 'Claim your reward', amount: '3794998000000000000000000', decimals: 18, value: 3794998 },
          { symbol: 'USDT', name: 'Tether USD', amount: '100000000', decimals: 6, value: 100 },
        ],
      },
    });

    const result = await getWalletBalances(MOCK_ADDRESS, 'polygon');
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('USDT');
  });

  it('filters out tokens with astronomically large balances (> 1 trillion)', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          // 10^21 tokens (spam supply) — clearly spam regardless of name
          { symbol: 'SPAM', name: 'Spam Token', amount: '1000000000000000000000000000000000000000', decimals: 18, value: 0 },
          { symbol: 'WBTC', name: 'Wrapped Bitcoin', amount: '100000000', decimals: 8, value: 6000 },
        ],
      },
    });

    const result = await getWalletBalances(MOCK_ADDRESS, 'ethereum');
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('WBTC');
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
      ['polygon', 'polygon'],
      ['avalanche', 'avalanche'],
      ['optimism', 'optimism'],
      ['arbitrum', 'arbitrum-one'],
    ];

    for (const [chain, expectedNetworkId] of chains) {
      axios.get.mockResolvedValueOnce({ data: { data: [] } });
      await getWalletBalances(MOCK_ADDRESS, chain);
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ params: expect.objectContaining({ network: expectedNetworkId }) })
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
      .mockResolvedValueOnce({ data: { data: [{ symbol: 'ETH', amount: '1000000000000000000', decimals: 18, value: 2000 }] } })
      .mockResolvedValueOnce({ data: { data: [{ symbol: 'MATIC', amount: '5000000000000000000', decimals: 18, value: 3 }] } });

    const wallets = [{ id: 1, address: '0xmulti', chains: ['ethereum', 'polygon'] }];
    const [result] = await getPortfolioBalances(wallets);
    expect(result.balances).toHaveLength(2);
    expect(result.balances[0].symbol).toBe('ETH');
    expect(result.balances[1].symbol).toBe('MATIC');
  });
});
