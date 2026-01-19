import { parseStringPromise, Builder } from 'xml2js';

export class ZoneController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getZone(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const zone = this.deviceManager.getZone(device.id);
    const builder = new Builder({ rootName: 'zone' });

    if (!zone) {
      res.set('Content-Type', 'application/xml');
      return res.send('<zone><member role="NORMAL"/></zone>');
    }

    const zoneData = {
      $: { master: zone.master },
      member: [
        { $: { role: 'MASTER', ipaddress: device.host } },
        ...zone.slaves.map(slaveId => {
          const slave = this.deviceManager.getDevice(slaveId);
          return { $: { role: 'SLAVE', ipaddress: slave?.host || '' } };
        })
      ]
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(zoneData));
  }

  async setZone(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const zone = xml.zone;
      const members = zone.member || [];
      
      const slaveIds = members
        .filter(m => m.$?.role === 'SLAVE')
        .map(m => {
          const ip = m.$?.ipaddress;
          const slave = this.deviceManager.getAllDevices().find(d => d.host === ip);
          return slave?.id;
        })
        .filter(Boolean);

      this.deviceManager.createZone(device.id, slaveIds);

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error setting zone:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }

  async removeZone(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    this.deviceManager.removeZone(device.id);

    res.set('Content-Type', 'application/xml');
    res.send('<status>OK</status>');
  }

  async addZoneSlave(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const slaveIp = xml.zone?.member?.[0]?.$?.ipaddress;
      const slave = this.deviceManager.getAllDevices().find(d => d.host === slaveIp);
      
      if (slave) {
        this.deviceManager.addSlaveToZone(device.id, slave.id);
      }

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error adding zone slave:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }

  async removeZoneSlave(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const slaveIp = xml.zone?.member?.[0]?.$?.ipaddress;
      const slave = this.deviceManager.getAllDevices().find(d => d.host === slaveIp);
      
      if (slave) {
        this.deviceManager.removeSlaveFromZone(device.id, slave.id);
      }

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error removing zone slave:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
