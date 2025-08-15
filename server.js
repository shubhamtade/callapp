// server.js
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = 8080;
const server = http.createServer();
const wss = new WebSocketServer({ server });

// We will map client IDs (e.g., phone numbers) to their WebSocket connections
const clients = new Map();

console.log(`🚀 Signaling server is starting on port ${PORT}...`);

wss.on("connection", (ws) => {
  let clientId = null; // Will be set on the first message

  ws.on("message", (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (e) {
      console.error("Invalid JSON received:", message.toString());
      return;
    }

    // 1. Handle the initial connection message to register the client
    if (parsedMessage.client_id && !clientId) {
      clientId = parsedMessage.client_id;
      clients.set(clientId, ws);
      console.log(`✅ Client registered: ${clientId}`);
      return;
    }

    // 2. Handle signaling messages by forwarding them to the target client
    const { to, from, ...data } = parsedMessage;
    if (to) {
      const targetClientWs = clients.get(to);
      if (targetClientWs && targetClientWs.readyState === WebSocket.OPEN) {
        console.log(`➡️  Forwarding message from ${from} to ${to}`);
        // Add the 'from' field so the recipient knows who sent it
        targetClientWs.send(JSON.stringify({ from, ...data }));
      } else {
        console.warn(`⚠️  Client ${to} not found or not connected.`);
      }
    }
  });

  ws.on("close", () => {
    if (clientId) {
      console.log(`❌ Client disconnected: ${clientId}`);
      clients.delete(clientId);
    }
  });

  ws.on("error", (error) => console.error("WebSocket error:", error));
});

server.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
