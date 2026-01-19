import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Device } from './models/device.js';
import { initializeDefaultPresets } from './utils/presetInitializer.js';

export class DeviceManager extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.zones = new Map();
  }

  loadDevices() {
    const configPath = './config/devices.json';
    if (!existsSync(configPath)) {
      console.log('No devices.json found, creating default...');
      this.createDefaultConfig();
      return;
    }

    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      config.devices.forEach(deviceConfig => {
        const device = new Device(deviceConfig);
        initializeDefaultPresets(device);
        this.devices.set(device.id, device);
        console.log(`Loaded device: ${device.name} (${device.id})`);
      });
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  createDefaultConfig() {
    const defaultConfig = {
      devices: [
        {
          id: 'device1',
          name: 'Living Room Speaker',
          host: '192.168.1.100',
          port: 8090
        }
      ]
    };
    writeFileSync('./config/devices.json', JSON.stringify(defaultConfig, null, 2));
    console.log('Created default config at config/devices.json');
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId) || this.devices.values().next().value;
  }

  getAllDevices() {
    return Array.from(this.devices.values());
  }

  registerDevice(config) {
    const device = new Device(config);
    this.devices.set(device.id, device);
    console.log(`Registered device: ${device.name} (${device.id})`);
    this.emit('update', { type: 'deviceRegistered', device: device.id });
    return device;
  }

  unregisterDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      console.log(`Unregistered device: ${device.name} (${device.id})`);
      this.emit('update', { type: 'deviceUnregistered', device: deviceId });
    }
  }

  createZone(masterId, slaveIds) {
    const master = this.getDevice(masterId);
    if (!master) return null;

    const zone = {
      master: masterId,
      slaves: slaveIds,
      created: new Date()
    };

    this.zones.set(masterId, zone);
    this.emit('update', { type: 'zoneUpdated', zone });
    return zone;
  }

  getZone(deviceId) {
    return this.zones.get(deviceId);
  }

  removeZone(masterId) {
    const zone = this.zones.get(masterId);
    if (zone) {
      this.zones.delete(masterId);
      this.emit('update', { type: 'zoneRemoved', masterId });
    }
    return zone;
  }

  addSlaveToZone(masterId, slaveId) {
    const zone = this.zones.get(masterId);
    if (zone && !zone.slaves.includes(slaveId)) {
      zone.slaves.push(slaveId);
      this.emit('update', { type: 'zoneUpdated', zone });
    }
    return zone;
  }

  removeSlaveFromZone(masterId, slaveId) {
    const zone = this.zones.get(masterId);
    if (zone) {
      zone.slaves = zone.slaves.filter(id => id !== slaveId);
      this.emit('update', { type: 'zoneUpdated', zone });
    }
    return zone;
  }
}
