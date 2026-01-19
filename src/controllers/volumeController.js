import { parseStringPromise, Builder } from 'xml2js';

export class VolumeController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getVolume(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const volume = device.getVolume();
    const builder = new Builder({ rootName: 'volume' });

    const data = {
      targetvolume: volume,
      actualvolume: volume,
      muteenabled: 'false'
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }

  async setVolume(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const volume = parseInt(xml.volume?._ || xml.volume || '30', 10);
      device.setVolume(volume);

      console.log(`Volume set to ${volume} for device ${device.name}`);

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error setting volume:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
