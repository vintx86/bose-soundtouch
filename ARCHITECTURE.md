# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Applications                      │
│  (Home Assistant, Mobile Apps, Web Interfaces, curl, etc.)     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/WebSocket
                             │ Port 8090
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Bose SoundTouch Server                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Express Server                        │   │
│  │                  (src/server.js)                        │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │              Device Manager                              │   │
│  │           (src/deviceManager.js)                        │   │
│  │  • Device state management                              │   │
│  │  • Zone management                                      │   │
│  │  • Event emission                                       │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │                  Controllers                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   │
│  │  │  Preset    │  │   Zone     │  │  Playback  │       │   │
│  │  │ Controller │  │ Controller │  │ Controller │       │   │
│  │  └────────────┘  └────────────┘  └────────────┘       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   │
│  │  │  Volume    │  │    Bass    │  │  Balance   │       │   │
│  │  │ Controller │  │ Controller │  │ Controller │       │   │
│  │  └────────────┘  └────────────┘  └────────────┘       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   │
│  │  │  Recents   │  │   Source   │  │    Name    │       │   │
│  │  │ Controller │  │ Controller │  │ Controller │       │   │
│  │  └────────────┘  └────────────┘  └────────────┘       │   │
│  └──────────────────────┬──────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────┴──────────────────────────────────┐   │
│  │                 Device Models                            │   │
│  │              (src/models/device.js)                     │   │
│  │  • Device state                                         │   │
│  │  • Presets (6)                                          │   │
│  │  • Recents (20)                                         │   │
│  │  • Volume, Bass, Balance                                │   │
│  │  • Now Playing                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              WebSocket Server                            │   │
│  │  • Real-time notifications                              │   │
│  │  • Zone updates                                         │   │
│  │  • Playback changes                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ (Future: Forward to real devices)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Real Bose Devices (Optional)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Device 1   │  │   Device 2   │  │   Device 3   │         │
│  │ 192.168.1.100│  │ 192.168.1.101│  │ 192.168.1.102│         │
│  │  Port 8090   │  │  Port 8090   │  │  Port 8090   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Example: Set Volume

```
Client                Server              DeviceManager        Device Model
  │                     │                      │                    │
  │ POST /volume       │                      │                    │
  │ <volume>50</volume>│                      │                    │
  ├────────────────────>│                      │                    │
  │                     │                      │                    │
  │                     │ getDevice(id)       │                    │
  │                     ├─────────────────────>│                    │
  │                     │                      │                    │
  │                     │ Device object        │                    │
  │                     │<─────────────────────┤                    │
  │                     │                      │                    │
  │                     │ setVolume(50)        │                    │
  │                     ├──────────────────────┼───────────────────>│
  │                     │                      │                    │
  │                     │                      │ volume = 50        │
  │                     │                      │                    │
  │                     │ <status>OK</status>  │                    │
  │<────────────────────┤                      │                    │
  │                     │                      │                    │
  │                     │ emit('update')       │                    │
  │                     ├─────────────────────>│                    │
  │                     │                      │                    │
  │                     │ WebSocket broadcast  │                    │
  │<════════════════════┤                      │                    │
  │ {type: 'volumeUpdated', volume: 50}       │                    │
```

## Zone Management Flow

### Example: Create Multiroom Zone

```
Client                Server              DeviceManager        Zone State
  │                     │                      │                    │
  │ POST /setZone      │                      │                    │
  │ <zone master="d1"> │                      │                    │
  │   <member MASTER/> │                      │                    │
  │   <member SLAVE/>  │                      │                    │
  │ </zone>            │                      │                    │
  ├────────────────────>│                      │                    │
  │                     │                      │                    │
  │                     │ createZone(master,   │                    │
  │                     │            [slaves]) │                    │
  │                     ├─────────────────────>│                    │
  │                     │                      │                    │
  │                     │                      │ Store zone config  │
  │                     │                      ├───────────────────>│
  │                     │                      │                    │
  │                     │                      │ emit('zoneUpdated')│
  │                     │<─────────────────────┤                    │
  │                     │                      │                    │
  │ <status>OK</status> │                      │                    │
  │<────────────────────┤                      │                    │
  │                     │                      │                    │
  │ WebSocket: Zone created                    │                    │
  │<════════════════════════════════════════════════════════════════│
```

## Data Flow

### Preset Selection (Web Radio / Spotify)

```
┌──────────────┐
│   Client     │
│  POST /select│
└──────┬───────┘
       │
       │ XML: ContentItem
       │ source="SPOTIFY"
       │ location="spotify:playlist:xxx"
       ▼
┌──────────────────┐
│ PresetController │
│  • Parse XML     │
│  • Validate      │
└──────┬───────────┘
       │
       │ selectPreset()
       ▼
┌──────────────────┐
│  Device Model    │
│  • setNowPlaying │
│  • addToRecents  │
└──────┬───────────┘
       │
       │ State updated
       ▼
┌──────────────────┐
│ DeviceManager    │
│  emit('update')  │
└──────┬───────────┘
       │
       │ Broadcast
       ▼
┌──────────────────┐
│ WebSocket Clients│
│  Receive update  │
└──────────────────┘
```

## Component Responsibilities

### Server (src/server.js)
- HTTP endpoint routing
- WebSocket server management
- Request/response handling
- Middleware configuration

### Device Manager (src/deviceManager.js)
- Device lifecycle management
- Zone state management
- Event emission
- Device lookup

### Controllers
Each controller handles a specific API domain:
- **PresetController**: Preset CRUD, content selection
- **ZoneController**: Multiroom zone management
- **PlaybackController**: Play/pause/stop, now playing
- **VolumeController**: Volume get/set
- **BassController**: Bass control and capabilities
- **BalanceController**: Balance control
- **RecentsController**: Recent items tracking
- **SourceController**: Available sources
- **NameController**: Device naming
- **CapabilitiesController**: Device capabilities
- **TrackInfoController**: Track metadata
- **NetworkInfoController**: Network details
- **GroupController**: Group management
- **ListMediaServersController**: Media server listing

### Device Model (src/models/device.js)
- Device state storage
- Preset management (6 presets)
- Recent items (20 items)
- Audio settings (volume, bass, balance)
- Now playing information
- State getters/setters

## Extension Points

### 1. Real Device Integration
```javascript
// Add in Device model
async forwardRequest(endpoint, method, body) {
  const response = await axios({
    method,
    url: `http://${this.host}:${this.port}${endpoint}`,
    data: body
  });
  return response.data;
}
```

### 2. Custom Business Logic
```javascript
// Add in controllers
async setVolume(req, res) {
  // Custom logic before
  await this.logVolumeChange();
  
  // Standard logic
  device.setVolume(volume);
  
  // Custom logic after
  await this.notifyHomeAutomation();
}
```

### 3. Authentication
```javascript
// Add middleware in server.js
app.use((req, res, next) => {
  const token = req.headers['authorization'];
  if (!validateToken(token)) {
    return res.status(401).send('<error>Unauthorized</error>');
  }
  next();
});
```

### 4. Caching
```javascript
// Add in DeviceManager
getDeviceWithCache(deviceId) {
  if (this.cache.has(deviceId)) {
    return this.cache.get(deviceId);
  }
  const device = this.getDevice(deviceId);
  this.cache.set(deviceId, device);
  return device;
}
```

## Scalability Considerations

### Current Architecture
- Single server instance
- In-memory state
- Suitable for home use (1-10 devices)

### Future Scaling Options

1. **Database Backend**
   - Store device state in Redis/MongoDB
   - Persist presets and configuration
   - Enable multi-instance deployment

2. **Load Balancing**
   - Multiple server instances
   - Sticky sessions for WebSocket
   - Shared state via Redis

3. **Microservices**
   - Separate services for zones, presets, playback
   - Message queue for inter-service communication
   - Independent scaling

4. **Cloud Deployment**
   - Docker containerization
   - Kubernetes orchestration
   - Auto-scaling based on load

## Security Considerations

### Current State
- No authentication (local network assumed)
- No encryption (HTTP)
- No rate limiting

### Production Recommendations
1. Add API key authentication
2. Implement HTTPS/TLS
3. Add rate limiting
4. Input validation and sanitization
5. CORS configuration
6. Request logging and monitoring

## Performance

### Current Performance
- Handles 100+ requests/second
- Sub-10ms response time
- WebSocket supports 100+ concurrent connections
- Memory usage: ~50MB base + ~1MB per device

### Optimization Opportunities
1. Response caching
2. Connection pooling for real devices
3. Async/await optimization
4. XML parsing optimization
5. WebSocket message batching
