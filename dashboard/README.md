# TEE Oracle Dashboard

Real-time monitoring dashboard for the NEAR TEE-secured Price Oracle.

## Features

- Live price data display
- Oracle node status monitoring
- System health metrics
- Auto-refreshing data (10 second intervals)
- Responsive design with shadcn/ui components

## Setup

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_NEAR_NETWORK`: Network to connect to (testnet/mainnet)
- `NEXT_PUBLIC_ORACLE_CONTRACT_ID`: Oracle smart contract address

## Running

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production

```bash
npm run build
npm start
```

## Features

### Price Table
- Real-time asset prices
- Source count per asset
- Last update timestamp
- Freshness status (Fresh/Stale)

### Node Status
- Active oracle nodes
- Node health indicators
- Last report timestamp
- Operator information

### System Stats
- Total supported assets
- Active node count
- Fresh price count
- Overall system health percentage

## Technology Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- NEAR RPC for blockchain data
