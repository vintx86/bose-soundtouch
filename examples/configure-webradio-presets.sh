#!/bin/bash

# Script to configure web radio presets on a Bose SoundTouch device
# Usage: ./configure-webradio-presets.sh [deviceId]

BASE_URL="http://localhost:8090"
DEVICE_ID="${1:-device1}"

echo "========================================="
echo "Configuring Web Radio Presets"
echo "Device: $DEVICE_ID"
echo "========================================="
echo ""

# Preset 1: BBC Radio 1
echo "Setting Preset 1: BBC Radio 1"
curl -s -X POST "$BASE_URL/storePreset?deviceId=$DEVICE_ID&presetId=1" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one">
  <itemName>BBC Radio 1</itemName>
  <containerArt>https://cdn-profiles.tunein.com/s24939/images/logog.png</containerArt>
</ContentItem>'
echo " ✓"
echo ""

# Preset 2: Jazz Radio
echo "Setting Preset 2: Jazz Radio"
curl -s -X POST "$BASE_URL/storePreset?deviceId=$DEVICE_ID&presetId=2" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<ContentItem source="INTERNET_RADIO" type="station" location="http://jazz-wr01.ice.infomaniak.ch/jazz-wr01-128.mp3">
  <itemName>Jazz Radio</itemName>
  <containerArt>https://cdn-profiles.tunein.com/s8379/images/logog.png</containerArt>
</ContentItem>'
echo " ✓"
echo ""

# Preset 3: Classical Music (BBC Radio 3)
echo "Setting Preset 3: BBC Radio 3 (Classical)"
curl -s -X POST "$BASE_URL/storePreset?deviceId=$DEVICE_ID&presetId=3" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_radio_three">
  <itemName>BBC Radio 3 (Classical)</itemName>
  <containerArt>https://cdn-profiles.tunein.com/s24941/images/logog.png</containerArt>
</ContentItem>'
echo " ✓"
echo ""

# Preset 4: NPR News
echo "Setting Preset 4: NPR News"
curl -s -X POST "$BASE_URL/storePreset?deviceId=$DEVICE_ID&presetId=4" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<ContentItem source="INTERNET_RADIO" type="station" location="http://npr-ice.streamguys1.com/live.mp3">
  <itemName>NPR News</itemName>
  <containerArt>https://media.npr.org/chrome_svg/npr-logo.svg</containerArt>
</ContentItem>'
echo " ✓"
echo ""

# Preset 5: Smooth Jazz
echo "Setting Preset 5: Smooth Jazz"
curl -s -X POST "$BASE_URL/storePreset?deviceId=$DEVICE_ID&presetId=5" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<ContentItem source="INTERNET_RADIO" type="station" location="http://smoothjazz.cdnstream1.com/2586_128.mp3">
  <itemName>Smooth Jazz</itemName>
  <containerArt>https://cdn-profiles.tunein.com/s47219/images/logog.png</containerArt>
</ContentItem>'
echo " ✓"
echo ""

# Preset 6: BBC World Service
echo "Setting Preset 6: BBC World Service"
curl -s -X POST "$BASE_URL/storePreset?deviceId=$DEVICE_ID&presetId=6" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0" encoding="UTF-8"?>
<ContentItem source="INTERNET_RADIO" type="station" location="http://stream.live.vc.bbcmedia.co.uk/bbc_world_service">
  <itemName>BBC World Service</itemName>
  <containerArt>https://cdn-profiles.tunein.com/s24943/images/logog.png</containerArt>
</ContentItem>'
echo " ✓"
echo ""

echo "========================================="
echo "Preset Configuration Complete!"
echo "========================================="
echo ""

# Display configured presets
echo "Configured Presets:"
curl -s "$BASE_URL/presets?deviceId=$DEVICE_ID" | xmllint --format - 2>/dev/null || echo "OK"
echo ""

echo "Test a preset with:"
echo "  curl -X POST '$BASE_URL/key?deviceId=$DEVICE_ID' -H 'Content-Type: application/xml' -d '<key>PRESET_1</key>'"
echo ""
