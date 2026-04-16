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

/**
 * Converts a raw token amount (wei-like string) to a human-readable balance using BigInt
 * to avoid float64 precision loss on large values (> 2^53).
 */
function formatBalance(rawBalance, decimals) {
  if (!rawBalance || decimals == null) return '0';
  try {
    const raw = BigInt(String(rawBalance).split('.')[0]); // strip any accidental decimal
    const dec = Math.max(0, Math.min(Number(decimals), 18)); // clamp 0–18
    const divisor = 10n ** BigInt(dec);
    const whole = raw / divisor;
    const remainder = raw % divisor;
    const wholeNum = Number(whole);
    const fracNum = Number(remainder) / Number(divisor);
    return (wholeNum + fracNum).toFixed(4);
  } catch {
    // Fallback for malformed values
    const value = Number(rawBalance) / Math.pow(10, decimals);
    return value.toFixed(4);
  }
}

/**
 * Spam/airdrop token detection heuristics.
 * The Token API has no built-in spam filter, so we apply client-side rules.
 * These catch the most common patterns: phishing URL airdrops, fake claim tokens,
 * and overflowed balances from tokens with astronomical supply.
 */
const SPAM_NAME_PATTERN = /https?:\/\/|www\.|\.com|\.net|\.io|\.org|\bclaim\b|\bairdrop\b|\breward\b|\bvisit\b|\bprize\b/i;
const MAX_REALISTIC_BALANCE = 1e12; // > 1 trillion formatted tokens = overflow or spam supply

function isSpamToken(token) {
  const nameSymbol = `${token.name ?? ''} ${token.symbol ?? ''}`;

  // 1. URL/phishing patterns in name or symbol
  if (SPAM_NAME_PATTERN.test(nameSymbol)) return true;

  const balance = parseFloat(token.balance);

  // 2. Astronomically large formatted balance (overflow or trillion-supply spam)
  if (balance > MAX_REALISTIC_BALANCE) return true;

  // 3. Round-number airdrop pattern: spam tokens are distributed in exact integers
  //    (e.g. 200,000 PUMP, 1,024 DogX). Real holdings from trading/staking always
  //    have fractional parts (3.4227 XVS, 203.8280 CHAIN). We flag tokens with:
  //    integer-formatted balance > 1,000 AND meaningful USD value.
  //    Known trade-off: would false-positive on exactly round purchases (e.g. exactly
  //    2,000 USDT with zero cents) — acceptable given how rare that is in practice.
  if (balance > 1_000 && balance === Math.floor(balance) && token.valueUsd > 10) return true;

  return false;
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

    // API fields: `amount` (raw string), `value` (USD float), `decimals`
    return data.data
      .map((token) => ({
        chain,
        symbol: token.symbol || 'UNKNOWN',
        name: token.name || '',
        balance: formatBalance(token.amount, token.decimals),
        decimals: token.decimals,
        contract: token.contract || null,
        valueUsd: token.value || 0,
      }))
      // Remove dust (zero balance AND zero USD value)
      .filter((t) => parseFloat(t.balance) > 0 || t.valueUsd > 0)
      // Remove spam/airdrop tokens
      .filter((t) => !isSpamToken(t))
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
