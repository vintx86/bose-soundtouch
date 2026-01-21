#!/bin/bash

# Test script for preset button resolution
# Tests the complete flow of preset button press

SERVER_URL="${1:-http://localhost:8090}"
DEVICE_ID="08DF1F0EBF49"
ACCOUNT_ID="default"

echo "========================================="
echo "Preset Button Resolution Test"
echo "========================================="
echo "Server: $SERVER_URL"
echo "Device: $DEVICE_ID"
echo ""

# Test 1: Get preset 1
echo "Test 1: Query Preset 1"
echo "---------------------------------------"
echo "Request: GET /device/$DEVICE_ID/presets?presetId=1"
echo ""

PRESET_RESPONSE=$(curl -s "${SERVER_URL}/device/${DEVICE_ID}/presets?presetId=1&accountId=${ACCOUNT_ID}")

echo "Response:"
echo "$PRESET_RESPONSE" | xmllint --format - 2>/dev/null || echo "$PRESET_RESPONSE"
echo ""

# Extract preset data for next test
SOURCE=$(echo "$PRESET_RESPONSE" | grep -o 'source="[^"]*"' | head -1 | cut -d'"' -f2)
LOCATION=$(echo "$PRESET_RESPONSE" | grep -o 'location="[^"]*"' | head -1 | cut -d'"' -f2)
ITEM_NAME=$(echo "$PRESET_RESPONSE" | grep -o '<itemName>[^<]*</itemName>' | sed 's/<[^>]*>//g')

echo "Extracted:"
echo "  Source: $SOURCE"
echo "  Location: $LOCATION"
echo "  Name: $ITEM_NAME"
echo ""

# Test 2: Resolve stream URL
echo "Test 2: Resolve Stream URL via BMX"
echo "---------------------------------------"
echo "Request: POST /bmx/resolve"
echo ""

BMX_REQUEST="<ContentItem source=\"$SOURCE\" type=\"stationurl\" location=\"$LOCATION\">
  <itemName>$ITEM_NAME</itemName>
</ContentItem>"

echo "Request Body:"
echo "$BMX_REQUEST"
echo ""

BMX_RESPONSE=$(curl -s -X POST "${SERVER_URL}/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d "$BMX_REQUEST")

echo "Response:"
echo "$BMX_RESPONSE" | xmllint --format - 2>/dev/null || echo "$BMX_RESPONSE"
echo ""

# Extract resolved stream URL
STREAM_URL=$(echo "$BMX_RESPONSE" | grep -o 'location="[^"]*"' | cut -d'"' -f2)

if [ -n "$STREAM_URL" ]; then
  echo "✓ Stream URL resolved: $STREAM_URL"
  echo ""
  
  # Test 3: Check if stream URL is accessible
  echo "Test 3: Verify Stream URL"
  echo "---------------------------------------"
  echo "Testing: $STREAM_URL"
  echo ""
  
  if curl -s -I "$STREAM_URL" | head -1 | grep -q "200\|302\|301"; then
    echo "✓ Stream URL is accessible"
  else
    echo "✗ Stream URL is not accessible"
    echo ""
    echo "Response:"
    curl -s -I "$STREAM_URL" | head -5
  fi
else
  echo "✗ Failed to resolve stream URL"
  echo ""
  echo "Check server logs for errors"
fi

echo ""
echo "========================================="
echo "Test Complete"
echo "========================================="
echo ""
echo "If all tests passed, preset button should work."
echo "If tests failed, check:"
echo "  1. Server is running: $SERVER_URL"
echo "  2. Device data exists: $DEVICE_ID"
echo "  3. TuneIn API is accessible"
echo "  4. Server logs for detailed errors"
echo ""
