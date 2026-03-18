const { spawn } = require('child_process');
const http = require('http');

const SERVER_URL = 'http://localhost:3000';
const START_TIMEOUT_MS = 15000;

function waitForServer(url, timeout) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', retry);
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        return reject(new Error('Timeout waiting for the server to start.'));
      }
      setTimeout(check, 500);
    };

    check();
  });
}

(async () => {
  console.log('Starting server (smoke test)...');

  const server = spawn('node', ['src/libraryApp.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForServer(SERVER_URL, START_TIMEOUT_MS);
    console.log(`✅ Smoke test passed: ${SERVER_URL} is reachable.`);
  } catch (err) {
    console.error('❌ Smoke test failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.kill();
  }
})();
