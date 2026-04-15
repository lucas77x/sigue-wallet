import { getPortfolioBalances } from './thegraph.js';

export async function getUserPortfolio(wallets) {
  if (!wallets || wallets.length === 0) return [];
  return getPortfolioBalances(wallets);
}

export function formatBalance(balance, decimals = 4) {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

export function calculateTotalPortfolio(positions) {
  return positions.reduce((sum, p) => {
    const val = parseFloat(p.valueUsd || 0);
    return sum + val;
  }, 0);
}
