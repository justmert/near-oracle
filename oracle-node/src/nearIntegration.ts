import * as nearAPI from 'near-api-js';
import { Config } from './config.js';
import { PriceData } from './priceFetcher.js';

const { connect, KeyPair, keyStores } = nearAPI;

export class NearIntegration {
  private near: nearAPI.Near | null = null;
  private account: nearAPI.Account | null = null;
  private contractId: string;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.contractId = config.oracleContractId;
  }

  async initialize(): Promise<void> {
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(this.config.privateKey as any);
    await keyStore.setKey(
      this.config.nearNetworkId,
      this.config.nodeAccountId,
      keyPair
    );

    const connectionConfig = {
      networkId: this.config.nearNetworkId,
      keyStore,
      nodeUrl: this.config.nearNodeUrl,
      walletUrl: `https://wallet.${this.config.nearNetwork}.near.org`,
      helperUrl: `https://helper.${this.config.nearNetwork}.near.org`,
      explorerUrl: `https://explorer.${this.config.nearNetwork}.near.org`,
    };

    this.near = await connect(connectionConfig);
    this.account = await this.near.account(this.config.nodeAccountId);

    console.log(`Connected to NEAR ${this.config.nearNetwork}`);
    console.log(`Node account: ${this.config.nodeAccountId}`);
    console.log(`Oracle contract: ${this.contractId}`);
  }

  async checkRegistration(): Promise<boolean> {
    if (!this.account) {
      throw new Error('NEAR not initialized');
    }

    try {
      const result = await this.account.viewFunction({
        contractId: this.contractId,
        methodName: 'is_authorized',
        args: { account_id: this.config.nodeAccountId },
      });

      return result === true;
    } catch (error) {
      console.error('Failed to check registration:', error);
      return false;
    }
  }

  async registerNode(): Promise<void> {
    if (!this.account) {
      throw new Error('NEAR not initialized');
    }

    console.log(`Registering node with code hash: ${this.config.codeHash}`);

    try {
      const issuedAtMs = this.config.attestationIssuedAtMs ?? Date.now();
      const issuedAtNs = Number(BigInt(Math.max(0, issuedAtMs)) * 1_000_000n);

      const result = await this.account.functionCall({
        contractId: this.contractId,
        methodName: 'register_node',
        args: {
          code_hash: this.config.codeHash,
          attestation: {
            mr_enclave: this.config.mrEnclave,
            issued_at: issuedAtNs,
          },
        },
        gas: BigInt('30000000000000'), // 30 TGas
      });

      console.log('Node registered successfully:', result);
    } catch (error) {
      console.error('Failed to register node:', error);
      throw error;
    }
  }

  async reportPrice(priceData: PriceData, decimals: number): Promise<void> {
    if (!this.account) {
      throw new Error('NEAR not initialized');
    }

    // Convert float price to fixed-point integer
    const multiplier = Math.floor(priceData.price * Math.pow(10, decimals));

    try {
      const result = await this.account.functionCall({
        contractId: this.contractId,
        methodName: 'report_price',
        args: {
          asset_id: priceData.assetId,
          multiplier: multiplier,
          decimals,
        },
        gas: BigInt('30000000000000'), // 30 TGas
      });

      console.log(
        `Price reported for ${priceData.assetId}: $${priceData.price.toFixed(decimals)} (${multiplier} / 10^${decimals})`
      );
    } catch (error: any) {
      console.error(`Failed to report price for ${priceData.assetId}:`, error?.message || error);
      throw error;
    }
  }

  async getPrice(assetId: string): Promise<any> {
    if (!this.account) {
      throw new Error('NEAR not initialized');
    }

    try {
      const result = await this.account.viewFunction({
        contractId: this.contractId,
        methodName: 'get_price',
        args: { asset_id: assetId },
      });

      return result;
    } catch (error) {
      console.error(`Failed to get price for ${assetId}:`, error);
      return null;
    }
  }

  async getAssets(): Promise<any[]> {
    if (!this.account) {
      throw new Error('NEAR not initialized');
    }

    try {
      const result = await this.account.viewFunction({
        contractId: this.contractId,
        methodName: 'get_assets',
        args: {},
      });

      return result || [];
    } catch (error) {
      console.error('Failed to get assets:', error);
      return [];
    }
  }
}