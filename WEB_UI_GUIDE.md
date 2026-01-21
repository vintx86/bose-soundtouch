# Web UI Guide

The Bose SoundTouch Server includes a comprehensive web-based user interface for managing devices, presets, playback, and zones.

## Accessing the Web UI

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8090
   ```

## Features Overview

The Web UI is organized into 6 main tabs:

### 1. Devices Tab

**Manage your SoundTouch devices**

- **View Registered Devices**: See all devices that have registered with the server
- **Add New Device**: Manually register a device by providing:
  - Device ID
  - Device Name
  - IP Address
  - Port (default: 8090)
- **Refresh Devices**: Reload the device list from the server

**Use Cases:**
- Monitor which devices are connected
- Add devices that haven't auto-registered
- Verify device configuration

---

### 2. Presets Tab

**Configure and manage presets for your devices**

#### View Presets
- Select a device from the dropdown
- See all 6 preset slots with their configured content
- View preset type (Internet Radio, Spotify, etc.)
- Delete individual presets

#### Add/Edit Presets
Configure presets for any of the 6 slots:

**Internet Radio (TuneIn):**
- Enter TuneIn Station ID (e.g., s24939)
- Use "Search TuneIn" button to find stations
- Station ID provides automatic stream URL resolution
- Best for most internet radio stations

**Internet Radio (Direct URL):**
- Enter direct stream URL (http://...)
- Use for stations not on TuneIn
- Immediate playback without resolution
- Good for custom/private streams

**Spotify:**
- Enter Spotify URI
- Formats supported:
  - Playlist: `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`
  - Album: `spotify:album:6DEjYFkNZh67HP7R9PSZvv`
  - Track: `spotify:track:3n3Ppam7vgaVa1iaRUc9Lp`
  - Artist: `spotify:artist:0OdUWJ0sBjDrqHygGUXeCF`

**Common Fields:**
- Preset Name: Display name for the preset
- Cover Art URL: Optional image URL

#### TuneIn Search
- Search for stations by name, genre, or location
- Click a result to auto-fill the preset form
- Results show station name and TuneIn ID

---

### 3. Playback Tab

**Control playback and audio settings**

#### Now Playing
- View current track information
- See album art
- Display source (Spotify, Internet Radio, etc.)
- Shows artist, album, and track name

#### Playback Controls
- **Previous Track** (⏮️)
- **Play** (▶️)
- **Pause** (⏸️)
- **Stop** (⏹️)
- **Next Track** (⏭️)

#### Volume Control
- Slider: 0-100
- Real-time adjustment
- Mute button

#### Audio Controls
- **Bass**: -9 to 0 (boost/cut low frequencies)
- **Balance**: -10 to 10 (left/right speaker balance)

#### Quick Actions
- Load preset buttons (1-6)
- Click any preset to play it immediately
- Shows preset names for easy identification

---

### 4. Zones Tab

**Create and manage multiroom zones**

#### View Active Zones
- See current zone configuration
- View master and slave devices
- Display device roles and IP addresses
- Dissolve zones with one click

#### Create Zone
1. Select master device (controls playback)
2. Check slave devices to add to zone
3. Click "Create Zone"
4. All devices play synchronized audio

**Zone Roles:**
- **Master**: Controls playback, volume, and content
- **Slave**: Follows master's playback

**Use Cases:**
- Whole-home audio
- Party mode (multiple rooms)
- Synchronized playback across floors

---

### 5. TuneIn Tab

**Search and browse TuneIn radio stations**

#### Search
- Enter search query (station name, genre, location)
- View up to 20 results
- Click any station to use in preset configuration

#### Browse Categories
Quick access to TuneIn categories:
- 📍 **Local Radio**: Stations in your area
- 🎵 **Music**: Music stations by genre
- 💬 **Talk**: Talk radio and podcasts
- ⚽ **Sports**: Sports radio
- 📰 **News**: News stations
- 🌍 **World**: International stations

#### Popular Stations
Pre-configured shortcuts to popular stations:
- BBC Radio 1 (s24939)
- BBC Radio 2 (s24940)
- BBC Radio 4 (s50419)
- NPR (s44260)

Click any station to auto-fill preset form.

---

### 6. Settings Tab

**Configure server and authentication**

#### Server Settings
- **Server URL**: API endpoint (default: http://localhost:8090)
- **Account ID**: Account identifier (default: default)
- Settings saved to browser localStorage

#### TuneIn Authentication
- Optional: Required for premium TuneIn features
- Enter TuneIn username and password
- Click "Authenticate" to enable premium features

#### About
- Server information
- Feature summary
- Endpoint count

---

## Common Workflows

### Workflow 1: Add a TuneIn Radio Preset

1. Go to **TuneIn** tab
2. Search for your station (e.g., "BBC Radio 1")
3. Click the station in results
4. Automatically switches to **Presets** tab with station filled in
5. Select preset slot (1-6)
6. Optionally add cover art URL
7. Click "Save Preset"
8. Preset is now available on device

### Workflow 2: Create a Spotify Preset

1. Go to **Presets** tab
2. Select device
3. Choose preset slot (1-6)
4. Select "Spotify" as source type
5. Enter Spotify URI (e.g., `spotify:playlist:37i9dQZF1DXcBWIGoYBM5M`)
6. Enter preset name
7. Optionally add cover art URL
8. Click "Save Preset"

### Workflow 3: Control Playback

1. Go to **Playback** tab
2. Select device
3. Use playback controls (play, pause, stop, etc.)
4. Adjust volume with slider
5. Fine-tune bass and balance
6. Load presets for quick access

### Workflow 4: Create Multiroom Zone

1. Go to **Zones** tab
2. Select master device (main speaker)
3. Check slave devices (additional speakers)
4. Click "Create Zone"
5. All speakers now play synchronized audio
6. Control all from master device

### Workflow 5: Browse TuneIn Categories

1. Go to **TuneIn** tab
2. Click a category button (e.g., "Music")
3. Browse results
4. Click any station to use in preset

---

## Tips & Tricks

### Preset Management
- Use descriptive names for easy identification
- Add cover art URLs for visual appeal
- TuneIn station IDs are more reliable than direct URLs
- Test presets after saving

### Playback Control
- Volume changes apply immediately
- Bass and balance adjust in real-time
- Use preset buttons for quick switching
- Refresh now playing to see current status

### Zone Management
- Master device controls all playback
- Slaves follow master automatically
- Dissolve zones when done
- All devices must be on same network

### TuneIn Search
- Be specific in search queries
- Use station name or call letters
- Browse categories for discovery
- Popular stations are pre-configured

### Settings
- Server URL must include http://
- Account ID organizes devices
- Settings persist across sessions
- TuneIn auth is optional

---

## Keyboard Shortcuts

Currently, the UI is mouse/touch-driven. Keyboard shortcuts may be added in future versions.

---

## Mobile Support

The Web UI is fully responsive and works on:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

**Mobile Optimizations:**
- Touch-friendly buttons
- Responsive grid layouts
- Collapsible sections
- Optimized for small screens

---

## Browser Compatibility

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- JavaScript enabled
- LocalStorage support
- Fetch API support
- CSS Grid support

---

## Troubleshooting

### Web UI Won't Load

**Problem**: Browser shows "Cannot connect" or blank page

**Solutions:**
1. Verify server is running: `npm start`
2. Check server URL in browser: `http://localhost:8090`
3. Check firewall settings
4. Try different browser
5. Clear browser cache

### Devices Not Showing

**Problem**: Device list is empty

**Solutions:**
1. Click "Refresh Devices"
2. Verify devices have registered with server
3. Check account ID in settings
4. Review server logs for registration errors

### Presets Not Loading

**Problem**: Preset list shows "No presets configured"

**Solutions:**
1. Select correct device from dropdown
2. Verify device has presets configured
3. Check account ID matches device account
4. Try refreshing the page

### Playback Controls Not Working

**Problem**: Buttons don't control device

**Solutions:**
1. Verify correct device is selected
2. Check device is online and reachable
3. Review server logs for errors
4. Ensure device is not in standby mode

### TuneIn Search Returns No Results

**Problem**: Search shows "No results found"

**Solutions:**
1. Check internet connectivity
2. Try different search terms
3. Use browse categories instead
4. Verify TuneIn API is accessible

### Volume/Bass/Balance Not Changing

**Problem**: Sliders move but audio doesn't change

**Solutions:**
1. Verify device supports the feature
2. Check device is not muted
3. Ensure device is playing content
4. Try refreshing device status

---

## API Integration

The Web UI uses the server's REST API. All operations can also be performed via:
- Command line (curl)
- Scripts (bash, Python, etc.)
- Home automation systems
- Custom applications

See [API_REFERENCE.md](API_REFERENCE.md) for complete API documentation.

---

## Future Enhancements

Potential improvements for future versions:

**Features:**
- Real-time updates via WebSocket
- Drag-and-drop preset reordering
- Playlist management
- Recent items history
- Device discovery
- Backup/restore presets
- Multi-device control
- Keyboard shortcuts
- Dark mode
- Customizable themes

**User Experience:**
- Undo/redo operations
- Bulk preset operations
- Preset templates
- Import/export presets
- Device grouping
- Favorites management

---

## Security Considerations

**Current Implementation:**
- No authentication required
- Intended for local network use
- All traffic unencrypted (HTTP)

**For Production Use:**
- Add authentication (username/password)
- Enable HTTPS
- Restrict network access
- Use firewall rules
- Consider VPN for remote access

---

## Performance

**Optimizations:**
- Minimal JavaScript dependencies
- Efficient DOM updates
- LocalStorage for settings
- Responsive design
- Fast load times

**Resource Usage:**
- Low CPU usage
- Minimal memory footprint
- No background polling (manual refresh)
- Efficient API calls

---

## Accessibility

**Current Support:**
- Semantic HTML
- Keyboard navigation (basic)
- Screen reader compatible (basic)
- High contrast support

**Future Improvements:**
- ARIA labels
- Full keyboard navigation
- Screen reader optimization
- Accessibility audit

---

## Related Documentation

- [README.md](README.md) - Project overview
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [PRESET_TYPES_GUIDE.md](PRESET_TYPES_GUIDE.md) - Preset configuration guide
- [TUNEIN_INTEGRATION.md](TUNEIN_INTEGRATION.md) - TuneIn integration details
- [USAGE.md](USAGE.md) - Command-line usage examples
