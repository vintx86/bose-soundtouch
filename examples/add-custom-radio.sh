#!/bin/bash

# Script to add a custom web radio station to a preset
# Usage: ./add-custom-radio.sh <preset_id> <stream_url> <station_name> [device_id]

if [ $# -lt 3 ]; then
  echo "Usage: $0 <preset_id> <stream_url> <station_name> [device_id]"
  echo ""
  echo "Example:"
  echo "  $0 1 'http://stream.example.com:8000/radio' 'My Radio Station' device1"
  echo ""
  echo "Preset ID: 1-6"
  exit 1
fi

PRESET_ID="$1"
STREAM_URL="$2"
STATION_NAME="$3"
DEVICE_ID="${4:-device1}"
BASE_URL="http://localhost:8090"

# Validate preset ID
if [ "$PRESET_ID" -lt 1 ] || [ "$PRESET_ID" -gt 6 ]; then
  echo "Error: Preset ID must be between 1 and 6"
  exit 1
fi

echo "========================================="
echo "Adding Custom Web Radio Station"
echo "========================================="
echo "Preset ID:     $PRESET_ID"
echo "Station Name:  $STATION_NAME"
echo "Stream URL:    $STREAM_URL"
echo "Device:        $DEVICE_ID"
echo ""

# Test the stream URL first
echo "Testing stream URL..."
if curl -s -I --max-time 5 "$STREAM_URL" > /dev/null 2>&1; then
  echo "✓ Stream URL is accessible"
else
  echo "⚠ Warning: Could not verify stream URL (may still work)"
fi
echo ""

# Store the preset
echo "Storing preset..."
RESPONSE=$(curl -s -X POST "$BASE_URL/storePreset?deviceId=$DEVICE_ID&presetId=$PRESET_ID" \
  -H "Content-Type: application/xml" \
  -d "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<ContentItem source=\"INTERNET_RADIO\" type=\"station\" location=\"$STREAM_URL\">
  <itemName>$STATION_NAME</itemName>
</ContentItem>")

if echo "$RESPONSE" | grep -q "OK"; then
  echo "✓ Preset stored successfully!"
else
  echo "✗ Error storing preset:"
  echo "$RESPONSE"
  exit 1
fi
echo ""

# Test playback
echo "Testing playback..."
curl -s -X POST "$BASE_URL/select?deviceId=$DEVICE_ID" \
  -H "Content-Type: application/xml" \
  -d "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<ContentItem source=\"INTERNET_RADIO\" presetId=\"$PRESET_ID\">
  <itemName>$STATION_NAME</itemName>
</ContentItem>" > /dev/null

echo "✓ Preset activated"
echo ""

# Show now playing
echo "Now Playing:"
curl -s "$BASE_URL/now_playing?deviceId=$DEVICE_ID" | xmllint --format - 2>/dev/null | grep -A 2 "itemName"
echo ""

echo "========================================="
echo "Success!"
echo "========================================="
echo ""
echo "To play this preset, use:"
echo "  Preset button: curl -X POST '$BASE_URL/key?deviceId=$DEVICE_ID' -H 'Content-Type: application/xml' -d '<key>PRESET_$PRESET_ID</key>'"
echo ""
echo "Or select directly:"
echo "  curl -X POST '$BASE_URL/select?deviceId=$DEVICE_ID' -H 'Content-Type: application/xml' -d '<ContentItem source=\"INTERNET_RADIO\" presetId=\"$PRESET_ID\"><itemName>$STATION_NAME</itemName></ContentItem>'"
echo ""
