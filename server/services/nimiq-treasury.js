import * as Nimiq from '@nimiq/core';

const NETWORK_IDS = {
  mainnet: 'mainalbatross',
  testnet: 'testalbatross',
};

export class NimiqTreasury {
  constructor(config) {
    this.config = config.nimiq;
    this.clientPromise = null;
  }

  isConfigured() {
    return Boolean(
      (this.config.treasuryMnemonic || /^[0-9a-fA-F]{64}$/.test(this.config.treasuryKey || ''))
      && this.config.treasuryAddress
      && this.config.seedNodes.length,
    );
  }

  configurationError() {
    if (!this.config.treasuryAddress) return 'TREASURY_ADDRESS is missing.';
    if (!this.config.seedNodes.length) return 'NIMIQ_SEED_NODES is missing.';
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

  async #client() {
    if (!this.clientPromise) {
      this.clientPromise = Nimiq.Client.create({
        networkId: NETWORK_IDS[this.config.network] || this.config.network,
        seedNodes: this.config.seedNodes,
        desiredPeerCount: 4,
      });
    }
    return this.clientPromise;
  }

  async send({ recipient, amountLuna }) {
    const configurationError = this.configurationError();
    if (configurationError) throw new Error(`Treasury payout is not configured: ${configurationError}`);

    const client = await this.#client();
    await client.waitForConsensusEstablished();
    const keyPair = this.#keyPair();
    const sender = keyPair.toAddress();

    const transaction = Nimiq.TransactionBuilder.newBasic(
      sender,
      Nimiq.Address.fromString(recipient),
      BigInt(amountLuna),
      0n,
      await client.getHeadHeight(),
      await client.getNetworkId(),
    );
    transaction.sign(keyPair);
    const details = await client.sendTransaction(transaction);
    return { hash: details.transactionHash };
  }
}