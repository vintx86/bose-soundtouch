import { parseStringPromise } from 'xml2js';

export class PresetStorageController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async storePreset(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const contentItem = xml.ContentItem;
      const presetId = req.query.presetId || '1'; // Preset slot 1-6

      if (parseInt(presetId) < 1 || parseInt(presetId) > 6) {
        return res.status(400).send('<error>Preset ID must be between 1 and 6</error>');
      }

      const preset = {
        id: presetId,
        name: contentItem.itemName?.[0] || 'Unnamed Station',
        source: contentItem.$?.source || 'INTERNET_RADIO',
        type: contentItem.$?.type || 'station',
        location: contentItem.$?.location || '',
        art: contentItem.containerArt?.[0] || '',
        sourceAccount: contentItem.$?.sourceAccount || '',
        createdOn: Date.now(),
        updatedOn: Date.now()
      };

      // Get current presets
      const presets = device.getPresets();
      
      // Find and update or add new
      const existingIndex = presets.findIndex(p => p.id === presetId);
      if (existingIndex >= 0) {
        presets[existingIndex] = preset;
        console.log(`Updated preset ${presetId} for ${device.name}: ${preset.name}`);
      } else {
        presets.push(preset);
        console.log(`Added preset ${presetId} for ${device.name}: ${preset.name}`);
      }

      // Sort by ID and keep only 6 presets
      presets.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      if (presets.length > 6) {
        presets.splice(6);
      }

      device.setPresets(presets);

      // Emit update event
      this.deviceManager.emit('update', {
        type: 'presetsUpdated',
        deviceId: device.id,
        presets
      });

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error storing preset:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }

  async removePreset(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    const presetId = req.query.presetId;
    
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    if (!presetId) {
      return res.status(400).send('<error>Preset ID required</error>');
    }

    const presets = device.getPresets().filter(p => p.id !== presetId);
    device.setPresets(presets);

    console.log(`Removed preset ${presetId} from ${device.name}`);

    // Emit update event
    this.deviceManager.emit('update', {
      type: 'presetsUpdated',
      deviceId: device.id,
      presets
    });

    res.set('Content-Type', 'application/xml');
    res.send('<status>OK</status>');
  }

  async removeAllPresets(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    device.setPresets([]);

    console.log(`Removed all presets from ${device.name}`);

    // Emit update event
    this.deviceManager.emit('update', {
      type: 'presetsUpdated',
      deviceId: device.id,
      presets: []
    });

    res.set('Content-Type', 'application/xml');
    res.send('<status>OK</status>');
  }
}
