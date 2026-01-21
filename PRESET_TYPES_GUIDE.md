# Preset Types Guide

This guide explains how different preset types (TuneIn, Spotify, Direct URLs, etc.) work with the Bose SoundTouch server.

## Overview

The server supports multiple preset types, each handled differently by the BMX resolution system:

1. **TuneIn Stations** - Require resolution (station ID → stream URL)
2. **Spotify** - Pass through (device handles internally)
3. **Direct Stream URLs** - Pass through (already playable)
4. **Other Sources** - Pass through (device-specific handling)

## How Preset Buttons Work

When a user presses any preset button, the same flow occurs regardless of content type:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User presses Preset Button 1                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Device: GET /device/{deviceId}/presets?presetId=1       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Server returns preset XML (any type)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Device: POST /bmx/resolve with preset content           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Server processes based on source type:                  │
│    • TuneIn: Resolve station ID to stream URL              │
│    • Spotify: Pass through unchanged                        │
│    • Direct URL: Pass through unchanged                     │
│    • Other: Pass through unchanged                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Server returns resolved/original content                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Device plays the content                                │
└─────────────────────────────────────────────────────────────┘
```

## Preset Type Details

### 1. TuneIn Stations (Internet Radio)

**Use Case:** Internet radio stations from TuneIn catalog

**Preset Configuration:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
  <itemName>BBC Radio 1</itemName>
  <stationName>BBC Radio 1</stationName>
  <containerArt>http://cdn-profiles.tunein.com/s24939/images/logoq.png</containerArt>
</ContentItem>
```

**Key Attributes:**
- `source="INTERNET_RADIO"` - Identifies as internet radio
- `stationId="s24939"` - TuneIn station ID (stable identifier)
- `location` - Can be empty or omitted (will be resolved)

**Resolution Process:**
1. Device sends preset to `/bmx/resolve`
2. Server detects `source="INTERNET_RADIO"` and `stationId` starting with "s"
3. Server queries TuneIn API: `https://opml.radiotime.com/Tune.ashx?id=s24939`
4. Server extracts actual stream URL from OPML response
5. Server returns ContentItem with `location` populated
6. Device plays the stream

**Why Resolution?**
- TuneIn station IDs are stable (don't change)
- Actual stream URLs can change (server moves, CDN changes, etc.)
- Resolution ensures you always get the current working URL
- Automatic failover if primary stream is down

**Example Resolution:**

**Input:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
  <itemName>BBC Radio 1</itemName>
</ContentItem>
```

**Output:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one" stationId="s24939">
  <itemName>BBC Radio 1</itemName>
  <stationName>BBC Radio 1</stationName>
  <containerArt>http://cdn-profiles.tunein.com/s24939/images/logoq.png</containerArt>
</ContentItem>
```

---

### 2. Spotify

**Use Case:** Spotify playlists, albums, tracks, artists

**Preset Configuration:**
```xml
<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M" sourceAccount="spotify_user">
  <itemName>Today's Top Hits</itemName>
  <containerArt>https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc</containerArt>
</ContentItem>
```

**Key Attributes:**
- `source="SPOTIFY"` - Identifies as Spotify content
- `type` - Can be "playlist", "album", "track", "artist"
- `location` - Spotify URI (e.g., `spotify:playlist:xxx`)
- `sourceAccount` - Spotify account identifier (optional)

**Resolution Process:**
1. Device sends preset to `/bmx/resolve`
2. Server detects `source="SPOTIFY"`
3. Server returns ContentItem unchanged (pass through)
4. Device handles Spotify authentication and playback internally

**Why Pass Through?**
- Spotify URIs are already in the correct format
- Device has built-in Spotify integration
- Device handles Spotify authentication (OAuth)
- Device manages Spotify streaming internally
- No server-side resolution needed

**Spotify URI Formats:**
- Playlist: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`
- Album: `spotify:album:6DEjYFkNZh67HP7R9PSZvv`
- Track: `spotify:track:3n3Ppam7vgaVa1iaRUc9Lp`
- Artist: `spotify:artist:0OdUWJ0sBjDrqHygGUXeCF`

**Example Resolution:**

**Input & Output (unchanged):**
```xml
<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M" sourceAccount="spotify_user">
  <itemName>Today's Top Hits</itemName>
  <containerArt>https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc</containerArt>
</ContentItem>
```

---

### 3. Direct Stream URLs (Internet Radio)

**Use Case:** Internet radio with known, stable stream URLs

**Preset Configuration:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one">
  <itemName>BBC Radio 1 Direct</itemName>
  <containerArt>http://example.com/art.jpg</containerArt>
</ContentItem>
```

**Key Attributes:**
- `source="INTERNET_RADIO"` - Identifies as internet radio
- `location` - Direct HTTP/HTTPS stream URL
- `stationId` - Omitted (not using TuneIn)

**Resolution Process:**
1. Device sends preset to `/bmx/resolve`
2. Server detects `location` starts with `http://` or `https://`
3. Server returns ContentItem unchanged (pass through)
4. Device plays the stream directly

**Why Pass Through?**
- Stream URL is already playable
- No resolution needed
- Immediate playback

**When to Use:**
- You have a stable stream URL
- Station not available on TuneIn
- Custom/private radio streams
- Local network streams

**Pros:**
- Immediate playback (no resolution delay)
- No dependency on TuneIn API
- Works with any HTTP/HTTPS stream

**Cons:**
- Stream URLs can change (manual update needed)
- No automatic failover
- No metadata from TuneIn

**Example Resolution:**

**Input & Output (unchanged):**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one">
  <itemName>BBC Radio 1 Direct</itemName>
  <containerArt>http://example.com/art.jpg</containerArt>
</ContentItem>
```

---

### 4. Other Sources

**Use Case:** Device-specific sources (Bluetooth, AUX, AirPlay, etc.)

**Preset Configuration:**
```xml
<ContentItem source="BLUETOOTH" type="device">
  <itemName>Bluetooth</itemName>
</ContentItem>
```

**Supported Sources:**
- `BLUETOOTH` - Bluetooth input
- `AUX` - Auxiliary input
- `AIRPLAY` - AirPlay streaming
- `LOCAL_MUSIC` - Music stored on device
- `UPNP` - UPnP/DLNA media servers

**Resolution Process:**
1. Device sends preset to `/bmx/resolve`
2. Server detects non-internet-radio, non-Spotify source
3. Server returns ContentItem unchanged (pass through)
4. Device handles source-specific logic internally

**Why Pass Through?**
- These sources are device-specific
- No external resolution needed
- Device knows how to handle them

---

## Configuring Presets

### Method 1: Using Control API

Store any preset type using the control API:

```bash
# TuneIn Station
curl -X POST "http://localhost:8090/storePreset?deviceId=device1&presetId=1" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
    <itemName>BBC Radio 1</itemName>
  </ContentItem>'

# Spotify Playlist
curl -X POST "http://localhost:8090/storePreset?deviceId=device1&presetId=2" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M">
    <itemName>Today'\''s Top Hits</itemName>
  </ContentItem>'

# Direct Stream URL
curl -X POST "http://localhost:8090/storePreset?deviceId=device1&presetId=3" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.url">
    <itemName>My Radio</itemName>
  </ContentItem>'
```

### Method 2: Direct File Edit

Edit `data/accounts/default/devices/{deviceId}/Presets.xml`:

```xml
<presets>
  <preset id="1" createdOn="1234567890" updatedOn="1234567890">
    <ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
      <itemName>BBC Radio 1</itemName>
    </ContentItem>
  </preset>
  <preset id="2" createdOn="1234567890" updatedOn="1234567890">
    <ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M">
      <itemName>Today's Top Hits</itemName>
    </ContentItem>
  </preset>
  <preset id="3" createdOn="1234567890" updatedOn="1234567890">
    <ContentItem source="INTERNET_RADIO" type="station" location="http://stream.url">
      <itemName>My Radio</itemName>
    </ContentItem>
  </preset>
</presets>
```

---

## Testing Different Preset Types

Run the comprehensive test script:

```bash
./examples/test-preset-button.sh
```

This tests:
1. TuneIn search
2. TuneIn preset storage
3. TuneIn preset button press
4. TuneIn stream resolution
5. Direct station lookup
6. Direct stream URL preset
7. Spotify preset storage
8. Spotify preset resolution (pass through)
9. Getting all presets
10. Getting only TuneIn presets
11. Browsing TuneIn categories

---

## Choosing the Right Preset Type

### Use TuneIn Station ID When:
- ✅ Station is available on TuneIn
- ✅ You want automatic stream URL updates
- ✅ You want failover support
- ✅ You want TuneIn metadata (logo, description)

### Use Direct Stream URL When:
- ✅ Station not available on TuneIn
- ✅ You have a stable, known stream URL
- ✅ You want immediate playback (no resolution)
- ✅ Custom/private streams

### Use Spotify When:
- ✅ Playing Spotify content
- ✅ User has Spotify account linked to device
- ✅ Want Spotify's full feature set

---

## Troubleshooting

### TuneIn Preset Not Playing

1. Check if station ID is valid:
   ```bash
   curl "http://localhost:8090/tunein/station/s24939"
   ```

2. Test resolution manually:
   ```bash
   curl -X POST "http://localhost:8090/bmx/resolve" \
     -H "Content-Type: application/xml" \
     -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
       <itemName>Test</itemName>
     </ContentItem>'
   ```

3. Check server logs for TuneIn API errors

### Spotify Preset Not Playing

1. Verify Spotify URI format is correct
2. Ensure device has Spotify account linked
3. Check if Spotify subscription is active
4. Verify device supports Spotify (not all models do)

### Direct Stream URL Not Playing

1. Test stream URL in browser or media player
2. Verify URL is accessible from device's network
3. Check if stream format is supported (MP3, AAC, OGG, HLS)
4. Ensure URL uses HTTP or HTTPS (not RTSP or other protocols)

---

## Summary

| Preset Type | Resolution | Why | Best For |
|-------------|------------|-----|----------|
| **TuneIn Station** | ✅ Yes | Station ID → Stream URL | Most internet radio |
| **Spotify** | ❌ No (pass through) | Device handles internally | Spotify content |
| **Direct URL** | ❌ No (pass through) | Already playable | Known stable streams |
| **Other Sources** | ❌ No (pass through) | Device-specific | Bluetooth, AUX, etc. |

All preset types use the same button press flow, but the BMX resolution step handles each type appropriately.
