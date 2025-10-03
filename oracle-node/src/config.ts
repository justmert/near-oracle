export interface AssetSource {
  name: string;
  url: string;
  path: string;
  weight: number;
}

export interface AssetConfig {
  id: string;
  symbol: string;
  decimals: number;
  sources: AssetSource[];
}

export interface Config {
  nearNetwork: 'testnet' | 'mainnet';
  nearNetworkId: string;
  nearNodeUrl: string;
  oracleContractId: string;
  nodeAccountId: string;
  privateKey: string;
  updateInterval: number;
  assets: AssetConfig[];
  codeHash: string;
  mrEnclave: string;
  attestationIssuedAtMs?: number;
}

export const DEFAULT_CONFIG: Partial<Config> = {
  nearNetwork: 'testnet',
  nearNetworkId: 'testnet',
  nearNodeUrl: 'https://rpc.testnet.near.org',
  updateInterval: 60000, // 60 seconds
  mrEnclave: 'dev_mr_enclave',
  assets: [
    {
      id: 'near',
      symbol: 'NEAR',
      decimals: 4,
      sources: [
        {
          name: 'coingecko',
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd',
          path: 'near.usd',
          weight: 1.0,
        },
        {
          name: 'binance',
          url: 'https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT',
          path: 'price',
          weight: 1.0,
        },
        {
          name: 'coinbase',
          url: 'https://api.coinbase.com/v2/prices/NEAR-USD/spot',
          path: 'data.amount',
          weight: 1.0,
        },
        {
          name: 'cryptocompare',
          url: 'https://min-api.cryptocompare.com/data/price?fsym=NEAR&tsyms=USD',
          path: 'USD',
          weight: 1.0,
        },
        {
          name: 'okx',
          url: 'https://www.okx.com/api/v5/market/ticker?instId=NEAR-USDT',
          path: 'data.0.last',
          weight: 1.0,
        },
        {
          name: 'kucoin',
          url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=NEAR-USDT',
          path: 'data.price',
          weight: 1.0,
        },
      ],
    },
    {
      id: 'bitcoin',
      symbol: 'BTC',
      decimals: 4,
      sources: [
        {
          name: 'coingecko',
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
          path: 'bitcoin.usd',
          weight: 1.0,
        },
        {
          name: 'binance',
          url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
          path: 'price',
          weight: 1.0,
        },
        {
          name: 'coinbase',
          url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
          path: 'data.amount',
          weight: 1.0,
        },
        {
          name: 'cryptocompare',
          url: 'https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD',
          path: 'USD',
          weight: 1.0,
        },
        {
          name: 'okx',
          url: 'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT',
          path: 'data.0.last',
          weight: 1.0,
        },
        {
          name: 'kucoin',
          url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT',
          path: 'data.price',
          weight: 1.0,
        },
      ],
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      decimals: 4,
      sources: [
        {
          name: 'coingecko',
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
          path: 'ethereum.usd',
          weight: 1.0,
        },
        {
          name: 'binance',
          url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
          path: 'price',
          weight: 1.0,
        },
        {
          name: 'coinbase',
          url: 'https://api.coinbase.com/v2/prices/ETH-USD/spot',
          path: 'data.amount',
          weight: 1.0,
        },
        {
          name: 'cryptocompare',
          url: 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
          path: 'USD',
          weight: 1.0,
        },
        {
          name: 'okx',
          url: 'https://www.okx.com/api/v5/market/ticker?instId=ETH-USDT',
          path: 'data.0.last',
          weight: 1.0,
        },
        {
          name: 'kucoin',
          url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=ETH-USDT',
          path: 'data.price',
          weight: 1.0,
        },
      ],
    },
    {
      id: 'usdc',
      symbol: 'USDC',
      decimals: 4,
      sources: [
        {
          name: 'coingecko',
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd',
          path: 'usd-coin.usd',
          weight: 1.0,
        },
        {
          name: 'binance',
          url: 'https://api.binance.com/api/v3/ticker/price?symbol=USDCUSDT',
          path: 'price',
          weight: 1.0,
        },
        {
          name: 'coinbase',
          url: 'https://api.coinbase.com/v2/prices/USDC-USD/spot',
          path: 'data.amount',
          weight: 1.0,
        },
        {
          name: 'cryptocompare',
          url: 'https://min-api.cryptocompare.com/data/price?fsym=USDC&tsyms=USD',
          path: 'USD',
          weight: 1.0,
        },
        {
          name: 'okx',
          url: 'https://www.okx.com/api/v5/market/ticker?instId=USDC-USDT',
          path: 'data.0.last',
          weight: 1.0,
        },
        {
          name: 'kucoin',
          url: 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=USDC-USDT',
          path: 'data.price',
          weight: 1.0,
        },
      ],
    },
  ],
};

export function loadConfig(): Config {
  const attestationIssuedAtMsEnv = process.env.ATTESTATION_ISSUED_AT_MS;
  const parsedAttestationMs = attestationIssuedAtMsEnv
    ? Number.parseInt(attestationIssuedAtMsEnv, 10)
    : undefined;

  if (parsedAttestationMs !== undefined && Number.isNaN(parsedAttestationMs)) {
    throw new Error('ATTESTATION_ISSUED_AT_MS must be a valid integer (milliseconds)');
  }

  const config = {
    ...DEFAULT_CONFIG,
    nearNetwork: (process.env.NEAR_NETWORK as 'testnet' | 'mainnet') || 'testnet',
    nearNetworkId: process.env.NEAR_NETWORK_ID || 'testnet',
    nearNodeUrl: process.env.NEAR_NODE_URL || 'https://rpc.testnet.near.org',
    oracleContractId: process.env.ORACLE_CONTRACT_ID || 'oracle.testnet',
    nodeAccountId: process.env.NODE_ACCOUNT_ID || 'node1.testnet',
    privateKey: process.env.NODE_PRIVATE_KEY || '',
    updateInterval: Number.parseInt(process.env.UPDATE_INTERVAL || '60000', 10),
    codeHash: process.env.CODE_HASH || 'dev_hash',
    mrEnclave: process.env.TEE_MR_ENCLAVE || DEFAULT_CONFIG.mrEnclave || '',
    attestationIssuedAtMs: parsedAttestationMs,
  } as Config;

  if (!config.privateKey) {
    throw new Error('NODE_PRIVATE_KEY environment variable is required');
  }

  if (!config.mrEnclave) {
    throw new Error('TEE_MR_ENCLAVE environment variable is required');
  }

  return config;
}
