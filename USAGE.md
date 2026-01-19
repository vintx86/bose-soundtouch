# Bose SoundTouch Server - Usage Guide

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure your devices in `config/devices.json`:
```json
{
  "devices": [
    {
      "id": "device1",
      "name": "Living Room Speaker",
      "host": "192.168.1.100",
      "port": 8090
    }
  ]
}
```

3. Start the server:
```bash
npm start
```

4. Test the API:
```bash
./test-api.sh
```

## Key Features

### 1. Web Radio Presets

Configure web radio stations as presets. The server comes with default presets including BBC Radio, Jazz Radio, and Classical Radio.

**Get all presets:**
```bash
curl http://localhost:8090/presets?deviceId=device1
```

**Select a web radio preset:**
```bash
curl -X POST http://localhost:8090/select?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d @examples/preset-webradio.xml
```

**Add custom web radio:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" 
  location="http://your-stream-url.com/radio" 
  isPresetable="true">
  <itemName>My Radio Station</itemName>
  <containerArt>http://example.com/art.jpg</containerArt>
</ContentItem>
```

### 2. Spotify Integration

Play Spotify playlists, albums, and tracks through presets.

**Select Spotify playlist:**
```bash
curl -X POST http://localhost:8090/select?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d @examples/preset-spotify.xml
```

**Spotify URI formats:**
- Playlist: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`
- Album: `spotify:album:6DEjYFkNZh67HP7R9PSZvv`
- Track: `spotify:track:3n3Ppam7vgaVa1iaRUc9Lp`
- Artist: `spotify:artist:0OdUWJ0sBjDrqHygGUXeCF`

### 3. Multiroom (Zones)

Create zones to play synchronized audio across multiple speakers.

**Create a zone:**
```bash
curl -X POST http://localhost:8090/setZone?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d @examples/zone-create.xml
```

**Get zone status:**
```bash
curl http://localhost:8090/getZone?deviceId=device1
```

**Add speaker to existing zone:**
```bash
curl -X POST http://localhost:8090/addZoneSlave?deviceId=device1 \
  -H "Content-Type: application/xml" \
  -d '<zone><member role="SLAVE" ipaddress="192.168.1.102"/></zone>'
```

**Remove zone:**
```bash
curl -X POST http://localhost:8090/removeZone?deviceId=device1
```

## API Endpoints

### Device Information
- `GET /info?deviceId={id}` - Get device info

### Playback Control
- `GET /now_playing?deviceId={id}` - Get current playback status
- `POST /key?deviceId={id}` - Send key press (PLAY, PAUSE, STOP, etc.)

### Volume Control
- `GET /volume?deviceId={id}` - Get current volume
- `POST /volume?deviceId={id}` - Set volume (0-100)

### Presets
- `GET /presets?deviceId={id}` - Get all presets
- `POST /select?deviceId={id}` - Select preset or source

### Sources
- `GET /sources?deviceId={id}` - Get available sources

### Zones (Multiroom)
- `GET /getZone?deviceId={id}` - Get zone configuration
- `POST /setZone?deviceId={id}` - Create/modify zone
- `POST /removeZone?deviceId={id}` - Remove zone
- `POST /addZoneSlave?deviceId={id}` - Add speaker to zone
- `POST /removeZoneSlave?deviceId={id}` - Remove speaker from zone

## WebSocket Notifications

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8090/notifications');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

## Supported Sources

- `INTERNET_RADIO` - Web radio streams
- `SPOTIFY` - Spotify content (requires account)
- `STORED_MUSIC` - Local music library
- `BLUETOOTH` - Bluetooth input
- `AUX` - Auxiliary input

## Examples

See the `examples/` directory for XML request examples:
- `key-play.xml` - Play key press
- `volume-set.xml` - Set volume
- `preset-spotify.xml` - Spotify preset
- `preset-webradio.xml` - Web radio preset
- `zone-create.xml` - Create multiroom zone

## Troubleshooting

**Server won't start:**
- Check if port 8090 is available
- Verify Node.js version (requires v14+)

**Device not found:**
- Ensure device is configured in `config/devices.json`
- Check device IP addresses are correct

**Zone creation fails:**
- Verify all devices are on the same network
- Check IP addresses in zone configuration
- Ensure devices support multiroom

## Integration with Bose Devices

To connect this server to actual Bose SoundTouch devices, you'll need to:

1. Forward API calls to real devices using their IP addresses
2. Implement WebSocket connections to devices for real-time updates
3. Handle authentication if required by your devices

The server currently acts as a mock/proxy that can be extended to communicate with real hardware.
