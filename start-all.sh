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
