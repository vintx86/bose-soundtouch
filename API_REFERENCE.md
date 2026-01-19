# Bose SoundTouch Web API - Complete Reference

This server implements the complete Bose SoundTouch Web API specification.

## Base URL
```
http://localhost:8090
```

## API Overview

This server provides **two sets of APIs**:

### 1. Cloud Replacement API (9 endpoints) - PRIMARY
For devices to connect TO the server (replaces Bose cloud). Devices call these endpoints when configured to use your server.

### 2. Control API (31 endpoints) - SECONDARY/OPTIONAL
For controlling devices from external clients (automation, scripts). These are bonus features for advanced use cases.

**After Bose cloud shutdown (May 2026), only the Cloud Replacement API is essential for device operation.**

---

# Cloud Replacement API Endpoints (9) - ESSENTIAL

These endpoints are called BY Bose devices when configured to use our server instead of Bose cloud.

## Device Registration

### POST /device/register
Device registers itself with the server on boot.

**Headers:**
- `X-Account-ID` - Account identifier (optional, defaults to "default")

**Request Body:**
```xml
<info deviceID="A0B1C2D3E4F5">
  <name>Living Room Speaker</name>
  <type>SoundTouch 10</type>
  <networkInfo>...</networkInfo>
</info>
```

**Response:**
```xml
<status>OK</status>
```

### GET /device/:deviceId/config
Device requests its configuration from server.

**Headers:**
- `X-Account-ID` - Account identifier

**Response:**
```xml
<info deviceID="A0B1C2D3E4F5">
  <name>Living Room Speaker</name>
  ...
</info>
```

---

## Preset Synchronization

### POST /device/:deviceId/presets
Device uploads its current presets to server for storage.

### GET /device/:deviceId/presets
Device downloads its presets from server.

---

## Recents Synchronization

### POST /device/:deviceId/recents
Device uploads recently played items.

### GET /device/:deviceId/recents
Device downloads recent items.

---

## Sources Synchronization

### POST /device/:deviceId/sources
Device uploads its available sources.

### GET /device/:deviceId/sources
Device downloads source configuration.

---

## Account Management

### GET /account/:accountId/devices
List all devices for an account.

---

# Control API Endpoints (31) - OPTIONAL

These endpoints allow you to control devices from scripts, automation systems, or custom applications. They are bonus features on top of the essential cloud replacement functionality.

All endpoints accept a `?deviceId={id}` query parameter to target a specific device.

---

## Complete Endpoint List

### Device Information

#### GET /info
Get device information including name, type, and network details.

**Response:**
```xml
<info deviceID="device1">
  <name>Living Room Speaker</name>
  <type>SoundTouch</type>
  <networkInfo>
    <ipAddress>192.168.1.100</ipAddress>
    <macAddress>00:00:00:00:00:00</macAddress>
  </networkInfo>
</info>
```

#### GET /name
Get device name.

#### POST /name
Set device name.

**Request:**
```xml
<name>My Speaker</name>
```

#### GET /capabilities
Get device capabilities (network config, Bluetooth profiles).

#### GET /networkInfo
Get detailed network information (IP, MAC, SSID, signal strength).

---

### Playback Control

#### GET /now_playing
Get current playback status and content information.

**Response:**
```xml
<nowPlaying source="SPOTIFY" sourceAccount="user">
  <ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:xxx">
    <itemName>Chill Vibes</itemName>
    <containerArt>https://...</containerArt>
  </ContentItem>
  <track>Song Name</track>
  <artist>Artist Name</artist>
  <album>Album Name</album>
  <playStatus>PLAY_STATE</playStatus>
</nowPlaying>
```

#### GET /trackInfo
Get detailed track information including duration, position, IDs.

#### POST /key
Send key press to device.

**Request:**
```xml
<key state="press" sender="Gabbo">PLAY</key>
```

**Supported Keys:**
- PLAY
- PAUSE
- PLAY_PAUSE
- STOP
- PREV_TRACK
- NEXT_TRACK
- THUMBS_UP
- THUMBS_DOWN
- BOOKMARK
- POWER
- MUTE
- VOLUME_UP
- VOLUME_DOWN
- PRESET_1 through PRESET_6
- AUX_INPUT
- SHUFFLE_OFF
- SHUFFLE_ON
- REPEAT_OFF
- REPEAT_ONE
- REPEAT_ALL

---

### Volume & Audio Control

#### GET /volume
Get current volume level.

**Response:**
```xml
<volume>
  <targetvolume>50</targetvolume>
  <actualvolume>50</actualvolume>
  <muteenabled>false</muteenabled>
</volume>
```

#### POST /volume
Set volume level (0-100).

**Request:**
```xml
<volume>50</volume>
```

#### GET /bass
Get bass level.

#### POST /bass
Set bass level (-9 to 0).

**Request:**
```xml
<bass>-3</bass>
```

#### GET /bassCapabilities
Get supported bass range.

#### GET /balance
Get balance level.

#### POST /balance
Set balance level (-10 to 10, negative=left, positive=right).

**Request:**
```xml
<balance>0</balance>
```

---

### Presets

#### GET /presets
Get all configured presets (up to 6).

**Response:**
```xml
<presets>
  <preset id="1" createdOn="..." updatedOn="...">
    <ContentItem source="INTERNET_RADIO" type="station" location="http://...">
      <itemName>BBC Radio 1</itemName>
      <containerArt>https://...</containerArt>
    </ContentItem>
  </preset>
  <preset id="2" createdOn="..." updatedOn="...">
    <ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:...">
      <itemName>Chill Vibes</itemName>
      <containerArt>https://...</containerArt>
    </ContentItem>
  </preset>
</presets>
```

#### POST /select
Select and play a preset or content item.

**Request (by preset ID):**
```xml
<ContentItem source="INTERNET_RADIO" presetId="1">
  <itemName>BBC Radio 1</itemName>
</ContentItem>
```

**Request (direct source):**
```xml
<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:xxx" sourceAccount="user">
  <itemName>My Playlist</itemName>
  <containerArt>https://...</containerArt>
</ContentItem>
```

#### POST /storePreset
Store a content item to a preset slot (1-6).

**Query Parameters:**
- `deviceId` - Target device
- `presetId` - Preset slot (1-6)

**Request:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.example.com/radio">
  <itemName>My Radio Station</itemName>
  <containerArt>http://example.com/logo.png</containerArt>
</ContentItem>
```

#### POST /removePreset
Remove a preset from a slot.

**Query Parameters:**
- `deviceId` - Target device
- `presetId` - Preset slot to remove

#### POST /removeAllPresets
Clear all presets from a device.

**Query Parameters:**
- `deviceId` - Target device
<ContentItem source="INTERNET_RADIO" presetId="1">
  <itemName>BBC Radio 1</itemName>
</ContentItem>
```

**Request (direct source):**
```xml
<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:xxx" sourceAccount="user">
  <itemName>My Playlist</itemName>
  <containerArt>https://...</containerArt>
</ContentItem>
```

---

### Recents

#### GET /recents
Get recently played content (last 20 items).

**Response:**
```xml
<recents>
  <recent deviceID="device1" utcTime="1234567890">
    <ContentItem source="SPOTIFY" type="track" location="spotify:track:xxx">
      <itemName>Song Name</itemName>
      <containerArt>https://...</containerArt>
    </ContentItem>
  </recent>
</recents>
```

---

### Sources

#### GET /sources
Get available input sources.

**Response:**
```xml
<sources>
  <sourceItem source="INTERNET_RADIO" status="READY" isLocal="false" multiroomallowed="true">
    INTERNET_RADIO
  </sourceItem>
  <sourceItem source="SPOTIFY" sourceAccount="user" status="READY" isLocal="false" multiroomallowed="true">
    SPOTIFY
  </sourceItem>
  <sourceItem source="BLUETOOTH" status="READY" isLocal="true" multiroomallowed="false">
    BLUETOOTH
  </sourceItem>
  <sourceItem source="AUX" status="READY" isLocal="true" multiroomallowed="false">
    AUX
  </sourceItem>
</sources>
```

**Supported Sources:**
- INTERNET_RADIO - Web radio streams
- SPOTIFY - Spotify content
- STORED_MUSIC - Local music library / DLNA
- BLUETOOTH - Bluetooth input
- AUX - Auxiliary input
- AIRPLAY - Apple AirPlay
- DEEZER - Deezer streaming
- IHEART - iHeartRadio
- PANDORA - Pandora
- SIRIUSXM - SiriusXM

---

### Multiroom (Zones)

#### GET /getZone
Get current zone configuration.

**Response (no zone):**
```xml
<zone>
  <member role="NORMAL"/>
</zone>
```

**Response (with zone):**
```xml
<zone master="device1">
  <member role="MASTER" ipaddress="192.168.1.100"/>
  <member role="SLAVE" ipaddress="192.168.1.101"/>
</zone>
```

#### POST /setZone
Create or modify a zone.

**Request:**
```xml
<zone master="device1">
  <member role="MASTER" ipaddress="192.168.1.100"/>
  <member role="SLAVE" ipaddress="192.168.1.101"/>
  <member role="SLAVE" ipaddress="192.168.1.102"/>
</zone>
```

#### POST /addZoneSlave
Add a speaker to existing zone.

**Request:**
```xml
<zone>
  <member role="SLAVE" ipaddress="192.168.1.102"/>
</zone>
```

#### POST /removeZoneSlave
Remove a speaker from zone.

**Request:**
```xml
<zone>
  <member role="SLAVE" ipaddress="192.168.1.102"/>
</zone>
```

#### POST /removeZone
Dissolve the zone completely.

---

### Groups

#### GET /getGroup
Get group configuration.

#### POST /setGroup
Set group configuration.

---

### Media Servers

#### GET /listMediaServers
List available DLNA/UPnP media servers.

---

## WebSocket Notifications

Connect to `ws://localhost:8090/notifications` for real-time updates.

**Event Types:**
- `nowPlayingUpdated` - Playback status changed
- `volumeUpdated` - Volume changed
- `presetsUpdated` - Presets modified
- `zoneUpdated` - Zone configuration changed
- `zoneRemoved` - Zone dissolved
- `recentsUpdated` - Recent list updated

**Example:**
```javascript
const ws = new WebSocket('ws://localhost:8090/notifications');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type);
};
```

---

## Content Item Sources

### Internet Radio
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream-url.com/radio">
  <itemName>Station Name</itemName>
  <containerArt>http://art-url.com/image.jpg</containerArt>
</ContentItem>
```

### Spotify
```xml
<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DX..." sourceAccount="user">
  <itemName>Playlist Name</itemName>
  <containerArt>https://i.scdn.co/image/...</containerArt>
</ContentItem>
```

**Spotify URI Formats:**
- Playlist: `spotify:playlist:{id}`
- Album: `spotify:album:{id}`
- Track: `spotify:track:{id}`
- Artist: `spotify:artist:{id}`

### Local Music (DLNA/UPnP)
```xml
<ContentItem source="STORED_MUSIC" type="album" location="upnp://server/path">
  <itemName>Album Name</itemName>
</ContentItem>
```

---

## Play Status Values

- `PLAY_STATE` - Currently playing
- `PAUSE_STATE` - Paused
- `STOP_STATE` - Stopped
- `BUFFERING_STATE` - Buffering content

---

## Implementation Notes

This server provides **two operating modes**:

### Mode 1: Controller Mode (Control API)
- **31 endpoints** for controlling devices
- Server acts as API client
- No device configuration needed
- Perfect for automation and scripting

### Mode 2: Cloud Replacement Mode (Cloud API)
- **9 endpoints** for cloud replacement
- Devices connect TO server
- Replaces Bose cloud services
- Requires device configuration

**Total: 40 endpoints + WebSocket**

---

# Cloud Replacement API Endpoints (9)

These endpoints are called BY Bose devices when configured to use our server instead of Bose cloud.

## Device Registration

### POST /device/register
Device registers itself with the server on boot.

**Headers:**
- `X-Account-ID` - Account identifier (optional, defaults to "default")

**Request Body:**
```xml
<info deviceID="A0B1C2D3E4F5">
  <name>Living Room Speaker</name>
  <type>SoundTouch 10</type>
  <networkInfo>...</networkInfo>
</info>
```

**Response:**
```xml
<status>OK</status>
```

### GET /device/:deviceId/config
Device requests its configuration from server.

**Headers:**
- `X-Account-ID` - Account identifier

**Response:**
```xml
<info deviceID="A0B1C2D3E4F5">
  <name>Living Room Speaker</name>
  ...
</info>
```

---

## Preset Synchronization

### POST /device/:deviceId/presets
Device uploads its current presets to server for storage.

**Headers:**
- `X-Account-ID` - Account identifier

**Request Body:**
```xml
<presets>
  <preset id="1" createdOn="..." updatedOn="...">
    <ContentItem source="INTERNET_RADIO" type="station" location="...">
      <itemName>BBC Radio 1</itemName>
    </ContentItem>
  </preset>
</presets>
```

**Response:**
```xml
<status>OK</status>
```

### GET /device/:deviceId/presets
Device downloads its presets from server.

**Headers:**
- `X-Account-ID` - Account identifier

**Response:**
```xml
<presets>
  <preset id="1">...</preset>
  <preset id="2">...</preset>
</presets>
```

---

## Recents Synchronization

### POST /device/:deviceId/recents
Device uploads recently played items.

### GET /device/:deviceId/recents
Device downloads recent items.

---

## Sources Synchronization

### POST /device/:deviceId/sources
Device uploads its available sources.

### GET /device/:deviceId/sources
Device downloads source configuration.

---

## Account Management

### GET /account/:accountId/devices
List all devices for an account.

**Response:**
```json
{
  "accountId": "default",
  "devices": [
    {
      "id": "A0B1C2D3E4F5",
      "info": "..."
    }
  ]
}
```

---

## Configuring Devices for Cloud Replacement

To configure a Bose device to use this server:

1. Enable remote access (USB with `remote_services` file)
2. Connect via telnet to device
3. Edit `/opt/Bose/etc/SoundTouchSdkPrivateCfg.xml`
4. Change server URLs to point to your server
5. Reboot device

See `DEVICE_CONFIGURATION_GUIDE.md` for detailed instructions.

---

## Storage Structure

Cloud replacement mode stores data persistently:

```
data/
└── accounts/
    └── {accountId}/
        └── devices/
            └── {deviceId}/
                ├── DeviceInfo.xml
                ├── Presets.xml
                ├── Recents.xml
                └── Sources.xml
```

---

## Key Features Implemented

### Controller Mode:
✅ Complete API endpoint coverage (31 endpoints)
✅ Web Radio preset configuration
✅ Spotify integration
✅ Multiroom zone management
✅ Volume, bass, and balance control
✅ Playback control
✅ Recent items tracking
✅ WebSocket notifications
✅ Multiple device support

### Cloud Replacement Mode:
✅ Device auto-registration (9 endpoints)
✅ Persistent filesystem storage
✅ Account-based organization
✅ Soundcork-compatible storage format
✅ State synchronization
✅ Works after Bose cloud shutdown (May 2026)
