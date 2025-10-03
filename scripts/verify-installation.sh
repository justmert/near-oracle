#!/bin/bash

echo "========================================="
echo "TEE Oracle Installation Verification"
echo "========================================="
echo ""

ERRORS=0

# Check directory structure
echo "✓ Checking directory structure..."
REQUIRED_DIRS=("contract" "oracle-node" "dashboard" "scripts")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "  ✗ Missing directory: $dir"
        ERRORS=$((ERRORS + 1))
    else
        echo "  ✓ Found: $dir"
    fi
done
echo ""

# Check contract files
echo "✓ Checking smart contract..."
if [ -f "contract/src/lib.rs" ]; then
    echo "  ✓ Contract source exists"
    if [ -f "contract/Cargo.toml" ]; then
        echo "  ✓ Cargo.toml exists"
    else
        echo "  ✗ Cargo.toml missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  ✗ Contract source missing"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check oracle node files
echo "✓ Checking oracle node..."
NODE_FILES=("src/index.ts" "src/config.ts" "src/priceFetcher.ts" "src/nearIntegration.ts" "package.json" "tsconfig.json")
cd oracle-node 2>/dev/null || { echo "  ✗ Cannot enter oracle-node directory"; ERRORS=$((ERRORS + 1)); cd ..; }
for file in "${NODE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ Found: $file"
    else
        echo "  ✗ Missing: $file"
        ERRORS=$((ERRORS + 1))
    fi
done
cd ..
echo ""

# Check dashboard files
echo "✓ Checking dashboard..."
DASH_FILES=("app/page.tsx" "components/price-table.tsx" "components/node-status.tsx" "lib/near.ts" "package.json")
cd dashboard 2>/dev/null || { echo "  ✗ Cannot enter dashboard directory"; ERRORS=$((ERRORS + 1)); cd ..; }
for file in "${DASH_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ Found: $file"
    else
        echo "  ✗ Missing: $file"
        ERRORS=$((ERRORS + 1))
    fi
done
cd ..
echo ""

# Check documentation
echo "✓ Checking documentation..."
DOC_FILES=("README.md" "TESTING.md" "plan.md" "IMPLEMENTATION_SUMMARY.md")
for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ Found: $file"
    else
        echo "  ✗ Missing: $file"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check scripts
echo "✓ Checking deployment scripts..."
SCRIPT_FILES=("build-contract.sh" "deploy-testnet.sh" "setup-demo.sh")
for file in "${SCRIPT_FILES[@]}"; do
    if [ -f "scripts/$file" ]; then
        if [ -x "scripts/$file" ]; then
            echo "  ✓ Found and executable: $file"
        else
            echo "  ⚠ Found but not executable: $file"
            echo "    Run: chmod +x scripts/$file"
        fi
    else
        echo "  ✗ Missing: $file"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check for contract build
echo "✓ Checking contract build status..."
if [ -f "contract/target/wasm32-unknown-unknown/release/tee_oracle_contract.wasm" ]; then
    echo "  ✓ Contract WASM exists"
    SIZE=$(du -h "contract/target/wasm32-unknown-unknown/release/tee_oracle_contract.wasm" | cut -f1)
    echo "  ℹ Contract size: $SIZE"
else
    echo "  ⚠ Contract not built yet"
    echo "    Run: ./scripts/build-contract.sh"
fi
echo ""

# Check for dependencies
echo "✓ Checking system dependencies..."

# Check Rust
if command -v cargo &> /dev/null; then
    RUST_VERSION=$(cargo --version)
    echo "  ✓ Rust: $RUST_VERSION"
else
    echo "  ✗ Rust not found"
    echo "    Install from: https://rustup.rs"
    ERRORS=$((ERRORS + 1))
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✓ Node.js: $NODE_VERSION"
else
    echo "  ✗ Node.js not found"
    echo "    Install from: https://nodejs.org"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "  ✓ npm: $NPM_VERSION"
else
    echo "  ✗ npm not found"
    ERRORS=$((ERRORS + 1))
fi

# Check NEAR CLI
if command -v near &> /dev/null; then
    NEAR_VERSION=$(near --version)
    echo "  ✓ NEAR CLI: $NEAR_VERSION"
else
    echo "  ⚠ NEAR CLI not found (optional for local testing)"
    echo "    Install: npm install -g near-cli"
fi

echo ""
echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed!"
    echo ""
    echo "Next steps:"
    echo "1. Build contract: ./scripts/build-contract.sh"
    echo "2. Install dependencies:"
    echo "   cd oracle-node && npm install && cd .."
    echo "   cd dashboard && npm install && cd .."
    echo "3. See TESTING.md for full deployment guide"
else
    echo "❌ Found $ERRORS error(s)"
    echo ""
    echo "Please fix the errors above before proceeding."
fi
echo "========================================="