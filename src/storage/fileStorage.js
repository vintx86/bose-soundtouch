import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export class FileStorage {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
    if (!existsSync(join(this.dataDir, 'accounts'))) {
      mkdirSync(join(this.dataDir, 'accounts'), { recursive: true });
    }
  }

  getDevicePath(accountId, deviceId) {
    return join(this.dataDir, 'accounts', accountId, 'devices', deviceId);
  }

  ensureDevicePath(accountId, deviceId) {
    const path = this.getDevicePath(accountId, deviceId);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
    return path;
  }

  // Device Info
  saveDeviceInfo(accountId, deviceId, xmlData) {
    const path = this.ensureDevicePath(accountId, deviceId);
    writeFileSync(join(path, 'DeviceInfo.xml'), xmlData);
    console.log(`Saved DeviceInfo for ${deviceId}`);
  }

  loadDeviceInfo(accountId, deviceId) {
    const path = join(this.getDevicePath(accountId, deviceId), 'DeviceInfo.xml');
    if (existsSync(path)) {
      return readFileSync(path, 'utf8');
    }
    return null;
  }

  // Presets
  savePresets(accountId, deviceId, xmlData) {
    const path = this.ensureDevicePath(accountId, deviceId);
    writeFileSync(join(path, 'Presets.xml'), xmlData);
    console.log(`Saved Presets for ${deviceId}`);
  }

  loadPresets(accountId, deviceId) {
    const path = join(this.getDevicePath(accountId, deviceId), 'Presets.xml');
    if (existsSync(path)) {
      return readFileSync(path, 'utf8');
    }
    return null;
  }

  // Recents
  saveRecents(accountId, deviceId, xmlData) {
    const path = this.ensureDevicePath(accountId, deviceId);
    writeFileSync(join(path, 'Recents.xml'), xmlData);
    console.log(`Saved Recents for ${deviceId}`);
  }

  loadRecents(accountId, deviceId) {
    const path = join(this.getDevicePath(accountId, deviceId), 'Recents.xml');
    if (existsSync(path)) {
      return readFileSync(path, 'utf8');
    }
    return null;
  }

  // Sources
  saveSources(accountId, deviceId, xmlData) {
    const path = this.ensureDevicePath(accountId, deviceId);
    writeFileSync(join(path, 'Sources.xml'), xmlData);
    console.log(`Saved Sources for ${deviceId}`);
  }

  loadSources(accountId, deviceId) {
    const path = join(this.getDevicePath(accountId, deviceId), 'Sources.xml');
    if (existsSync(path)) {
      return readFileSync(path, 'utf8');
    }
    return null;
  }

  // List all devices for an account
  listDevices(accountId) {
    const accountPath = join(this.dataDir, 'accounts', accountId, 'devices');
    if (!existsSync(accountPath)) {
      return [];
    }
    return readdirSync(accountPath);
  }

  // Check if device exists
  deviceExists(accountId, deviceId) {
    const path = join(this.getDevicePath(accountId, deviceId), 'DeviceInfo.xml');
    return existsSync(path);
  }
}
