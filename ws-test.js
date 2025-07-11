const WebSocket = require('ws')

const WS_URL = 'wss://classic-messenger-app-backend-45b0821935c8.herokuapp.com/'
const NUM_CLIENTS = 250

let connected = 0
let failed = 0
let messages = 0

const latencies = []
let minLatency = Infinity
let maxLatency = 0

console.log(`Starting WebSocket test with ${NUM_CLIENTS} clients...`)
console.log(`Target: ${WS_URL}\n`)

function createClient(id) {
  const ws = new WebSocket(WS_URL)

  const messageTimestamps = new Map()

  ws.on('open', () => {
    connected++
    console.log(`Connected: ${connected}/${NUM_CLIENTS}`)

    ws.send(JSON.stringify({ registration: true }))

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const messageId = `${id}-${Date.now()}`
        const timestamp = Date.now()

        messageTimestamps.set(messageId, timestamp)

        ws.send(
          JSON.stringify({
            type: 'test',
            messageId: messageId,
            username: `lmaoxd${id}`,
            message: `Test from client ${id}`,
            timestamp: Date.now(),
          }),
        )
        messages++
      }
    }, 5000)

    setTimeout(() => {
      clearInterval(interval)
      ws.close()
    }, 30000)
  })

  ws.on('error', (err) => {
    failed++
    console.log(`Failed: ${failed} (${err.message})`)
  })

  ws.on('message', (data) => {
    let message = JSON.parse(data)

    if (message.type === 'test_echo' && message.messageId) {
      const sentTime = messageTimestamps.get(message.messageId)
      if (sentTime) {
        const latency = Date.now() - sentTime
        latencies.push(latency)

        if (latency < minLatency) minLatency = latency
        if (latency > maxLatency) maxLatency = latency

        messageTimestamps.delete(message.messageId)

        if (latencies.length % 50 === 0) {
          console.log(`Latency sample: ${latency}ms`)
        }
      }
    }
  })
}

for (let i = 0; i < NUM_CLIENTS; i++) {
  setTimeout(() => createClient(i), i * 100)
}

setTimeout(() => {
  const avgLatency =
    latencies.length > 0
      ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)
      : 'N/A'

  console.log(`
============================
FINAL RESULTS:
============================
Successful connections: ${connected}/${NUM_CLIENTS}
Failed connections: ${failed}
Messages sent: ${messages}
Success rate: ${((connected / NUM_CLIENTS) * 100).toFixed(1)}%

Messages with latency data: ${latencies.length}
Average latency: ${avgLatency}ms
Min latency: ${minLatency === Infinity ? 'N/A' : minLatency}ms
Max latency: ${maxLatency === 0 ? 'N/A' : maxLatency}ms

${connected === NUM_CLIENTS ? 'Perfect! All connections succeeded!' : ''}
${connected >= NUM_CLIENTS * 0.95 ? 'Excellent performance!' : ''}
${connected < NUM_CLIENTS * 0.8 ? ' Some connections failed - check server capacity' : ''}
  `)
  process.exit(0)
}, 80000)
