import { parseStringPromise, Builder } from 'xml2js';

export class PlaybackController {
  constructor(deviceManager) {
    this.deviceManager = deviceManager;
  }

  async getNowPlaying(req, res) {
    const device = this.deviceManager.getDevice(req.query.deviceId);
    if (!device) {
      return res.status(404).send('<error>Device not found</error>');
    }

    const nowPlaying = device.getNowPlaying();
    const builder = new Builder({ rootName: 'nowPlaying' });

    if (!nowPlaying) {
      res.set('Content-Type', 'application/xml');
      return res.send('<nowPlaying source="STANDBY"><playStatus>STOP_STATE</playStatus></nowPlaying>');
    }

    const data = {
      $: { 
        source: nowPlaying.source,
        sourceAccount: nowPlaying.sourceAccount || ''
      },
      ContentItem: {
        $: { 
          source: nowPlaying.source,
          type: nowPlaying.type || 'station',
          location: nowPlaying.location || '',
          sourceAccount: nowPlaying.sourceAccount || '',
          isPresetable: 'true'
        },
        itemName: nowPlaying.name || 'Unknown',
        containerArt: nowPlaying.art || ''
      },
      track: nowPlaying.track || '',
      artist: nowPlaying.artist || '',
      album: nowPlaying.album || '',
      stationName: nowPlaying.stationName || nowPlaying.name || '',
      art: nowPlaying.art || '',
      playStatus: nowPlaying.playStatus || 'PLAY_STATE',
      shuffleSetting: 'SHUFFLE_OFF',
      repeatSetting: 'REPEAT_OFF'
    };

    res.set('Content-Type', 'application/xml');
    res.send(builder.buildObject(data));
  }

  async handleKey(req, res) {
    try {
      const xml = await parseStringPromise(req.body);
      const device = this.deviceManager.getDevice(req.query.deviceId);
      
      if (!device) {
        return res.status(404).send('<error>Device not found</error>');
      }

      const key = xml.key;
      const state = key.$?.state || 'press';
      const sender = key.$?.sender || 'Gabbo';
      const keyValue = key._ || key;

      console.log(`Key ${keyValue} ${state} from ${sender}`);

      const nowPlaying = device.getNowPlaying();
      if (nowPlaying) {
        switch (keyValue) {
          case 'PLAY':
            nowPlaying.playStatus = 'PLAY_STATE';
            break;
          case 'PAUSE':
            nowPlaying.playStatus = 'PAUSE_STATE';
            break;
          case 'PLAY_PAUSE':
            nowPlaying.playStatus = nowPlaying.playStatus === 'PLAY_STATE' 
              ? 'PAUSE_STATE' 
              : 'PLAY_STATE';
            break;
          case 'STOP':
            nowPlaying.playStatus = 'STOP_STATE';
            break;
        }
        device.setNowPlaying(nowPlaying);
      }

      res.set('Content-Type', 'application/xml');
      res.send('<status>OK</status>');
    } catch (error) {
      console.error('Error handling key:', error);
      res.status(400).send('<error>Invalid request</error>');
    }
  }
}
