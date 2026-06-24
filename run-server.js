const { spawn } = require('child_process');
const fs = require('fs');
const log = fs.openSync('/home/z/my-project/dev.log', 'a');

function start() {
  const child = spawn('node', ['.next/standalone/server.js', '-p', '3000', '-H', '0.0.0.0'], {
    stdio: ['ignore', log, log],
    env: { ...process.env, NODE_ENV: 'production' },
    cwd: '/home/z/my-project'
  });
  
  child.on('exit', (code) => {
    fs.writeSync(log, `[${new Date().toISOString()}] Server exited with code ${code}. Restarting...\n`);
    setTimeout(start, 1000);
  });
  
  child.on('error', (err) => {
    fs.writeSync(log, `[${new Date().toISOString()}] Server error: ${err.message}\n`);
    setTimeout(start, 1000);
  });
}

start();

// Keep the parent process alive
setInterval(() => {}, 60000);
