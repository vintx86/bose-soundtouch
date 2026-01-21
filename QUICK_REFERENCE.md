# Quick Reference Card

## Purpose

This server **replaces Bose cloud services** after the May 6, 2026 shutdown, keeping your SoundTouch devices fully functional.

## Installation & Setup

```bash
# Install dependencies
npm install

# Start server
npm start

# Access Web UI
# Open browser: http://localhost:8090

# Configure devices (see DEVICE_CONFIGURATION_GUIDE.md)
./scripts/configure-device-for-server.sh <device_ip> <server_url>
```

## Web UI

**Quick Access:** `http://localhost:8090`

**Features:**
- 📱 Device management
- 🎵 Preset configuration (TuneIn, Spotify, Direct URLs)
- ▶️ Playback control
- 🔊 Volume, bass, balance adjustment
- 🔗 Multiroom zones
- 🔍 TuneIn search
- ⚙️ Settings

**Documentation:** [WEB_UI_GUIDE.md](WEB_UI_GUIDE.md) | [WEB_UI_QUICKSTART.md](WEB_UI_QUICKSTART.md)

## Configuration

Edit `config/devices.json`:
```json
{
  "devices": [
    {"id": "device1", "name": "Living Room", "host": "192.168.1.100", "port": 8090}
  ]
}
```

## Common API Calls

### Get Device Info
```bash
curl http://localhost:8090/info?deviceId=device1
```

### Get Presets
```bash
curl http://localhost:8090/presets?deviceId=device1
```

### Play Web Radio
```bash
curl -X POST http://localhost:8090/select?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" location="http://stream-url.com"><itemName>My Radio</itemName></ContentItem>'
```

### Play Spotify
```bash
curl -X POST http://localhost:8090/select?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:xxx"><itemName>My Playlist</itemName></ContentItem>'
```

### Set Volume
```bash
curl -X POST http://localhost:8090/volume?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d '<volume>50</volume>'
```

### Create Zone (Multiroom)
```bash
curl -X POST http://localhost:8090/setZone?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d '<zone master="device1"><member role="MASTER" ipaddress="192.168.1.100"/><member role="SLAVE" ipaddress="192.168.1.101"/></zone>'
```

### Send Key Press
```bash
curl -X POST http://localhost:8090/key?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d '<key state="press" sender="Remote">PLAY</key>'
```

## Spotify URI Formats

- Playlist: `spotify:playlist:37i9dQZF1DX4WYpdgoIcn6`
- Album: `spotify:album:6DEjYFkNZh67HP7R9PSZvv`
- Track: `spotify:track:3n3Ppam7vgaVa1iaRUc9Lp`
- Artist: `spotify:artist:0OdUWJ0sBjDrqHygGUXeCF`

## Key Press Values

- `PLAY`, `PAUSE`, `PLAY_PAUSE`, `STOP`
- `PREV_TRACK`, `NEXT_TRACK`
- `VOLUME_UP`, `VOLUME_DOWN`, `MUTE`
- `PRESET_1` through `PRESET_6`
- `POWER`, `SHUFFLE_ON`, `REPEAT_ALL`

## WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8090/notifications');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data.type);
};
```

## All Endpoints

### Cloud Replacement API (9 endpoints) - ESSENTIAL
Devices call these when configured to use your server

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/device/register` | POST | Device registration |
| `/device/:id/config` | GET | Device config |
| `/device/:id/presets` | GET/POST | Preset sync |
| `/device/:id/recents` | GET/POST | Recents sync |
| `/device/:id/sources` | GET/POST | Sources sync |
| `/account/:id/devices` | GET | List devices |

### BMX/TuneIn API (6 endpoints) - ESSENTIAL FOR WEB RADIO
TuneIn integration for internet radio presets

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tunein/search` | GET | Search TuneIn stations |
| `/tunein/station/:id` | GET | Get station details |
| `/tunein/browse` | GET | Browse categories |
| `/bmx/resolve` | POST | Resolve stream URL |
| `/bmx/presets/:deviceId` | GET | Get TuneIn presets |
| `/bmx/auth` | POST | TuneIn auth (optional) |

### Control API (31 endpoints) - OPTIONAL BONUS
For automation and scripting (query with `?deviceId={id}`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/info` | GET | Device info |
| `/name` | GET/POST | Device name |
| `/capabilities` | GET | Capabilities |
| `/networkInfo` | GET | Network info |
| `/presets` | GET | All presets |
| `/select` | POST | Select content |
| `/recents` | GET | Recent items |
| `/sources` | GET | Available sources |
| `/now_playing` | GET | Current playback |
| `/trackInfo` | GET | Track details |
| `/key` | POST | Key press |
| `/volume` | GET/POST | Volume control |
| `/bass` | GET/POST | Bass control |
| `/bassCapabilities` | GET | Bass range |
| `/balance` | GET/POST | Balance control |
| `/getZone` | GET | Zone status |
| `/setZone` | POST | Create zone |
| `/addZoneSlave` | POST | Add to zone |
| `/removeZoneSlave` | POST | Remove from zone |
| `/removeZone` | POST | Dissolve zone |
| `/getGroup` | GET | Group info |
| `/setGroup` | POST | Set group |
| `/listMediaServers` | GET | Media servers |

**Total: 46 endpoints (9 essential + 6 TuneIn + 31 optional)**

## TuneIn Integration

### Search TuneIn
```bash
curl http://localhost:8090/tunein/search?query=BBC
```

### Get Station Details
```bash
curl http://localhost:8090/tunein/station/s24939
```

### Store TuneIn Preset
```bash
curl -X POST http://localhost:8090/storePreset?deviceId=device1&presetId=1 \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
    <itemName>BBC Radio 1</itemName>
  </ContentItem>'
```

### Resolve Stream URL
```bash
curl -X POST http://localhost:8090/bmx/resolve \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
    <itemName>BBC Radio 1</itemName>
  </ContentItem>'
```

### Popular TuneIn Station IDs
- BBC Radio 1: `s24939`
- BBC Radio 2: `s24940`
- BBC Radio 4: `s50419`
- NPR: `s44260`

## After Bose Shutdown (May 6, 2026)

### What Stops Working Without This Server
- ❌ Presets
- ❌ Spotify
- ❌ Internet Radio
- ❌ Multiroom zones
- ❌ Device configuration

### What Works With This Server
- ✅ All presets
- ✅ Spotify integration
- ✅ Internet radio
- ✅ Multiroom zones
- ✅ Full device functionality

## Default Presets

1. BBC Radio 1 (Internet Radio)
2. Chill Vibes (Spotify)
3. Jazz Radio (Internet Radio)
4. Discover Weekly (Spotify)
5. Classical Radio (Internet Radio)
6. Rock Classics (Spotify)

## Audio Ranges

- Volume: 0-100
- Bass: -9 to 0
- Balance: -10 (left) to 10 (right)

## Port Information

- HTTP API: 8090 (default)
- WebSocket: 8090/notifications
- Real Bose devices: 8090 (HTTP), 8080 (WebSocket)

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :8090

# Use different port
PORT=8091 npm start
```

### Device not found
- Check `config/devices.json`
- Verify deviceId in query parameter
- Ensure devices are loaded (check console)

### XML parsing error
- Verify XML is well-formed
- Check Content-Type header is `application/xml`
- Validate against examples in `examples/` directory

## File Locations

- **Server**: `src/server.js`
- **Config**: `config/devices.json`
- **Controllers**: `src/controllers/`
- **Examples**: `examples/`
- **Tests**: `test-api.sh`

## Documentation

- **README.md** - Overview
- **API_REFERENCE.md** - Complete API docs
- **USAGE.md** - Usage guide
- **TUNEIN_INTEGRATION.md** - TuneIn/BMX integration guide
- **IMPLEMENTATION_STATUS.md** - Feature checklist
- **CONNECTING_REAL_DEVICES.md** - Hardware integration
- **ARCHITECTURE.md** - System architecture
- **PROJECT_SUMMARY.md** - Project overview

## Support

Check documentation files for detailed information on:
- Complete API reference
- Hardware integration
- Architecture details
- Implementation status
