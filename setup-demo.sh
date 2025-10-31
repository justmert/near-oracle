#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}YK Labs NEAR Price Oracle - Demo Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running from cloned repository (has contract/ directory)
if [ -d "contract" ] && [ -d "oracle-node" ] && [ -d "dashboard" ]; then
    echo -e "${YELLOW}Running from existing project directory${NC}"
    PROJECT_DIR=$(pwd)
else
    # Clone the repository
    echo -e "${YELLOW}Step 1: Cloning repository...${NC}"
    if [ -d "yk-labs-oracle" ]; then
        echo -e "${YELLOW}Directory yk-labs-oracle already exists. Using existing directory.${NC}"
        cd yk-labs-oracle
    else
        git clone https://github.com/justmert/yk-labs-oracle.git
        cd yk-labs-oracle
    fi
    PROJECT_DIR=$(pwd)
fi

echo -e "${GREEN}✓ Project directory: $PROJECT_DIR${NC}"
echo ""

# Step 2: Check dependencies
echo -e "${YELLOW}Step 2: Checking dependencies...${NC}"

command -v node >/dev/null 2>&1 || { echo -e "${RED}✗ Node.js is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}✗ npm is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo -e "${RED}✗ Rust/Cargo is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v near >/dev/null 2>&1 || { echo -e "${RED}✗ NEAR CLI is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v wasm-opt >/dev/null 2>&1 || { echo -e "${RED}✗ wasm-opt (binaryen) is required but not installed. Install with: brew install binaryen${NC}" >&2; exit 1; }
command -v rsync >/dev/null 2>&1 || { echo -e "${RED}✗ rsync is required but not installed. Aborting.${NC}" >&2; exit 1; }

echo -e "${GREEN}✓ All dependencies installed${NC}"
echo ""

# Step 3: Build the smart contract
echo -e "${YELLOW}Step 3: Building smart contract...${NC}"
cd "$PROJECT_DIR"
./scripts/build-contract.sh
CONTRACT_HASH=$(shasum -a 256 out/contract.wasm | awk '{print $1}')
echo -e "${GREEN}✓ Contract built with hash: $CONTRACT_HASH${NC}"
echo ""

# Step 4: Create main contract account
echo -e "${YELLOW}Step 4: Creating main contract account...${NC}"
TIMESTAMP=$(date +%s)
CONTRACT_ACCOUNT="oracle-demo-${TIMESTAMP}.testnet"

echo -e "${YELLOW}Creating account: $CONTRACT_ACCOUNT${NC}"
near account create-account sponsor-by-faucet-service "$CONTRACT_ACCOUNT" autogenerate-new-keypair save-to-legacy-keychain network-config testnet create

# Get the private key
CONTRACT_PRIVATE_KEY=$(cat ~/.near-credentials/testnet/${CONTRACT_ACCOUNT}.json | jq -r '.private_key')
echo -e "${GREEN}✓ Contract account created: $CONTRACT_ACCOUNT${NC}"

# Request additional funds from faucet to ensure enough for node creation
echo -e "${YELLOW}Requesting additional funds from faucet...${NC}"
curl -s -X POST "https://helper.nearprotocol.com/account" \
  -H "Content-Type: application/json" \
  -d "{\"newAccountId\":\"$CONTRACT_ACCOUNT\",\"newAccountPublicKey\":\"$(cat ~/.near-credentials/testnet/${CONTRACT_ACCOUNT}.json | jq -r '.public_key')\"}" || true

echo -e "${GREEN}✓ Additional funding requested${NC}"
echo ""

# Step 5: Deploy contract
echo -e "${YELLOW}Step 5: Deploying contract...${NC}"
near contract deploy "$CONTRACT_ACCOUNT" use-file out/contract.wasm without-init-call network-config testnet sign-with-keychain send

echo -e "${GREEN}✓ Contract deployed${NC}"
echo ""

# Step 6: Initialize contract
echo -e "${YELLOW}Step 6: Initializing contract...${NC}"
near contract call-function as-transaction "$CONTRACT_ACCOUNT" new json-args '{"owner":"'"$CONTRACT_ACCOUNT"'","recency_threshold":300000000000,"min_report_count":2}' prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send

echo -e "${GREEN}✓ Contract initialized${NC}"
echo ""

# Step 7: Add assets
echo -e "${YELLOW}Step 7: Adding assets to contract...${NC}"

near contract call-function as-transaction "$CONTRACT_ACCOUNT" add_asset json-args '{"asset":{"id":"near","symbol":"NEAR","name":"NEAR Protocol","decimals":4,"active":true,"min_sources":2}}' prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send



near contract call-function as-transaction "$CONTRACT_ACCOUNT" add_asset json-args '{"asset":{"id":"bitcoin","symbol":"BTC","name":"Bitcoin","decimals":4,"active":true,"min_sources":2}}' prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send



near contract call-function as-transaction "$CONTRACT_ACCOUNT" add_asset json-args '{"asset":{"id":"ethereum","symbol":"ETH","name":"Ethereum","decimals":4,"active":true,"min_sources":2}}' prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send



near contract call-function as-transaction "$CONTRACT_ACCOUNT" add_asset json-args '{"asset":{"id":"usdc","symbol":"USDC","name":"USD Coin","decimals":4,"active":true,"min_sources":2}}' prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send

echo -e "${GREEN}✓ Assets added${NC}"
echo ""

# Step 8: Approve code hash and attestation
echo -e "${YELLOW}Step 8: Approving code hash and attestation...${NC}"


near contract call-function as-transaction "$CONTRACT_ACCOUNT" approve_code_hash json-args "{\"code_hash\":\"$CONTRACT_HASH\"}" prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send



near contract call-function as-transaction "$CONTRACT_ACCOUNT" approve_attestation json-args "{\"code_hash\":\"$CONTRACT_HASH\",\"mr_enclave\":\"dev_mr_enclave_v1\"}" prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send

echo -e "${GREEN}✓ Code hash and attestation approved${NC}"
echo ""

# Step 9: Create and setup 3 oracle nodes
echo -e "${YELLOW}Step 9: Setting up 3 oracle nodes...${NC}"

for i in 1 2 3; do
    NODE_ACCOUNT="node${i}.$CONTRACT_ACCOUNT"
    echo -e "${YELLOW}Creating node account ${i}/3: $NODE_ACCOUNT${NC}"

    # Create node account as sub-account funded by contract account
    near account create-account fund-myself "$NODE_ACCOUNT" '2 NEAR' autogenerate-new-keypair save-to-legacy-keychain sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send

    # Get node private key
    NODE_PRIVATE_KEY=$(cat ~/.near-credentials/testnet/${NODE_ACCOUNT}.json | jq -r '.private_key')

    # Add node operator
    near contract call-function as-transaction "$CONTRACT_ACCOUNT" add_node_operator json-args "{\"operator_account\":\"$NODE_ACCOUNT\"}" prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$CONTRACT_ACCOUNT" network-config testnet sign-with-keychain send

    # Set node account (operator assigns itself as node)
    near contract call-function as-transaction "$CONTRACT_ACCOUNT" set_node_account json-args "{\"node_account\":\"$NODE_ACCOUNT\"}" prepaid-gas '30.0 Tgas' attached-deposit '0 NEAR' sign-as "$NODE_ACCOUNT" network-config testnet sign-with-keychain send

    # Create oracle node directory
    NODE_DIR="$PROJECT_DIR/oracle-node-${i}"
    if [ ! -d "$NODE_DIR" ]; then
        # Copy oracle-node but exclude node_modules to avoid broken symlinks
        mkdir -p "$NODE_DIR"
        rsync -a --exclude 'node_modules' "$PROJECT_DIR/oracle-node/" "$NODE_DIR/"
    fi

    # Always install dependencies to ensure clean setup
    echo -e "${YELLOW}Installing dependencies for node ${i}...${NC}"
    cd "$NODE_DIR"
    npm install > /dev/null 2>&1

    # Create .env file
    cat > "$NODE_DIR/.env" << EOF
NODE_ACCOUNT_ID=$NODE_ACCOUNT
NODE_PRIVATE_KEY=$NODE_PRIVATE_KEY
ORACLE_CONTRACT_ID=$CONTRACT_ACCOUNT
CODE_HASH=$CONTRACT_HASH
TEE_MR_ENCLAVE=dev_mr_enclave_v1
NEAR_NETWORK=testnet
NEAR_NODE_URL=https://rpc.testnet.fastnear.com
UPDATE_INTERVAL=60000
EOF

    echo -e "${GREEN}✓ Oracle node ${i} configured: $NODE_ACCOUNT${NC}"
done

echo ""

# Step 10: Setup dashboard
echo -e "${YELLOW}Step 10: Setting up dashboard...${NC}"
cd "$PROJECT_DIR/dashboard"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dashboard dependencies...${NC}"
    npm install > /dev/null 2>&1
fi

# Create dashboard .env.local
cat > .env.local << EOF
NEXT_PUBLIC_ORACLE_CONTRACT_ID=$CONTRACT_ACCOUNT
NEXT_PUBLIC_NEAR_NETWORK=testnet
EOF

echo -e "${GREEN}✓ Dashboard configured${NC}"
echo ""

# Step 11: Create startup script
echo -e "${YELLOW}Step 11: Creating startup script...${NC}"

cat > "$PROJECT_DIR/start-all.sh" << 'STARTUP_EOF'
#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting all oracle nodes and dashboard..."

# Start oracle nodes in background
for i in 1 2 3; do
    NODE_DIR="$PROJECT_DIR/oracle-node-${i}"
    if [ -d "$NODE_DIR" ]; then
        echo "Starting oracle node ${i}..."
        cd "$NODE_DIR"
        npm run dev > "../oracle-node-${i}.log" 2>&1 &
        echo $! > "../oracle-node-${i}.pid"
        echo "✓ Oracle node ${i} started (PID: $(cat "../oracle-node-${i}.pid"))"
    fi
done

# Start dashboard
echo "Starting dashboard..."
cd "$PROJECT_DIR/dashboard"
npm run dev > ../dashboard.log 2>&1 &
echo $! > ../dashboard.pid
echo "✓ Dashboard started (PID: $(cat ../dashboard.pid))"

echo ""
echo "========================================"
echo "All services started!"
echo "========================================"
echo ""
echo "Dashboard: http://localhost:3000"
echo ""
echo "Logs:"
echo "  - Dashboard: $PROJECT_DIR/dashboard.log"
echo "  - Oracle Node 1: $PROJECT_DIR/oracle-node-1.log"
echo "  - Oracle Node 2: $PROJECT_DIR/oracle-node-2.log"
echo "  - Oracle Node 3: $PROJECT_DIR/oracle-node-3.log"
echo ""
echo "To stop all services, run: ./stop-all.sh"
STARTUP_EOF

chmod +x "$PROJECT_DIR/start-all.sh"

# Step 12: Create stop script
cat > "$PROJECT_DIR/stop-all.sh" << 'STOP_EOF'
#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping all services..."

# Stop oracle nodes
for i in 1 2 3; do
    PID_FILE="$PROJECT_DIR/oracle-node-${i}.pid"
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            echo "✓ Stopped oracle node ${i} (PID: $PID)"
        fi
        rm "$PID_FILE"
    fi
done

# Stop dashboard
PID_FILE="$PROJECT_DIR/dashboard.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo "✓ Stopped dashboard (PID: $PID)"
    fi
    rm "$PID_FILE"
fi

echo "All services stopped."
STOP_EOF

chmod +x "$PROJECT_DIR/stop-all.sh"

echo -e "${GREEN}✓ Startup scripts created${NC}"
echo ""

# Save configuration
cat > "$PROJECT_DIR/deployment-info.txt" << EOF
YK Labs NEAR Price Oracle - Deployment Information
===================================================

Contract Account: $CONTRACT_ACCOUNT
Contract Hash: $CONTRACT_HASH

Oracle Nodes:
EOF

for i in 1 2 3; do
    NODE_ACCOUNT="node${i}.$CONTRACT_ACCOUNT"
    echo "  - Node ${i}: $NODE_ACCOUNT" >> "$PROJECT_DIR/deployment-info.txt"
done

cat >> "$PROJECT_DIR/deployment-info.txt" << EOF

Network: testnet
RPC: https://rpc.testnet.fastnear.com

To start all services: ./start-all.sh
To stop all services: ./stop-all.sh

Dashboard: http://localhost:3000
Contract Explorer: https://explorer.testnet.near.org/accounts/$CONTRACT_ACCOUNT
EOF

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
cat "$PROJECT_DIR/deployment-info.txt"
echo ""
echo -e "${YELLOW}To start all services now, run:${NC}"
echo -e "${GREEN}./start-all.sh${NC}"
echo ""
