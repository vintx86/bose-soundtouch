import { parseStringPromise, Builder } from 'xml2js';

export class PresetController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getPresets(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const presets = device.getPresets();
    const builder = new Builder({ rootName: 'presets' });
    
    const presetsData = {
      preset: presets.map(p => ({
        $: { id: p.id, createdOn: p.createdOn, updatedOn: p.updatedOn },
        ContentItem: {
          $: { 
            source: p.source,
            type: p.type,
            location: p.location,
            sourceAccount: p.sourceAccount || ''
          },
          itemName: p.name,
          containerArt: p.art || ''
        }
      }))
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(presetsData));
  }

  async selectPreset(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const contentItem = xml.ContentItem;
      const source = contentItem.$?.source;
      const location = contentItem.$?.location;
      const presetId = contentItem.$?.presetId;

      // Handle preset selection
      if (presetId) {
        const presets = device.getPresets();
        const preset = presets.find(p => p.id === presetId);
        
        if (preset) {
          device.setNowPlaying({
            source: preset.source,
            type: preset.type,
            name: preset.name,
            location: preset.location,
            art: preset.art,
            playStatus: 'PLAY_STATE'
          });
        }
      } else if (source && location) {
        // Direct source selection
        device.setNowPlaying({
          source,
          location,
          name: contentItem.itemName?.[0] || 'Unknown',
          playStatus: 'PLAY_STATE'
        });
      }

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error selecting preset:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
