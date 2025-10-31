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
