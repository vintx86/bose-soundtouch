import { Builder } from 'xml2js';

export class CapabilitiesController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getCapabilities(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const builder = new Builder({ rootName: 'capabilities' });

    const data = {
      networkConfig: [
        { $: { type: 'SCM' } },
        { $: { type: 'ETHERNET' } },
        { $: { type: 'WIFI' } }
      ],
      bluetoothProfile: [
        { _: 'A2DP_SINK' },
        { _: 'A2DP_SOURCE' }
      ]
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }
}
