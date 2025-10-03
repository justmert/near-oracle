import fetch from 'node-fetch';
import { AssetConfig, AssetSource } from './config.js';
import { calculateMedian, extractPriceFromPath } from './priceUtils.js';

export interface PriceData {
  assetId: string;
  price: number;
  sources: number;
  timestamp: number;
}

export class PriceFetcher {
  private failureCount: Map<string, number> = new Map();

  async fetchPrice(asset: AssetConfig): Promise<PriceData | null> {
    const prices: number[] = [];
    let successfulSources = 0;

    for (const source of asset.sources) {
      try {
        const price = await this.fetchFromSource(source);
        if (price !== null && price > 0) {
          prices.push(price);
          successfulSources++;
          this.failureCount.set(source.name, 0);
        }
      } catch (error) {
        const failures = (this.failureCount.get(source.name) || 0) + 1;
        this.failureCount.set(source.name, failures);
        console.error(`Failed to fetch from ${source.name}:`, error);

        if (failures >= 3) {
          console.warn(`Source ${source.name} has failed ${failures} times consecutively`);
        }
      }
    }

    if (prices.length === 0) {
      console.error(`No successful price fetches for ${asset.symbol}`);
      return null;
    }

    // Calculate median price
    const median = calculateMedian(prices);

    return {
      assetId: asset.id,
      price: median,
      sources: successfulSources,
      timestamp: Date.now(),
    };
  }

  private async fetchFromSource(source: AssetSource): Promise<number | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NEAR-TEE-Oracle/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const price = extractPriceFromPath(data, source.path);

      if (typeof price === 'number' && !isNaN(price) && price > 0) {
        return price;
      }

      throw new Error(`Invalid price value: ${price}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  getFailureStats(): Map<string, number> {
    return new Map(this.failureCount);
  }
}

export { calculateMedian, extractPriceFromPath } from './priceUtils.js';
