#!/bin/bash
while true; do
  cd /home/z/my-project/.next/standalone
  node server.js -p 3000 >> /home/z/my-project/prod.log 2>&1 &
  SERVER_PID=$!
  # Poll for 30s instead of wait (since SIGKILL doesn't notify parent)
  for i in $(seq 1 30); do
    sleep 1
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "[$(date)] Server died, restarting..." >> /home/z/my-project/prod.log
      break
    fi
  done
  # Kill if still running (to prevent overlap)
  kill $SERVER_PID 2>/dev/null
  sleep 1
done
