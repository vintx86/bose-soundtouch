import { parseStringPromise, Builder } from 'xml2js';

export class BassController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getBass(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const bass = device.getBass();
    const builder = new Builder({ rootName: 'bass' });

    const data = {
      targetbass: bass,
      actualbass: bass
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }

  async setBass(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const bass = parseInt(xml.bass?._ || xml.bass || '0', 10);
      device.setBass(bass);

      console.log(`Bass set to ${bass} for device ${device.name}`);

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error setting bass:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }

  async getBassCapabilities(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const builder = new Builder({ rootName: 'bassCapabilities' });

    const data = {
      bassMin: -9,
      bassMax: 0,
      bassDefault: 0
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }
}
