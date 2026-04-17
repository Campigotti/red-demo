const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;

// Obtener la IP local del servidor
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const SERVER_IP = getLocalIP();

// Servidor HTTP para servir el cliente
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'client.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading client');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Servidor WebSocket
const wss = new WebSocket.Server({ server });

// Mapa de clientes conectados
const clients = new Map(); // id -> { ws, name, ip, color, joinedAt, status }
let nextId = 1;

// Colores para los dispositivos
const COLORS = [
  '#00f5d4', '#fee440', '#f15bb5', '#9b5de5', '#00bbf9',
  '#fb5607', '#8338ec', '#3a86ff', '#06d6a0', '#ef233c'
];

function getColorForClient(id) {
  return COLORS[(id - 1) % COLORS.length];
}

function broadcast(message, excludeId = null) {
  const data = JSON.stringify(message);
  clients.forEach((client, id) => {
    if (id !== excludeId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function broadcastAll(message) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function getClientList() {
  return Array.from(clients.entries()).map(([id, c]) => ({
    id,
    name: c.name,
    ip: c.ip,
    color: c.color,
    joinedAt: c.joinedAt,
    status: c.status
  }));
}

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress.replace('::ffff:', '');
  const clientId = nextId++;
  const color = getColorForClient(clientId);

  // Registrar cliente temporal
  clients.set(clientId, {
    ws,
    name: `Dispositivo-${clientId}`,
    ip: clientIP,
    color,
    joinedAt: Date.now(),
    status: 'online'
  });

  console.log(`[+] Nuevo cliente #${clientId} desde ${clientIP}`);

  // Enviar bienvenida al cliente
  ws.send(JSON.stringify({
    type: 'welcome',
    id: clientId,
    color,
    serverIP: SERVER_IP,
    clients: getClientList()
  }));

  // Notificar a todos del nuevo cliente
  broadcast({
    type: 'client_joined',
    client: { id: clientId, name: clients.get(clientId).name, ip: clientIP, color, joinedAt: Date.now(), status: 'online' }
  }, clientId);

  // Manejar mensajes
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const client = clients.get(clientId);
    if (!client) return;

    switch (msg.type) {

      case 'set_name':
        client.name = msg.name.substring(0, 24) || `Dispositivo-${clientId}`;
        broadcastAll({
          type: 'client_updated',
          client: { id: clientId, name: client.name, ip: client.ip, color: client.color, status: client.status }
        });
        break;

      case 'chat':
        if (!msg.text || msg.text.trim() === '') return;
        broadcastAll({
          type: 'chat',
          from: clientId,
          fromName: client.name,
          fromColor: client.color,
          text: msg.text.substring(0, 500),
          timestamp: Date.now(),
          target: msg.target || null // null = broadcast, id = privado
        });
        break;

      case 'ping_device':
        const target = clients.get(msg.targetId);
        if (target && target.ws.readyState === WebSocket.OPEN) {
          target.ws.send(JSON.stringify({
            type: 'ping_received',
            from: clientId,
            fromName: client.name,
            fromColor: client.color
          }));
          ws.send(JSON.stringify({
            type: 'ping_sent',
            targetId: msg.targetId,
            targetName: target.name
          }));
        }
        break;

      case 'status_update':
        client.status = msg.status || 'online';
        broadcastAll({
          type: 'client_updated',
          client: { id: clientId, name: client.name, ip: client.ip, color: client.color, status: client.status }
        });
        break;
    }
  });

  ws.on('close', () => {
    const client = clients.get(clientId);
    if (client) {
      console.log(`[-] Cliente #${clientId} (${client.name}) desconectado`);
      clients.delete(clientId);
      broadcast({
        type: 'client_left',
        id: clientId,
        name: client.name
      });
    }
  });

  ws.on('error', (err) => {
    console.error(`Error cliente #${clientId}:`, err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  LAN HUB - Servidor activo`);
  console.log(`${'='.repeat(50)}`);
  console.log(`  IP del servidor: ${SERVER_IP}`);
  console.log(`  Puerto: ${PORT}`);
  console.log(`\n  Los dispositivos deben abrir:`);
  console.log(`  http://${SERVER_IP}:${PORT}`);
  console.log(`${'='.repeat(50)}\n`);
});
