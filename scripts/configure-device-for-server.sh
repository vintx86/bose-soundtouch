#!/bin/bash

# Script to configure a Bose SoundTouch device to use our server
# Usage: ./configure-device-for-server.sh <device_ip> <server_url> [account_id]

if [ $# -lt 2 ]; then
  echo "Usage: $0 <device_ip> <server_url> [account_id]"
  echo ""
  echo "Example:"
  echo "  $0 192.168.1.100 http://soundcork.local:8090 default"
  echo ""
  echo "This script will:"
  echo "  1. Extract device information from the device"
  echo "  2. Upload it to your server"
  echo "  3. Provide instructions for device reconfiguration"
  exit 1
fi

DEVICE_IP="$1"
SERVER_URL="$2"
ACCOUNT_ID="${3:-default}"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "========================================="
echo "Bose SoundTouch Device Configuration"
echo "========================================="
echo "Device IP:  $DEVICE_IP"
echo "Server URL: $SERVER_URL"
echo "Account ID: $ACCOUNT_ID"
echo ""

# Step 1: Extract device information
echo "Step 1: Extracting device information..."
echo ""

echo "  - Getting device info..."
if curl -s "http://${DEVICE_IP}:8090/info" > "${TEMP_DIR}/DeviceInfo.xml"; then
  echo "    ✓ DeviceInfo.xml"
else
  echo "    ✗ Failed to get device info"
  echo ""
  echo "Make sure:"
  echo "  1. Device is powered on"
  echo "  2. Device IP is correct: $DEVICE_IP"
  echo "  3. Device is on same network"
  exit 1
fi

# Extract device ID
DEVICE_ID=$(grep -o 'deviceID="[^"]*"' "${TEMP_DIR}/DeviceInfo.xml" | cut -d'"' -f2)
DEVICE_NAME=$(grep -o '<name>[^<]*</name>' "${TEMP_DIR}/DeviceInfo.xml" | sed 's/<[^>]*>//g')

if [ -z "$DEVICE_ID" ]; then
  echo "    ✗ Could not extract device ID"
  exit 1
fi

echo "    Device ID: $DEVICE_ID"
echo "    Device Name: $DEVICE_NAME"
echo ""

echo "  - Getting presets..."
curl -s "http://${DEVICE_IP}:8090/presets" > "${TEMP_DIR}/Presets.xml"
echo "    ✓ Presets.xml"

echo "  - Getting recents..."
curl -s "http://${DEVICE_IP}:8090/recents" > "${TEMP_DIR}/Recents.xml"
echo "    ✓ Recents.xml"

echo ""

# Step 2: Upload to server
echo "Step 2: Uploading device data to server..."
echo ""

echo "  - Registering device..."
RESPONSE=$(curl -s -X POST "${SERVER_URL}/device/register" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: ${ACCOUNT_ID}" \
  --data-binary "@${TEMP_DIR}/DeviceInfo.xml")

if echo "$RESPONSE" | grep -q "OK"; then
  echo "    ✓ Device registered"
else
  echo "    ✗ Registration failed:"
  echo "$RESPONSE"
  exit 1
fi

echo "  - Uploading presets..."
curl -s -X POST "${SERVER_URL}/device/${DEVICE_ID}/presets" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: ${ACCOUNT_ID}" \
  --data-binary "@${TEMP_DIR}/Presets.xml" > /dev/null
echo "    ✓ Presets uploaded"

echo "  - Uploading recents..."
curl -s -X POST "${SERVER_URL}/device/${DEVICE_ID}/recents" \
  -H "Content-Type: application/xml" \
  -H "X-Account-ID: ${ACCOUNT_ID}" \
  --data-binary "@${TEMP_DIR}/Recents.xml" > /dev/null
echo "    ✓ Recents uploaded"

echo ""
echo "========================================="
echo "Device data uploaded successfully!"
echo "========================================="
echo ""

# Step 3: Instructions for device reconfiguration
echo "Step 3: Configure device to use your server"
echo ""
echo "⚠️  IMPORTANT: The following steps require physical access to the device"
echo ""
echo "1. Prepare USB drive:"
echo "   - Format USB drive as FAT32"
echo "   - Create empty file: touch /path/to/usb/remote_services"
echo ""
echo "2. Enable remote access:"
echo "   - Power off device"
echo "   - Insert USB drive into device"
echo "   - Power on device"
echo "   - Wait 30 seconds"
echo ""
echo "3. Connect to device:"
echo "   telnet ${DEVICE_IP}"
echo "   (login as 'root', no password)"
echo ""
echo "4. Make filesystem writable:"
echo "   mount -o remount,rw /dev/root /"
echo ""
echo "5. Backup original config:"
echo "   cp /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml.backup"
echo ""
echo "6. Edit configuration:"
echo "   vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml"
echo ""
echo "   Change ALL server URLs to: ${SERVER_URL}"
echo ""
echo "   Example:"
echo "   <server name=\"marge\" url=\"${SERVER_URL}\"/>"
echo "   <server name=\"bmx\" url=\"${SERVER_URL}\"/>"
echo "   <server name=\"stats\" url=\"${SERVER_URL}\"/>"
echo "   <server name=\"swUpdate\" url=\"${SERVER_URL}\"/>"
echo ""
echo "7. Reboot device:"
echo "   reboot"
echo ""
echo "8. Verify connection:"
echo "   Check server logs for: 'Device registration: ${DEVICE_ID}'"
echo ""
echo "========================================="
echo ""
echo "Need help? See DEVICE_CONFIGURATION_GUIDE.md"
echo ""

# Save instructions to file
INSTRUCTIONS_FILE="${TEMP_DIR}/device-${DEVICE_ID}-instructions.txt"
cat > "$INSTRUCTIONS_FILE" << EOF
Bose SoundTouch Device Configuration Instructions
Device: $DEVICE_NAME ($DEVICE_ID)
IP: $DEVICE_IP
Server: $SERVER_URL
Account: $ACCOUNT_ID

TELNET COMMANDS:
================

# Connect
telnet ${DEVICE_IP}
# Login: root (no password)

# Make writable
mount -o remount,rw /dev/root /

# Backup
cp /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml.backup

# Edit (change all URLs to ${SERVER_URL})
vi /opt/Bose/etc/SoundTouchSdkPrivateCfg.xml

# Reboot
reboot

VERIFICATION:
=============

# Check device appears in server
curl "${SERVER_URL}/account/${ACCOUNT_ID}/devices"

# Check device can get its config
curl "${SERVER_URL}/device/${DEVICE_ID}/config"

# Check presets
curl "${SERVER_URL}/device/${DEVICE_ID}/presets"

EOF

cp "$INSTRUCTIONS_FILE" "./device-${DEVICE_ID}-instructions.txt"
echo "Instructions saved to: device-${DEVICE_ID}-instructions.txt"
echo ""
