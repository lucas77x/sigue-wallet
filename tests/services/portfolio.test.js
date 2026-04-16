import { describe, it, expect, vi } from 'vitest';

// Mock thegraph to isolate portfolio service tests
vi.mock('../../src/services/thegraph.js', () => ({
  getPortfolioBalances: vi.fn(),
}));

import { formatBalance, calculateTotalPortfolio, getUserPortfolio } from '../../src/services/portfolio.js';
import { getPortfolioBalances } from '../../src/services/thegraph.js';

describe('formatBalance', () => {
  it('formats a normal number to 4 decimal places', () => {
    expect(formatBalance('1.23456789')).toBe('1.2346');
  });

  it('returns "0" for NaN input', () => {
    expect(formatBalance('abc')).toBe('0');
  });

  it('returns "0" for null/undefined input', () => {
    expect(formatBalance(null)).toBe('0');
    expect(formatBalance(undefined)).toBe('0');
  });

  it('formats zero correctly', () => {
    expect(formatBalance('0')).toBe('0.0000');
  });

  it('respects the custom decimals parameter', () => {
    expect(formatBalance('1.123456', 2)).toBe('1.12');
    expect(formatBalance('1.5', 0)).toBe('2');
  });

  it('formats very large numbers without scientific notation', () => {
    expect(formatBalance('1234567.89')).toBe('1234567.8900');
  });
});

describe('calculateTotalPortfolio', () => {
  it('sums valueUsd across all positions', () => {
    const positions = [{ valueUsd: '100.50' }, { valueUsd: '200.25' }, { valueUsd: '50.25' }];
    expect(calculateTotalPortfolio(positions)).toBeCloseTo(351.0);
  });

  it('returns 0 for an empty array', () => {
    expect(calculateTotalPortfolio([])).toBe(0);
  });

  it('treats missing valueUsd as 0', () => {
    const positions = [{ valueUsd: '100' }, {}, { valueUsd: undefined }];
    expect(calculateTotalPortfolio(positions)).toBeCloseTo(100);
  });

  it('handles string numbers correctly', () => {
    const positions = [{ valueUsd: '1000.00' }];
    expect(calculateTotalPortfolio(positions)).toBe(1000);
  });
});

describe('getUserPortfolio', () => {
  it('returns empty array when wallets is empty', async () => {
    const result = await getUserPortfolio([]);
    expect(result).toEqual([]);
    expect(getPortfolioBalances).not.toHaveBeenCalled();
  });

  it('delegates to getPortfolioBalances with the wallet list', async () => {
    const wallets = [{ id: 1, address: '0xabc', chain: 'ethereum' }];
    const expected = [{ ...wallets[0], balances: [] }];
    getPortfolioBalances.mockResolvedValueOnce(expected);

    const result = await getUserPortfolio(wallets);
    expect(getPortfolioBalances).toHaveBeenCalledWith(wallets);
    expect(result).toEqual(expected);
  });

  it('returns null/undefined when wallets is null', async () => {
    const result = await getUserPortfolio(null);
    expect(result).toEqual([]);
  });
});
