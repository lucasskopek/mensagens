const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logFd = fs.openSync('/home/z/my-project/dev.log', 'a');

function startServer() {
  const child = spawn('node', 
    [path.join('/home/z/my-project', '.next/standalone/server.js'), '-p', '3000', '-H', '0.0.0.0'], 
    { 
      stdio: ['ignore', logFd, logFd],
      env: { ...process.env, NODE_ENV: 'production' },
      detached: false,
      cwd: '/home/z/my-project'
    }
  );
  
  child.on('exit', (code, signal) => {
    const msg = `[${new Date().toISOString()}] Server died (code=${code}, signal=${signal}). Restarting in 1s...\n`;
    fs.writeSync(logFd, msg);
    setTimeout(startServer, 1000);
  });
  
  child.on('error', (err) => {
    fs.writeSync(logFd, `[${new Date().toISOString()}] Error: ${err.message}\n`);
    setTimeout(startServer, 1000);
  });
}

startServer();

// Keep event loop alive
const keepalive = setInterval(() => {}, 10000);
keepalive.unref();

// Prevent process from exiting
process.on('SIGTERM', () => {
  fs.writeSync(logFd, `[${new Date().toISOString()}] Got SIGTERM, ignoring\n`);
});
process.on('SIGINT', () => {
  fs.writeSync(logFd, `[${new Date().toISOString()}] Got SIGINT, ignoring\n`);
});
