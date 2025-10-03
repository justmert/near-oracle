#!/bin/bash
set -e

# Configuration
NETWORK="testnet"
CONTRACT_ACCOUNT="${CONTRACT_ACCOUNT:-oracle.testnet}"
OWNER_ACCOUNT="${OWNER_ACCOUNT:-$CONTRACT_ACCOUNT}"

echo "Deploying to NEAR $NETWORK..."
echo "Contract Account: $CONTRACT_ACCOUNT"
echo "Owner Account: $OWNER_ACCOUNT"
echo ""

# Check if contract is built
if [ ! -f "out/contract.wasm" ]; then
    echo "❌ Contract not built. Run ./scripts/build-contract.sh first"
    exit 1
fi

# Deploy contract
echo "📤 Deploying contract..."
near deploy --accountId $CONTRACT_ACCOUNT --wasmFile out/contract.wasm

# Initialize contract
echo "🔧 Initializing contract..."
near call $CONTRACT_ACCOUNT new '{
  "owner": "'$OWNER_ACCOUNT'",
  "recency_threshold": 300000000000,
  "min_report_count": 1
}' --accountId $OWNER_ACCOUNT

echo ""
echo "✅ Contract deployed and initialized!"
echo ""
echo "Next steps:"
echo "1. Add assets: near call $CONTRACT_ACCOUNT add_asset '{...}' --accountId $OWNER_ACCOUNT"
echo "2. Whitelist operators: near call $CONTRACT_ACCOUNT add_node_operator '{...}' --accountId $OWNER_ACCOUNT"
echo "3. Approve code hash: near call $CONTRACT_ACCOUNT approve_code_hash '{...}' --accountId $OWNER_ACCOUNT"