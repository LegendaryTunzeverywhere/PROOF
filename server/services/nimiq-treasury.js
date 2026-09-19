import * as Nimiq from '@nimiq/core';

const NETWORK_NUMBERS = {
  mainnet: 24,
  testnet: 5,
};

function transactionHash(value) {
  const raw = value?.toHex?.() || value?.toString?.() || value;
  const hash = raw instanceof Uint8Array
    ? Buffer.from(raw).toString('hex')
    : String(raw || '').replace(/^0x/, '');
  if (!/^[0-9a-f]{64}$/i.test(hash)) throw new Error('Nimiq RPC returned an invalid transaction hash.');
  return hash.toLowerCase();
}

export class NimiqTreasury {
  constructor(config) {
    this.config = config.nimiq;
  }

  isConfigured() {
    return Boolean(
      (this.config.treasuryMnemonic || /^[0-9a-fA-F]{64}$/.test(this.config.treasuryKey || ''))
      && this.config.treasuryAddress
      && this.config.rpcUrl,
    );
  }

  configurationError() {
    if (!this.config.treasuryAddress) return 'TREASURY_ADDRESS is missing.';
    if (!this.config.rpcUrl) return 'NIMIQ_RPC_URL is missing.';
    if (!this.config.treasuryMnemonic && !/^[0-9a-fA-F]{64}$/.test(this.config.treasuryKey || '')) {
      return 'Set TREASURY_MNEMONIC or a 64-character hexadecimal TREASURY_KEY.';
    }
    try {
      const sender = this.#keyPair().toAddress();
      const configuredSender = Nimiq.Address.fromString(this.config.treasuryAddress);
      if (!sender.equals(configuredSender)) return 'TREASURY_ADDRESS does not match the configured mnemonic/key (check TREASURY_MNEMONIC_PASSWORD).';
    } catch (error) {
      return `Treasury key could not be derived: ${error instanceof Error ? error.message : String(error)}`;
    }
    return null;
  }

  #keyPair() {
    if (this.config.treasuryMnemonic) {
      const entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(this.config.treasuryMnemonic);
      const master = entropy.toExtendedPrivateKey(this.config.treasuryMnemonicPassword || undefined);
      const accountKey = master.derivePath("m/44'/242'/0'/0'");
      return Nimiq.KeyPair.derive(accountKey.privateKey);
    }
    return Nimiq.KeyPair.derive(Nimiq.PrivateKey.fromHex(this.config.treasuryKey));
  }

  async #rpc(method, params = []) {
    if (!this.config.rpcUrl) throw new Error('NIMIQ_RPC_URL is missing.');
    const response = await fetch(this.config.rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
    });
    if (!response.ok) throw new Error(`Nimiq RPC HTTP ${response.status}`);
    const result = await response.json();
    if (result.error) throw new Error(result.error.message || `Nimiq RPC ${method} failed.`);
    return result.result?.data ?? result.result;
  }

  async send({ recipient, amountLuna, data = '' }) {
    const configurationError = this.configurationError();
    if (configurationError) throw new Error(`Treasury payout is not configured: ${configurationError}`);

    const keyPair = this.#keyPair();
    const sender = keyPair.toAddress();
    const height = await this.#rpc('getBlockNumber');
    if (!Number.isInteger(height)) throw new Error('Nimiq RPC returned an invalid block height.');

    const transaction = data
      ? Nimiq.TransactionBuilder.newBasicWithData(
        sender,
        Nimiq.Address.fromString(recipient),
        new TextEncoder().encode(data),
        BigInt(amountLuna),
        0n,
        height,
        NETWORK_NUMBERS[this.config.network] || 24,
      )
      : Nimiq.TransactionBuilder.newBasic(
        sender,
        Nimiq.Address.fromString(recipient),
        BigInt(amountLuna),
        0n,
        height,
        NETWORK_NUMBERS[this.config.network] || 24,
      );
    transaction.sign(keyPair);
    const result = await this.#rpc('pushTransaction', [transaction.toHex()]);
    return { hash: transactionHash(result?.transactionHash || transaction.hash()) };
  }
}