# TEE-Secured Price Oracle for NEAR Protocol

A hardware-secured price oracle system using Trusted Execution Environments (TEEs) to provide reliable price feeds for NEAR Protocol DeFi applications.

**Version**: 1.0.0
**License**: Apache 2.0
**Networks**: NEAR Testnet & Mainnet

## Overview

This oracle system consists of three components:

1. **Smart Contract** (Rust) - Manages price aggregation, node authorization, and governance
2. **Oracle Nodes** (TypeScript) - Fetch prices from multiple APIs and report to blockchain
3. **Dashboard** (Next.js) - Real-time monitoring interface

The system uses TEE attestation for security instead of crypto-economic incentives, and provides a Pyth-compatible interface for easy integration.

This MVP does not represent RFP compliance. Some features are simplified for demonstration purposes. If we proceed to implement the full RFP, we will not proceed with this MVP codebase, as we will build a new codebase from scratch to meet all requirements.


## Implementation

Please refer to [implementation](IMPLEMENTATION.md) for detailed technical architecture.

## Quick Start

### Prerequisites

- Rust 1.86.0
- Node.js 20+
- NEAR CLI
- wasm-opt (from binaryen)
- rsync

### Automated Setup (Recommended)

Run the automated setup script to deploy and configure everything:

```bash
./setup-demo.sh
```

This script will:
1. Build the smart contract
2. Create and deploy contract account on testnet
3. Initialize contract with configuration
4. Add 4 assets (NEAR, BTC, ETH, USDC)
5. Approve code hash and TEE attestation
6. Create 3 oracle node accounts
7. Setup oracle node directories with dependencies
8. Configure dashboard

After completion, start all services:

```bash
./start-all.sh
```

Stop all services:

```bash
./stop-all.sh
```

### Manual Setup

If you prefer manual setup or need to customize:

**Build Contract:**
```bash
./scripts/build-contract.sh
```

**Deploy to Testnet:**
```bash
near deploy <your-account.testnet> out/contract.wasm
near call <your-account.testnet> new '{"owner":"<your-account.testnet>","recency_threshold":"300000000000","min_report_count":2}' --accountId <your-account.testnet>
```

**Run Oracle Node:**
```bash
cd oracle-node
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

**Run Dashboard:**
```bash
cd dashboard
npm install
cp .env.example .env.local
# Edit .env.local with contract ID
npm run dev
```

Visit http://localhost:3000

## Usage

### Query Price (JavaScript)

```javascript
import { connect } from 'near-api-js';

const near = await connect(config);
const account = await near.account('your-app.near');

const price = await account.viewFunction({
  contractId: 'oracle.testnet',
  methodName: 'get_price',
  args: { asset_id: 'near' }
});

console.log(`Price: $${price.price.multiplier / Math.pow(10, price.price.decimals)}`);
```

### Query Price (Pyth-compatible)

```javascript
const pythPrice = await account.viewFunction({
  contractId: 'oracle.testnet',
  methodName: 'get_price_no_older_than',
  args: {
    asset_id: 'near',
    max_age: '300000000000'  // 5 minutes in nanoseconds
  }
});
```

### Smart Contract Integration (Rust)

```rust
use near_sdk::{ext_contract, near_bindgen, Promise};

#[ext_contract(ext_oracle)]
pub trait Oracle {
    fn get_price(&self, asset_id: String) -> Option<PriceData>;
}

#[near_bindgen]
impl MyContract {
    pub fn get_oracle_price(&self) -> Promise {
        ext_oracle::get_price(
            "near".to_string(),
            "oracle.testnet".parse().unwrap(),
            0,
            5_000_000_000_000
        )
    }
}
```

## Configuration

### Contract

```bash
near call oracle.testnet update_config '{
  "recency_threshold": "300000000000",  // 5 minutes (nanoseconds)
  "min_report_count": 2
}' --accountId oracle.testnet
```

### Oracle Node (.env)

```env
NODE_ACCOUNT_ID=node1.testnet
NODE_PRIVATE_KEY=ed25519:...
ORACLE_CONTRACT_ID=oracle.testnet
CODE_HASH=<build-hash>
TEE_MR_ENCLAVE=<enclave-measurement>
NEAR_NETWORK=testnet
UPDATE_INTERVAL=60000
```

### Adding New Assets

1. Update `oracle-node/src/config.ts` with new asset and 5+ API sources
2. Build and get new code hash: `npm run build && shasum -a 256 dist/index.js`
3. Approve code hash: `near call oracle.testnet approve_code_hash '{"code_hash":"<hash>"}'`
4. Add asset to contract: `near call oracle.testnet add_asset '{"asset":{...}}'`

## API Reference

### View Methods

```rust
get_price(asset_id: String) -> Option<PriceData>
get_price_data() -> Vec<PriceData>
get_price_no_older_than(asset_id: String, max_age: u64) -> Option<PythPrice>
get_price_unsafe(asset_id: String) -> Option<PythPrice>
get_assets() -> Vec<Asset>
is_authorized(account_id: AccountId) -> bool
```

### Admin Methods

```rust
add_asset(asset: Asset)
add_node_operator(operator_account: AccountId)
approve_code_hash(code_hash: String)
approve_attestation(code_hash: String, mr_enclave: String)
pause()
resume()
```

### Node Registration Flow

1. Owner whitelists operator: `add_node_operator()`
2. Operator sets node account: `set_node_account()`
3. Node registers with attestation: `register_node()`
4. Node reports prices: `report_price()`

## Testing

### Contract Tests

```bash
cd contract
cargo test
```

All 12 tests should pass, covering initialization, node registration, price reporting, aggregation, staleness, and governance.

### Oracle Node Tests

```bash
cd oracle-node
npm test
```

Tests median calculation and JSONPath extraction.

## Governance

### Setup Governance

```bash
near call oracle.testnet configure_admin_role '{
  "proposers": ["operator1.testnet"],
  "voters": ["operator1.testnet", "operator2.testnet"],
  "timelock_delay": "86400000000000",
  "quorum_bps": 5000
}' --accountId oracle.testnet
```

### Proposal Workflow

1. Propose: `near call oracle.testnet propose_action '{"action":{...}}'`
2. Approve: `near call oracle.testnet approve_proposal '{"proposal_id":1}'`
3. Execute: `near call oracle.testnet execute_proposal '{"proposal_id":1}'`

## Monitoring

### Dashboard

The dashboard displays:
- Current asset prices with freshness indicators
- Number of sources per asset
- Node status (online/offline, last report time)
- System health metrics

### Health Checks

```bash
near view oracle.testnet is_authorized '{"account_id":"node1.testnet"}'
near view oracle.testnet get_node_details '{"account_id":"node1.testnet"}'
near view oracle.testnet get_authorized_nodes
```


## Acknowledgments

Built for NEAR Infrastructure Committee RFP, based on NearDeFi price oracle and Shade Agent Framework.

## License

Apache License 2.0
