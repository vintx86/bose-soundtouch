import { parseStringPromise, Builder } from 'xml2js';

/**
 * Cloud Replacement Controller
 * Implements endpoints that Bose devices expect from cloud servers (marge, bmx)
 * This allows devices to connect TO our server instead of Bose servers
 */
export class CloudReplacementController {
  constructor(deviceManager, storage) {
    this.deviceManager = deviceManager;
    this.storage = storage;
  }

  /**
   * Device Registration
   * Called by device on boot to register itself
   * POST /device/register
   */
  async registerDevice(req, res) {
    try {
      const deviceInfo = await parseStringPromise(req.body);
      const deviceId = deviceInfo.info?.$?.deviceID || deviceInfo.info?.deviceID?.[0];
      const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

      if (!deviceId) {
        return res.status(400).send('<error>Device ID required</error>');
      }

      console.log(`Device registration: ${deviceId} (Account: ${accountId})`);

      // Store device info
      this.storage.saveDeviceInfo(accountId, deviceId, req.body);

      // Check if device already exists in manager
      let device = this.deviceManager.getDevice(deviceId);
      if (!device) {
        // Auto-register device
        const deviceName = deviceInfo.info?.name?.[0] || `Device ${deviceId}`;
        const deviceHost = req.ip || req.connection.remoteAddress;
        
        this.deviceManager.registerDevice({
          id: deviceId,
          name: deviceName,
          host: deviceHost,
          port: 8090,
          accountId: accountId
        });

        console.log(`Auto-registered device: ${deviceName} (${deviceId})`);
      }

      // Return success
      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error registering device:', error);
      res.status(500).send('<error>Registration failed</error>');
    }
  }

  /**
   * Get Device Configuration
   * Called by device to get its configuration from server
   * GET /device/:deviceId/config
   */
  async getDeviceConfig(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`Config request from device: ${deviceId}`);

    // Load stored device info
    const deviceInfo = this.storage.loadDeviceInfo(accountId, deviceId);
    
    if (deviceInfo) {
      res.set('Content-Type', 'application/xml');
      res.send(deviceInfo);
    } else {
      res.status(404).send('<error>Device not found</error>');
    }
  }

  /**
   * Sync Presets
   * Device sends its current presets to be stored
   * POST /device/:deviceId/presets
   */
  async syncPresets(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`Preset sync from device: ${deviceId}`);

    try {
      // Store presets
      this.storage.savePresets(accountId, deviceId, req.body);

      // Update device manager
      const device = this.deviceManager.getDevice(deviceId);
      if (device) {
        const presets = await parseStringPromise(req.body);
        // Update device presets in memory
        if (presets.presets?.preset) {
          const presetArray = Array.isArray(presets.presets.preset) 
            ? presets.presets.preset 
            : [presets.presets.preset];
          
          const formattedPresets = presetArray.map(p => ({
            id: p.$?.id,
            name: p.ContentItem?.itemName?.[0] || 'Unnamed',
            source: p.ContentItem?.$?.source,
            type: p.ContentItem?.$?.type,
            location: p.ContentItem?.$?.location,
            art: p.ContentItem?.containerArt?.[0] || '',
            sourceAccount: p.ContentItem?.$?.sourceAccount || '',
            createdOn: p.$?.createdOn,
            updatedOn: p.$?.updatedOn
          }));
          
          device.setPresets(formattedPresets);
        }
      }

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error syncing presets:', error);
      res.status(500).send('<error>Sync failed</error>');
    }
  }

  /**
   * Get Presets
   * Device requests its presets from server
   * GET /device/:deviceId/presets
   */
  async getPresets(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`Preset request from device: ${deviceId}`);

    const presets = this.storage.loadPresets(accountId, deviceId);
    
    if (presets) {
      res.set('Content-Type', 'application/xml');
      res.send(presets);
    } else {
      // Return empty presets
      res.set('Content-Type', 'application/xml');
      res.send('<presets/>');
    }
  }

  /**
   * Sync Recents
   * Device sends its recent items to be stored
   * POST /device/:deviceId/recents
   */
  async syncRecents(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`Recents sync from device: ${deviceId}`);

    try {
      this.storage.saveRecents(accountId, deviceId, req.body);

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error syncing recents:', error);
      res.status(500).send('<error>Sync failed</error>');
    }
  }

  /**
   * Get Recents
   * Device requests its recent items from server
   * GET /device/:deviceId/recents
   */
  async getRecents(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`Recents request from device: ${deviceId}`);

    const recents = this.storage.loadRecents(accountId, deviceId);
    
    if (recents) {
      res.set('Content-Type', 'application/xml');
      res.send(recents);
    } else {
      res.set('Content-Type', 'application/xml');
      res.send('<recents/>');
    }
  }

  /**
   * Sync Sources
   * Device sends its available sources to be stored
   * POST /device/:deviceId/sources
   */
  async syncSources(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`Sources sync from device: ${deviceId}`);

    try {
      this.storage.saveSources(accountId, deviceId, req.body);

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error syncing sources:', error);
      res.status(500).send('<error>Sync failed</error>');
    }
  }

  /**
   * Get Sources
   * Device requests its sources from server
   * GET /device/:deviceId/sources
   */
  async getSources(req, res) {
    const deviceId = req.params.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';

    console.log(`Sources request from device: ${deviceId}`);

    const sources = this.storage.loadSources(accountId, deviceId);
    
    if (sources) {
      res.set('Content-Type', 'application/xml');
      res.send(sources);
    } else {
      // Return default sources
      const builder = new Builder({ rootName: 'sources' });
      const data = {
        sourceItem: [
          { $: { source: 'INTERNET_RADIO', status: 'READY' } },
          { $: { source: 'SPOTIFY', status: 'READY' } }
        ]
      };
      res.set('Content-Type', 'application/xml');
      res.send(builder.buildObject(data));
    }
  }

  /**
   * List Devices
   * Get all devices for an account
   * GET /account/:accountId/devices
   */
  async listDevices(req, res) {
    const accountId = req.params.accountId || 'default';

    const deviceIds = this.storage.listDevices(accountId);
    const devices = deviceIds.map(id => {
      const info = this.storage.loadDeviceInfo(accountId, id);
      return { id, info };
    });

    res.json({ accountId, devices });
  }
}
