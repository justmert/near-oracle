#!/bin/bash
set -e

echo "Building NEAR smart contract..."

cd contract

# Build contract with Rust 1.86 (toolchain pinned in rust-toolchain.toml)
cargo build --target wasm32-unknown-unknown --release

# Create output directory
mkdir -p ../out

# Run wasm-opt for nearcore compatibility (fixes Rust 1.87+ WASM features issue)
wasm-opt -Oz --signext-lowering \
  target/wasm32-unknown-unknown/release/tee_oracle_contract.wasm \
  -o ../out/contract.wasm

# Calculate hash
HASH=$(shasum -a 256 ../out/contract.wasm | awk '{print $1}')

echo ""
echo "✅ Contract built successfully!"
echo "📦 Location: out/contract.wasm"
echo "🔒 SHA-256: $HASH"
echo ""
echo "Use this hash for CODE_HASH in oracle node configuration"
