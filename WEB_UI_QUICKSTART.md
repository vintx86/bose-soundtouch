# Web UI Quick Start

Get started with the Bose SoundTouch Web UI in 5 minutes.

## Step 1: Start the Server

```bash
npm start
```

You should see:
```
Bose SoundTouch Server running on port 8090
WebSocket notifications available at ws://localhost:8090/notifications
```

## Step 2: Open Web UI

Open your browser and go to:
```
http://localhost:8090
```

You'll see the main interface with 6 tabs.

## Step 3: Configure a TuneIn Preset

### Quick Method:

1. Click the **TuneIn** tab
2. Click on a popular station (e.g., "BBC Radio 1")
3. You'll be switched to the **Presets** tab with the station pre-filled
4. Select a preset slot (1-6)
5. Click **Save Preset**

### Search Method:

1. Go to **TuneIn** tab
2. Enter a station name in the search box
3. Click **Search**
4. Click any result to use it
5. Select preset slot and save

## Step 4: Configure a Spotify Preset

1. Go to **Presets** tab
2. Select preset slot (1-6)
3. Change source type to **Spotify**
4. Enter Spotify URI (e.g., `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`)
5. Enter a name (e.g., "Today's Top Hits")
6. Click **Save Preset**

## Step 5: Control Playback

1. Go to **Playback** tab
2. Select your device
3. Click **Load Presets** button
4. Click any preset button to play it
5. Use playback controls (play, pause, stop, etc.)
6. Adjust volume with the slider

## Step 6: Create a Multiroom Zone

1. Go to **Zones** tab
2. Select master device (main speaker)
3. Check slave devices (additional speakers)
4. Click **Create Zone**
5. All speakers now play synchronized audio

## Common Tasks

### Add a Direct Stream URL Preset

1. **Presets** tab
2. Select slot
3. Change source to **Internet Radio (Direct URL)**
4. Enter stream URL: `http://stream.example.com/radio`
5. Enter name
6. Save

### Search for Jazz Stations

1. **TuneIn** tab
2. Enter "jazz" in search
3. Click **Search**
4. Browse results
5. Click any station to use

### Adjust Audio Settings

1. **Playback** tab
2. Use **Bass** slider (-9 to 0)
3. Use **Balance** slider (-10 to 10)
4. Changes apply immediately

### Browse TuneIn Categories

1. **TuneIn** tab
2. Click a category button (Music, Talk, Sports, etc.)
3. Browse results
4. Click any station to use

## Tips

- **Preset slots**: You have 6 slots per device (1-6)
- **TuneIn IDs**: More reliable than direct URLs
- **Spotify URIs**: Get from Spotify app (Share → Copy Link)
- **Volume**: Changes apply in real-time
- **Zones**: Master controls all playback
- **Settings**: Saved automatically to browser

## Troubleshooting

### Can't Access Web UI

**Problem**: Browser shows "Cannot connect"

**Solution**: 
- Verify server is running: `npm start`
- Check URL: `http://localhost:8090`
- Try `http://127.0.0.1:8090`

### No Devices Showing

**Problem**: Device list is empty

**Solution**:
- Click "Refresh Devices"
- Devices must register with server first
- See [DEVICE_CONFIGURATION_GUIDE.md](DEVICE_CONFIGURATION_GUIDE.md)

### Preset Not Playing

**Problem**: Click preset button but nothing happens

**Solution**:
- Verify device is online
- Check preset is saved correctly
- Review server logs for errors

## Next Steps

- Read [WEB_UI_GUIDE.md](WEB_UI_GUIDE.md) for complete documentation
- Configure your devices: [DEVICE_CONFIGURATION_GUIDE.md](DEVICE_CONFIGURATION_GUIDE.md)
- Learn about preset types: [PRESET_TYPES_GUIDE.md](PRESET_TYPES_GUIDE.md)
- Explore TuneIn integration: [TUNEIN_INTEGRATION.md](TUNEIN_INTEGRATION.md)

## Screenshots

The Web UI includes:

- **Devices Tab**: Grid view of all registered devices
- **Presets Tab**: Visual preset cards with source badges
- **Playback Tab**: Now playing card with album art and controls
- **Zones Tab**: Zone configuration with master/slave roles
- **TuneIn Tab**: Search results and category browsing
- **Settings Tab**: Server configuration and authentication

## Mobile Access

The Web UI works on mobile devices:

1. Find your server's IP address:
   ```bash
   ifconfig | grep inet  # macOS/Linux
   ipconfig              # Windows
   ```

2. On your phone/tablet, open browser and go to:
   ```
   http://YOUR_SERVER_IP:8090
   ```

3. Use the responsive mobile interface

## Keyboard Shortcuts

Currently mouse/touch-driven. Keyboard shortcuts may be added in future versions.

## Browser Support

Works on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Fast load times
- Minimal resource usage
- No background polling
- Efficient API calls

Enjoy your Bose SoundTouch Web UI! 🎵
