import axios from 'axios';

const TOKEN_API_URL = 'https://gateway.thegraph.com';
const API_KEY = process.env.THEGRAPH_API_KEY || '';

const CHAIN_IDS = {
  ethereum: '1',
  bsc: '56',
  polygon: '137',
  avalanche: '43114',
  optimism: '10',
  fantom: '250',
  arbitrum: '42161',
  sonic: '101'
};

async function fetchBalance(address, chain) {
  const chainId = CHAIN_IDS[chain];
  if (!chainId) throw new Error(`Unknown chain: ${chain}`);

  const query = `{
    account(id: "${address.toLowerCase()}") {
      id
    }
  }`;

  try {
    const { data } = await axios.post(
      `${TOKEN_API_URL}/api/${API_KEY}/status`,
      { query },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (data.errors) {
      console.warn(`[thegraph] ${chain} ${address.slice(0, 10)}: no data`);
      return [];
    }

    return data.data?.account ? [{ chain, address, hasData: true }] : [];
  } catch (err) {
    console.warn(`[thegraph] ${chain} error: ${err.message}`);
    return [];
  }
}

export async function getWalletBalances(address, chain) {
  return fetchBalance(address, chain);
}

export async function getPortfolioBalances(wallets) {
  const results = await Promise.all(
    wallets.map(w => getWalletBalances(w.address, w.chain))
  );
  return wallets.map((w, i) => ({ ...w, balances: results[i] }));
}
