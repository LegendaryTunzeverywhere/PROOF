import { normalizeNimiqAddress, formatNimiqAddress, toNim } from './util.js';

export async function connectedWalletBalance(user, config = {}) {
  const fallback = toNim(user.balanceLuna);
  const walletAddresses = [...new Set([
    user.walletAddress,
    ...(Array.isArray(user.prefs?.walletAddresses) ? user.prefs.walletAddresses : []),
  ].filter(Boolean).map((address) => normalizeNimiqAddress(address)))];

  if (!walletAddresses.length || user.walletMode === 'demo' || !config?.nimiq?.rpcUrl) {
    return fallback;
  }

  const rpc = async (method, params, id) => {
    const response = await fetch(config.nimiq.rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });
    if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`);
    const payload = await response.json();
    if (payload?.error) throw new Error(payload.error.message || 'RPC_ERROR');
    return payload?.result?.data ?? payload?.result ?? null;
  };

  const accountBalances = new Map();

  await Promise.all(walletAddresses.map(async (address, index) => {
    try {
      const account = await rpc('getAccountByAddress', [formatNimiqAddress(address)], `balance-${user.id}-${index}`);
      const balanceLuna = Number(account?.balance);
      if (Number.isFinite(balanceLuna) && balanceLuna >= 0) accountBalances.set(address, balanceLuna);
    } catch (error) {
      console.warn(`[wallet] Could not read account balance for ${formatNimiqAddress(address)}:`, error.message);
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
        console.warn(`[wallet] Could not inspect HTLC history for ${formatNimiqAddress(address)}:`, error.message);
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
        console.warn(`[wallet] Could not read HTLC balance for ${candidate}:`, error.message);
      }
    }));
  }

  return accountBalances.size
    ? toNim([...accountBalances.values()].reduce((sum, balance) => sum + balance, 0))
    : fallback;
}
