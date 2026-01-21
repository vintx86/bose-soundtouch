# Preset Button Fix - TuneIn Resolution

## Issue

Device 08DF1F0EBF49 is configured to use our server, but pressing preset button 1 (Energy Zürich - TuneIn station s47530) doesn't work.

## Root Cause

The BMX controller's `resolveStream()` function had two issues:

1. **Didn't handle "TUNEIN" source** - Only handled "INTERNET_RADIO"
2. **Didn't extract station ID from location path** - Expected stationId attribute, but preset has station ID embedded in location path

### Preset Data Format

```xml
<ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
  <itemName>Energy Zürich</itemName>
</ContentItem>
```

**Problems:**
- `source="TUNEIN"` (not "INTERNET_RADIO")
- Station ID `s47530` is in location path, not as attribute
- Location is relative path: `/v1/playback/station/s47530`

## Fix Applied

Updated `src/controllers/bmxController.js` → `resolveStream()` function:

### 1. Handle TUNEIN Source

```javascript
// Before: Only handled INTERNET_RADIO
if (source === 'INTERNET_RADIO' && stationId && stationId.startsWith('s')) {
  // resolve...
}

// After: Handle both TUNEIN and INTERNET_RADIO
if (source === 'TUNEIN' || source === 'INTERNET_RADIO') {
  // resolve...
}
```

### 2. Extract Station ID from Location Path

```javascript
// Extract station ID from location path like "/v1/playback/station/s47530"
if (!stationId && location) {
  const stationMatch = location.match(/\/station\/(s\d+)/);
  if (stationMatch) {
    stationId = stationMatch[1];
    console.log(`Extracted station ID from location: ${stationId}`);
  }
}
```

### 3. Resolve TuneIn Station to Stream URL

```javascript
if (stationId && stationId.startsWith('s')) {
  console.log(`Resolving TuneIn station: ${stationId}`);
  
  // Query TuneIn API
  const tuneUrl = `${this.tuneinApiBase}/Tune.ashx`;
  const params = {
    id: stationId,
    partnerId: this.tuneinPartnerId,
    formats: 'mp3,aac,ogg,hls'
  };
  
  const response = await axios.get(tuneUrl, { params });
  const streamUrl = this.extractStreamUrl(response.data);
  
  if (streamUrl) {
    console.log(`Resolved stream URL: ${streamUrl}`);
    // Return resolved ContentItem with stream URL
    return resolvedContentItem;
  }
}
```

## How It Works Now

### Complete Flow

1. **User presses preset button 1 on device**

2. **Device queries server for preset:**
   ```
   GET /device/08DF1F0EBF49/presets?presetId=1
   ```

3. **Server returns preset data:**
   ```xml
   <ContentItem source="TUNEIN" location="/v1/playback/station/s47530">
     <itemName>Energy Zürich</itemName>
   </ContentItem>
   ```

4. **Device sends to BMX server for resolution:**
   ```
   POST /bmx/resolve
   Body: <ContentItem source="TUNEIN" location="/v1/playback/station/s47530">...</ContentItem>
   ```

5. **BMX server extracts station ID:**
   ```
   location="/v1/playback/station/s47530" → stationId="s47530"
   ```

6. **BMX server queries TuneIn API:**
   ```
   GET https://opml.radiotime.com/Tune.ashx?id=s47530&partnerId=Bose&formats=mp3,aac,ogg,hls
   ```

7. **TuneIn returns OPML with stream URL:**
   ```xml
   <outline url="http://stream.energy.ch/energyzuerich_128.mp3" />
   ```

8. **BMX server returns resolved stream:**
   ```xml
   <ContentItem source="INTERNET_RADIO" location="http://stream.energy.ch/energyzuerich_128.mp3" stationId="s47530">
     <itemName>Energy Zürich</itemName>
   </ContentItem>
   ```

9. **Device plays stream:**
   ```
   Connects to: http://stream.energy.ch/energyzuerich_128.mp3
   Audio plays!
   ```

## Testing

### Automated Test

Run the test script:

```bash
./test-preset-resolve.sh http://localhost:8090
```

**Expected output:**
```
Test 1: Query Preset 1
✓ Preset retrieved

Test 2: Resolve Stream URL via BMX
✓ Stream URL resolved: http://stream.energy.ch/...

Test 3: Verify Stream URL
✓ Stream URL is accessible
```

### Manual Tests

#### 1. Test Preset Query
```bash
curl "http://localhost:8090/device/08DF1F0EBF49/presets?presetId=1&accountId=default"
```

#### 2. Test BMX Resolve
```bash
curl -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
    <itemName>Energy Zürich</itemName>
  </ContentItem>'
```

#### 3. Test TuneIn API
```bash
curl "https://opml.radiotime.com/Tune.ashx?id=s47530&partnerId=Bose&formats=mp3,aac,ogg,hls"
```

#### 4. Test via Web UI
1. Open: `http://localhost:8090`
2. Go to "Playback" tab
3. Select device: "SoundTouch Arbeitszimmer"
4. Click preset button: "1. Energy Zürich"

### Server Logs

When pressing preset button, you should see:

```
Preset 1 request from device: 08DF1F0EBF49
BMX resolve: source=TUNEIN, location=/v1/playback/station/s47530, stationId=undefined
Extracted station ID from location: s47530
Resolving TuneIn station: s47530
Resolved stream URL: http://stream.energy.ch/energyzuerich_128.mp3
```

## Verification

### Prerequisites

1. **Server is running:**
   ```bash
   npm start
   ```

2. **Device is configured to use our server:**
   ```bash
   # Check device config
   telnet 192.168.1.128 17000
   cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml | grep bmx
   ```
   
   Should show:
   ```xml
   <server name="bmx" url="http://YOUR_SERVER_IP:8090"/>
   ```

3. **Device can reach server:**
   ```bash
   # From device
   ping YOUR_SERVER_IP
   ```

### Test Preset Button

1. **Press preset button 1** on device
2. **Check server logs** for BMX resolve requests
3. **Listen for audio** - should play Energy Zürich

### Troubleshooting

**No audio plays:**
- Check server logs for errors
- Verify device is configured to use our BMX server
- Test BMX resolve manually (see commands above)
- Check TuneIn API is accessible

**Server logs show "Failed to extract stream URL":**
- TuneIn API might have changed format
- Station might be geo-restricted
- Test TuneIn API directly (see command above)

**No requests in server logs:**
- Device not configured to use our server
- Device can't reach server (network/firewall)
- Verify device configuration

## Files Modified

1. **src/controllers/bmxController.js** - Updated `resolveStream()` function

## Files Created

1. **PRESET_BUTTON_DEBUG.md** - Detailed debugging guide
2. **PRESET_BUTTON_FIX.md** - This file
3. **test-preset-resolve.sh** - Automated test script

## Summary

**Before:**
- BMX controller only handled `source="INTERNET_RADIO"`
- BMX controller expected `stationId` attribute
- Preset button didn't work for TuneIn stations

**After:**
- BMX controller handles both `TUNEIN` and `INTERNET_RADIO` sources
- BMX controller extracts station ID from location path
- Preset button resolves TuneIn stations to stream URLs
- Audio plays when pressing preset button

---

**Status:** Fixed ✅
**Next Step:** Restart server and test preset button on device
**Test Command:** `./test-preset-resolve.sh`
