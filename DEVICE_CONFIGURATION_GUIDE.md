# Device Configuration Guide

This guide explains how to configure your Bose SoundTouch devices to use this server as a replacement for Bose cloud services.

## Overview

After Bose shuts down their cloud services (May 6, 2026), your SoundTouch devices will need to connect to a local server to maintain full functionality. This guide shows you how to configure your devices to use your own server.

## Prerequisites

- USB flash drive (FAT32 formatted)
- Telnet client
- Your server running and accessible on your network
- Server hostname or IP address

## Configuration Process

### Step 1: Enable Remote Access on Device

1. **Prepare USB drive:**
   ```bash
   # Format USB drive as FAT32
   # Create an empty file called 'remote_services'
   touch /Volumes/USB/remote_services  # macOS
   # or
   type nul > E:\remote_services       # Windows
   ```

2. **Boot device with USB:**
   - Power off your SoundTouch device
   - Insert USB drive into USB port on back of device
   - Power on device
   - Wait for device to boot (about 30 seconds)

3. **Device is now accessible via telnet/SSH**

### Step 2: Connect to Device

Find your device's IP address (check your router or use network scanner):

```bash
# Connect via telnet
telnet 192.168.1.100

# Login as root (no password)
# Username: root
# Password: (just press Enter)
```

### Step 3: Extract Device Information

Before reconfiguring, extract current device state:

```bash
# On your computer (not on device)
DEVICE_IP="192.168.1.100"
ACCOUNT_ID="default"  # or your account ID

# Get device info
curl "http://${DEVICE_IP}:8090/info" > DeviceInfo.xml

# Get presets
curl "http://${DEVICE_IP}:8090/presets" > Presets.xml

# Get recents
curl "http://${DEVICE_IP}:8090/recents" > Recents.xml
```

### Step 4: Transfer Device State to Server

```bash
# Set your server details
SERVER_URL="http://your-server.local:8090"
DEVICE_ID="A0B1C2D3E4F5"  # Get from DeviceInfo.xml

# Upload device info
curl -X POST "${SERVER_URL}/device/register" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: ${ACCOUNT_ID}" \
  --data-binary @DeviceInfo.xml

# Upload presets
curl -X POST "${SERVER_URL}/device/${DEVICE_ID}/presets" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: ${ACCOUNT_ID}" \
  --data-binary @Presets.xml

# Upload recents
curl -X POST "${SERVER_URL}/device/${DEVICE_ID}/recents" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: ${ACCOUNT_ID}" \
  --data-binary @Recents.xml
```

### Step 5: Get Sources from Device

Sources.xml is not exposed via HTTP API, must get from device filesystem:

```bash
# On device (via telnet)
cat /opt/Bose/etc/Sources.xml

# Copy output and save to Sources.xml on your computer
# Then upload to server:
curl -X POST "${SERVER_URL}/device/${DEVICE_ID}/sources" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: ${ACCOUNT_ID}" \
  --data-binary @Sources.xml
```

### Step 6: Configure Device to Use Your Server

Still connected via telnet to the device:

```bash
# Make filesystem writable
mount -o remount,rw /dev/root /

# Backup original configuration
cp /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml.backup

# Edit configuration
vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml
```

**Original configuration:**
```xml
<server name="marge" url="https://marge.bose.com"/>
<server name="bmx" url="https://bmx.bose.com"/>
<server name="stats" url="https://stats.bose.com"/>
<server name="swUpdate" url="https://swupdate.bose.com"/>
```

**New configuration (replace with your server):**
```xml
<server name="marge" url="http://your-server.local:8090"/>
<server name="bmx" url="http://your-server.local:8090"/>
<server name="stats" url="http://your-server.local:8090"/>
<server name="swUpdate" url="http://your-server.local:8090"/>
```

**Important:** Replace `your-server.local:8090` with your actual server hostname/IP and port.

### Step 7: Reboot Device

```bash
# On device
reboot

# Or physically unplug and plug back in
```

### Step 8: Verify Connection

Check server logs for device registration:

```bash
# Server should show:
# Device registration: A0B1C2D3E4F5 (Account: default)
# Auto-registered device: Living Room (A0B1C2D3E4F5)
```

Verify device appears in server:

```bash
curl "http://your-server.local:8090/account/default/devices"
```

## Automated Setup Script

We provide a script to automate the setup process:

```bash
./scripts/configure-device-for-server.sh <device_ip> <server_url> [account_id]

# Example:
./scripts/configure-device-for-server.sh 192.168.1.100 http://soundcork.local:8090 default
```

## Server Data Structure

After configuration, server stores device data in:

```
data/
└── accounts/
    └── default/
        └── devices/
            └── A0B1C2D3E4F5/
                ├── DeviceInfo.xml
                ├── Presets.xml
                ├── Recents.xml
                └── Sources.xml
```

## Troubleshooting

### Device Can't Connect to Server

**Check network connectivity:**
```bash
# On device
ping your-server.local
```

**Check server is running:**
```bash
curl http://your-server.local:8090/info
```

**Check firewall:**
- Ensure port 8090 is open on server
- Check router/firewall rules

### Device Still Using Bose Servers

**Verify configuration was saved:**
```bash
# On device
cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml
```

**Check filesystem is writable:**
```bash
# On device
mount | grep "/ "
# Should show "rw" not "ro"
```

### Presets Not Working

**Verify presets were uploaded:**
```bash
curl "http://your-server.local:8090/device/A0B1C2D3E4F5/presets"
```

**Re-upload presets:**
```bash
curl -X POST "http://your-server.local:8090/device/A0B1C2D3E4F5/presets" \
  -H "Content-Type: application/xml" \
  --data-binary @Presets.xml
```

### Device Not Auto-Registering

**Check server logs** for registration attempts

**Manually register device:**
```bash
curl -X POST "http://your-server.local:8090/device/register" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: default" \
  --data-binary @DeviceInfo.xml
```

## Reverting to Bose Servers

To revert device to use Bose servers:

```bash
# On device (via telnet)
mount -o remount,rw /dev/root /
cp /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml.backup /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml
reboot
```

## Multiple Devices

Repeat the configuration process for each device. All devices can use the same server and will be organized by account ID.

## Multiple Accounts

To separate devices into different accounts:

1. Use different account IDs when uploading device data
2. Devices will be stored in separate account directories
3. Query devices by account: `/account/{accountId}/devices`

## Security Considerations

### Current Implementation
- No authentication required
- HTTP only (no HTTPS)
- Suitable for trusted local networks

### Production Recommendations
1. Add authentication (API keys, OAuth)
2. Enable HTTPS/TLS
3. Restrict access by IP/network
4. Use firewall rules

## Network Requirements

- Server must be accessible from devices
- Use static IP or reliable hostname (mDNS, DNS)
- Port 8090 must be accessible
- Low latency recommended (same LAN)

## Advanced: DNS-Based Configuration

Instead of editing device config, you can use DNS to redirect Bose domains:

```bash
# In your local DNS server (Pi-hole, dnsmasq, etc.)
# Redirect Bose domains to your server

# /etc/hosts or DNS config:
192.168.1.50  marge.bose.com
192.168.1.50  bmx.bose.com
192.168.1.50  stats.bose.com
192.168.1.50  swupdate.bose.com
```

**Advantages:**
- No device modification needed
- Easy to revert
- Works for all devices automatically

**Disadvantages:**
- Requires DNS server control
- May affect other Bose devices
- HTTPS certificate issues

## What Happens After Configuration

1. **Device boots** and reads SoundTouchSdkPrivateCfg.xml
2. **Device connects** to your server instead of Bose
3. **Device registers** itself (POST /device/register)
4. **Device syncs** presets, recents, sources
5. **Device operates** normally using your server
6. **Server stores** all device state persistently
7. **You control** device via both:
   - Device's local API (port 8090 on device)
   - Server's control API (port 8090 on server)

## Benefits of This Server

✅ **Independence** - No reliance on Bose cloud
✅ **Privacy** - All data stays local
✅ **Persistence** - State survives device reboots
✅ **Multi-device** - Centralized management
✅ **Backup** - Easy to backup/restore device state
✅ **Future-proof** - Works after Bose shutdown (May 2026)
✅ **Full Features** - Presets, Spotify, multiroom all work

## What This Server Provides

| Feature | Without Server | With This Server |
|---------|---------------|------------------|
| Presets | ❌ Lost | ✅ Fully functional |
| Spotify | ❌ Broken | ✅ Works |
| Internet Radio | ❌ Unavailable | ✅ Works |
| Multiroom | ❌ Broken | ✅ Works |
| Device Config | ❌ Lost | ✅ Persistent |
| Recent Items | ❌ Lost | ✅ Tracked |

## Recommended Setup

**After May 6, 2026:**
- Configure all devices to use your server
- Full functionality without Bose cloud
- All features continue working locally
