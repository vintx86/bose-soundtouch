import { parseStringPromise, Builder } from 'xml2js';

export class GroupController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getGroup(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const builder = new Builder({ rootName: 'group' });

    const data = {
      $: { id: device.id },
      name: device.name,
      masterDeviceId: device.id,
      roles: {
        role: [
          { $: { type: 'NORMAL' }, _: device.id }
        ]
      }
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }

  async setGroup(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      console.log('Group configuration updated');

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error setting group:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
