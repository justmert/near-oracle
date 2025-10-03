import { config as dotenvConfig } from 'dotenv';
import { loadConfig } from './config.js';
import { PriceFetcher } from './priceFetcher.js';
import { NearIntegration } from './nearIntegration.js';

// Load environment variables
dotenvConfig();

class OracleNode {
  private config = loadConfig();
  private fetcher = new PriceFetcher();
  private near = new NearIntegration(this.config);
  private running = false;
  private updateTimer: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    console.log('Starting TEE Oracle Node...');
    console.log(`Update interval: ${this.config.updateInterval}ms`);
    console.log(`Assets to monitor: ${this.config.assets.map(a => a.symbol).join(', ')}`);

    try {
      // Initialize NEAR connection
      await this.near.initialize();

      // Check registration status
      const isRegistered = await this.near.checkRegistration();
      if (!isRegistered) {
        console.log('Node not registered. Attempting registration...');
        await this.near.registerNode();
      } else {
        console.log('Node is already registered');
      }

      // Start main loop
      this.running = true;
      await this.updatePrices();
      this.scheduleNextUpdate();

      console.log('Oracle node started successfully');
    } catch (error) {
      console.error('Failed to start oracle node:', error);
      process.exit(1);
    }
  }

  private async updatePrices(): Promise<void> {
    console.log(`\n[${new Date().toISOString()}] Updating prices...`);

    for (const asset of this.config.assets) {
      try {
        const priceData = await this.fetcher.fetchPrice(asset);

        if (priceData) {
          await this.near.reportPrice(priceData, asset.decimals);
        } else {
          console.warn(`Failed to fetch price for ${asset.symbol}`);
        }
      } catch (error: any) {
        console.error(`Error processing ${asset.symbol}:`, error?.message || error);
      }

      // Small delay between assets to avoid rate limits
      await this.sleep(1000);
    }

    console.log('Price update cycle completed');
  }

  private scheduleNextUpdate(): void {
    if (!this.running) return;

    this.updateTimer = setTimeout(async () => {
      await this.updatePrices();
      this.scheduleNextUpdate();
    }, this.config.updateInterval);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop(): Promise<void> {
    console.log('Stopping oracle node...');
    this.running = false;

    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }

    console.log('Oracle node stopped');
  }
}

// Main execution
const node = new OracleNode();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT signal');
  await node.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM signal');
  await node.stop();
  process.exit(0);
});

// Start the node
node.start().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});