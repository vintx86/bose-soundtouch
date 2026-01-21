# Server Restart Required

## Changes Made

Updated `src/controllers/bmxController.js` to fix TuneIn stream resolution:

### 1. Updated `extractStreamUrl()` Function

The function now handles TuneIn's plain text response format (not just OPML XML).

**Before:**
```javascript
extractStreamUrl(opmlData) {
  // Only looked for OPML XML format: url="..."
  const urlMatch = opmlData.match(/url="([^"]+)"/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return null;
}
```

**After:**
```javascript
extractStreamUrl(opmlData) {
  // Handle plain text URLs (one per line)
  const lines = opmlData.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  for (const line of lines) {
    if (line.startsWith('http://') || line.startsWith('https://')) {
      return line;
    }
  }
  
  // Also handle OPML XML format
  const urlMatch = opmlData.match(/url="([^"]+)"/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  
  return null;
}
```

### 2. TuneIn API Response Format

When querying TuneIn API:
```bash
curl "https://opml.radiotime.com/Tune.ashx?id=s47530&partnerId=Bose&formats=mp3,aac,ogg,hls"
```

**Response (plain text, not XML):**
```
https://energyzuerich.ice.infomaniak.ch/energyzuerich-high.mp3
https://energyzuerich.ice.infomaniak.ch/energyzuerich-low.mp3
```

The old code expected OPML XML format, but TuneIn returns plain text URLs.

## How to Restart Server

### Option 1: Stop and Start

```bash
# Stop the server (Ctrl+C in the terminal where it's running)
# Or find and kill the process:
ps aux | grep "node.*server.js" | grep -v grep
kill <PID>

# Start the server again
npm start
```

### Option 2: Use nodemon (Auto-restart on changes)

If you want automatic restarts during development:

```bash
# Install nodemon globally
npm install -g nodemon

# Start server with nodemon
nodemon src/server.js
```

## Verification After Restart

### Test 1: BMX Resolve Endpoint

```bash
curl -s -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
  <itemName>Energy Zürich</itemName>
</ContentItem>'
```

**Expected output:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="https://energyzuerich.ice.infomaniak.ch/energyzuerich-high.mp3" stationId="s47530">
  <itemName>Energy Zürich</itemName>
  <stationName>Energy Zürich</stationName>
</ContentItem>
```

### Test 2: Run Full Test Script

```bash
./test-preset-resolve.sh
```

**Expected output:**
```
Test 1: Query Preset 1
✓ Preset retrieved

Test 2: Resolve Stream URL via BMX
✓ Stream URL resolved: https://energyzuerich.ice.infomaniak.ch/energyzuerich-high.mp3

Test 3: Verify Stream URL
✓ Stream URL is accessible
```

### Test 3: Server Logs

After restart, when pressing preset button or testing BMX resolve, you should see:

```
BMX resolve: source=TUNEIN, location=/v1/playback/station/s47530, stationId=undefined
Extracted station ID from location: s47530
Resolving TuneIn station: s47530
Extracted stream URL from plain text: https://energyzuerich.ice.infomaniak.ch/energyzuerich-high.mp3
Resolved stream URL: https://energyzuerich.ice.infomaniak.ch/energyzuerich-high.mp3
```

## What Was Fixed

1. ✅ **TUNEIN source handling** - Now handles both TUNEIN and INTERNET_RADIO
2. ✅ **Station ID extraction** - Extracts station ID from location path
3. ✅ **Plain text URL parsing** - Handles TuneIn's plain text response format
4. ✅ **OPML XML parsing** - Still handles OPML format if TuneIn returns it

## Files Modified

- `src/controllers/bmxController.js` - Updated `resolveStream()` and `extractStreamUrl()`

## Next Steps

1. **Restart the server** (see commands above)
2. **Run test script:** `./test-preset-resolve.sh`
3. **Test preset button** on device
4. **Check server logs** for successful resolution

---

**Status:** Code fixed, restart required to apply changes
**Test Command:** `./test-preset-resolve.sh`
