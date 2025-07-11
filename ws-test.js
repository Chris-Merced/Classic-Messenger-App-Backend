// ws-test.js - Simple WebSocket Load Test
const WebSocket = require('ws');

// UPDATE THIS WITH YOUR ACTUAL BACKEND URL!
const WS_URL = 'wss://classic-messenger-app-backend-45b0821935c8.herokuapp.com/';
const NUM_CLIENTS = 100; // Start with 100, then try 250, 500, etc.

let connected = 0;
let failed = 0;
let messages = 0;

console.log(`🚀 Starting WebSocket test with ${NUM_CLIENTS} clients...`);
console.log(`📍 Target: ${WS_URL}\n`);

function createClient(id) {
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    connected++;
    console.log(`✅ Connected: ${connected}/${NUM_CLIENTS}`);
    
    // Send registration message like your frontend does
    ws.send(JSON.stringify({ registration: true }));
    
    // Send a test message every 5 seconds
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'test',
          username: 'lmaoxd',
          message: `Test from client ${id}`,
          timestamp: Date.now()
        }));
        messages++;
      }
    }, 5000);
    
    // Keep connection open for 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      ws.close();
    }, 30000);
  });
  
  ws.on('error', (err) => {
    failed++;
    console.log(`❌ Failed: ${failed} (${err.message})`);
  });
  
  ws.on('message', (data) => {
    let message = json.parse(data)
    console.log(message)
  });
}

// Create clients with staggered connections
for (let i = 0; i < NUM_CLIENTS; i++) {
  setTimeout(() => createClient(i), i * 100); // 100ms between each connection
}

// Show final results
setTimeout(() => {
  console.log(`
============================
📊 FINAL RESULTS:
============================
✅ Successful connections: ${connected}/${NUM_CLIENTS}
❌ Failed connections: ${failed}
📨 Messages sent: ${messages}
🎯 Success rate: ${((connected/NUM_CLIENTS)*100).toFixed(1)}%

${connected === NUM_CLIENTS ? '🎉 Perfect! All connections succeeded!' : ''}
${connected >= NUM_CLIENTS * 0.95 ? '✨ Excellent performance!' : ''}
${connected < NUM_CLIENTS * 0.8 ? '⚠️  Some connections failed - check server capacity' : ''}
  `);
  process.exit(0);
}, 40000); // Wait 40 seconds total