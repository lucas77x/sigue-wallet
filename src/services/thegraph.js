import axios from 'axios';

const TOKEN_API_BASE = 'https://token-api.thegraph.com';
const API_KEY = process.env.THEGRAPH_API_KEY || '';

/**
 * Map from internal chain names to The Graph Token API network IDs.
 * null = not supported by the Token API (returns empty array with warning).
 */
// Verified network slugs for The Graph Token API (param: ?network=)
const NETWORK_IDS = {
  ethereum: 'mainnet',
  bsc: 'bsc',
  polygon: 'polygon',
  avalanche: 'avalanche',
  optimism: 'optimism',
  arbitrum: 'arbitrum-one',
  fantom: null, // Not supported by Token API
  sonic: null,  // Not supported by Token API
};

function formatBalance(rawBalance, decimals) {
  if (!rawBalance || decimals == null) return '0';
  const value = Number(rawBalance) / Math.pow(10, decimals);
  return value.toFixed(4);
}

export async function getWalletBalances(address, chain) {
  const networkId = NETWORK_IDS[chain];
  if (!networkId) {
    console.warn(`[thegraph] Chain '${chain}' is not supported by the Token API`);
    return [];
  }

  try {
    const { data } = await axios.get(`${TOKEN_API_BASE}/v1/evm/balances`, {
      params: { network: networkId, address: address.toLowerCase() },
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
      timeout: 10_000,
    });

    if (!data?.data || !Array.isArray(data.data)) return [];

    return data.data
      .map((token) => ({
        chain,
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || '',
        balance: formatBalance(token.balance, token.decimals),
        decimals: token.decimals,
        contract: token.contract || null,
        priceUsd: token.price_usd || 0,
        valueUsd: token.value_usd || 0,
      }))
      // Filter out dust/spam: zero balance after formatting AND zero USD value
      .filter((t) => parseFloat(t.balance) > 0 || t.valueUsd > 0)
      // Sort by USD value descending
      .sort((a, b) => b.valueUsd - a.valueUsd);
  } catch (err) {
    if (err.response?.status === 404) {
      return []; // address has no tokens on this chain
    }
    console.warn(`[thegraph] ${chain}/${address.slice(0, 10)}: ${err.message}`);
    return [];
  }
}

export async function getPortfolioBalances(wallets) {
  const results = await Promise.all(
    wallets.map(async (w) => {
      const chains = Array.isArray(w.chains) ? w.chains : [w.chains].filter(Boolean);
      const perChain = await Promise.all(chains.map((chain) => getWalletBalances(w.address, chain)));
      return { ...w, balances: perChain.flat() };
    }),
  );
  return results;
}
