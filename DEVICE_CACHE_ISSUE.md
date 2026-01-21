# Device Cache Issue - Preset Not Working

## Problem

Device 08DF1F0EBF49 (SoundTouch Arbeitszimmer) is configured to use local server:
- `<bmxRegistryUrl>` points to local server
- Device has been rebooted
- But pressing preset button still shows old Bose cloud configuration

## Root Cause

The device caches preset data and BMX configuration. Even after changing `SoundTouchSdkPrivateCfg.xml` and rebooting, the device may still have:

1. **Cached preset data** from old Bose cloud
2. **Cached BMX registry** pointing to old servers
3. **Persistent storage** that wasn't cleared

## Solution Steps

### Step 1: Verify Server Configuration

Connect to device and check configuration:

```bash
telnet 192.168.1.128 17000
# Login: root (no password)

# Check BMX configuration
cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml | grep -A 2 bmx
```

**Expected output:**
```xml
<server name="bmx" url="http://YOUR_SERVER_IP:8090"/>
<bmxRegistryUrl>http://YOUR_SERVER_IP:8090</bmxRegistryUrl>
```

**If still showing Bose servers:**
```xml
<server name="bmx" url="https://bmx.bose.com"/>
<bmxRegistryUrl>https://bmx.bose.com</bmxRegistryUrl>
```

Then the configuration wasn't saved properly.

### Step 2: Clear Device Cache

The device caches data in several locations:

```bash
# Connect to device
telnet 192.168.1.128 17000

# Make filesystem writable
mount -o remount,rw /dev/root /

# Clear preset cache
rm -f /opt/Bose/var/presets.xml
rm -f /opt/Bose/var/cache/*

# Clear BMX cache
rm -f /opt/Bose/var/bmx_cache.xml
rm -f /opt/Bose/var/bmx_registry.xml

# Reboot
reboot
```

### Step 3: Force Configuration Update

If the configuration file is correct but device still uses old settings:

```bash
# Connect to device
telnet 192.168.1.128 17000

# Make filesystem writable
mount -o remount,rw /dev/root /

# Backup current config
cp /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml.backup

# Edit configuration
vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml
```

**Required changes in SoundTouchSdkPrivateCfg.xml:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<SoundTouchSdkPrivateCfg>
  <!-- Change ALL these URLs to your server -->
  <server name="marge" url="http://YOUR_SERVER_IP:8090"/>
  <server name="bmx" url="http://YOUR_SERVER_IP:8090"/>
  <server name="stats" url="http://YOUR_SERVER_IP:8090"/>
  <server name="swUpdate" url="http://YOUR_SERVER_IP:8090"/>
  
  <!-- IMPORTANT: Also change these -->
  <margeUrl>http://YOUR_SERVER_IP:8090</margeUrl>
  <bmxRegistryUrl>http://YOUR_SERVER_IP:8090</bmxRegistryUrl>
  <statsUrl>http://YOUR_SERVER_IP:8090</statsUrl>
  
  <!-- Keep other settings as-is -->
</SoundTouchSdkPrivateCfg>
```

**Save and reboot:**
```bash
# After editing
reboot
```

### Step 4: Verify Device Connects to Server

After reboot, check server logs:

```bash
# On server machine
npm start

# Watch for device connection
# Should see:
# Device registration: 08DF1F0EBF49 (Account: default)
```

If you don't see device registration, the device is still trying to connect to Bose servers.

### Step 5: Test Preset Query

From server machine, test if device can query presets:

```bash
# Test preset query endpoint
curl "http://localhost:8090/device/08DF1F0EBF49/presets?presetId=1&accountId=default"
```

**Expected output:**
```xml
<presets>
  <preset id="1">
    <ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
      <itemName>Energy Zürich</itemName>
    </ContentItem>
  </preset>
</presets>
```

### Step 6: Test BMX Resolve

Test if BMX resolve works:

```bash
curl -X POST "http://localhost:8090/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
    <itemName>Energy Zürich</itemName>
  </ContentItem>'
```

**Expected output:**
```xml
<ContentItem source="INTERNET_RADIO" type="station" location="https://energyzuerich.ice.infomaniak.ch/energyzuerich-high.mp3" stationId="s47530">
  <itemName>Energy Zürich</itemName>
</ContentItem>
```

## Common Issues

### Issue 1: Configuration Not Saved

**Symptom:** After editing and rebooting, device still uses old URLs

**Solution:**
```bash
# Make sure filesystem is writable
mount -o remount,rw /dev/root /

# Verify file was saved
cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml | grep bmx

# If not saved, filesystem might be read-only
# Try remounting and editing again
```

### Issue 2: Device Can't Reach Server

**Symptom:** Device doesn't connect to server after reboot

**Solution:**
```bash
# From device, test connectivity
ping YOUR_SERVER_IP

# From device, test HTTP
wget -O- http://YOUR_SERVER_IP:8090/account/default/devices

# If fails, check:
# - Server is running
# - Firewall allows port 8090
# - Device and server on same network
```

### Issue 3: Wrong Server URL Format

**Symptom:** Device connects but preset doesn't work

**Solution:**
Make sure URLs in config are correct format:
- ✅ `http://192.168.1.163:8090` (with port)
- ✅ `http://192.168.1.163:8090/` (with trailing slash is OK)
- ❌ `192.168.1.163:8090` (missing http://)
- ❌ `http://192.168.1.163` (missing port)

### Issue 4: Preset Data Still Cached

**Symptom:** Device queries server but uses old preset data

**Solution:**
```bash
# Clear all cached data
rm -rf /opt/Bose/var/cache/*
rm -f /opt/Bose/var/*.xml

# Force device to re-sync presets
# Press and hold preset button 1 for 5 seconds
# This should trigger a preset sync
```

## Complete Device Reconfiguration Script

If nothing works, do a complete reconfiguration:

```bash
#!/bin/bash
# Complete device reconfiguration

DEVICE_IP="192.168.1.128"
SERVER_URL="http://192.168.1.163:8090"

echo "Connecting to device..."
telnet $DEVICE_IP 17000 << EOF
# Login as root
root

# Make writable
mount -o remount,rw /dev/root /

# Backup
cp /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml.backup

# Clear cache
rm -rf /opt/Bose/var/cache/*
rm -f /opt/Bose/var/*.xml

# Edit config (you'll need to do this manually)
echo "Edit /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml"
echo "Change all URLs to: $SERVER_URL"

# After editing, reboot
reboot
EOF
```

## Manual Configuration Template

Use this template for `SoundTouchSdkPrivateCfg.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<SoundTouchSdkPrivateCfg>
  <server name="marge" url="http://192.168.1.163:8090"/>
  <server name="bmx" url="http://192.168.1.163:8090"/>
  <server name="stats" url="http://192.168.1.163:8090"/>
  <server name="swUpdate" url="http://192.168.1.163:8090"/>
  
  <margeUrl>http://192.168.1.163:8090</margeUrl>
  <bmxRegistryUrl>http://192.168.1.163:8090</bmxRegistryUrl>
  <statsUrl>http://192.168.1.163:8090</statsUrl>
  
  <enableDebugLogging>false</enableDebugLogging>
  <enableVerboseLogging>false</enableVerboseLogging>
</SoundTouchSdkPrivateCfg>
```

**Replace `192.168.1.163:8090` with your actual server IP and port!**

## Verification Checklist

After reconfiguration:

- [ ] Device configuration file has correct server URLs
- [ ] Device cache cleared
- [ ] Device rebooted
- [ ] Server logs show device connection
- [ ] Preset query works: `curl http://localhost:8090/device/08DF1F0EBF49/presets?presetId=1`
- [ ] BMX resolve works: `curl -X POST http://localhost:8090/bmx/resolve ...`
- [ ] Pressing preset button on device triggers server request (check server logs)
- [ ] Audio plays when pressing preset button

## Debug: Watch Server Logs

Start server and watch for requests:

```bash
npm start

# When you press preset button, you should see:
# Preset 1 request from device: 08DF1F0EBF49
# BMX resolve: source=TUNEIN, location=/v1/playback/station/s47530
# Extracted station ID from location: s47530
# Resolving TuneIn station: s47530
# Resolved stream URL: https://energyzuerich.ice.infomaniak.ch/...
```

**If you see NO logs when pressing preset button:**
- Device is NOT querying your server
- Device is still using old Bose cloud configuration
- Need to reconfigure device (see steps above)

## Alternative: Factory Reset

If all else fails, factory reset the device:

1. **Backup device data** (if needed)
2. **Factory reset device** (hold AUX + Volume Down for 10 seconds)
3. **Reconfigure from scratch** using configuration script
4. **Test preset button**

---

**Next Steps:**
1. Connect to device via telnet
2. Verify configuration file has correct URLs
3. Clear device cache
4. Reboot device
5. Watch server logs when pressing preset button
6. If no logs appear, device still using old config
