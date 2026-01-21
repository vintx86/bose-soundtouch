# Device Access Troubleshooting

## Problem

No server logs appear when pressing preset button on device 08DF1F0EBF49.

This means the device is NOT connecting to your server.

## Possible Causes

1. **Device can't reach server** (network/firewall issue)
2. **Device still configured for old Bose servers** (config not saved)
3. **Server not listening on correct interface** (localhost only)
4. **Wrong server URL in device config** (typo, wrong IP, wrong port)

## Step-by-Step Diagnosis

### Step 1: Verify Server is Accessible from Device

From the device, test if it can reach your server:

```bash
# Connect to device
telnet 192.168.1.128 17000
# Login: root (no password)

# Test ping
ping YOUR_SERVER_IP
# Should show: 64 bytes from YOUR_SERVER_IP...

# Test HTTP access
wget -O- http://YOUR_SERVER_IP:8090/account/default/devices
# Should show: JSON with devices

# If wget fails, try:
curl http://YOUR_SERVER_IP:8090/account/default/devices
```

**If ping works but HTTP fails:**
- Firewall is blocking port 8090
- Server not listening on all interfaces

**If ping fails:**
- Device and server not on same network
- Network routing issue

### Step 2: Check Server Binding

The server must listen on ALL interfaces (0.0.0.0), not just localhost (127.0.0.1).

Check how server is started:

```bash
# Check server.js
grep "listen" src/server.js

# Should be:
# app.listen(PORT, () => {
# NOT:
# app.listen(PORT, 'localhost', () => {
```

Check what the server is actually listening on:

```bash
# On server machine
netstat -an | grep 8090
# or
lsof -i :8090

# Should show:
# *:8090 (LISTEN)  ← Good, listening on all interfaces
# 127.0.0.1:8090 (LISTEN)  ← Bad, only localhost
```

**If server only listening on localhost:**

The server needs to be accessible from other devices on the network.

**Fix:** Server is already configured correctly in `src/server.js`:
```javascript
const server = app.listen(PORT, () => {
  // No host specified = binds to 0.0.0.0 (all interfaces)
});
```

But check if there's a firewall blocking:

```bash
# macOS - Check firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow Node.js through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Step 3: Test Server Access from Your Computer

From your computer (not the device), test if server is accessible:

```bash
# Get your server's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: inet 192.168.1.163

# Test from another terminal or device on same network
curl http://192.168.1.163:8090/account/default/devices

# Should return JSON with devices
```

**If this fails:**
- Server not running
- Firewall blocking
- Wrong IP address

### Step 4: Check Device Configuration

Connect to device and verify configuration:

```bash
telnet 192.168.1.128 17000
# Login: root

# Check configuration
cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml
```

**Look for these lines:**
```xml
<server name="bmx" url="http://YOUR_SERVER_IP:8090"/>
<bmxRegistryUrl>http://YOUR_SERVER_IP:8090</bmxRegistryUrl>
<margeUrl>http://YOUR_SERVER_IP:8090</margeUrl>
```

**Common mistakes:**
- ❌ `http://localhost:8090` (device can't reach "localhost")
- ❌ `192.168.1.163:8090` (missing `http://`)
- ❌ `http://192.168.1.163` (missing port `:8090`)
- ✅ `http://192.168.1.163:8090` (correct!)

### Step 5: Test from Device to Server

While connected to device via telnet:

```bash
# Test if device can reach server
wget -O- http://YOUR_SERVER_IP:8090/account/default/devices

# If this works, device CAN reach server
# If this fails, there's a network/firewall issue
```

**If wget succeeds:**
- Device CAN reach server
- Problem is in device configuration (wrong URLs)

**If wget fails:**
- Device CANNOT reach server
- Network/firewall issue

## Common Issues and Solutions

### Issue 1: Firewall Blocking Port 8090

**Symptom:** Device can ping server but can't access HTTP

**Solution (macOS):**
```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If enabled, allow Node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add $(which node)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp $(which node)

# Or temporarily disable firewall for testing
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
# (Remember to re-enable after testing!)
```

**Solution (Linux):**
```bash
# Check firewall
sudo ufw status

# Allow port 8090
sudo ufw allow 8090/tcp

# Or temporarily disable
sudo ufw disable
```

### Issue 2: Server Only Listening on Localhost

**Symptom:** Server works from same machine but not from device

**Check:**
```bash
netstat -an | grep 8090
# Should show: *:8090 or 0.0.0.0:8090
# NOT: 127.0.0.1:8090
```

**Solution:**
Server code is already correct. If still showing localhost only, check if you're running server with a specific host:

```bash
# Wrong:
node src/server.js --host localhost

# Right:
node src/server.js
# or
npm start
```

### Issue 3: Wrong IP Address in Device Config

**Symptom:** Device tries to connect but to wrong IP

**Find your correct IP:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Should show something like:
# inet 192.168.1.163 netmask 0xffffff00 broadcast 192.168.1.255
```

**Update device config with correct IP:**
```bash
telnet 192.168.1.128 17000
mount -o remount,rw /dev/root /
vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml

# Change all URLs to: http://192.168.1.163:8090
# (Use YOUR actual IP!)

reboot
```

### Issue 4: Device and Server on Different Networks

**Symptom:** Device can't ping server

**Check:**
```bash
# On server machine
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example: 192.168.1.163

# On device
# (via telnet)
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example: 192.168.1.128

# Both should be on same subnet (192.168.1.x)
```

**If different subnets:**
- Connect both to same WiFi network
- Or configure routing between networks

### Issue 5: Configuration Not Saved

**Symptom:** After editing config and rebooting, still shows old URLs

**Solution:**
```bash
telnet 192.168.1.128 17000

# IMPORTANT: Make filesystem writable FIRST
mount -o remount,rw /dev/root /

# Verify it's writable
mount | grep "on / "
# Should show: rw (not ro)

# Now edit
vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml

# Save and verify
cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml | grep bmx

# Reboot
reboot
```

## Complete Test Procedure

### Test 1: Server Accessibility

```bash
# From your computer (not device)
curl http://YOUR_SERVER_IP:8090/account/default/devices

# Expected: JSON with devices
# If fails: Server not accessible, check firewall
```

### Test 2: Device to Server Connectivity

```bash
# Connect to device
telnet 192.168.1.128 17000

# Test from device
wget -O- http://YOUR_SERVER_IP:8090/account/default/devices

# Expected: JSON with devices
# If fails: Network/firewall issue
```

### Test 3: Device Configuration

```bash
# On device
cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml | grep -A 1 bmx

# Expected:
# <server name="bmx" url="http://YOUR_SERVER_IP:8090"/>
# <bmxRegistryUrl>http://YOUR_SERVER_IP:8090</bmxRegistryUrl>

# If wrong: Edit and reboot
```

### Test 4: Server Logs

```bash
# On server machine
npm start

# Press preset button on device
# Expected: See logs like:
# Preset 1 request from device: 08DF1F0EBF49
# BMX resolve: source=TUNEIN...

# If no logs: Device not connecting to server
```

## Quick Fix Script

Create a file `fix-device-access.sh`:

```bash
#!/bin/bash

DEVICE_IP="192.168.1.128"
SERVER_IP="192.168.1.163"  # CHANGE THIS TO YOUR SERVER IP
SERVER_PORT="8090"

echo "Testing server accessibility..."
if curl -s -f "http://${SERVER_IP}:${SERVER_PORT}/account/default/devices" > /dev/null; then
  echo "✓ Server is accessible from this machine"
else
  echo "✗ Server is NOT accessible"
  echo "  Check: Server is running (npm start)"
  echo "  Check: Firewall allows port ${SERVER_PORT}"
  exit 1
fi

echo ""
echo "Connect to device and run these commands:"
echo ""
echo "telnet ${DEVICE_IP} 17000"
echo ""
echo "# Test connectivity from device:"
echo "wget -O- http://${SERVER_IP}:${SERVER_PORT}/account/default/devices"
echo ""
echo "# If that works, update configuration:"
echo "mount -o remount,rw /dev/root /"
echo "vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml"
echo ""
echo "# Change ALL URLs to: http://${SERVER_IP}:${SERVER_PORT}"
echo ""
echo "# Clear cache:"
echo "rm -rf /opt/Bose/var/cache/*"
echo "rm -f /opt/Bose/var/*.xml"
echo ""
echo "# Reboot:"
echo "reboot"
echo ""
```

## Summary

**No server logs = Device not connecting to server**

Most likely causes:
1. **Firewall blocking port 8090** (most common)
2. **Wrong IP in device config**
3. **Device can't reach server** (network issue)

**Quick test:**
```bash
# From device (via telnet)
wget -O- http://YOUR_SERVER_IP:8090/account/default/devices

# If this works: Config issue
# If this fails: Network/firewall issue
```

**Next steps:**
1. Find your server IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
2. Test from device: `wget -O- http://YOUR_SERVER_IP:8090/account/default/devices`
3. If fails: Check firewall
4. If works: Update device config with correct IP
5. Reboot device
6. Watch server logs

---

**Need help?** Run: `./diagnose-device-config.sh 192.168.1.128 http://YOUR_SERVER_IP:8090`
