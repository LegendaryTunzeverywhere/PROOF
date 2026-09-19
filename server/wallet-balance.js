import { normalizeNimiqAddress, formatNimiqAddress, toNim } from './util.js';

const walletRpcCooldowns = new Map();
const walletBalanceCache = new Map();

function requestRateLimitKey(method, params) {
  return `${method}:${JSON.stringify(params ?? [])}`;
}

function isRateLimited(key) {
  const until = walletRpcCooldowns.get(key) || 0;
  return Date.now() < until;
}

function markRateLimited(key, ms = 30000) {
  walletRpcCooldowns.set(key, Date.now() + ms);
}

export async function connectedWalletBalance(user, config = {}) {
  const fallback = toNim(user.balanceLuna);
  const walletAddresses = [...new Set([
    user.walletAddress,
    ...(Array.isArray(user.prefs?.walletAddresses) ? user.prefs.walletAddresses : []),
  ].filter(Boolean).map((address) => normalizeNimiqAddress(address)))];

  if (!walletAddresses.length || user.walletMode === 'demo' || !config?.nimiq?.rpcUrl) {
    return fallback;
  }

  const cacheKey = `${user.id}:${user.walletMode}:${JSON.stringify(walletAddresses)}:${config.nimiq.rpcUrl}`;
  const cached = walletBalanceCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 30000) {
    return cached.value;
  }

  const rpc = async (method, params, id) => {
    const key = requestRateLimitKey(method, params);
    if (isRateLimited(key)) {
      throw new Error('RPC_RATE_LIMITED');
    }

    let attempt = 0;
    while (attempt <= 1) {
      try {
        const response = await fetch(config.nimiq.rpcUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
        });
        if (!response.ok) {
          const message = `RPC_HTTP_${response.status}`;
          if (response.status === 429) {
            markRateLimited(key, 30000);
            if (attempt === 0) {
              attempt += 1;
              await new Promise((resolve) => setTimeout(resolve, 250));
              continue;
            }
            throw new Error(message);
          }
          throw new Error(message);
        }
        const payload = await response.json();
        if (payload?.error) throw new Error(payload.error.message || 'RPC_ERROR');
        return payload?.result?.data ?? payload?.result ?? null;
      } catch (error) {
        const message = String(error?.message || error || '');
        if (/RPC_RATE_LIMITED/.test(message)) {
          throw error;
        }
        if (/RPC_HTTP_429/.test(message) && attempt <= 1) {
          markRateLimited(key, 30000);
          attempt += 1;
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        throw error;
      }
    }

    throw new Error('RPC_RETRY_EXHAUSTED');
  };

  const accountBalances = new Map();

  await Promise.all(walletAddresses.map(async (address, index) => {
    try {
      const account = await rpc('getAccountByAddress', [formatNimiqAddress(address)], `balance-${user.id}-${index}`);
      const balanceLuna = Number(account?.balance);
      if (Number.isFinite(balanceLuna) && balanceLuna >= 0) accountBalances.set(address, balanceLuna);
    } catch (error) {
      if (!/RPC_HTTP_429|RPC_RATE_LIMITED|RPC_RETRY_EXHAUSTED/.test(String(error?.message || error || ''))) {
        console.warn(`[wallet] Could not read account balance for ${formatNimiqAddress(address)}:`, error.message);
      }
    }
  }));

  if (user.walletMode === 'nimiqpay') {
    const htlcCandidates = new Set();
    await Promise.all(walletAddresses.map(async (address, index) => {
      try {
        const transactions = await rpc(
          'getTransactionsByAddress',
          [formatNimiqAddress(address), 100, null],
          `transactions-${user.id}-${index}`,
        );
        for (const transaction of Array.isArray(transactions) ? transactions : []) {
          if (Number(transaction?.toType) === 2 && transaction.to) htlcCandidates.add(transaction.to);
          if (Number(transaction?.fromType) === 2 && transaction.from) htlcCandidates.add(transaction.from);
          for (const related of transaction.relatedAddresses || []) {
            if (related && related !== address && (Number(transaction?.toType) === 2 || Number(transaction?.fromType) === 2)) {
              htlcCandidates.add(related);
            }
          }
        }
      } catch (error) {
        if (!/RPC_HTTP_429|RPC_RATE_LIMITED|RPC_RETRY_EXHAUSTED/.test(String(error?.message || error || ''))) {
          console.warn(`[wallet] Could not inspect HTLC history for ${formatNimiqAddress(address)}:`, error.message);
        }
      }
    }));

    await Promise.all([...htlcCandidates].map(async (candidate, index) => {
      try {
        const account = await rpc('getAccountByAddress', [candidate], `htlc-${user.id}-${index}`);
        if (String(account?.type || '').toLowerCase() !== 'htlc') return;
        const sender = normalizeNimiqAddress(account.sender || '');
        const recipient = normalizeNimiqAddress(account.recipient || '');
        if (!walletAddresses.includes(sender) && !walletAddresses.includes(recipient)) return;
        const balanceLuna = Number(account.balance);
        if (Number.isFinite(balanceLuna) && balanceLuna > 0) accountBalances.set(normalizeNimiqAddress(candidate), balanceLuna);
      } catch (error) {
        if (!/RPC_HTTP_429|RPC_RATE_LIMITED|RPC_RETRY_EXHAUSTED/.test(String(error?.message || error || ''))) {
          console.warn(`[wallet] Could not read HTLC balance for ${candidate}:`, error.message);
        }
      }
    }));
  }

  const totalBalanceLuna = accountBalances.size
    ? [...accountBalances.values()].reduce((sum, balance) => sum + balance, 0)
    : fallback * 100000;
  const nextBalanceNim = toNim(totalBalanceLuna);
  walletBalanceCache.set(cacheKey, { value: nextBalanceNim, at: Date.now() });
  return nextBalanceNim;
}
