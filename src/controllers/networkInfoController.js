import { Builder } from 'xml2js';

export class NetworkInfoController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getNetworkInfo(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const builder = new Builder({ rootName: 'networkInfo' });

    const data = {
      type: 'SCM',
      ipAddress: device.host,
      macAddress: '00:00:00:00:00:00',
      ssid: 'HomeNetwork',
      signalStrength: '5'
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }
}
