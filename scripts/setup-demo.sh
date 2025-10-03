#!/bin/bash
set -e

# This script sets up a complete demo environment with sample assets

CONTRACT_ACCOUNT="${CONTRACT_ACCOUNT:-oracle.testnet}"
OWNER_ACCOUNT="${OWNER_ACCOUNT:-$CONTRACT_ACCOUNT}"
CODE_HASH="${CODE_HASH:-demo_hash_12345}"
TEE_MR_ENCLAVE="${TEE_MR_ENCLAVE:-dev_mr_enclave}"

echo "Setting up demo environment..."
echo ""

# Add sample assets
echo "📝 Adding sample assets..."

near call $CONTRACT_ACCOUNT add_asset '{
  "asset": {
    "id": "near",
    "symbol": "NEAR",
    "name": "NEAR Protocol",
    "decimals": 4,
    "active": true,
    "min_sources": 5
  }
}' --accountId $OWNER_ACCOUNT

near call $CONTRACT_ACCOUNT add_asset '{
  "asset": {
    "id": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "decimals": 2,
    "active": true,
    "min_sources": 5
  }
}' --accountId $OWNER_ACCOUNT

near call $CONTRACT_ACCOUNT add_asset '{
  "asset": {
    "id": "ethereum",
    "symbol": "ETH",
    "name": "Ethereum",
    "decimals": 2,
    "active": true,
    "min_sources": 5
  }
}' --accountId $OWNER_ACCOUNT

near call $CONTRACT_ACCOUNT add_asset '{
  "asset": {
    "id": "usdc",
    "symbol": "USDC",
    "name": "USD Coin",
    "decimals": 4,
    "active": true,
    "min_sources": 5
  }
}' --accountId $OWNER_ACCOUNT

# Approve code hash
echo "🔒 Approving code hash..."
near call $CONTRACT_ACCOUNT approve_code_hash '{
  "code_hash": "'$CODE_HASH'"
}' --accountId $OWNER_ACCOUNT
near call $CONTRACT_ACCOUNT approve_attestation '{
  "code_hash": "'$CODE_HASH'",
  "mr_enclave": "'${TEE_MR_ENCLAVE:-dev_mr_enclave}'"
}' --accountId $OWNER_ACCOUNT

# Whitelist operator (if provided)
if [ ! -z "$OPERATOR_ACCOUNT" ]; then
    echo "👤 Whitelisting operator: $OPERATOR_ACCOUNT..."
    near call $CONTRACT_ACCOUNT add_node_operator '{
      "operator_account": "'$OPERATOR_ACCOUNT'"
    }' --accountId $OWNER_ACCOUNT
fi

echo ""
echo "✅ Demo setup complete!"
echo ""
echo "Assets added: NEAR, BTC, ETH, USDC"
echo "Code hash approved: $CODE_HASH"
echo ""
echo "To set node account (from operator account):"
echo "near call $CONTRACT_ACCOUNT set_node_account '{\"node_account\": \"node.testnet\"}' --accountId \$OPERATOR_ACCOUNT"
echo ""
echo "To register node (from node account):"
echo "near call $CONTRACT_ACCOUNT register_node '{\"code_hash\": \"$CODE_HASH\", \"attestation\": {\"mr_enclave\": \"${TEE_MR_ENCLAVE:-dev_mr_enclave}\", \"issued_at\": \"${ATTESTATION_ISSUED_AT_NS:-<nanoseconds>}\"}}' --accountId \$NODE_ACCOUNT"
