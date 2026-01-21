#!/bin/bash

# Test Preset Button Flow with TuneIn Integration
# This simulates what happens when a user presses a preset button on their Bose device

SERVER="http://localhost:8090"
DEVICE_ID="test-device-001"
ACCOUNT_ID="default"

echo "=== Testing Preset Button Flow with TuneIn ==="
echo ""

# Step 1: Search TuneIn for a station
echo "1. Searching TuneIn for BBC stations..."
curl -X GET "${SERVER}/tunein/search?query=BBC" \
  -H "Content-Type: application/xml"
echo ""
echo ""

# Step 2: Store a TuneIn preset (simulating user configuring preset via app)
echo "2. Storing TuneIn web radio preset to slot 1..."
curl -X POST "${SERVER}/storePreset?deviceId=${DEVICE_ID}&presetId=1" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" location="" stationId="s24939">
    <itemName>BBC Radio 1</itemName>
    <stationName>BBC Radio 1</stationName>
    <containerArt>http://cdn-profiles.tunein.com/s24939/images/logoq.png</containerArt>
  </ContentItem>'
echo ""
echo ""

# Step 3: Device presses preset button 1 and queries server for that preset
echo "3. Device presses preset button 1 and queries server..."
PRESET_RESPONSE=$(curl -s -X GET "${SERVER}/device/${DEVICE_ID}/presets?presetId=1&accountId=${ACCOUNT_ID}" \
  -H "Content-Type: application/xml")
echo "$PRESET_RESPONSE"
echo ""
echo ""

# Step 4: Device resolves TuneIn station to stream URL
echo "4. Device resolves TuneIn station to actual stream URL..."
curl -X POST "${SERVER}/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" stationId="s24939">
    <itemName>BBC Radio 1</itemName>
    <stationName>BBC Radio 1</stationName>
  </ContentItem>'
echo ""
echo ""

# Step 5: Get TuneIn station details directly
echo "5. Getting TuneIn station details for s24939..."
curl -X GET "${SERVER}/tunein/station/s24939" \
  -H "Content-Type: application/xml"
echo ""
echo ""

# Step 6: Store a direct stream URL preset (non-TuneIn)
echo "6. Storing direct stream URL preset to slot 2..."
curl -X POST "${SERVER}/storePreset?deviceId=${DEVICE_ID}&presetId=2" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one">
    <itemName>BBC Radio 1 Direct</itemName>
    <containerArt>http://example.com/art.jpg</containerArt>
  </ContentItem>'
echo ""
echo ""

# Step 7: Store Spotify preset
echo "7. Storing Spotify preset to slot 3..."
curl -X POST "${SERVER}/storePreset?deviceId=${DEVICE_ID}&presetId=3" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M" sourceAccount="spotify_user">
    <itemName>Today'\''s Top Hits</itemName>
    <containerArt>https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc</containerArt>
  </ContentItem>'
echo ""
echo ""

# Step 8: Test Spotify preset resolution (should pass through unchanged)
echo "8. Testing Spotify preset resolution (should pass through)..."
curl -X POST "${SERVER}/bmx/resolve" \
  -H "Content-Type: application/xml" \
  -d '<ContentItem source="SPOTIFY" type="playlist" location="spotify:playlist:37i9dQZF1DXcBWIGoYBM5M" sourceAccount="spotify_user">
    <itemName>Today'\''s Top Hits</itemName>
    <containerArt>https://i.scdn.co/image/ab67706f00000002724554ed6bed6f051d9b0bfc</containerArt>
  </ContentItem>'
echo ""
echo ""

# Step 9: Get all presets
echo "9. Getting all presets for device..."
curl -X GET "${SERVER}/device/${DEVICE_ID}/presets?accountId=${ACCOUNT_ID}" \
  -H "Content-Type: application/xml"
echo ""
echo ""

# Step 10: Get only TuneIn presets
echo "10. Getting only TuneIn presets for device..."
curl -X GET "${SERVER}/bmx/presets/${DEVICE_ID}?accountId=${ACCOUNT_ID}" \
  -H "Content-Type: application/xml"
echo ""
echo ""

# Step 11: Browse TuneIn categories
echo "11. Browsing TuneIn music category..."
curl -X GET "${SERVER}/tunein/browse?c=music" \
  -H "Content-Type: application/xml"
echo ""
echo ""

echo "=== Test Complete ==="
echo ""
echo "The preset data is now stored in: data/accounts/${ACCOUNT_ID}/devices/${DEVICE_ID}/Presets.xml"
echo ""
echo "Summary:"
echo "- Preset 1: TuneIn station (BBC Radio 1) - requires BMX resolution"
echo "- Preset 2: Direct stream URL - plays immediately"
echo "- Preset 3: Spotify playlist - passes through BMX, handled by device"
