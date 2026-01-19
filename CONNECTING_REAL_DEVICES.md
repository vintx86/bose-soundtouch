# Connecting to Real Bose SoundTouch Devices

This guide explains how to extend the server to communicate with actual Bose SoundTouch hardware.

## Current Architecture

The server currently operates as a **mock/standalone server** that maintains state locally. This is useful for:
- Development and testing
- Understanding the API
- Building integrations without hardware

## Goal: Real Device Integration

Transform the server into a **proxy/gateway** that:
1. Receives API calls from clients
2. Forwards requests to real Bose devices
3. Returns actual device responses
4. Monitors device state via WebSocket
5. Provides unified control of multiple devices

## Implementation Steps

### Step 1: Install HTTP Client

Already included in `package.json`:
```json
"axios": "^1.6.0"
```

### Step 2: Update Device Model

Add methods to communicate with real devices:

```javascript
// src/models/device.js

import axios from 'axios';

export class Device {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.host = config.host;
    this.port = config.port || 8090;
    this.baseUrl = `http://${this.host}:${this.port}`;
    // ... rest of constructor
  }

  async forwardRequest(endpoint, method = 'GET', body = null) {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: { 'Content-Type': 'application/xml' }
      };
      
      if (body) {
        config.data = body;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Error forwarding to ${this.host}:`, error.message);
      throw error;
    }
  }
}
```

### Step 3: Update Controllers to Forward Requests

Example for VolumeController:

```javascript
// src/controllers/volumeController.js

export class VolumeController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
    this.useRealDevices = process.env.USE_REAL_DEVICES === 'true';
  }

  async getVolume(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    try {
      if (this.useRealDevices) {
        // Forward to real device
        const response = await device.forwardRequest('/volume', 'GET');
        res.set('Content-Type', 'application/xml');
        res.send(response);
      } else {
        // Use mock data
        const volume = device.getVolume();
        const builder = new Builder({ rootName: 'volume' });
        const data = {
          targetvolume: volume,
          actualvolume: volume,
          muteenabled: 'false'
        };
        res.set('Content-Type', 'application/xml');
        res.send(builder.buildObject(data));
      }
    } catch (error) {
      res.status(500).send('<error>Device communication failed</error>');
    }
  }

  async setVolume(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    try {
      if (this.useRealDevices) {
        // Forward to real device
        const response = await device.forwardRequest('/volume', 'POST', req.body);
        res.set('Content-Type', 'application/xml');
        res.send(response);
      } else {
        // Use mock behavior
        const xml = await parseStringPromise(req.body);
        const volume = parseInt(xml.volume?._ || xml.volume || '30', 10);
        device.setVolume(volume);
        res.set('Content-Type', 'application/xml');
        res.send('<status>OK</status>');
      }
    } catch (error) {
      res.status(500).send('<error>Device communication failed</error>');
    }
  }
}
```

### Step 4: Connect to Device WebSocket

Monitor real-time updates from devices:

```javascript
// src/deviceManager.js

import WebSocket from 'ws';

export class DeviceManager extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.zones = new Map();
    this.deviceWebSockets = new Map();
  }

  connectToDevice(device) {
    const wsUrl = `ws://${device.host}:8080/`;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log(`Connected to device ${device.name} WebSocket`);
    });

    ws.on('message', (data) => {
      console.log(`Update from ${device.name}:`, data.toString());
      
      // Parse and forward to clients
      this.emit('update', {
        type: 'deviceUpdate',
        deviceId: device.id,
        data: data.toString()
      });
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${device.name}:`, error.message);
    });

    ws.on('close', () => {
      console.log(`Disconnected from ${device.name}, reconnecting...`);
      setTimeout(() => this.connectToDevice(device), 5000);
    });

    this.deviceWebSockets.set(device.id, ws);
  }

  loadDevices() {
    // ... existing code ...
    
    if (process.env.USE_REAL_DEVICES === 'true') {
      this.devices.forEach(device => {
        this.connectToDevice(device);
      });
    }
  }
}
```

### Step 5: Add Device Discovery (Optional)

Automatically find Bose devices on the network:

```javascript
// src/utils/deviceDiscovery.js

import { Client } from 'node-ssdp';

export class DeviceDiscovery {
  constructor() {
    this.client = new Client();
  }

  async discover() {
    return new Promise((resolve) => {
      const devices = [];

      this.client.on('response', (headers, statusCode, rinfo) => {
        if (headers.ST && headers.ST.includes('SoundTouch')) {
          devices.push({
            host: rinfo.address,
            location: headers.LOCATION,
            usn: headers.USN
          });
        }
      });

      // Search for Bose SoundTouch devices
      this.client.search('urn:schemas-upnp-org:device:MediaRenderer:1');

      setTimeout(() => {
        this.client.stop();
        resolve(devices);
      }, 5000);
    });
  }
}

// Usage in deviceManager.js
import { DeviceDiscovery } from './utils/deviceDiscovery.js';

async discoverDevices() {
  const discovery = new DeviceDiscovery();
  const foundDevices = await discovery.discover();
  
  foundDevices.forEach(device => {
    console.log('Found device:', device.host);
    // Add to devices map
  });
}
```

### Step 6: Environment Configuration

Create `.env` file:

```bash
# .env
USE_REAL_DEVICES=true
PORT=8090
AUTO_DISCOVER=false
```

Update `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "xml2js": "^0.6.2",
    "axios": "^1.6.0",
    "ws": "^8.16.0",
    "dotenv": "^16.3.1",
    "node-ssdp": "^4.0.1"
  }
}
```

Load environment in server:

```javascript
// src/server.js
import dotenv from 'dotenv';
dotenv.config();

// ... rest of server code
```

## Configuration Examples

### Mock Mode (Current)
```json
// config/devices.json
{
  "devices": [
    {
      "id": "device1",
      "name": "Living Room",
      "host": "192.168.1.100",
      "port": 8090
    }
  ]
}
```

```bash
# .env
USE_REAL_DEVICES=false
```

### Real Device Mode
```json
// config/devices.json
{
  "devices": [
    {
      "id": "living-room-soundtouch",
      "name": "Living Room Speaker",
      "host": "192.168.1.100",
      "port": 8090
    },
    {
      "id": "bedroom-soundtouch",
      "name": "Bedroom Speaker",
      "host": "192.168.1.101",
      "port": 8090
    }
  ]
}
```

```bash
# .env
USE_REAL_DEVICES=true
AUTO_DISCOVER=true
```

## Testing Real Device Connection

1. **Find your Bose device IP:**
```bash
# Check your router's DHCP leases or use network scanner
nmap -p 8090 192.168.1.0/24
```

2. **Test direct connection:**
```bash
curl http://192.168.1.100:8090/info
```

3. **Update config with real IP:**
```json
{
  "devices": [
    {
      "id": "my-bose",
      "name": "My Bose Speaker",
      "host": "192.168.1.100",
      "port": 8090
    }
  ]
}
```

4. **Enable real device mode:**
```bash
echo "USE_REAL_DEVICES=true" > .env
```

5. **Start server:**
```bash
npm start
```

6. **Test through proxy:**
```bash
curl http://localhost:8090/info?deviceId=my-bose
```

## Hybrid Mode

You can mix mock and real devices:

```javascript
// src/models/device.js

export class Device {
  constructor(config) {
    // ...
    this.isMock = config.mock || false;
  }

  async forwardRequest(endpoint, method, body) {
    if (this.isMock) {
      throw new Error('Mock device - no forwarding');
    }
    // ... forward to real device
  }
}
```

```json
// config/devices.json
{
  "devices": [
    {
      "id": "real-device",
      "name": "Real Speaker",
      "host": "192.168.1.100",
      "port": 8090,
      "mock": false
    },
    {
      "id": "mock-device",
      "name": "Test Speaker",
      "host": "192.168.1.200",
      "port": 8090,
      "mock": true
    }
  ]
}
```

## Benefits of Proxy Architecture

1. **Unified API** - Single endpoint for multiple devices
2. **Enhanced Features** - Add custom logic, logging, analytics
3. **Caching** - Cache responses to reduce device load
4. **Security** - Add authentication, rate limiting
5. **Compatibility** - Handle API version differences
6. **Monitoring** - Track device health and usage
7. **Automation** - Trigger actions based on device state

## Troubleshooting

### Device Not Responding
- Check device is powered on
- Verify IP address is correct
- Ensure device is on same network
- Check firewall rules (port 8090)

### WebSocket Connection Failed
- Bose devices use port 8080 for WebSocket
- Some devices may not support WebSocket
- Check device firmware version

### Zone Creation Fails
- Ensure all devices are on same network
- Verify devices support multiroom
- Check device firmware compatibility

## Next Steps

1. Implement forwarding in one controller (e.g., VolumeController)
2. Test with real device
3. Extend to other controllers
4. Add WebSocket monitoring
5. Implement device discovery
6. Add error handling and retry logic
7. Create health check endpoint

## Resources

- Bose SoundTouch Web API PDF (official specification)
- Device WebSocket typically on port 8080
- UPnP/SSDP for device discovery
- mDNS service name: `_soundtouch._tcp`
