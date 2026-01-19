export class Device {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.host = config.host;
    this.port = config.port || 8090;
    this.presets = [];
    this.recents = [];
    this.currentSource = null;
    this.volume = 30;
    this.bass = 0;
    this.balance = 0;
    this.nowPlaying = null;
  }

  getInfo() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<info deviceID="${this.id}">
  <name>${this.name}</name>
  <type>SoundTouch</type>
  <networkInfo>
    <ipAddress>${this.host}</ipAddress>
    <macAddress>00:00:00:00:00:00</macAddress>
  </networkInfo>
</info>`;
  }

  setPresets(presets) {
    this.presets = presets;
  }

  getPresets() {
    return this.presets;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(100, volume));
  }

  getVolume() {
    return this.volume;
  }

  setBass(bass) {
    this.bass = Math.max(-9, Math.min(0, bass));
  }

  getBass() {
    return this.bass;
  }

  setBalance(balance) {
    this.balance = Math.max(-10, Math.min(10, balance));
  }

  getBalance() {
    return this.balance;
  }

  setNowPlaying(nowPlaying) {
    this.nowPlaying = nowPlaying;
    // Add to recents
    if (nowPlaying) {
      this.addToRecents(nowPlaying);
    }
  }

  getNowPlaying() {
    return this.nowPlaying;
  }

  addToRecents(item) {
    const recent = {
      ...item,
      utcTime: Date.now()
    };
    this.recents.unshift(recent);
    // Keep only last 20 items
    if (this.recents.length > 20) {
      this.recents = this.recents.slice(0, 20);
    }
  }

  getRecents() {
    return this.recents;
  }

  setName(name) {
    this.name = name;
  }
}
