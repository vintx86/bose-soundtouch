# TuneIn/BMX Integration Guide

This document explains how the TuneIn internet radio integration works in the Bose SoundTouch server.

## Overview

The BMX server (bmx.bose.com) in the original Bose infrastructure handled TuneIn integration. Our server replicates this functionality, allowing devices to:

- Search for TuneIn radio stations
- Browse TuneIn categories
- Store TuneIn stations as presets
- Resolve TuneIn station IDs to actual stream URLs

## How It Works

### Preset Button Flow

When a user presses a preset button (regardless of content type):

```
1. User presses Preset Button 1
   ↓
2. Device queries: GET /device/{deviceId}/presets?presetId=1
   ↓
3. Server returns preset (TuneIn, Spotify, or other)
   ↓
4. Device calls: POST /bmx/resolve with preset content
   ↓
5a. If TuneIn: Server queries TuneIn API to get stream URL
5b. If Spotify: Server passes through as-is
5c. If other: Server passes through as-is
   ↓
6. Server returns resolved/original content to device
   ↓
7. Device plays the content
```

### TuneIn Station IDs

TuneIn uses station IDs in the format `s{number}` (e.g., `s24939` for BBC Radio 1). These IDs are stable and can be stored in presets.

## API Endpoints

### Search TuneIn

```bash
curl "http://localhost:8090/tunein/search?query=BBC"
```

Returns OPML with matching stations including their station IDs.

### Get Station Details

```bash
curl "http://localhost:8090/tunein/station/s24939"
```

Returns ContentItem XML with stream URL for the station.

### Browse Categories

```bash
curl "http://localhost:8090/tunein/browse?c=music"
```

Categories: `local`, `music`, `talk`, `sports`, `news`, `world`, `podcasts`

### Resolve Stream (Device-Called)

This endpoint handles ALL preset types, not just TuneIn:

**TuneIn Station:**
```bash
curl -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
    <itemName>BBC Radio 1</itemName>
  </ContentItem>'
```

Returns the same ContentItem with `location` attribute populated with actual stream URL.

**Spotify Playlist:**
```bash
curl -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M">
    <itemName>Today'\''s Top Hits</itemName>
  </ContentItem>'
```

Returns the same ContentItem unchanged (Spotify URIs are handled by the device).

**Direct Stream URL:**
```bash
curl -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.url">
    <itemName>My Radio</itemName>
  </ContentItem>'
```

Returns the same ContentItem unchanged (already has stream URL).

## How Different Preset Types Are Handled

The BMX resolve endpoint (`POST /bmx/resolve`) is called by devices for ALL preset types, not just TuneIn. Here's how each type is handled:

### TuneIn Stations (Requires Resolution)

**Preset stored:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
  <itemName>BBC Radio 1</itemName>
</ContentItem>
```

**What happens:**
1. Device calls `/bmx/resolve` with station ID
2. Server queries TuneIn API: `https://opml.radiotime.com/Tune.ashx?id=s24939`
3. Server extracts actual stream URL from OPML response
4. Server returns ContentItem with `location` populated
5. Device plays the stream

**Why:** TuneIn station IDs are stable, but actual stream URLs can change. Resolution ensures you always get the current working URL.

### Spotify (Pass Through)

**Preset stored:**
```xml
<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M">
  <itemName>Today's Top Hits</itemName>
</ContentItem>
```

**What happens:**
1. Device calls `/bmx/resolve` with Spotify URI
2. Server recognizes `source="SPOTIFY"`
3. Server returns ContentItem unchanged
4. Device handles Spotify authentication and playback internally

**Why:** Spotify URIs are already in the correct format. The device has built-in Spotify integration that handles authentication and streaming.

### Direct Stream URLs (Pass Through)

**Preset stored:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one">
  <itemName>BBC Radio 1 Direct</itemName>
</ContentItem>
```

**What happens:**
1. Device calls `/bmx/resolve` with stream URL
2. Server recognizes `location` starts with `http://` or `https://`
3. Server returns ContentItem unchanged
4. Device plays the stream directly

**Why:** Direct URLs are already playable. No resolution needed.

### Other Sources (Pass Through)

Sources like `BLUETOOTH`, `AUX`, `AIRPLAY`, etc. are passed through unchanged. These are handled by the device's internal logic.

## Configuring TuneIn Presets

### Method 1: Using Control API

Store a TuneIn preset using the control API:

```bash
curl -X POST "http://localhost:8090/storePreset?deviceId=YOUR_DEVICE_ID&presetId=1" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
    <itemName>BBC Radio 1</itemName>
    <stationName>BBC Radio 1</stationName>
    <containerArt>http://cdn-profiles.tunein.com/s24939/images/logoq.png</containerArt>
  </ContentItem>'
```

### Method 2: Direct File Edit

Edit `data/accounts/default/devices/{deviceId}/Presets.xml`:

```xml
<presets>
  <preset id="1" createdOn="1234567890" updatedOn="1234567890">
    <ContentItem source="INTERNET_RADIO" type="station" location="" stationId="s24939">
      <itemName>BBC Radio 1</itemName>
      <stationName>BBC Radio 1</stationName>
      <containerArt>http://cdn-profiles.tunein.com/s24939/images/logoq.png</containerArt>
    </ContentItem>
  </preset>
</presets>
```

**Note:** The `location` attribute can be empty - it will be resolved when the preset is played.

## Finding TuneIn Station IDs

### Option 1: Search via API

```bash
curl "http://localhost:8090/tunein/search?query=YOUR_STATION_NAME"
```

Look for `guide_id` or `stationId` in the OPML response.

### Option 2: TuneIn Website

1. Go to https://tunein.com
2. Search for your station
3. Look at the URL: `https://tunein.com/radio/Station-Name-s12345/`
4. The station ID is `s12345`

### Option 3: Browse Categories

```bash
curl "http://localhost:8090/tunein/browse?c=local"
```

Browse by category to discover stations.

## Popular Station IDs

Here are some popular TuneIn station IDs:

- **BBC Radio 1**: `s24939`
- **BBC Radio 2**: `s24940`
- **BBC Radio 4**: `s50419`
- **NPR**: `s44260`
- **KCRW**: `s8772`
- **WNYC**: `s22450`

## TuneIn Authentication (Optional)

For premium TuneIn features, you can authenticate:

### Via Environment Variables

```bash
export TUNEIN_USERNAME="your_username"
export TUNEIN_PASSWORD="your_password"
npm start
```

### Via API

```bash
curl -X POST "http://localhost:8090/bmx/auth" \
  -H "Content-Type: application/xml" \
  -d '<auth>
    <username>your_username</username>
    <password>your_password</password>
  </auth>'
```

## Direct Stream URLs vs TuneIn IDs

You can configure presets with either:

### TuneIn Station ID (Recommended)

```xml
<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
  <itemName>BBC Radio 1</itemName>
</ContentItem>
```

**Pros:**
- Stable - station ID doesn't change
- Server handles stream resolution
- Automatic failover if stream URL changes

**Cons:**
- Requires BMX resolution step
- Depends on TuneIn API availability

### Direct Stream URL

```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one">
  <itemName>BBC Radio 1</itemName>
</ContentItem>
```

**Pros:**
- Plays immediately without resolution
- No dependency on TuneIn

**Cons:**
- Stream URLs can change
- No automatic failover
- Must manually update if URL changes

## Testing

Run the comprehensive test script:

```bash
./examples/test-preset-button.sh
```

This script tests:
1. TuneIn search
2. Storing TuneIn preset
3. Preset button press simulation
4. BMX stream resolution
5. Direct station lookup
6. Direct stream URL preset
7. Spotify preset
8. Getting all presets
9. Getting only TuneIn presets
10. Browsing TuneIn categories

## Troubleshooting

### Preset Button Doesn't Play

1. Check if preset is stored:
   ```bash
   curl "http://localhost:8090/device/YOUR_DEVICE_ID/presets?presetId=1"
   ```

2. Test BMX resolution:
   ```bash
   curl -X POST "http://localhost:8090/bmx/resolve" \
     -H "Content-Type: application/xml" \
     -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="YOUR_STATION_ID">
       <itemName>Test</itemName>
     </ContentItem>'
   ```

3. Check server logs for errors

### TuneIn Search Returns No Results

- Verify internet connectivity
- Try different search terms
- Check if TuneIn API is accessible: `curl https://opml.radiotime.com/Browse.ashx?c=local`

### Stream URL Resolution Fails

- Station ID might be invalid
- TuneIn API might be down
- Try using direct stream URL instead

## Implementation Details

### BMX Controller

The `BMXController` class (`src/controllers/bmxController.js`) handles:

- TuneIn API integration
- OPML parsing
- Stream URL extraction
- Preset filtering
- Authentication

### TuneIn API

The server uses TuneIn's OPML API:

- **Base URL**: `https://opml.radiotime.com`
- **Partner ID**: `Bose`
- **Formats**: `mp3,aac,ogg,hls`

### Endpoints Used

- `/Search.ashx` - Search stations
- `/Tune.ashx` - Get stream URL for station
- `/Browse.ashx` - Browse categories

## Future Enhancements

Potential improvements:

1. **Caching**: Cache TuneIn responses to reduce API calls
2. **Favorites**: Sync TuneIn favorites from user account
3. **Recommendations**: Suggest stations based on listening history
4. **Metadata**: Fetch and display now-playing information
5. **Fallback Streams**: Try alternative streams if primary fails

## Related Documentation

- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [WEBRADIO_PRESET_GUIDE.md](WEBRADIO_PRESET_GUIDE.md) - Web radio preset configuration
- [examples/test-preset-button.sh](examples/test-preset-button.sh) - Test script
