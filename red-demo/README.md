# LAN HUB — Monitor y Chat de Red Local

Hub de red LAN con WebSocket que permite ver todos los dispositivos conectados e interactuar entre ellos en tiempo real.

---

## Instalación rápida

### Requisitos
- Node.js v14 o superior  
- Todos los dispositivos deben estar en la misma red LAN

### Pasos

```bash
# 1. Entra a la carpeta
cd lan-hub

# 2. Instala la dependencia (solo una vez)
npm install

# 3. Inicia el servidor
node server.js
```

El servidor mostrará en consola algo como:

```
==================================================
  LAN HUB - Servidor activo
==================================================
  IP del servidor: 192.168.1.100
  Puerto: 3000

  Los dispositivos deben abrir:
  http://192.168.1.100:3000
==================================================
```

---

## Uso

1. **En la máquina servidora:** ejecuta `node server.js`
2. **En TODOS los demás dispositivos:** abre el navegador y ve a `http://IP-DEL-SERVIDOR:3000`
3. Cada dispositivo elige un nombre y se conecta automáticamente

---

## Funcionalidades

| Feature | Descripción |
|---|---|
| 🟢 Dispositivos en tiempo real | Panel izquierdo muestra todos los conectados con su IP y color único |
| 💬 Chat general | Mensajes visibles para todos en la red |
| 🔒 Mensajes privados | Haz clic en un dispositivo → escribe → solo ese dispositivo lo ve |
| ⚡ Ping | Botón PING en cada dispositivo — envía señal visual instantánea |
| 🔄 Reconexión automática | Si se pierde la conexión, el cliente intenta reconectarse cada 3s |

---

## Ajustes

Edita `server.js` para cambiar:
- **Puerto:** cambia `const PORT = 3000;` al puerto que quieras
- **Colores:** agrega más colores al array `COLORS`

---

## Seguridad

Este servidor está diseñado para **redes LAN internas de confianza**.  
No expongas el puerto 3000 a Internet sin agregar autenticación.
