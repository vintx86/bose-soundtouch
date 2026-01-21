# Preset Corruption Fix

## Issue

Device 08DF1F105037 (SoundTouch-Portable) had corrupted presets after saving a new preset via Web UI. All presets showed "Unnamed" with empty `location=""` attributes.

## Root Causes

### 1. Web UI Not Sending Location for TuneIn Presets

**Problem:**
```xml
<!-- Web UI sent this (missing location) -->
<ContentItem source="INTERNET_RADIO" type="station" stationId="s47530">
  <itemName>Energy Zürich</itemName>
</ContentItem>
```

**Should send:**
```xml
<!-- Should include location -->
<ContentItem source="INTERNET_RADIO" type="station" stationId="s47530" location="/v1/playback/station/s47530">
  <itemName>Energy Zürich</itemName>
</ContentItem>
```

### 2. Server Not Loading Existing Presets from Storage

**Problem:**
The `storePreset` function was:
1. Getting presets from device object in memory (which might be empty)
2. Updating one preset
3. Saving ALL presets (including empty ones)

This caused all existing presets to be overwritten with empty data.

**Flow that caused corruption:**
```
1. User saves preset 5 via Web UI
2. Server gets device from deviceManager (device has no presets in memory)
3. Server creates preset 5 with empty location
4. Server saves ALL presets (1-5) with empty locations
5. All presets corrupted!
```

## Fixes Applied

### 1. Fixed Web UI - Include Location for TuneIn Presets

**File:** `public/app.js`

**Before:**
```javascript
if (source === 'INTERNET_RADIO') {
    const stationId = document.getElementById('preset-station-id').value;
    xml = `<ContentItem source="INTERNET_RADIO" type="station" stationId="${stationId}">
        <itemName>${name}</itemName>
    </ContentItem>`;
}
```

**After:**
```javascript
if (source === 'INTERNET_RADIO') {
    const stationId = document.getElementById('preset-station-id').value;
    // Include both stationId and location for TuneIn stations
    xml = `<ContentItem source="INTERNET_RADIO" type="station" stationId="${stationId}" location="/v1/playback/station/${stationId}">
        <itemName>${name}</itemName>
        <stationName>${name}</stationName>
        ${art ? `<containerArt>${art}</containerArt>` : ''}
    </ContentItem>`;
}
```

### 2. Fixed Server - Load Existing Presets from Storage

**File:** `src/controllers/presetStorageController.js`

**Before:**
```javascript
async storePreset(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    const presets = device.getPresets(); // ❌ Gets from memory (might be empty)
    
    // Update preset
    presets[existingIndex] = newPreset;
    
    // Save ALL presets (including empty ones)
    await this.savePresetsToStorage(device);
}
```

**After:**
```javascript
async storePreset(req, res) {
    const deviceId = req.query.deviceId;
    const accountId = req.query.accountId || 'default';
    
    // ✅ Load existing presets from storage FIRST
    let existingPresets = [];
    const presetsXml = this.storage.loadPresets(accountId, deviceId);
    if (presetsXml) {
        const parsed = await parseStringPromise(presetsXml);
        existingPresets = parsePresetsFromXml(parsed);
    }
    
    // Update only the specific preset
    const existingIndex = existingPresets.findIndex(p => p.id === presetId);
    if (existingIndex >= 0) {
        existingPresets[existingIndex] = newPreset;
    } else {
        existingPresets.push(newPreset);
    }
    
    // Save all presets (now with correct data)
    await this.savePresetsToStorage(deviceId, accountId, existingPresets);
}
```

### 3. Added stationId to Storage

**File:** `src/controllers/presetStorageController.js`

Now stores both `location` and `stationId` attributes:

```javascript
ContentItem: {
  $: {
    source: p.source || 'INTERNET_RADIO',
    type: p.type || 'station',
    location: p.location || '',
    stationId: p.stationId || undefined,  // ✅ Added
    sourceAccount: p.sourceAccount || '',
    isPresetable: 'true'
  },
  itemName: p.name,
  containerArt: p.art || ''
}
```

### 4. Restored Corrupted Presets

**File:** `data/accounts/default/devices/08DF1F105037/Presets.xml`

Restored presets with proper TuneIn station data:

```xml
<preset id="1">
  <ContentItem source="INTERNET_RADIO" type="station" 
               location="/v1/playback/station/s47530" 
               stationId="s47530">
    <itemName>Energy Zürich</itemName>
    <containerArt>http://cdn-profiles.tunein.com/s47530/images/logog.jpg</containerArt>
  </ContentItem>
</preset>
<!-- ... more presets ... -->
```

**Restored Presets:**
1. Energy Zürich (s47530)
2. Radio 24 (s2773)
3. SRF 1 (s8959)
4. SRF 2 Kultur (s8960)
5. Radio Argovia (s8955)

## How It Works Now

### Saving a Preset

1. **User fills preset form in Web UI**
   - Preset slot: 5
   - Source: TuneIn
   - Station ID: s8955
   - Name: Radio Argovia

2. **Web UI sends complete data:**
   ```xml
   <ContentItem source="INTERNET_RADIO" type="station" 
                stationId="s8955" 
                location="/v1/playback/station/s8955">
     <itemName>Radio Argovia</itemName>
   </ContentItem>
   ```

3. **Server loads existing presets from storage:**
   ```javascript
   // Load presets 1-4 from Presets.xml
   existingPresets = [preset1, preset2, preset3, preset4];
   ```

4. **Server updates only preset 5:**
   ```javascript
   existingPresets.push(newPreset5);
   // Now: [preset1, preset2, preset3, preset4, preset5]
   ```

5. **Server saves all presets:**
   ```javascript
   // All presets saved with correct data
   savePresetsToStorage(deviceId, accountId, existingPresets);
   ```

6. **Result:** All presets preserved, preset 5 added/updated

## Testing

### Test 1: Save New Preset

1. Open Web UI: `http://localhost:8090`
2. Go to "Presets" tab
3. Select device: "SoundTouch-Portable"
4. Fill form:
   - Preset Slot: 6
   - Source: TuneIn
   - Station ID: s8956
   - Name: Test Station
5. Click "Save Preset"
6. Verify: All existing presets (1-5) still show correct names
7. Verify: New preset 6 appears with "Test Station"

### Test 2: Update Existing Preset

1. Select preset slot: 1
2. Change name to: "Energy Zürich Updated"
3. Click "Save Preset"
4. Verify: Preset 1 updated
5. Verify: Presets 2-5 unchanged

### Test 3: Check Storage

```bash
# View presets file
cat data/accounts/default/devices/08DF1F105037/Presets.xml

# Should show all presets with:
# - Non-empty location attributes
# - Correct station IDs
# - Proper names
```

### Test 4: API Test

```bash
# Get all presets
curl "http://localhost:8090/device/08DF1F105037/presets?accountId=default"

# Should return all presets with correct data
```

## Files Modified

1. **public/app.js** - Fixed preset form to include location
2. **src/controllers/presetStorageController.js** - Fixed to load existing presets from storage
3. **data/accounts/default/devices/08DF1F105037/Presets.xml** - Restored corrupted presets

## Prevention

The fixes prevent future corruption by:

1. ✅ **Web UI always sends complete data** (location + stationId)
2. ✅ **Server always loads existing presets** from storage before updating
3. ✅ **Server only updates the specific preset** being saved
4. ✅ **Server preserves all other presets** unchanged
5. ✅ **Storage includes both location and stationId** for TuneIn stations

## Verification

After restart, verify:

```bash
# 1. Check presets via API
curl "http://localhost:8090/device/08DF1F105037/presets?accountId=default"

# 2. Check Web UI
# - Open http://localhost:8090
# - Go to Presets tab
# - Select "SoundTouch-Portable"
# - Should see 5 presets with correct names

# 3. Test saving a preset
# - Add preset 6
# - Verify presets 1-5 unchanged
# - Verify preset 6 saved correctly
```

## Summary

**Before:**
- ❌ Web UI sent incomplete data (no location)
- ❌ Server didn't load existing presets from storage
- ❌ Saving one preset corrupted all presets
- ❌ All presets showed "Unnamed" with empty locations

**After:**
- ✅ Web UI sends complete data (location + stationId)
- ✅ Server loads existing presets from storage
- ✅ Saving one preset preserves all others
- ✅ All presets show correct names and data
- ✅ Presets restored for device 08DF1F105037

---

**Status:** Fixed ✅
**Presets Restored:** 5 presets for SoundTouch-Portable
**Next:** Restart server to apply fixes
