#!/bin/bash
cd /home/z/my-project
while true; do
    echo "[$(date '+%H:%M:%S')] Starting server..." >> /home/z/my-project/dev.log
    NODE_ENV=production node .next/standalone/server.js -p 3000 -H 0.0.0.0 >> /home/z/my-project/dev.log 2>&1
    EXIT_CODE=$?
    echo "[$(date '+%H:%M:%S')] Exited with code $EXIT_CODE. Restarting in 2s..." >> /home/z/my-project/dev.log
    sleep 2
done
