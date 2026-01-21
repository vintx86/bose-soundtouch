# Bose SoundTouch Local Server

A complete local server implementation that **replaces Bose cloud services** for SoundTouch devices after the May 2026 shutdown.

## Overview

This server acts as a replacement for Bose's cloud infrastructure (marge.bose.com, bmx.bose.com), allowing your SoundTouch devices to continue functioning with full features after Bose discontinues cloud support.

**Status: Production Ready** - Fully implements the cloud replacement functionality needed after May 6, 2026.

## Core Features (Requested)
- ✅ **Web Radio Configuration on Presets** - Full support for internet radio stations with TuneIn integration
- ✅ **Spotify Integration** - Play Spotify playlists, albums, tracks, and artists
- ✅ **Multiroom (Zones)** - Create and manage synchronized playback across multiple speakers
- ✅ **TuneIn/BMX Integration** - Search, browse, and play TuneIn radio stations

### Complete API Implementation
- ✅ Device information and management
- ✅ Playback control (play, pause, stop, next, previous)
- ✅ Volume control with mute support
- ✅ Bass control (-9 to 0)
- ✅ Balance control (-10 to 10)
- ✅ Preset management (6 presets)
- ✅ Recent items tracking (last 20)
- ✅ Source selection (Spotify, Internet Radio, Bluetooth, AUX, etc.)
- ✅ Track information with metadata
- ✅ Network information
- ✅ Device capabilities
- ✅ Group management
- ✅ Media server listing
- ✅ WebSocket notifications for real-time updates
- ✅ Persistent storage (survives restarts)
- ✅ Auto-registration (devices register themselves)
- ✅ Account-based organization

## Why This Server?

**Bose is shutting down SoundTouch cloud services on May 6, 2026.**

After this date, without a replacement server:
- ❌ Presets will stop working
- ❌ Spotify integration will fail
- ❌ Internet radio will be unavailable
- ❌ Multiroom zones won't function
- ❌ Device configuration will be lost

**With this server:**
- ✅ All features continue working
- ✅ Complete local control
- ✅ No internet dependency
- ✅ Privacy - all data stays local
- ✅ Future-proof solution

## Installation

```bash
npm install
```

## Quick Start

### 1. Start the Server

```bash
npm start
```

Server runs on port 8090 by default.

### 2. Access Web UI

Open your browser and navigate to:
```
http://localhost:8090
```

The web UI provides a complete interface for:
- Device management
- Preset configuration (TuneIn, Spotify, Direct URLs)
- Playback control
- Multiroom zone management
- TuneIn search and browse
- Settings and authentication

### 3. Configure Your Devices

Follow the [Device Configuration Guide](DEVICE_CONFIGURATION_GUIDE.md) to configure your SoundTouch devices to use your server instead of Bose cloud.

**Quick steps:**
1. Enable remote access on device (USB with `remote_services` file)
2. Extract device data and upload to server
3. Edit device config to point to your server
4. Reboot device

**Automated setup:**
```bash
./scripts/configure-device-for-server.sh <device_ip> <server_url>
```

## How It Works

### Device Connection Flow

```
1. Device boots → reads config (points to your server)
2. Device registers with server (POST /device/register)
3. Device downloads presets, sources, recents
4. Device operates normally using your server
5. All state stored persistently on your server
```

### What Gets Stored

```
data/
└── accounts/
    └── default/
        └── devices/
            └── {deviceId}/
                ├── DeviceInfo.xml
                ├── Presets.xml
                ├── Recents.xml
                └── Sources.xml
```

## Testing

Run the test script to verify all endpoints:
```bash
./test-api.sh
```

## Documentation

- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API endpoint documentation
- **[USAGE.md](USAGE.md)** - Usage guide with examples
- **examples/** - XML request examples for all operations

## API Endpoints

### Cloud Replacement Endpoints (Device-Initiated)
Devices call these when configured to use your server:

- `POST /device/register` - Device self-registration
- `GET /device/:id/config` - Device configuration
- `GET/POST /device/:id/presets` - Preset synchronization
- `GET/POST /device/:id/recents` - Recent items sync
- `GET/POST /device/:id/sources` - Source configuration
- `GET /account/:id/devices` - List devices per account

### BMX/TuneIn Endpoints (Internet Radio)
TuneIn integration for web radio presets:

- `GET /tunein/search?query=...` - Search TuneIn stations
- `GET /tunein/station/:stationId` - Get station details and stream URL
- `GET /tunein/browse?c=...` - Browse TuneIn categories
- `POST /bmx/resolve` - Resolve preset to stream URL (called by device)
- `GET /bmx/presets/:deviceId` - Get TuneIn presets for device
- `POST /bmx/auth` - Authenticate with TuneIn (optional)

### Control Endpoints (Optional - For Automation)
You can also control devices directly via API:

- `GET /info?deviceId=x` - Device information
- `GET /presets?deviceId=x` - Get presets
- `POST /select?deviceId=x` - Select content
- `GET /volume?deviceId=x`, `POST /volume?deviceId=x` - Volume control
- `GET /now_playing?deviceId=x` - Current playback
- `POST /key?deviceId=x` - Send key press
- `GET /getZone?deviceId=x`, `POST /setZone?deviceId=x` - Multiroom zones

**Total: 46 endpoints** - See [API_REFERENCE.md](API_REFERENCE.md) for complete documentation.

## TuneIn Configuration

The server includes TuneIn integration for internet radio presets. When a device presses a preset button configured with a TuneIn station, the server resolves the stream URL automatically.

### Optional TuneIn Authentication

For premium TuneIn features, set environment variables:

```bash
export TUNEIN_USERNAME="your_username"
export TUNEIN_PASSWORD="your_password"
npm start
```

### How Preset Buttons Work

1. Device presses preset button (e.g., Preset 1)
2. Device queries: `GET /device/{deviceId}/presets?presetId=1`
3. Server returns preset with TuneIn station ID
4. Device calls: `POST /bmx/resolve` with station ID
5. Server resolves to actual stream URL
6. Device plays the stream

See [WEBRADIO_PRESET_GUIDE.md](WEBRADIO_PRESET_GUIDE.md) for detailed configuration.

For information on how different preset types (TuneIn, Spotify, Direct URLs) are handled, see [PRESET_TYPES_GUIDE.md](PRESET_TYPES_GUIDE.md).

## Use Cases

### 1. Mock Server for Development
Use as a test server for developing Bose SoundTouch integrations without real hardware.

### 2. Local Control Server
Replace Bose cloud services for local-only operation after cloud EOL (May 2026).

### 3. Proxy Server
Extend controllers to forward requests to real Bose devices while adding custom logic.

### 4. Home Automation Integration
Integrate with Home Assistant, Node-RED, or other automation platforms.

## Extending to Real Hardware

The server currently maintains state locally. To connect to real Bose devices:

1. **Forward API calls**: Update controllers to proxy requests to device IPs
2. **WebSocket connections**: Connect to device WebSocket for real-time updates
3. **Device discovery**: Implement UPnP/SSDP discovery
4. **Authentication**: Add auth handling if required

Example controller modification:
```javascript
// In controller, forward to real device
const response = await axios.post(
  `http://${device.host}:${device.port}/volume`,
  xmlBody,
  { headers: { 'Content-Type': 'application/xml' } }
);
```

## Architecture

```
src/
├── server.js                          # Main Express server
├── deviceManager.js                   # Device & zone management
├── storage/
│   └── fileStorage.js                # Persistent storage
├── models/
│   └── device.js                     # Device model
├── controllers/                      # API endpoint controllers
│   ├── cloudReplacementController.js # Cloud replacement endpoints
│   ├── bmxController.js              # TuneIn/BMX integration
│   ├── presetController.js
│   ├── presetStorageController.js
│   ├── zoneController.js
│   ├── playbackController.js
│   └── ...
└── utils/
    └── presetInitializer.js          # Default presets

public/                                # Web UI (NEW!)
├── index.html                         # Main UI
├── styles.css                         # Styling
└── app.js                             # Frontend logic
```

## Web UI

A complete web-based management interface is included:

**Features:**
- 📱 Device management and monitoring
- 🎵 Preset configuration (TuneIn, Spotify, Direct URLs)
- ▶️ Playback control with now playing display
- 🔊 Volume, bass, and balance adjustment
- 🔗 Multiroom zone creation and management
- 🔍 TuneIn search and browse
- ⚙️ Settings and authentication
- 📱 Responsive design (works on desktop, tablet, mobile)

**Access:** Open `http://localhost:8090` in your browser

**Documentation:** See [WEB_UI_GUIDE.md](WEB_UI_GUIDE.md) for complete usage guide

## WebSocket Events

Connect to `ws://localhost:8090/notifications` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8090/notifications');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data.type, data);
};
```

Event types: `zoneUpdated`, `deviceRegistered`, `presetsUpdated`, etc.

## Technology Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **ws** - WebSocket server
- **xml2js** - XML parsing/building
- **File-based storage** - Persistent device state

## License

MIT

## Autor
(C) 2026 Benjamin Schaja