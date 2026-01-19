import { parseStringPromise, Builder } from 'xml2js';

export class BalanceController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getBalance(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const balance = device.getBalance();
    const builder = new Builder({ rootName: 'balance' });

    const data = {
      targetbalance: balance,
      actualbalance: balance
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }

  async setBalance(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const balance = parseInt(xml.balance?._ || xml.balance || '0', 10);
      device.setBalance(balance);

      console.log(`Balance set to ${balance} for device ${device.name}`);

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error setting balance:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
