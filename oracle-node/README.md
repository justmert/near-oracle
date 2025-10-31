# TEE-Secured Oracle Node

Oracle node that fetches prices from multiple sources and reports them to the NEAR blockchain.

## Features

- Multi-source price aggregation (median calculation)
- Automatic retry and error handling
- NEAR blockchain integration
- Docker support for TEE deployment
- Health monitoring

## Setup

### Prerequisites

- Node.js 20+
- npm or yarn
- NEAR account with private key

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `NODE_ACCOUNT_ID`: Your NEAR account ID
- `NODE_PRIVATE_KEY`: Your NEAR account private key (ed25519:...)
- `ORACLE_CONTRACT_ID`: Oracle smart contract address
- `UPDATE_INTERVAL`: Price update frequency in milliseconds

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t oracle-node .
docker run --env-file .env oracle-node
```

## How It Works

1. **Initialization**: Connects to NEAR and checks registration status
2. **Registration**: Registers with oracle contract if not already registered
3. **Price Fetching**: Fetches prices from multiple sources for each asset
4. **Aggregation**: Calculates median price from all successful sources
5. **Reporting**: Reports aggregated price to smart contract
6. **Loop**: Repeats at configured interval

## Supported Price Sources

- CoinGecko API
- Binance API
- Coinbase API

Additional sources can be added in `src/config.ts`.

## Monitoring

The node logs all operations including:
- Price fetch successes/failures
- Price reporting transactions
- Registration status
- Error conditions

## Error Handling

- Retries failed API requests
- Continues with remaining sources if one fails
- Alerts after consecutive failures
- Graceful shutdown on SIGINT/SIGTERM