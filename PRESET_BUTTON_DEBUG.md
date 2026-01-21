# Preset Button Debugging Guide

## Issue

Device 08DF1F0EBF49 is configured to use our server, but pressing preset button 1 (Energy Zürich - TuneIn station) doesn't work.

## Expected Flow

When a device presses a preset button, this should happen:

### 1. Device Queries Preset
```
Device → Server: GET /device/08DF1F0EBF49/presets?presetId=1
Server → Device: Returns preset XML
```

**Expected Response:**
```xml
<presets>
  <preset id="1">
    <ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
      <itemName>Energy Zürich</itemName>
      <containerArt>http://cdn-profiles.tunein.com/s47530/images/logog.jpg</containerArt>
    </ContentItem>
  </preset>
</presets>
```

### 2. Device Resolves Stream URL
```
Device → BMX Server: POST /bmx/resolve
Body: <ContentItem source="TUNEIN" location="/v1/playback/station/s47530">...</ContentItem>

BMX Server → TuneIn API: GET https://opml.radiotime.com/Tune.ashx?id=s47530
TuneIn API → BMX Server: Returns OPML with stream URL

BMX Server → Device: Returns resolved ContentItem with stream URL
```

**Expected Response:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.url/radio.mp3" stationId="s47530">
  <itemName>Energy Zürich</itemName>
  <stationName>Energy Zürich</stationName>
  <containerArt>http://cdn-profiles.tunein.com/s47530/images/logog.jpg</containerArt>
</ContentItem>
```

### 3. Device Plays Stream
```
Device connects to: http://stream.url/radio.mp3
Audio plays
```

## Current Preset Data

Preset 1 for device 08DF1F0EBF49:
```xml
<preset id="1">
  <ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
    <itemName>Energy Zürich</itemName>
    <containerArt>http://cdn-profiles.tunein.com/s47530/images/logog.jpg</containerArt>
  </ContentItem>
</preset>
```

**Station ID:** s47530 (Energy Zürich)
**Source:** TUNEIN (legacy Bose format)
**Location:** /v1/playback/station/s47530 (relative path with station ID)

## Fix Applied

Updated `src/controllers/bmxController.js` to handle:

1. **TUNEIN source** (in addition to INTERNET_RADIO)
2. **Extract station ID from location path** (e.g., `/v1/playback/station/s47530` → `s47530`)
3. **Resolve TuneIn station ID to stream URL**

### Code Changes

```javascript
// Handle TUNEIN source (legacy format from Bose cloud)
// Extract station ID from location path like "/v1/playback/station/s47530"
if (source === 'TUNEIN' || source === 'INTERNET_RADIO') {
  if (!stationId && location) {
    // Extract station ID from location path
    const stationMatch = location.match(/\/station\/(s\d+)/);
    if (stationMatch) {
      stationId = stationMatch[1];
      console.log(`Extracted station ID from location: ${stationId}`);
    }
  }

  // If we have a station ID, resolve it to a stream URL
  if (stationId && stationId.startsWith('s')) {
    // Query TuneIn API for stream URL
    const tuneUrl = `${this.tuneinApiBase}/Tune.ashx`;
    const params = {
      id: stationId,
      partnerId: this.tuneinPartnerId,
      formats: 'mp3,aac,ogg,hls'
    };
    
    const response = await axios.get(tuneUrl, { params });
    const streamUrl = this.extractStreamUrl(response.data);
    
    // Return resolved stream URL
    return resolvedContentItem;
  }
}
```

## Debugging Steps

### 1. Check Server Logs

Restart the server and watch for logs when pressing preset button:

```bash
npm start
```

**Expected logs when pressing preset button 1:**
```
Device registration: 08DF1F0EBF49 (Account: default)
Preset 1 request from device: 08DF1F0EBF49
BMX resolve: source=TUNEIN, location=/v1/playback/station/s47530, stationId=undefined
Extracted station ID from location: s47530
Resolving TuneIn station: s47530
Resolved stream URL: http://stream.energy.ch/...
```

### 2. Test Preset Query Manually

```bash
# Get preset 1
curl "http://localhost:8090/device/08DF1F0EBF49/presets?presetId=1&accountId=default"
```

**Expected output:**
```xml
<presets>
  <preset id="1">
    <ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
      <itemName>Energy Zürich</itemName>
      <containerArt>http://cdn-profiles.tunein.com/s47530/images/logog.jpg</containerArt>
    </ContentItem>
  </preset>
</presets>
```

### 3. Test BMX Resolve Manually

```bash
# Test resolving the preset
curl -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
    <itemName>Energy Zürich</itemName>
    <containerArt>http://cdn-profiles.tunein.com/s47530/images/logog.jpg</containerArt>
  </ContentItem>'
```

**Expected output:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.url/..." stationId="s47530">
  <itemName>Energy Zürich</itemName>
  <stationName>Energy Zürich</stationName>
  <containerArt>http://cdn-profiles.tunein.com/s47530/images/logog.jpg</containerArt>
</ContentItem>
```

### 4. Test TuneIn API Directly

```bash
# Test TuneIn API
curl "https://opml.radiotime.com/Tune.ashx?id=s47530&partnerId=Bose&formats=mp3,aac,ogg,hls"
```

**Expected output:** OPML XML with stream URL

### 5. Check Device Configuration

Verify device is configured to use our server:

```bash
# Connect to device
telnet 192.168.1.128 17000
# Login: root (no password)

# Check configuration
cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml | grep -A 1 "bmx"
```

**Expected output:**
```xml
<server name="bmx" url="http://YOUR_SERVER_IP:8090"/>
```

## Possible Issues

### Issue 1: Device Not Configured to Use Our BMX Server

**Symptom:** No BMX resolve requests in server logs

**Solution:** Reconfigure device to point bmx server to our server:
```bash
telnet 192.168.1.128 17000
mount -o remount,rw /dev/root /
vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml
# Change: <server name="bmx" url="http://YOUR_SERVER_IP:8090"/>
reboot
```

### Issue 2: TuneIn API Returns No Stream URL

**Symptom:** Server logs show "Failed to extract stream URL"

**Solution:** 
- Check TuneIn API response format
- Station might require authentication
- Station might be geo-restricted

**Test:**
```bash
curl "https://opml.radiotime.com/Tune.ashx?id=s47530&partnerId=Bose&formats=mp3,aac,ogg,hls"
```

### Issue 3: Device Can't Reach Server

**Symptom:** No requests in server logs

**Solution:**
- Check firewall allows port 8090
- Verify device and server on same network
- Test connectivity: `curl http://SERVER_IP:8090/account/default/devices`

### Issue 4: Wrong Preset Format

**Symptom:** BMX resolve fails to extract station ID

**Solution:** Already fixed in bmxController.js - now extracts station ID from location path

## Verification Checklist

- [ ] Server is running and accessible
- [ ] Device is configured to use our server (marge, bmx, stats URLs)
- [ ] Device can query presets: `/device/:deviceId/presets?presetId=1`
- [ ] BMX resolve endpoint works: `POST /bmx/resolve`
- [ ] TuneIn API is accessible and returns stream URLs
- [ ] Server logs show preset and BMX requests when button pressed
- [ ] Device plays audio after pressing preset button

## Testing with Web UI

You can also test preset playback through the Web UI:

1. Open: `http://YOUR_SERVER_IP:8090`
2. Go to "Playback" tab
3. Select device: "SoundTouch Arbeitszimmer"
4. Scroll down to "Preset Buttons"
5. Click "1. Energy Zürich"

This simulates pressing preset button 1 and should trigger the same flow.

## Next Steps

1. **Restart server** to apply BMX controller fix
2. **Press preset button 1** on device
3. **Check server logs** for BMX resolve requests
4. **If no logs:** Device not configured to use our BMX server
5. **If logs show errors:** Debug TuneIn API response

## Server Logs to Watch For

```bash
# Start server with logs visible
npm start

# In another terminal, tail logs if using PM2 or similar
# Or just watch the console output
```

**Successful flow logs:**
```
Preset 1 request from device: 08DF1F0EBF49
BMX resolve: source=TUNEIN, location=/v1/playback/station/s47530, stationId=undefined
Extracted station ID from location: s47530
Resolving TuneIn station: s47530
Resolved stream URL: http://stream.energy.ch/energyzuerich_128.mp3
```

**Failed flow logs:**
```
Preset 1 request from device: 08DF1F0EBF49
BMX resolve: source=TUNEIN, location=/v1/playback/station/s47530, stationId=undefined
Extracted station ID from location: s47530
Resolving TuneIn station: s47530
TuneIn resolution error: ...
```

## Manual Test Commands

```bash
# 1. Test preset query
curl "http://localhost:8090/device/08DF1F0EBF49/presets?presetId=1&accountId=default"

# 2. Test BMX resolve
curl -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530"><itemName>Energy Zürich</itemName></ContentItem>'

# 3. Test TuneIn API
curl "https://opml.radiotime.com/Tune.ashx?id=s47530&partnerId=Bose&formats=mp3,aac,ogg,hls"

# 4. Simulate preset button press via device API
curl -X POST "http://192.168.1.128:8090/key" \
  -H "Content-Type: application/xml" \
  -d '<key state="press" sender="Gabbo">PRESET_1</key>'
```

---

**Status:** BMX controller updated to handle TUNEIN source and extract station IDs
**Next:** Restart server and test preset button
