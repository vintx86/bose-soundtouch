import { Builder } from 'xml2js';

export class ListMediaServersController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async listMediaServers(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const builder = new Builder({ rootName: 'mediaServers' });

    const data = {
      mediaServer: [
        {
          $: { id: 'server1' },
          name: 'Local Media Server',
          location: 'http://192.168.1.50:8200'
        }
      ]
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }
}
