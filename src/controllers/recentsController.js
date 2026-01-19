import { Builder } from 'xml2js';

export class RecentsController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getRecents(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const recents = device.getRecents();
    const builder = new Builder({ rootName: 'recents' });

    const recentsData = {
      recent: recents.map(r => ({
        $: { deviceID: device.id, utcTime: r.utcTime },
        ContentItem: {
          $: { 
            source: r.source,
            type: r.type,
            location: r.location,
            sourceAccount: r.sourceAccount || '',
            isPresetable: 'true'
          },
          itemName: r.name,
          containerArt: r.art || ''
        }
      }))
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(recentsData));
  }
}
