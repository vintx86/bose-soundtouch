import express from 'express';
import { WebSocketServer } from 'ws';
import { DeviceManager } from './deviceManager.js';
import { FileStorage } from './storage/fileStorage.js';
import { PresetController } from './controllers/presetController.js';
import { PresetStorageController } from './controllers/presetStorageController.js';
import { ZoneController } from './controllers/zoneController.js';
import { PlaybackController } from './controllers/playbackController.js';
import { VolumeController } from './controllers/volumeController.js';
import { SourceController } from './controllers/sourceController.js';
import { BassController } from './controllers/bassController.js';
import { BalanceController } from './controllers/balanceController.js';
import { RecentsController } from './controllers/recentsController.js';
import { NameController } from './controllers/nameController.js';
import { CapabilitiesController } from './controllers/capabilitiesController.js';
import { TrackInfoController } from './controllers/trackInfoController.js';
import { NetworkInfoController } from './controllers/networkInfoController.js';
import { GroupController } from './controllers/groupController.js';
import { ListMediaServersController } from './controllers/listMediaServersController.js';
import { CloudReplacementController } from './controllers/cloudReplacementController.js';
import { BMXController } from './controllers/bmxController.js';

const app = express();
const PORT = process.env.PORT || 8090;

app.use(express.text({ type: 'application/xml' }));
app.use(express.json());

const deviceManager = new DeviceManager();
const storage = new FileStorage(process.env.DATA_DIR || './data');

// Controllers
const presetController = new PresetController(deviceManager);
const presetStorageController = new PresetStorageController(deviceManager, storage);
const zoneController = new ZoneController(deviceManager);
const playbackController = new PlaybackController(deviceManager);
const volumeController = new VolumeController(deviceManager);
const sourceController = new SourceController(deviceManager);
const bassController = new BassController(deviceManager);
const balanceController = new BalanceController(deviceManager);
const recentsController = new RecentsController(deviceManager);
const nameController = new NameController(deviceManager);
const capabilitiesController = new CapabilitiesController(deviceManager);
const trackInfoController = new TrackInfoController(deviceManager);
const networkInfoController = new NetworkInfoController(deviceManager);
const groupController = new GroupController(deviceManager);
const listMediaServersController = new ListMediaServersController(deviceManager);
const cloudReplacementController = new CloudReplacementController(deviceManager, storage);
const bmxController = new BMXController(deviceManager, storage);

// ============================================================================
// CLOUD REPLACEMENT ENDPOINTS (Devices connect TO server)
// These endpoints are called BY Bose devices when configured to use our server
// ============================================================================

// Device Registration & Management
app.post('/device/register', (req, res) => cloudReplacementController.registerDevice(req, res));
app.get('/device/:deviceId/config', (req, res) => cloudReplacementController.getDeviceConfig(req, res));

// Preset Sync (device-initiated)
app.post('/device/:deviceId/presets', (req, res) => cloudReplacementController.syncPresets(req, res));
app.get('/device/:deviceId/presets', (req, res) => cloudReplacementController.getPresets(req, res));

// Recents Sync (device-initiated)
app.post('/device/:deviceId/recents', (req, res) => cloudReplacementController.syncRecents(req, res));
app.get('/device/:deviceId/recents', (req, res) => cloudReplacementController.getRecents(req, res));

// Sources Sync (device-initiated)
app.post('/device/:deviceId/sources', (req, res) => cloudReplacementController.syncSources(req, res));
app.get('/device/:deviceId/sources', (req, res) => cloudReplacementController.getSources(req, res));

// Account Management
app.get('/account/:accountId/devices', (req, res) => cloudReplacementController.listDevices(req, res));

// ============================================================================
// BMX / TUNEIN ENDPOINTS (Internet Radio Integration)
// These endpoints handle TuneIn integration for web radio presets
// ============================================================================

// TuneIn Search & Browse
app.get('/tunein/search', (req, res) => bmxController.searchTuneIn(req, res));
app.get('/tunein/station/:stationId', (req, res) => bmxController.getTuneInStation(req, res));
app.get('/tunein/browse', (req, res) => bmxController.browseTuneIn(req, res));

// BMX Stream Resolution (called by devices when playing presets)
app.post('/bmx/resolve', (req, res) => bmxController.resolveStream(req, res));
app.get('/bmx/presets/:deviceId', (req, res) => bmxController.getTuneInPresets(req, res));

// TuneIn Authentication (optional)
app.post('/bmx/auth', (req, res) => bmxController.authenticateTuneIn(req, res));

// ============================================================================
// CONTROL API ENDPOINTS (Server connects TO devices)
// These endpoints are for controlling devices from external clients
// ============================================================================

// Device info
app.get('/info', async (req, res) => {
  const device = deviceManager.getDevice(req.query.deviceId);
  if (!device) {
    return res.status(404).send('<error>Device not found</error>');
  }
  res.set('Content-Type', 'application/xml');
  res.send(device.getInfo());
});

// Name
app.get('/name', (req, res) => nameController.getName(req, res));
app.post('/name', (req, res) => nameController.setName(req, res));

// Capabilities
app.get('/capabilities', (req, res) => capabilitiesController.getCapabilities(req, res));

// Network Info
app.get('/networkInfo', (req, res) => networkInfoController.getNetworkInfo(req, res));

// Presets
app.get('/presets', (req, res) => presetController.getPresets(req, res));
app.post('/select', (req, res) => presetController.selectPreset(req, res));
app.post('/storePreset', (req, res) => presetStorageController.storePreset(req, res));
app.post('/removePreset', (req, res) => presetStorageController.removePreset(req, res));
app.post('/removeAllPresets', (req, res) => presetStorageController.removeAllPresets(req, res));

// Recents
app.get('/recents', (req, res) => recentsController.getRecents(req, res));

// Now Playing
app.get('/now_playing', (req, res) => playbackController.getNowPlaying(req, res));

// Track Info
app.get('/trackInfo', (req, res) => trackInfoController.getTrackInfo(req, res));

// Key press
app.post('/key', (req, res) => playbackController.handleKey(req, res));

// Volume
app.get('/volume', (req, res) => volumeController.getVolume(req, res));
app.post('/volume', (req, res) => volumeController.setVolume(req, res));

// Bass
app.get('/bass', (req, res) => bassController.getBass(req, res));
app.post('/bass', (req, res) => bassController.setBass(req, res));
app.get('/bassCapabilities', (req, res) => bassController.getBassCapabilities(req, res));

// Balance
app.get('/balance', (req, res) => balanceController.getBalance(req, res));
app.post('/balance', (req, res) => balanceController.setBalance(req, res));

// Zones (Multiroom)
app.get('/getZone', (req, res) => zoneController.getZone(req, res));
app.post('/setZone', (req, res) => zoneController.setZone(req, res));
app.post('/removeZone', (req, res) => zoneController.removeZone(req, res));
app.post('/addZoneSlave', (req, res) => zoneController.addZoneSlave(req, res));
app.post('/removeZoneSlave', (req, res) => zoneController.removeZoneSlave(req, res));

// Group
app.get('/getGroup', (req, res) => groupController.getGroup(req, res));
app.post('/setGroup', (req, res) => groupController.setGroup(req, res));

// Sources
app.get('/sources', (req, res) => sourceController.getSources(req, res));

// Media Servers
app.get('/listMediaServers', (req, res) => listMediaServersController.listMediaServers(req, res));

const server = app.listen(PORT, () => {
  console.log(`Bose SoundTouch Server running on port ${PORT}`);
  console.log(`WebSocket notifications available at ws://localhost:${PORT}/notifications`);
  deviceManager.loadDevices();
});

// WebSocket for notifications
const wss = new WebSocketServer({ server, path: '/notifications' });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

deviceManager.on('update', (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
});
