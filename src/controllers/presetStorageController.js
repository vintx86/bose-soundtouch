import { parseStringPromise, Builder } from 'xml2js';

export class PresetStorageController {
  constructor(deviceManager, storage) {
    this.deviceManager = deviceManager;
    this.storage = storage;
  }

  async storePreset(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const deviceId = req.query.deviceId;
      const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';
      
      if (!deviceId) {
        return res.status(400).send('<error>Device ID required</error>');
      }

      const contentItem = xml.ContentItem;
      const presetId = req.query.presetId || '1'; // Preset slot 1-6

      if (parseInt(presetId) < 1 || parseInt(presetId) > 6) {
        return res.status(400).send('<error>Preset ID must be between 1 and 6</error>');
      }

      console.log(`Storing preset ${presetId} for device ${deviceId}`);
      console.log('ContentItem:', JSON.stringify(contentItem, null, 2));

      // Load existing presets from storage
      let existingPresets = [];
      const presetsXml = this.storage.loadPresets(accountId, deviceId);
      if (presetsXml) {
        try {
          const parsed = await parseStringPromise(presetsXml);
          if (parsed.presets?.preset) {
            const presetArray = Array.isArray(parsed.presets.preset) 
              ? parsed.presets.preset 
              : [parsed.presets.preset];
            
            existingPresets = presetArray.map(p => ({
              id: p.$?.id,
              name: p.ContentItem?.itemName?.[0] || 'Unnamed',
              source: p.ContentItem?.$?.source || 'INTERNET_RADIO',
              type: p.ContentItem?.$?.type || 'station',
              location: p.ContentItem?.$?.location || '',
              stationId: p.ContentItem?.$?.stationId || '',
              art: p.ContentItem?.containerArt?.[0] || '',
              sourceAccount: p.ContentItem?.$?.sourceAccount || '',
              createdOn: p.$?.createdOn || Date.now(),
              updatedOn: p.$?.updatedOn || Date.now()
            }));
          }
        } catch (error) {
          console.error('Error parsing existing presets:', error);
        }
      }

      console.log(`Loaded ${existingPresets.length} existing presets`);

      // Create new preset object
      const newPreset = {
        id: presetId,
        name: contentItem.itemName?.[0] || 'Unnamed Station',
        source: contentItem.$?.source || 'INTERNET_RADIO',
        type: contentItem.$?.type || 'station',
        location: contentItem.$?.location || '',
        stationId: contentItem.$?.stationId || '',
        art: contentItem.containerArt?.[0] || '',
        sourceAccount: contentItem.$?.sourceAccount || '',
        createdOn: Date.now(),
        updatedOn: Date.now()
      };

      // Find and update or add new
      const existingIndex = existingPresets.findIndex(p => p.id === presetId);
      if (existingIndex >= 0) {
        // Preserve createdOn from existing preset
        newPreset.createdOn = existingPresets[existingIndex].createdOn;
        existingPresets[existingIndex] = newPreset;
        console.log(`Updated preset ${presetId}: ${newPreset.name}`);
      } else {
        existingPresets.push(newPreset);
        console.log(`Added preset ${presetId}: ${newPreset.name}`);
      }

      // Sort by ID and keep only 6 presets
      existingPresets.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      if (existingPresets.length > 6) {
        existingPresets.splice(6);
      }

      // Save to persistent storage
      await this.savePresetsToStorage(deviceId, accountId, existingPresets);

      // Update device manager if device exists
      const device = this.deviceManager.getDevice(deviceId);
      if (device) {
        device.setPresets(existingPresets);
        
        // Emit update event
        this.deviceManager.emit('update', {
          type: 'presetsUpdated',
          deviceId: device.id,
          presets: existingPresets
        });
      }

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error storing preset:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }

  async removePreset(req, res) {
    const deviceId = req.query.deviceId;
    const presetId = req.query.presetId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';
    
    if (!deviceId) {
      return res.status(400).send('<error>Device ID required</error>');
    }

    if (!presetId) {
      return res.status(400).send('<error>Preset ID required</error>');
    }

    // Load existing presets from storage
    let existingPresets = [];
    const presetsXml = this.storage.loadPresets(accountId, deviceId);
    if (presetsXml) {
      try {
        const parsed = await parseStringPromise(presetsXml);
        if (parsed.presets?.preset) {
          const presetArray = Array.isArray(parsed.presets.preset) 
            ? parsed.presets.preset 
            : [parsed.presets.preset];
          
          existingPresets = presetArray.map(p => ({
            id: p.$?.id,
            name: p.ContentItem?.itemName?.[0] || 'Unnamed',
            source: p.ContentItem?.$?.source || 'INTERNET_RADIO',
            type: p.ContentItem?.$?.type || 'station',
            location: p.ContentItem?.$?.location || '',
            stationId: p.ContentItem?.$?.stationId || '',
            art: p.ContentItem?.containerArt?.[0] || '',
            sourceAccount: p.ContentItem?.$?.sourceAccount || '',
            createdOn: p.$?.createdOn || Date.now(),
            updatedOn: p.$?.updatedOn || Date.now()
          }));
        }
      } catch (error) {
        console.error('Error parsing existing presets:', error);
      }
    }

    const presets = existingPresets.filter(p => p.id !== presetId);
    
    console.log(`Removed preset ${presetId} from device ${deviceId}`);

    // Save to persistent storage
    await this.savePresetsToStorage(deviceId, accountId, presets);

    // Update device manager if device exists
    const device = this.deviceManager.getDevice(deviceId);
    if (device) {
      device.setPresets(presets);
      
      // Emit update event
      this.deviceManager.emit('update', {
        type: 'presetsUpdated',
        deviceId: device.id,
        presets
      });
    }

    res.set('Content-Type', 'application/xml');
    res.send('<status>OK</status>');
  }

  async removeAllPresets(req, res) {
    const deviceId = req.query.deviceId;
    const accountId = req.headers['x-account-id'] || req.query.accountId || 'default';
    
    if (!deviceId) {
      return res.status(400).send('<error>Device ID required</error>');
    }

    console.log(`Removed all presets from device ${deviceId}`);

    // Save to persistent storage
    await this.savePresetsToStorage(deviceId, accountId, []);

    // Update device manager if device exists
    const device = this.deviceManager.getDevice(deviceId);
    if (device) {
      device.setPresets([]);
      
      // Emit update event
      this.deviceManager.emit('update', {
        type: 'presetsUpdated',
        deviceId: device.id,
        presets: []
      });
    }

    res.set('Content-Type', 'application/xml');
    res.send('<status>OK</status>');
  }

  /**
   * Convert in-memory presets to XML and save to persistent storage
   */
  async savePresetsToStorage(deviceId, accountId, presets) {
    if (!this.storage) {
      console.warn('Storage not available, skipping preset persistence');
      return;
    }

    // Convert presets to XML format expected by devices
    const builder = new Builder({ rootName: 'presets' });
    const presetsData = {
      preset: presets.map(p => ({
        $: {
          id: p.id,
          createdOn: p.createdOn || Date.now(),
          updatedOn: p.updatedOn || Date.now()
        },
        ContentItem: {
          $: {
            source: p.source || 'INTERNET_RADIO',
            type: p.type || 'station',
            location: p.location || '',
            stationId: p.stationId || undefined,
            sourceAccount: p.sourceAccount || '',
            isPresetable: 'true'
          },
          itemName: p.name,
          containerArt: p.art || ''
        }
      }))
    };

    const xml = builder.buildObject(presetsData);
    this.storage.savePresets(accountId, deviceId, xml);
    console.log(`Persisted ${presets.length} presets to storage for device ${deviceId}`);
  }
}
