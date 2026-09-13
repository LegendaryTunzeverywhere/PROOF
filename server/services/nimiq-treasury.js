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
    return Boolean(this.config.treasuryKey && this.config.treasuryAddress && this.config.seedNodes.length);
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
    if (!this.isConfigured()) throw new Error('Treasury payout is not configured.');

    const client = await this.#client();
    await client.waitForConsensusEstablished();
    const keyPair = Nimiq.KeyPair.derive(Nimiq.PrivateKey.fromHex(this.config.treasuryKey));
    const sender = keyPair.toAddress();
    const configuredSender = Nimiq.Address.fromString(this.config.treasuryAddress);
    if (!sender.equals(configuredSender)) throw new Error('TREASURY_ADDRESS does not match TREASURY_KEY.');

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