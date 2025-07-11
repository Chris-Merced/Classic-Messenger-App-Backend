const WebSocket = require('ws');

const WS_URL = 'wss://classic-messenger-app-backend-45b0821935c8.herokuapp.com/';
const NUM_CLIENTS = 100; 

let connected = 0;
let failed = 0;
let messages = 0;


console.log(`Starting WebSocket test with ${NUM_CLIENTS} clients...`);
console.log(`Target: ${WS_URL}\n`);

function createClient(id) {
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    connected++;
    console.log(`Connected: ${connected}/${NUM_CLIENTS}`);
    
    
    ws.send(JSON.stringify({ registration: true }));
    
    
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'test',
          username:`lmaoxd${id}`,
          message: `Test from client ${id}`,
          timestamp: Date.now()
        }));
        messages++;
        user++
      }
    }, 5000);
    
    
    setTimeout(() => {
      clearInterval(interval);
      ws.close();
    }, 30000);
  });
  
  ws.on('error', (err) => {
    failed++;
    console.log(`Failed: ${failed} (${err.message})`);
  });
  
  ws.on('message', (data) => {
    let message = JSON.parse(data)
    console.log(message)
  });
}

for (let i = 0; i < NUM_CLIENTS; i++) {
  setTimeout(() => createClient(i), i * 100); 
}


setTimeout(() => {
  console.log(`
============================
FINAL RESULTS:
============================
Successful connections: ${connected}/${NUM_CLIENTS}
Failed connections: ${failed}
Messages sent: ${messages}
Success rate: ${((connected/NUM_CLIENTS)*100).toFixed(1)}%

${connected === NUM_CLIENTS ? 'Perfect! All connections succeeded!' : ''}
${connected >= NUM_CLIENTS * 0.95 ? 'Excellent performance!' : ''}
${connected < NUM_CLIENTS * 0.8 ? ' Some connections failed - check server capacity' : ''}
  `);
  process.exit(0);
}, 40000); 