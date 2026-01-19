import { parseStringPromise, Builder } from 'xml2js';

export class NameController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getName(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const builder = new Builder({ rootName: 'name' });
    const data = { _: device.name };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }

  async setName(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const name = xml.name?._ || xml.name || device.name;
      device.setName(name);

      console.log(`Device name changed to: ${name}`);

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error setting name:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
