#!/bin/bash

# Diagnostic script for device configuration issues
# Usage: ./diagnose-device-config.sh <device_ip> <server_url>

DEVICE_IP="${1:-192.168.1.128}"
SERVER_URL="${2:-http://192.168.1.163:8090}"
DEVICE_ID="08DF1F0EBF49"

echo "========================================="
echo "Device Configuration Diagnostic"
echo "========================================="
echo "Device IP:  $DEVICE_IP"
echo "Server URL: $SERVER_URL"
echo "Device ID:  $DEVICE_ID"
echo ""

# Test 1: Can we reach the device?
echo "Test 1: Device Connectivity"
echo "---------------------------------------"
if ping -c 1 -W 1 $DEVICE_IP > /dev/null 2>&1; then
  echo "✓ Device is reachable"
else
  echo "✗ Device is NOT reachable"
  echo "  Check: Device is powered on and on network"
  exit 1
fi
echo ""

# Test 2: Can device reach server?
echo "Test 2: Server Connectivity from Device"
echo "---------------------------------------"
echo "Note: This requires telnet access to device"
echo "Manual test: telnet $DEVICE_IP 17000"
echo "Then run: wget -O- $SERVER_URL/account/default/devices"
echo ""

# Test 3: Server is running?
echo "Test 3: Server Status"
echo "---------------------------------------"
if curl -s -f "$SERVER_URL/account/default/devices" > /dev/null 2>&1; then
  echo "✓ Server is running and accessible"
else
  echo "✗ Server is NOT accessible"
  echo "  Check: Server is running (npm start)"
  echo "  Check: Server URL is correct: $SERVER_URL"
  exit 1
fi
echo ""

# Test 4: Device registered on server?
echo "Test 4: Device Registration"
echo "---------------------------------------"
DEVICES=$(curl -s "$SERVER_URL/account/default/devices")
if echo "$DEVICES" | grep -q "$DEVICE_ID"; then
  echo "✓ Device is registered on server"
else
  echo "✗ Device is NOT registered on server"
  echo "  Run: ./scripts/configure-device-for-server.sh $DEVICE_IP $SERVER_URL"
fi
echo ""

# Test 5: Presets available?
echo "Test 5: Preset Data"
echo "---------------------------------------"
PRESETS=$(curl -s "$SERVER_URL/device/$DEVICE_ID/presets?presetId=1&accountId=default")
if echo "$PRESETS" | grep -q "Energy Zürich"; then
  echo "✓ Preset 1 data available"
  echo "  Name: Energy Zürich"
  echo "  Station: s47530"
else
  echo "✗ Preset 1 data NOT available or corrupted"
  echo "  Response:"
  echo "$PRESETS" | head -10
fi
echo ""

# Test 6: BMX resolve working?
echo "Test 6: BMX Stream Resolution"
echo "---------------------------------------"
BMX_RESPONSE=$(curl -s -X POST "$SERVER_URL/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="TUNEIN" type="stationurl" location="/v1/playback/station/s47530">
    <itemName>Energy Zürich</itemName>
  </ContentItem>')

if echo "$BMX_RESPONSE" | grep -q "energyzuerich"; then
  echo "✓ BMX resolve working"
  STREAM_URL=$(echo "$BMX_RESPONSE" | grep -o 'location="[^"]*"' | cut -d'"' -f2)
  echo "  Stream URL: $STREAM_URL"
else
  echo "✗ BMX resolve NOT working"
  echo "  Response:"
  echo "$BMX_RESPONSE"
fi
echo ""

# Test 7: Device API accessible?
echo "Test 7: Device API"
echo "---------------------------------------"
if curl -s -f "http://$DEVICE_IP:8090/info" > /dev/null 2>&1; then
  echo "✓ Device API is accessible"
  DEVICE_NAME=$(curl -s "http://$DEVICE_IP:8090/info" | grep -o '<name>[^<]*</name>' | sed 's/<[^>]*>//g' | head -1)
  echo "  Device Name: $DEVICE_NAME"
else
  echo "✗ Device API is NOT accessible"
  echo "  Check: Device allows API access"
fi
echo ""

echo "========================================="
echo "Configuration Instructions"
echo "========================================="
echo ""
echo "To configure device to use your server:"
echo ""
echo "1. Connect to device:"
echo "   telnet $DEVICE_IP 17000"
echo "   (login: root, no password)"
echo ""
echo "2. Make filesystem writable:"
echo "   mount -o remount,rw /dev/root /"
echo ""
echo "3. Check current configuration:"
echo "   cat /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml | grep -A 1 bmx"
echo ""
echo "4. If NOT pointing to your server, edit:"
echo "   vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml"
echo ""
echo "   Change ALL URLs to: $SERVER_URL"
echo "   Especially:"
echo "   - <server name=\"bmx\" url=\"$SERVER_URL\"/>"
echo "   - <bmxRegistryUrl>$SERVER_URL</bmxRegistryUrl>"
echo ""
echo "5. Clear cache:"
echo "   rm -rf /opt/Bose/var/cache/*"
echo "   rm -f /opt/Bose/var/*.xml"
echo ""
echo "6. Reboot:"
echo "   reboot"
echo ""
echo "7. Watch server logs:"
echo "   npm start"
echo "   (Press preset button and watch for requests)"
echo ""
echo "========================================="
echo ""
